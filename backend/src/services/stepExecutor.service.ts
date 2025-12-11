import prisma from '../config/database';
import logger from '../utils/logger';
import { uuidv4 } from '../utils/uuid';
import { StepHandlerFactory } from './stepHandlers/StepHandlerFactory';

/**
 * Step Executor Service
 * 
 * Executes workflows sequentially, step by step.
 * Handles user input pauses and data passing between steps.
 */
class StepExecutorService {
  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: number, userId: number, initialData: any = {}) {
    try {
      // Load workflow with steps
      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, createdBy: userId },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found or access denied');
      }

      if (!workflow.isActive) {
        throw new Error('Workflow is not active');
      }

      if (workflow.steps.length === 0) {
        throw new Error('Workflow has no steps');
      }

      // Create execution record
      const executionId = await uuidv4();
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId,
          executionId,
          userId,
          status: 'running',
          currentStep: 1,
          context: initialData,
          startedAt: new Date(),
        },
      });

      logger.info(`Workflow execution started: ${executionId} for workflow ${workflowId}`);

      // Execute steps sequentially
      try {
        await this.executeSteps(execution.id, workflow.steps, userId);

        // Mark as completed
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            durationMs: Date.now() - new Date(execution.startedAt!).getTime(),
          },
        });

        logger.info(`Workflow execution completed: ${executionId}`);
      } catch (error: any) {
        // Check if this is a "waiting for user" pause
        if (error.message === 'WAITING_FOR_USER') {
          logger.info(`Workflow execution paused for user input: ${executionId}`);
          return { executionId, status: 'waiting_user' };
        }

        // Mark as failed
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            errorMessage: error.message,
            completedAt: new Date(),
          },
        });

        logger.error(`Workflow execution failed: ${executionId}`, error);
        throw error;
      }

      return { executionId, status: 'completed' };
    } catch (error: any) {
      logger.error('Error executing workflow:', error);
      throw error;
    }
  }

  /**
   * Execute steps sequentially
   */
  private async executeSteps(executionId: number, steps: any[], userId: number) {
    // Get current execution context
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    let context = execution.context as any;

    for (const step of steps) {
      // Check if execution was cancelled
      const currentExecution = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
      });

      if (currentExecution?.status === 'cancelled') {
        throw new Error('Execution was cancelled');
      }

      // Update current step
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { currentStep: step.stepOrder },
      });

      // Execute step
      const output = await this.executeStep(executionId, step, context, userId);

      // Store output in context
      const outputKey = step.outputVariable || `step_${step.stepOrder}_output`;
      context[outputKey] = output;

      // Update execution context
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { context },
      });
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(executionId: number, step: any, context: any, userId: number) {
    // Create step execution record
    const stepExecution = await prisma.stepExecution.create({
      data: {
        workflowExecutionId: executionId,
        stepId: step.id,
        stepOrder: step.stepOrder,
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      // Resolve input data from context
      const inputData = this.resolveInputData(step, context);

      // Update with resolved input
      await prisma.stepExecution.update({
        where: { id: stepExecution.id },
        data: { inputData },
      });

      // Get step handler
      const handler = StepHandlerFactory.getHandler(step.stepType);

      // Check if step requires user input
      if (handler.requiresUserInput()) {
        // Mark step as waiting for user
        await prisma.stepExecution.update({
          where: { id: stepExecution.id },
          data: { status: 'waiting_user' },
        });

        // Mark execution as waiting
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: 'waiting_user' },
        });

        // Throw special error to pause execution
        throw new Error('WAITING_FOR_USER');
      }

      // Execute step
      const output = await handler.execute(step.config, inputData, context, userId);

      // Mark as completed
      await prisma.stepExecution.update({
        where: { id: stepExecution.id },
        data: {
          status: 'completed',
          outputData: output,
          completedAt: new Date(),
          durationMs: Date.now() - new Date(stepExecution.startedAt!).getTime(),
        },
      });

      return output;
    } catch (error: any) {
      // If it's a user input pause, rethrow
      if (error.message === 'WAITING_FOR_USER') {
        throw error;
      }

      // Mark as failed
      await prisma.stepExecution.update({
        where: { id: stepExecution.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Resolve input data from context
   */
  private resolveInputData(step: any, context: any): any {
    if (!step.inputSource) {
      return {};
    }

    // Handle different input sources
    if (step.inputSource === 'previous_step') {
      // Get output from previous step
      const prevStepKey = `step_${step.stepOrder - 1}_output`;
      return context[prevStepKey] || {};
    }

    if (step.inputSource === 'user_input') {
      // Will be provided when resuming
      return {};
    }

    if (step.inputSource.startsWith('step_')) {
      // Specific step output
      return context[step.inputSource] || {};
    }

    // Try to resolve as variable path
    return this.getNestedValue(context, step.inputSource);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Resume execution after user input
   */
  async resumeExecution(executionId: string, userId: number, userInput: any) {
    try {
      // Get execution
      const execution = await prisma.workflowExecution.findFirst({
        where: {
          executionId,
          userId,
        },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepOrder: 'asc' },
              },
            },
          },
          stepExecutions: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (!execution) {
        throw new Error('Execution not found or access denied');
      }

      if (execution.status !== 'waiting_user') {
        throw new Error('Execution is not waiting for user input');
      }

      // Find the step waiting for input
      const waitingStep = execution.stepExecutions.find(se => se.status === 'waiting_user');
      if (!waitingStep) {
        throw new Error('No step waiting for user input');
      }

      // Update step with user input
      await prisma.stepExecution.update({
        where: { id: waitingStep.id },
        data: {
          status: 'completed',
          outputData: userInput,
          completedAt: new Date(),
          durationMs: Date.now() - new Date(waitingStep.startedAt!).getTime(),
        },
      });

      // Update context with user input
      const step = execution.workflow.steps.find(s => s.id === waitingStep.stepId);
      if (step) {
        const outputKey = step.outputVariable || `step_${step.stepOrder}_output`;
        const context = execution.context as any;
        context[outputKey] = userInput;

        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            context,
            status: 'running',
          },
        });
      }

      // Continue execution from next step
      const remainingSteps = execution.workflow.steps.filter(
        s => s.stepOrder > (execution.currentStep || 0)
      );

      if (remainingSteps.length > 0) {
        try {
          await this.executeSteps(execution.id, remainingSteps, userId);

          // Mark as completed
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              durationMs: Date.now() - new Date(execution.startedAt!).getTime(),
            },
          });

          logger.info(`Workflow execution completed: ${executionId}`);
        } catch (error: any) {
          // Check if waiting for user again
          if (error.message === 'WAITING_FOR_USER') {
            logger.info(`Workflow execution paused again for user input: ${executionId}`);
            return { executionId, status: 'waiting_user' };
          }

          throw error;
        }
      } else {
        // No more steps, mark as completed
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            durationMs: Date.now() - new Date(execution.startedAt!).getTime(),
          },
        });
      }

      return { executionId, status: 'completed' };
    } catch (error: any) {
      logger.error('Error resuming execution:', error);
      throw error;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string, userId: number) {
    try {
      const execution = await prisma.workflowExecution.findFirst({
        where: { executionId, userId },
      });

      if (!execution) {
        throw new Error('Execution not found or access denied');
      }

      if (!['running', 'waiting_user', 'pending'].includes(execution.status)) {
        throw new Error('Can only cancel running, waiting, or pending executions');
      }

      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      // Cancel pending/running steps
      await prisma.stepExecution.updateMany({
        where: {
          workflowExecutionId: execution.id,
          status: { in: ['pending', 'running', 'waiting_user'] },
        },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      logger.info(`Execution ${executionId} cancelled by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error('Error cancelling execution:', error);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string, userId: number) {
    try {
      const execution = await prisma.workflowExecution.findFirst({
        where: { executionId, userId },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          stepExecutions: {
            include: {
              step: {
                select: {
                  id: true,
                  name: true,
                  stepType: true,
                  stepOrder: true,
                  pageComponent: true,
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
      logger.error('Error getting execution status:', error);
      throw error;
    }
  }
}

export const stepExecutorService = new StepExecutorService();

