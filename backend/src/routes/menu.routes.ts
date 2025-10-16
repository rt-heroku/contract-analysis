import { Router } from 'express';
import { menuController } from '../controllers/menu.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// All menu routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Menu item CRUD
router.get('/', menuController.getAllMenuItems);
router.post('/', menuController.createMenuItem);
router.put('/:id', menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);

// Menu assignment to roles
router.get('/role/:roleId', menuController.getRoleMenuPermissions);
router.post('/assign', menuController.assignMenuToRole);
router.post('/remove', menuController.removeMenuFromRole);
router.post('/bulk-assign', menuController.bulkAssignMenusToRole);

// Reorder menu items
router.post('/reorder', menuController.reorderMenuItems);

export default router;

