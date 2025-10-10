import { Router } from 'express';
import systemController from '../controllers/system.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/menu', authenticate, systemController.getMenu);
router.get('/settings', systemController.getPublicSettings);

export default router;

