import { Router } from 'express';
import { actionController } from '../controllers/action.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/actions - Get all actions
router.get('/', actionController.getActions);

// GET /api/actions/system - Get system actions
router.get('/system', actionController.getSystemActions);

// GET /api/actions/:id - Get action by ID
router.get('/:id', actionController.getActionById);

// POST /api/actions - Create action
router.post('/', actionController.createAction);

// PUT /api/actions/:id - Update action
router.put('/:id', actionController.updateAction);

// DELETE /api/actions/:id - Delete action
router.delete('/:id', actionController.deleteAction);

// POST /api/actions/:id/share - Share action
router.post('/:id/share', actionController.shareAction);

export default router;

