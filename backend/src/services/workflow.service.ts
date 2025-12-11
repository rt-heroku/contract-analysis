import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * Workflow Service
 * 
 * Manages CRUD operations for the Step Builder workflow system.
 * Separate from Process Designer for simplicity and compatibility.
 */
class WorkflowService {
  /**
   * Create a new workflow
   */
  async createWorkflow(userId: number, data: {
    name: string;
    description?: string;
    category?: string;
    timeoutSeconds?: number;
    isTemplate?: boolean;
  }) {
    try {
      const workflow = await prisma.workflow.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          timeoutSeconds: data.timeoutSeconds || 1800,
          isTemplate: data.isTemplate || false,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      logger.info(`Workflow created: ${workflow.id} by user ${userId}`);
      return workflow;
    } catch (error: any) {
      logger.error('Error creating workflow:', error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  /**
   * Get workflows for a user
   */
  async getWorkflows(userId: number, filters?: {
    category?: string;
    isActive?: boolean;
    isTemplate?: boolean;
  }) {
    try {
      const where: any = { createdBy: userId };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.isTemplate !== undefined) {
        where.isTemplate = filters.isTemplate;
      }

      const workflows = await prisma.workflow.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
          _count: {
            select: {
              executions: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return workflows;
    } catch (error: any) {
      logger.error('Error fetching workflows:', error);
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: number, userId: number) {
    try {
      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!workflow) {
        throw new Error('Workflow not found or access denied');
      }

      return workflow;
    } catch (error: any) {
      logger.error(`Error fetching workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: number, userId: number, data: {
    name?: string;
    description?: string;
    category?: string;
    timeoutSeconds?: number;
    isActive?: boolean;
  }) {
    try {
      // Verify ownership
      const existing = await prisma.workflow.findFirst({
        where: { id, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Workflow not found or access denied');
      }

      const workflow = await prisma.workflow.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          timeoutSeconds: data.timeoutSeconds,
          isActive: data.isActive,
          updatedAt: new Date(),
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      logger.info(`Workflow ${id} updated by user ${userId}`);
      return workflow;
    } catch (error: any) {
      logger.error(`Error updating workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: number, userId: number) {
    try {
      // Verify ownership
      const existing = await prisma.workflow.findFirst({
        where: { id, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Workflow not found or access denied');
      }

      await prisma.workflow.delete({
        where: { id },
      });

      logger.info(`Workflow ${id} deleted by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error deleting workflow ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add step to workflow
   */
  async addStep(workflowId: number, userId: number, stepData: {
    stepType: string;
    name: string;
    description?: string;
    config: any;
    inputSource?: string;
    outputVariable?: string;
    pageComponent?: string;
    requiresUserInput?: boolean;
    condition?: any;
  }) {
    try {
      // Verify ownership
      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, createdBy: userId },
        include: { steps: true },
      });

      if (!workflow) {
        throw new Error('Workflow not found or access denied');
      }

      // Calculate next step order
      const maxOrder = workflow.steps.length > 0
        ? Math.max(...workflow.steps.map(s => s.stepOrder))
        : 0;

      const step = await prisma.workflowStep.create({
        data: {
          workflowId,
          stepOrder: maxOrder + 1,
          stepType: stepData.stepType,
          name: stepData.name,
          description: stepData.description,
          config: stepData.config,
          inputSource: stepData.inputSource,
          outputVariable: stepData.outputVariable,
          pageComponent: stepData.pageComponent,
          requiresUserInput: stepData.requiresUserInput || false,
          condition: stepData.condition,
        },
      });

      // Update workflow timestamp
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { updatedAt: new Date() },
      });

      logger.info(`Step ${step.id} added to workflow ${workflowId}`);
      return step;
    } catch (error: any) {
      logger.error(`Error adding step to workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Update step
   */
  async updateStep(stepId: number, userId: number, stepData: {
    name?: string;
    description?: string;
    config?: any;
    inputSource?: string;
    outputVariable?: string;
    pageComponent?: string;
    requiresUserInput?: boolean;
    condition?: any;
  }) {
    try {
      // Verify ownership through workflow
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { workflow: true },
      });

      if (!step || step.workflow.createdBy !== userId) {
        throw new Error('Step not found or access denied');
      }

      const updatedStep = await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          name: stepData.name,
          description: stepData.description,
          config: stepData.config,
          inputSource: stepData.inputSource,
          outputVariable: stepData.outputVariable,
          pageComponent: stepData.pageComponent,
          requiresUserInput: stepData.requiresUserInput,
          condition: stepData.condition,
          updatedAt: new Date(),
        },
      });

      // Update workflow timestamp
      await prisma.workflow.update({
        where: { id: step.workflowId },
        data: { updatedAt: new Date() },
      });

      logger.info(`Step ${stepId} updated by user ${userId}`);
      return updatedStep;
    } catch (error: any) {
      logger.error(`Error updating step ${stepId}:`, error);
      throw error;
    }
  }

  /**
   * Reorder steps
   */
  async reorderSteps(workflowId: number, userId: number, stepOrders: { stepId: number; newOrder: number }[]) {
    try {
      // Verify ownership
      const workflow = await prisma.workflow.findFirst({
        where: { id: workflowId, createdBy: userId },
      });

      if (!workflow) {
        throw new Error('Workflow not found or access denied');
      }

      // Update each step's order in a transaction
      await prisma.$transaction(
        stepOrders.map(({ stepId, newOrder }) =>
          prisma.workflowStep.update({
            where: { id: stepId },
            data: { stepOrder: newOrder },
          })
        )
      );

      // Update workflow timestamp
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { updatedAt: new Date() },
      });

      logger.info(`Steps reordered in workflow ${workflowId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error reordering steps in workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Delete step
   */
  async deleteStep(stepId: number, userId: number) {
    try {
      // Verify ownership through workflow
      const step = await prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: { workflow: true },
      });

      if (!step || step.workflow.createdBy !== userId) {
        throw new Error('Step not found or access denied');
      }

      const workflowId = step.workflowId;
      const deletedOrder = step.stepOrder;

      // Delete the step
      await prisma.workflowStep.delete({
        where: { id: stepId },
      });

      // Reorder remaining steps
      await prisma.workflowStep.updateMany({
        where: {
          workflowId,
          stepOrder: { gt: deletedOrder },
        },
        data: {
          stepOrder: { decrement: 1 },
        },
      });

      // Update workflow timestamp
      await prisma.workflow.update({
        where: { id: workflowId },
        data: { updatedAt: new Date() },
      });

      logger.info(`Step ${stepId} deleted by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error deleting step ${stepId}:`, error);
      throw error;
    }
  }

  /**
   * Duplicate workflow
   */
  async duplicateWorkflow(id: number, userId: number) {
    try {
      // Get original workflow with steps
      const original = await prisma.workflow.findFirst({
        where: { id, createdBy: userId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      });

      if (!original) {
        throw new Error('Workflow not found or access denied');
      }

      // Create new workflow
      const duplicate = await prisma.workflow.create({
        data: {
          name: `${original.name} (Copy)`,
          description: original.description,
          category: original.category,
          timeoutSeconds: original.timeoutSeconds,
          isTemplate: false,
          createdBy: userId,
          steps: {
            create: original.steps.map(step => ({
              stepOrder: step.stepOrder,
              stepType: step.stepType,
              name: step.name,
              description: step.description,
              config: step.config as any,
              inputSource: step.inputSource,
              outputVariable: step.outputVariable,
              pageComponent: step.pageComponent,
              requiresUserInput: step.requiresUserInput,
              condition: step.condition as any,
            })),
          },
        },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      logger.info(`Workflow ${id} duplicated as ${duplicate.id} by user ${userId}`);
      return duplicate;
    } catch (error: any) {
      logger.error(`Error duplicating workflow ${id}:`, error);
      throw error;
    }
  }
}

export const workflowService = new WorkflowService();

