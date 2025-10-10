import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { validate } from '../middleware/validator';
import { updateUserSchema } from '../utils/validators';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', validate(updateUserSchema), adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// Logs
router.get('/activity-logs', adminController.getActivityLogs);
router.get('/api-logs', adminController.getApiLogs);

// Settings
router.get('/settings', adminController.getSystemSettings);

export default router;


