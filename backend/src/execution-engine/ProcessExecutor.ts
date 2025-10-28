import prisma from '../config/database';
import logger from '../utils/logger';
import { executionService } from '../services/execution.service';
import { ActionExecutor } from './ActionExecutor';

export interface ExecutionContext {
  [key: string]: any;
}

export interface ProcessNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowDefinition {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  executionMode?: 'sequential' | 'parallel' | 'hybrid';
}

export class ProcessExecutor {
  private actionExecutor: ActionExecutor;

  constructor() {
    this.actionExecutor = new ActionExecutor();
  }

  /**
   * Execute a process
   */
  async execute(processId: number, userId: number, inputContext: ExecutionContext = {}) {
    let executionRecord: any;

    try {
      // Load process definition
      const process = await prisma.process.findUnique({
        where: { id: processId },
      });

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      if (!process.isActive) {
        throw new Error(`Process is not active: ${process.name}`);
      }

      // Create execution record
      executionRecord = await executionService.createExecution(processId, userId, inputContext);

      // Update status to running
      await executionService.updateExecutionStatus(executionRecord.executionId, 'running');

      // Parse flow definition
      const flowDef: FlowDefinition = process.flowDefinition as any;
      const executionMode = flowDef.executionMode || process.executionMode || 'sequential';

      // Build execution context
      const context: ExecutionContext = {
        ...inputContext,
        processId,
        processName: process.name,
        executionId: executionRecord.executionId,
        userId,
      };

      // Execute flow based on mode
      let result: any;
      if (executionMode === 'sequential') {
        result = await this.executeSequential(flowDef, executionRecord.id, context);
      } else if (executionMode === 'parallel') {
        result = await this.executeParallel(flowDef, executionRecord.id, context);
      } else {
        result = await this.executeHybrid(flowDef, executionRecord.id, context);
      }

      // Complete execution
      await executionService.updateExecutionStatus(
        executionRecord.executionId,
        'completed',
        result
      );

      logger.info(`Process execution completed: ${executionRecord.executionId}`);

      return {
        success: true,
        executionId: executionRecord.executionId,
        result,
      };
    } catch (error: any) {
      logger.error(`Process execution failed: ${error.message}`, error);

      if (executionRecord) {
        await executionService.updateExecutionStatus(
          executionRecord.executionId,
          'failed',
          null,
          error.message
        );
      }

      throw error;
    }
  }

  /**
   * Execute nodes sequentially in topological order
   */
  private async executeSequential(
    flowDef: FlowDefinition,
    processExecutionId: number,
    context: ExecutionContext
  ): Promise<any> {
    const { nodes, edges } = flowDef;

    // Build execution order using topological sort
    const executionOrder = this.topologicalSort(nodes, edges);

    const nodeOutputs: { [nodeId: string]: any } = {};

    // Execute nodes in order
    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = nodes.find((n) => n.id === nodeId);

      if (!node) continue;

      // Build input data from previous nodes
      const inputData = this.buildNodeInput(node, edges, nodeOutputs, context);

      // Execute the node
      try {
        const output = await this.executeNode(
          node,
          processExecutionId,
          i,
          inputData,
          context
        );

        nodeOutputs[nodeId] = output;
        context[`node_${nodeId}`] = output; // Store in context for variable interpolation
      } catch (error: any) {
        logger.error(`Node execution failed: ${node.id}`, error);
        throw error;
      }
    }

