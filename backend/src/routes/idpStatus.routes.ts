import { Router } from 'express';
import { idpStatusController } from '../controllers/idpStatus.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get IDP processing status
router.post('/status', idpStatusController.getStatus);

// Request manual review
router.post('/review', idpStatusController.requestReview);

// Approve manual review
router.post('/approve', idpStatusController.approveReview);

export default router;

