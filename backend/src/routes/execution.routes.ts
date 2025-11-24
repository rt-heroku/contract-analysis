import { Router } from 'express';
import { executionController } from '../controllers/execution.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/executions - Get all executions
router.get('/', executionController.getExecutions);

// GET /api/executions/stats - Get execution statistics
router.get('/stats', executionController.getExecutionStats);

// GET /api/executions/:id - Get execution by ID
router.get('/:id', executionController.getExecutionById);

// POST /api/executions/:id/cancel - Cancel execution
router.post('/:id/cancel', executionController.cancelExecution);

// POST /api/executions/:id/retry - Retry execution
router.post('/:id/retry', executionController.retryExecution);

export default router;