    // Return final output (last node or all outputs)
    const lastNodeId = executionOrder[executionOrder.length - 1];
    return {
      finalOutput: nodeOutputs[lastNodeId],
      allOutputs: nodeOutputs,
    };
  }

  /**
   * Execute independent nodes in parallel
   */
  private async executeParallel(
    flowDef: FlowDefinition,
    processExecutionId: number,
    context: ExecutionContext
  ): Promise<any> {
    const { nodes, edges } = flowDef;

    // Group nodes by dependency level
    const levels = this.groupNodesByLevel(nodes, edges);
    const nodeOutputs: { [nodeId: string]: any } = {};

    // Execute each level in parallel
    for (const level of levels) {
      const promises = level.map(async (nodeId, idx) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        const inputData = this.buildNodeInput(node, edges, nodeOutputs, context);

        try {
          const output = await this.executeNode(
            node,
            processExecutionId,
            idx,
            inputData,
            context
          );

          return { nodeId, output };
        } catch (error: any) {
          logger.error(`Node execution failed: ${node.id}`, error);
          throw error;
        }
      });

      const results = await Promise.all(promises);

      // Store outputs
      results.forEach((result) => {
        if (result) {
          nodeOutputs[result.nodeId] = result.output;
          context[`node_${result.nodeId}`] = result.output;
        }
      });
    }

    return {
      allOutputs: nodeOutputs,
    };
  }

  /**
   * Execute with hybrid mode (parallel within levels, sequential between levels)
   */
  private async executeHybrid(
    flowDef: FlowDefinition,
    processExecutionId: number,
    context: ExecutionContext
  ): Promise<any> {
    // Hybrid is same as parallel for now
    return this.executeParallel(flowDef, processExecutionId, context);
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: ProcessNode,
    processExecutionId: number,
    stepOrder: number,
    inputData: any,
    context: ExecutionContext
  ): Promise<any> {
    // Get action ID from node data
    const actionId = node.data.actionId;

    if (!actionId) {
      throw new Error(`Node ${node.id} has no action ID`);
    }

    // Create action execution record
    const actionExecution = await executionService.createActionExecution(
      processExecutionId,
      actionId,
      node.id,
      stepOrder,
      inputData
    );

    try {
      // Update to running
      await executionService.updateActionExecutionStatus(actionExecution.id, 'running');

      // Execute the action
      const output = await this.actionExecutor.execute(
        actionId,
        inputData,
        node.data.config || {},
        context
      );

      // Update to completed
      await executionService.updateActionExecutionStatus(
        actionExecution.id,
        'completed',
        output
      );

      return output;
    } catch (error: any) {
      // Update to failed
      await executionService.updateActionExecutionStatus(
        actionExecution.id,
        'failed',
        null,
        error.message
      );

      throw error;
    }
  }

  /**
   * Build input data for a node from its predecessors
   */
  private buildNodeInput(
    node: ProcessNode,
    edges: ProcessEdge[],
    nodeOutputs: { [nodeId: string]: any },
    context: ExecutionContext
  ): any {
    const incomingEdges = edges.filter((e) => e.target === node.id);

    if (incomingEdges.length === 0) {
      // No incoming edges, use context or node config
      return node.data.initialInput || {};
    }

    // Single input from previous node
    if (incomingEdges.length === 1) {
      const sourceNodeId = incomingEdges[0].source;
      return nodeOutputs[sourceNodeId] || {};
    }

    // Multiple inputs, merge them
    const inputs: any = {};
    incomingEdges.forEach((edge) => {
      const sourceOutput = nodeOutputs[edge.source];
      if (sourceOutput) {
        inputs[edge.source] = sourceOutput;
      }
    });

    return inputs;
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(nodes: ProcessNode[], edges: ProcessEdge[]): string[] {
    const adjList: { [key: string]: string[] } = {};
    const inDegree: { [key: string]: number } = {};

    // Initialize
    nodes.forEach((node) => {
      adjList[node.id] = [];
      inDegree[node.id] = 0;
    });

    // Build adjacency list and in-degree
    edges.forEach((edge) => {
      adjList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });

    // Find starting nodes (in-degree = 0)
    const queue: string[] = [];
    Object.keys(inDegree).forEach((nodeId) => {
      if (inDegree[nodeId] === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      // Reduce in-degree for neighbors
      adjList[nodeId].forEach((neighbor) => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Process has circular dependencies');
    }

    return result;
  }

  /**
   * Group nodes by dependency level for parallel execution
   */
  private groupNodesByLevel(nodes: ProcessNode[], edges: ProcessEdge[]): string[][] {
    const adjList: { [key: string]: string[] } = {};
    const inDegree: { [key: string]: number } = {};

    // Initialize
    nodes.forEach((node) => {
      adjList[node.id] = [];
      inDegree[node.id] = 0;
    });

    // Build adjacency list and in-degree
    edges.forEach((edge) => {
      adjList[edge.source].push(edge.target);
      inDegree[edge.target]++;
    });

    const levels: string[][] = [];
    const remaining = new Set(nodes.map((n) => n.id));

    while (remaining.size > 0) {
      // Find nodes with no dependencies in remaining set
      const currentLevel: string[] = [];

      remaining.forEach((nodeId) => {
        if (inDegree[nodeId] === 0) {
          currentLevel.push(nodeId);
        }
      });

      if (currentLevel.length === 0) {
        throw new Error('Process has circular dependencies');
      }

      levels.push(currentLevel);

      // Remove current level nodes and update in-degrees
      currentLevel.forEach((nodeId) => {
        remaining.delete(nodeId);
        adjList[nodeId].forEach((neighbor) => {
          if (remaining.has(neighbor)) {
            inDegree[neighbor]--;
          }
        });
      });
    }

    return levels;
  }
}

