# Process Engine Documentation

**Last Updated:** January 23, 2025, 7:45 AM

## Overview

The **Process Engine** enables visual workflow automation through a ReactFlow-based designer and runtime execution engine. Users can create processes by connecting action nodes, define variables, handle errors, and execute workflows.

**Current State:** Beta - Core runtime exists, UI incomplete, limited action library

---

## Architecture

```
┌────────────────────────────────────────┐
│   PROCESS DESIGNER (Frontend)          │
│   - Visual flow editor (ReactFlow)     │
│   - Action palette                     │
│   - Variable configuration             │
│   - Test execution                     │
└────────────────────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│   PROCESS SERVICE (Backend)            │
│   - Process CRUD                       │
│   - Validation                         │
│   - Version management                 │
└────────────────────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│   PROCESS EXECUTOR (Runtime)           │
│   - Parse flow definition              │
│   - Execute actions sequentially       │
│   - Variable passing                   │
│   - Error handling & retries           │
└────────────────────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│   ACTION EXECUTOR                      │
│   - Execute individual actions         │
│   - Connector integration              │
│   - Input/output transformation        │
└────────────────────────────────────────┘
```

---

## Database Schema

### Process Model

```typescript
model Process {
  id              Int
  name            String
  processKey      String?  // Unique technical identifier
  description     String?
  version         String   // e.g., "v1.0"
  tags            Json     // Array of tags
  category        String?
  status          String   // 'draft', 'published', 'active', 'deprecated'
  priority        String   // 'high', 'medium', 'low'
  
  // Core Definition
  flowDefinition  Json     // ReactFlow nodes + edges
  executionMode   String   // 'sequential', 'parallel', 'hybrid'
  
  // Execution Settings
  timeoutSeconds  Int?
  retryPolicy     Json?
  concurrencyConfig Json?
  errorHandlingStrategy String
  
  // Variables
  inputParameters Json?
  environmentVariables Json?
  globalConstants Json?
  outputVariables Json?
  
  // Security
  permissions     Json?
  dataClassification String?
  complianceTags  Json
  
  // Notifications
  notificationConfig Json?
  
  // Monitoring
  loggingConfig   Json?
  metricsEnabled  Boolean
  performanceSLA  Json?
  
  // Documentation
  documentation   String?  // Markdown
  changelog       String?
  relatedProcesses Json?
  referenceUrls   Json?
  
  // Deployment
  environment     String   // 'dev', 'staging', 'production'
  deploymentStatus String?
  
  // Trigger
  isActive        Boolean
  isTemplate      Boolean
  triggerType     String   // 'manual', 'ui_form', 'api', 'schedule'
  triggerConfig   Json?
  triggerUrl      String?
  
  // Audit
  createdBy       Int
  lastModifiedBy  Int?
  sharedWith      Json
  createdAt       DateTime
  updatedAt       DateTime
  
  creator           User
  modifier          User?
  processExecutions ProcessExecution[]
  dynamicPages      DynamicPage[]
}
```

**Key Fields:**
- `flowDefinition` - ReactFlow graph (nodes + edges)
- `executionMode` - Sequential, parallel, or hybrid
- `inputParameters` - Expected inputs for execution
- `triggerType` - How process is started

---

### Action Model

```typescript
model Action {
  id                 Int
  name               String   // Unique
  displayName        String
  description        String?
  actionType         String   // 'system', 'user_defined', 'connector'
  category           String   // 'control_flow', 'data', 'api', 'storage'
  
  connectorId        Int?     // For connector actions
  connectorOperation String?
  
  icon               String?
  iconUrl            String?
  color              String?
  
  // Schemas (JSON Schema format)
  configSchema       Json     // Configuration UI
  inputSchema        Json     // Expected inputs
  outputSchema       Json     // Output format
  
  // Execution
  executorType       String   // 'builtin', 'rest_api', 'script', 'connector'
  executorConfig     Json
  
  isSystem           Boolean
  isActive           Boolean
  createdBy          Int
  sharedWith         Json
  
  creator          User
  connector        Connector?
  actionExecutions ActionExecution[]
}
```

