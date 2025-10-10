import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Activity Logs
router.get('/activity-logs', adminController.getActivityLogs);

// API Logs
router.get('/api-logs', adminController.getApiLogs);

// Sessions
router.get('/sessions', adminController.getSessions);

// User Management
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.updateUserStatus);

export default router;
