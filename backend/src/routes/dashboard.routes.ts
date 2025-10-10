import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// User dashboard statistics
router.get('/statistics', authenticate, dashboardController.getStatistics);

// Admin dashboard statistics
router.get('/admin-statistics', authenticate, requireAdmin, dashboardController.getAdminStatistics);

export default router;