**Key Fields:**
- `configSchema` - Defines configuration UI
- `inputSchema` - Validates action inputs
- `outputSchema` - Defines action outputs
- `executorType` - How action is executed

---

### Execution Models

```typescript
model ProcessExecution {
  id                Int
  processId         Int
  executionId       String   // UUID
  userId            Int
  status            String   // 'pending', 'running', 'completed', 'failed'
  executionContext  Json     // Input variables
  result            Json?    // Final output
  startedAt         DateTime?
  completedAt       DateTime?
  durationMs        Int?
  errorMessage      String?
  
  process          Process
  user             User
  actionExecutions ActionExecution[]
}

model ActionExecution {
  id                  Int
  processExecutionId  Int
  actionId            Int
  nodeId              String   // From flow definition
  stepOrder           Int
  status              String   // 'pending', 'running', 'completed', 'failed', 'skipped'
  inputData           Json?
  outputData          Json?
  errorMessage        String?
  startedAt           DateTime?
  completedAt         DateTime?
  durationMs          Int?
  retryCount          Int
  
  processExecution ProcessExecution
  action           Action
}
```

---

## Flow Definition Format

**Format:** ReactFlow nodes + edges

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "action",
      "position": { "x": 100, "y": 100 },
      "data": {
        "actionId": 42,
        "actionName": "fetch-data",
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET"
        },
        "inputMapping": {
          "userId": "{{variables.userId}}"
        },
        "outputVariable": "apiData"
      }
    },
    {
      "id": "node-2",
      "type": "action",
      "position": { "x": 300, "y": 100 },
      "data": {
        "actionId": 43,
        "actionName": "transform-data",
        "config": { "format": "json" },
        "inputMapping": {
          "rawData": "{{node-1.output.apiData}}"
        },
        "outputVariable": "transformedData"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "default"
    }
  ]
}
```

**Key Concepts:**
- `nodes` - Action steps
- `edges` - Execution order
- `inputMapping` - Variable references (mustache syntax)
- `outputVariable` - Store action output

---

## Process Executor

**File:** `backend/src/execution-engine/ProcessExecutor.ts`

```typescript
export class ProcessExecutor {
  async execute(
    processId: number,
    userId: number,
    inputData: any = {}
  ): Promise<ProcessExecution> {
    // 1. Load process definition
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: { creator: true },
    });

    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    // 2. Create execution record
    const executionId = uuidv4();
    const execution = await prisma.processExecution.create({
      data: {
        processId,
        executionId,
        userId,
        status: 'running',
        executionContext: {
          inputData,
          startTime: new Date().toISOString(),
        },
        startedAt: new Date(),
      },
    });

    // 3. Parse flow definition
    const flowDefinition = process.flowDefinition as {
      nodes: any[];
      edges: any[];
    };

    // 4. Build execution graph
    const graph = this.buildExecutionGraph(flowDefinition);

    // 5. Initialize variables
    const variables = {
      ...process.environmentVariables,
      ...process.globalConstants,
      ...inputData,
    };

    // 6. Execute nodes in order
    try {
      const result = await this.executeGraph(
        execution.id,
        graph,
        variables,
        process.executionMode
      );

      // 7. Mark as completed
      await prisma.processExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          result,
          completedAt: new Date(),
          durationMs: Date.now() - new Date(execution.startedAt!).getTime(),
        },
      });

      return execution;
    } catch (error: any) {
      // 8. Mark as failed
      await prisma.processExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private buildExecutionGraph(flowDefinition: any): ExecutionNode[] {
    // Sort nodes by topological order (using edges)
    const { nodes, edges } = flowDefinition;
    const graph: ExecutionNode[] = [];

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    edges.forEach((edge: any) => {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source)!.push(edge.target);
    });

    // Topological sort
    const visited = new Set<string>();
    const sorted: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      neighbors.forEach(visit);

      sorted.unshift(nodeId);
    };

    nodes.forEach((node: any) => visit(node.id));

    // Map to execution nodes
    return sorted.map((nodeId, index) => {
      const node = nodes.find((n: any) => n.id === nodeId)!;
      return {
        nodeId,
        actionId: node.data.actionId,
        config: node.data.config,
        inputMapping: node.data.inputMapping,
        outputVariable: node.data.outputVariable,
        stepOrder: index,
      };
    });
  }

  private async executeGraph(
    executionId: number,
    graph: ExecutionNode[],
    variables: any,
    executionMode: string
  ): Promise<any> {
    const actionExecutor = new ActionExecutor();

    if (executionMode === 'sequential') {
      // Execute nodes one by one
      for (const node of graph) {
        const output = await this.executeNode(
          executionId,
          node,
          variables,
          actionExecutor
        );

        // Store output in variables
        if (node.outputVariable) {
          variables[node.outputVariable] = output;
        }

        // Also store by node ID
        variables[`node-${node.nodeId}`] = { output };
      }

      return { success: true, variables };
    } else if (executionMode === 'parallel') {
      // Execute all nodes in parallel
      const results = await Promise.all(
        graph.map(node =>
          this.executeNode(executionId, node, variables, actionExecutor)
        )
      );

      // Merge results
      graph.forEach((node, index) => {
        if (node.outputVariable) {
          variables[node.outputVariable] = results[index];
        }
      });

      return { success: true, variables };
    }

    throw new Error(`Unsupported execution mode: ${executionMode}`);
  }

  private async executeNode(
    executionId: number,
    node: ExecutionNode,
    variables: any,
    actionExecutor: ActionExecutor
  ): Promise<any> {
    // 1. Create action execution record
    const actionExecution = await prisma.actionExecution.create({
      data: {
        processExecutionId: executionId,
        actionId: node.actionId,
        nodeId: node.nodeId,
        stepOrder: node.stepOrder,
        status: 'running',
        inputData: null, // Will be set after resolving variables
        startedAt: new Date(),
      },
    });

    try {
      // 2. Resolve input variables
      const resolvedInput = this.resolveVariables(node.inputMapping, variables);

      // 3. Update with resolved input
      await prisma.actionExecution.update({
        where: { id: actionExecution.id },
        data: { inputData: resolvedInput },
      });

      // 4. Execute action
      const output = await actionExecutor.execute(
        node.actionId,
        resolvedInput,
        node.config
      );

      // 5. Mark as completed
      await prisma.actionExecution.update({
        where: { id: actionExecution.id },
        data: {
          status: 'completed',
          outputData: output,
          completedAt: new Date(),
          durationMs: Date.now() - new Date(actionExecution.startedAt!).getTime(),
        },
      });

      return output;
    } catch (error: any) {
      // 6. Mark as failed
      await prisma.actionExecution.update({
        where: { id: actionExecution.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private resolveVariables(mapping: any, variables: any): any {
    if (!mapping) return {};

    const resolved: any = {};

    for (const [key, template] of Object.entries(mapping)) {
      // Resolve mustache templates: {{variable.path}}
      let value = template as string;

      if (typeof value === 'string' && value.includes('{{')) {
        const matches = value.match(/{{([^}]+)}}/g) || [];
        matches.forEach(match => {
          const path = match.replace('{{', '').replace('}}', '').trim();
          const resolvedValue = this.getNestedValue(variables, path);
          value = value.replace(match, resolvedValue);
        });
      }

      resolved[key] = value;
    }

    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

---

## Action Executor

**File:** `backend/src/execution-engine/ActionExecutor.ts`

```typescript
export class ActionExecutor {
  async execute(
    actionId: number,
    input: any,
    config: any
  ): Promise<any> {
    // 1. Load action definition
    const action = await prisma.action.findUnique({
      where: { id: actionId },
      include: { connector: true },
    });

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    // 2. Execute based on executor type
    switch (action.executorType) {
      case 'builtin':
        return await this.executeBuiltin(action, input, config);
      
      case 'rest_api':
        return await this.executeRestApi(action, input, config);
      
      case 'connector':
        return await this.executeConnector(action, input, config);
      
      case 'script':
        return await this.executeScript(action, input, config);
      
      default:
        throw new Error(`Unsupported executor type: ${action.executorType}`);
    }
  }

  private async executeBuiltin(action: Action, input: any, config: any): Promise<any> {
    // Load built-in action handler
    const { BuiltinActions } = require('./actions/BuiltinActions');
    return await BuiltinActions[action.name](input, config);
  }

  private async executeRestApi(action: Action, input: any, config: any): Promise<any> {
    const { url, method, headers, body } = action.executorConfig as any;

    const response = await axios({
      method: method || 'GET',
      url: this.resolveTemplate(url, { ...input, ...config }),
      headers: headers || {},
      data: body ? this.resolveTemplate(body, { ...input, ...config }) : undefined,
    });

    return response.data;
  }

  private async executeConnector(action: Action, input: any, config: any): Promise<any> {
    const { ConnectorExecutor } = require('./connectors/ConnectorExecutor');
    return await ConnectorExecutor.execute(action.connector!, action.connectorOperation!, input);
  }

  private async executeScript(action: Action, input: any, config: any): Promise<any> {
    // Execute JavaScript/TypeScript script
    const { script } = action.executorConfig as any;
    const fn = new Function('input', 'config', script);
    return fn(input, config);
  }

  private resolveTemplate(template: string, variables: any): any {
    // Same as ProcessExecutor.resolveVariables
    // ... (omitted for brevity)
  }
}
```

---

## Built-in Actions

**File:** `backend/src/execution-engine/actions/BuiltinActions.ts`

```typescript
export const BuiltinActions = {
  /**
   * Log message to console/logs
   */
  async log(input: { message: string }, config: any) {
    logger.info('Process log:', input.message);
    return { logged: true, message: input.message };
  },

  /**
   * Set variable value
   */
  async setVariable(input: { name: string; value: any }, config: any) {
    return { [input.name]: input.value };
  },

  /**
   * Conditional branch
   */
  async condition(input: { condition: boolean; trueValue: any; falseValue: any }, config: any) {
    return input.condition ? input.trueValue : input.falseValue;
  },

  /**
   * Loop over array
   */
  async forEach(input: { items: any[]; action: string }, config: any) {
    const results = [];
    for (const item of input.items) {
      // Execute sub-action for each item
      const result = await this.executeSubAction(input.action, item, config);
      results.push(result);
    }
    return { results };
  },

  /**
   * Delay execution
   */
  async delay(input: { seconds: number }, config: any) {
    await new Promise(resolve => setTimeout(resolve, input.seconds * 1000));
    return { delayed: input.seconds };
  },

  /**
   * HTTP request
   */
  async httpRequest(input: { url: string; method: string; body?: any }, config: any) {
    const response = await axios({
      method: input.method || 'GET',
      url: input.url,
      data: input.body,
    });
    return response.data;
  },

  /**
   * Database query
   */
  async databaseQuery(input: { connectorId: number; query: string }, config: any) {
    const pool = await dbExplorerService.getPool(input.connectorId, config.userId);
    const result = await pool.query(input.query);
    return { rows: result.rows };
  },

  // ... 15+ more built-in actions
};
```

---

## API Endpoints

**Base:** `/api/processes`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List processes |
| GET | `/:id` | Get process by ID |
| POST | `/` | Create process |
| PUT | `/:id` | Update process |
| DELETE | `/:id` | Delete process |
| POST | `/:id/execute` | Execute process |
| GET | `/:id/executions` | Get execution history |
| GET | `/executions/:executionId` | Get execution details |
| POST | `/actions` | List available actions |

---

## Current Limitations

### ✅ Implemented
1. Sequential execution
2. Variable passing
3. Basic error handling
4. Execution tracking
5. Activity logging

### ⚠️ Missing
1. Parallel execution (partially)
2. Conditional branching
3. Loops
4. Sub-processes
5. Human-in-the-loop (approval steps)
6. Scheduled execution
7. Event-driven triggers
8. Retry with backoff
9. Visual debugger
10. Process versioning

---

## Recommendations

### Short-Term
1. Implement conditional nodes
2. Add loop support
3. Improve error messages
4. Add execution pause/resume

### Medium-Term
1. Visual debugger
2. Process templates library
3. Scheduled execution (cron)
4. Webhook triggers

### Long-Term
1. Distributed execution (message queue)
2. Process marketplace
3. AI-generated processes
4. Real-time collaboration

---

**Document Status:** ✅ Complete  
**Next:** See `INTEGRATIONS.md` for external services

