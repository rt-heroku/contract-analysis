import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { stepExecutorService } from '../services/stepExecutor.service';
import loggingService from '../services/logging.service';
import logger from '../utils/logger';

/**
 * Workflow Controller
 * 
 * Handles HTTP requests for workflow management and execution
 */
class WorkflowController {
  /**
   * Get all workflows for user
   */
  async getWorkflows(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { category, isActive, isTemplate } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isTemplate !== undefined) filters.isTemplate = isTemplate === 'true';

      const workflows = await workflowService.getWorkflows(userId, filters);

      res.json(workflows);
    } catch (error: any) {
      logger.error('Error getting workflows:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);

      const workflow = await workflowService.getWorkflowById(workflowId, userId);

      res.json(workflow);
    } catch (error: any) {
      logger.error('Error getting workflow:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Create new workflow
   */
  async createWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { name, description, category, timeoutSeconds, isTemplate } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Workflow name is required' });
      }

      const workflow = await workflowService.createWorkflow(userId, {
        name,
        description,
        category,
        timeoutSeconds,
        isTemplate,
      });

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.create',
        actionDescription: `Created workflow: ${name}`,
        metadata: { workflowId: workflow.id },
      });

      res.status(201).json(workflow);
    } catch (error: any) {
      logger.error('Error creating workflow:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update workflow
   */
  async updateWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);
      const { name, description, category, timeoutSeconds, isActive } = req.body;

      const workflow = await workflowService.updateWorkflow(workflowId, userId, {
        name,
        description,
        category,
        timeoutSeconds,
        isActive,
      });

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.update',
        actionDescription: `Updated workflow: ${workflow.name}`,
        metadata: { workflowId: workflow.id },
      });

      res.json(workflow);
    } catch (error: any) {
      logger.error('Error updating workflow:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);

      await workflowService.deleteWorkflow(workflowId, userId);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.delete',
        actionDescription: `Deleted workflow ID: ${workflowId}`,
        metadata: { workflowId },
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Error deleting workflow:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Add step to workflow
   */
  async addStep(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);
      const stepData = req.body;

      if (!stepData.stepType || !stepData.name) {
        return res.status(400).json({ error: 'Step type and name are required' });
      }

      const step = await workflowService.addStep(workflowId, userId, stepData);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.step.add',
        actionDescription: `Added step: ${stepData.name} to workflow ${workflowId}`,
        metadata: { workflowId, stepId: step.id },
      });

      res.status(201).json(step);
    } catch (error: any) {
      logger.error('Error adding step:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Update step
   */
  async updateStep(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const stepId = parseInt(req.params.stepId);
      const stepData = req.body;

      const step = await workflowService.updateStep(stepId, userId, stepData);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.step.update',
        actionDescription: `Updated step: ${step.name}`,
        metadata: { stepId: step.id },
      });

      res.json(step);
    } catch (error: any) {
      logger.error('Error updating step:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Delete step
   */
  async deleteStep(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const stepId = parseInt(req.params.stepId);

      await workflowService.deleteStep(stepId, userId);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.step.delete',
        actionDescription: `Deleted step ID: ${stepId}`,
        metadata: { stepId },
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Error deleting step:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Reorder steps
   */
  async reorderSteps(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);
      const { stepOrders } = req.body;

      if (!Array.isArray(stepOrders)) {
        return res.status(400).json({ error: 'stepOrders must be an array' });
      }

      await workflowService.reorderSteps(workflowId, userId, stepOrders);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.steps.reorder',
        actionDescription: `Reordered steps in workflow ${workflowId}`,
        metadata: { workflowId, stepCount: stepOrders.length },
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Error reordering steps:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Duplicate workflow
   */
  async duplicateWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);

      const duplicate = await workflowService.duplicateWorkflow(workflowId, userId);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.duplicate',
        actionDescription: `Duplicated workflow ${workflowId} as ${duplicate.id}`,
        metadata: { originalId: workflowId, duplicateId: duplicate.id },
      });

      res.status(201).json(duplicate);
    } catch (error: any) {
      logger.error('Error duplicating workflow:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const workflowId = parseInt(req.params.id);
      const { initialData } = req.body;

      const result = await stepExecutorService.executeWorkflow(workflowId, userId, initialData || {});

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.execute',
        actionDescription: `Executed workflow ${workflowId}`,
        metadata: { workflowId, executionId: result.executionId, status: result.status },
      });

      res.json(result);
    } catch (error: any) {
      logger.error('Error executing workflow:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Resume execution after user input
   */
  async resumeExecution(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { executionId } = req.params;
      const { userInput } = req.body;

      const result = await stepExecutorService.resumeExecution(executionId, userId, userInput);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.execution.resume',
        actionDescription: `Resumed workflow execution ${executionId}`,
        metadata: { executionId, status: result.status },
      });

      res.json(result);
    } catch (error: any) {
      logger.error('Error resuming execution:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { executionId } = req.params;

      await stepExecutorService.cancelExecution(executionId, userId);

      // Log activity
      await loggingService.logActivity({
        userId,
        actionType: 'workflow.execution.cancel',
        actionDescription: `Cancelled workflow execution ${executionId}`,
        metadata: { executionId },
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error('Error cancelling execution:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { executionId } = req.params;

      const execution = await stepExecutorService.getExecutionStatus(executionId, userId);

      res.json(execution);
    } catch (error: any) {
      logger.error('Error getting execution status:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  }
}

export const workflowController = new WorkflowController();

