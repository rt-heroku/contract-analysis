import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's own permissions (any authenticated user)
router.get('/me/permissions', roleController.getUserPermissions);

// Admin-only routes
router.get('/', requireAdmin, roleController.getAllRoles);
router.get('/:id', requireAdmin, roleController.getRoleById);
router.post('/', requireAdmin, roleController.createRole);
router.put('/:id', requireAdmin, roleController.updateRole);
router.delete('/:id', requireAdmin, roleController.deleteRole);

// Permissions
router.get('/permissions/all', requireAdmin, roleController.getAllPermissions);
router.get('/permissions/by-category', requireAdmin, roleController.getPermissionsByCategory);
router.get('/:roleId/permissions', requireAdmin, roleController.getRolePermissions);
router.post('/permissions/assign', requireAdmin, roleController.assignPermissionToRole);
router.post('/permissions/remove', requireAdmin, roleController.removePermissionFromRole);
router.post('/permissions/bulk-update', requireAdmin, roleController.bulkUpdateRolePermissions);

export default router;

