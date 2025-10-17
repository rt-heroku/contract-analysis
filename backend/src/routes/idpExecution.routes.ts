import { Router } from 'express';
import { idpExecutionController } from '../controllers/idpExecution.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Parse IDP URL (helper endpoint)
router.post('/parse-url', idpExecutionController.parseUrl);

// CRUD operations
router.get('/', idpExecutionController.getAll);
router.get('/:id', idpExecutionController.getById);
router.post('/', idpExecutionController.create);
router.put('/:id', idpExecutionController.update);
router.delete('/:id', idpExecutionController.delete);

// Sharing operations
router.get('/:id/shared-users', idpExecutionController.getSharedUsers);
router.post('/:id/share', idpExecutionController.share);
router.delete('/:id/unshare/:userId', idpExecutionController.unshare);

export default router;

