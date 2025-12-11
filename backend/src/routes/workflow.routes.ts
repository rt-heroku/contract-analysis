import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Workflow Management Routes
 */

// Get all workflows
router.get(
  '/',
  workflowController.getWorkflows.bind(workflowController)
);

// Get workflow by ID
router.get(
  '/:id',
  workflowController.getWorkflowById.bind(workflowController)
);

// Create workflow
router.post(
  '/',
  workflowController.createWorkflow.bind(workflowController)
);

// Update workflow
router.put(
  '/:id',
  workflowController.updateWorkflow.bind(workflowController)
);

// Delete workflow
router.delete(
  '/:id',
  workflowController.deleteWorkflow.bind(workflowController)
);

// Duplicate workflow
router.post(
  '/:id/duplicate',
  workflowController.duplicateWorkflow.bind(workflowController)
);

/**
 * Step Management Routes
 */

// Add step to workflow
router.post(
  '/:id/steps',
  workflowController.addStep.bind(workflowController)
);

// Update step
router.put(
  '/:id/steps/:stepId',
  workflowController.updateStep.bind(workflowController)
);

// Delete step
router.delete(
  '/:id/steps/:stepId',
  workflowController.deleteStep.bind(workflowController)
);

// Reorder steps
router.put(
  '/:id/steps/reorder',
  workflowController.reorderSteps.bind(workflowController)
);

/**
 * Execution Routes
 */

// Execute workflow
router.post(
  '/:id/execute',
  workflowController.executeWorkflow.bind(workflowController)
);

// Resume execution (after user input)
router.post(
  '/executions/:executionId/resume',
  workflowController.resumeExecution.bind(workflowController)
);

// Cancel execution
router.post(
  '/executions/:executionId/cancel',
  workflowController.cancelExecution.bind(workflowController)
);

// Get execution status
router.get(
  '/executions/:executionId',
  workflowController.getExecutionStatus.bind(workflowController)
);

export default router;

