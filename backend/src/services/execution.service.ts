import prisma from '../config/database';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

class ExecutionService {
  /**
   * Get all executions for a user
   */
  async getExecutions(userId: number, filters?: {
    processId?: number;
    status?: string;
    limit?: number;
  }) {
    try {
      const where: any = { userId };

      if (filters?.processId) {
        where.processId = filters.processId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      const executions = await prisma.processExecution.findMany({
        where,
        include: {
          process: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              actionExecutions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
      });

      return executions;
    } catch (error: any) {
      logger.error('Error fetching executions:', error);
      throw new Error(`Failed to fetch executions: ${error.message}`);
    }
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(executionId: string, userId: number) {
    try {
      const execution = await prisma.processExecution.findFirst({
        where: {
          executionId,
          userId,
        },
        include: {
          process: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              flowDefinition: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          actionExecutions: {
            include: {
              action: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  category: true,
                  icon: true,
                  color: true,
                },
              },
            },
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (!execution) {
        throw new Error('Execution not found or access denied');
      }

      return execution;
    } catch (error: any) {
      logger.error(`Error fetching execution ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Create new process execution record
   */
  async createExecution(
    processId: number,
    userId: number,
    executionContext: any
  ) {
    try {
      const executionId = uuidv4();

      const execution = await prisma.processExecution.create({
        data: {
          processId,
          executionId,
          userId,
          status: 'pending',
          executionContext,
        },
      });

      logger.info(`Process execution created: ${executionId} for process ${processId}`);
      return execution;
    } catch (error: any) {
      logger.error('Error creating execution:', error);
      throw new Error(`Failed to create execution: ${error.message}`);
    }
  }

  /**
   * Update execution status
   */
  async updateExecutionStatus(
    executionId: string,
    status: string,
    result?: any,
    errorMessage?: string
  ) {
    try {
      const updateData: any = { status };

      if (status === 'running' && !result) {
        updateData.startedAt = new Date();
      }

      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.completedAt = new Date();
        
        const execution = await prisma.processExecution.findUnique({
          where: { executionId },
        });

        if (execution?.startedAt) {
          const duration = new Date().getTime() - new Date(execution.startedAt).getTime();
          updateData.durationMs = duration;
        }
      }

      if (result) {
        updateData.result = result;
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      const execution = await prisma.processExecution.update({
        where: { executionId },
        data: updateData,
      });

      logger.info(`Process execution ${executionId} status updated to ${status}`);
      return execution;
    } catch (error: any) {
      logger.error(`Error updating execution ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Create action execution record
   */
  async createActionExecution(
    processExecutionId: number,
    actionId: number,
    nodeId: string,
    stepOrder: number,
    inputData?: any
  ) {
    try {
      const actionExecution = await prisma.actionExecution.create({
        data: {
          processExecutionId,
          actionId,
          nodeId,
          stepOrder,
          status: 'pending',
          inputData,
        },
      });

      return actionExecution;
    } catch (error: any) {
      logger.error('Error creating action execution:', error);
      throw error;
    }
  }

  /**
   * Update action execution status
   */
  async updateActionExecutionStatus(
    actionExecutionId: number,
    status: string,
    outputData?: any,
    errorMessage?: string
  ) {
    try {
      const updateData: any = { status };

      if (status === 'running') {
        updateData.startedAt = new Date();
      }

      if (status === 'completed' || status === 'failed' || status === 'skipped') {
        updateData.completedAt = new Date();

        const actionExecution = await prisma.actionExecution.findUnique({
          where: { id: actionExecutionId },
        });

        if (actionExecution?.startedAt) {
          const duration = new Date().getTime() - new Date(actionExecution.startedAt).getTime();
          updateData.durationMs = duration;
        }
      }

      if (outputData) {
        updateData.outputData = outputData;
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      const actionExecution = await prisma.actionExecution.update({
        where: { id: actionExecutionId },
        data: updateData,
      });

      return actionExecution;
    } catch (error: any) {
      logger.error(`Error updating action execution ${actionExecutionId}:`, error);
      throw error;
    }
  }

  /**
   * Increment retry count for action execution
   */
  async incrementRetryCount(actionExecutionId: number) {
    try {
      const actionExecution = await prisma.actionExecution.update({
        where: { id: actionExecutionId },
        data: {
          retryCount: {
            increment: 1,
          },
        },
      });

      return actionExecution;
    } catch (error: any) {
      logger.error(`Error incrementing retry count for action execution ${actionExecutionId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(userId: number, processId?: number) {
    try {
      const where: any = { userId };
      if (processId) {
        where.processId = processId;
      }

      const [total, completed, failed, running] = await Promise.all([
        prisma.processExecution.count({ where }),
        prisma.processExecution.count({ where: { ...where, status: 'completed' } }),
        prisma.processExecution.count({ where: { ...where, status: 'failed' } }),
        prisma.processExecution.count({ where: { ...where, status: 'running' } }),
      ]);

      return {
        total,
        completed,
        failed,
        running,
        pending: total - completed - failed - running,
        successRate: total > 0 ? ((completed / total) * 100).toFixed(2) : '0',
      };
    } catch (error: any) {
      logger.error('Error fetching execution stats:', error);
      throw error;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string, userId: number) {
    try {
      const execution = await prisma.processExecution.findFirst({
        where: { executionId, userId },
      });

      if (!execution) {
        throw new Error('Execution not found or access denied');
      }

      if (execution.status !== 'running' && execution.status !== 'pending') {
        throw new Error('Can only cancel running or pending executions');
      }

      await this.updateExecutionStatus(executionId, 'cancelled');

      // Cancel all pending/running action executions
      await prisma.actionExecution.updateMany({
        where: {
          processExecutionId: execution.id,
          status: { in: ['pending', 'running'] },
        },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      logger.info(`Execution ${executionId} cancelled by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error cancelling execution ${executionId}:`, error);
      throw error;
    }
  }
}

export const executionService = new ExecutionService();

