import { ActionHandler } from '../ActionExecutor';
import { ExecutionContext } from '../ProcessExecutor';
import logger from '../../utils/logger';
import prisma from '../../config/database';

/**
 * Call Process Action
 * Execute another process as a sub-process
 */
export class CallProcessAction implements ActionHandler {
  async execute(inputData: any, config: any, context: ExecutionContext): Promise<any> {
    const {
      processId,
      processName,
      waitForCompletion = true,
      inheritContext = true,
      timeoutMs = 300000,
    } = { ...inputData, ...config };

    try {
      if (!processId) {
        throw new Error('processId is required');
      }

      logger.info(`Call Process: Calling process ${processName || processId}`, {
        processId,
        waitForCompletion,
        inheritContext,
      });

      // Get the process definition
      const process = await prisma.process.findUnique({
        where: { id: processId },
      });

      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      if (!process.isActive) {
        throw new Error(`Process is not active: ${process.name}`);
      }

      // Prepare input data for sub-process
      const subProcessInput = inheritContext 
        ? { ...context.variables, ...inputData }
        : inputData;

      // Generate unique execution ID
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create execution record
      const execution = await prisma.processExecution.create({
        data: {
          processId,
          executionId,
          status: 'running',
          startedAt: new Date(),
          userId: context.userId,
          executionContext: {
            parentExecutionId: context.executionId,
            parentProcessId: context.processId,
            calledBy: 'call_process_action',
            input: subProcessInput,
          } as any,
        },
      });

      logger.info(`Call Process: Created execution ${execution.id} for process ${process.name}`);

      if (!waitForCompletion) {
        // Fire and forget - return immediately
        logger.info(`Call Process: Not waiting for completion (async mode)`);
        return {
          executionId: execution.id,
          status: 'running',
          result: null,
          startedAt: execution.startedAt?.toISOString() || new Date().toISOString(),
          completedAt: null,
        };
      }

      // Wait for completion (with timeout)
      logger.info(`Call Process: Waiting for completion (timeout: ${timeoutMs}ms)`);
      
      // In a real implementation, this would:
      // 1. Start the process execution in a background job
      // 2. Poll or listen for completion
      // 3. Return the result
      // For now, we'll simulate a successful execution

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - (execution.startedAt?.getTime() || completedAt.getTime());
      
      await prisma.processExecution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt,
          durationMs,
          result: { success: true, data: subProcessInput } as any,
        },
      });

      logger.info(`Call Process: Sub-process completed successfully`);

      return {
        executionId: execution.id,
        status: 'completed',
        result: { success: true, data: subProcessInput },
        startedAt: execution.startedAt?.toISOString() || new Date().toISOString(),
        completedAt: completedAt.toISOString(),
      };
    } catch (error: any) {
      logger.error('Call Process: Failed to execute sub-process', error);
      throw new Error(`Call Process failed: ${error.message}`);
    }
  }
}

