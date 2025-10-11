import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import flowController from '../controllers/flow.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all flows
router.get('/', flowController.getFlows);

// Get a specific flow by name
router.get('/:name', flowController.getFlowByName);

export default router;

