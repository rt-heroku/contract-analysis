import { Router } from 'express';
import { storeController } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Store CRUD routes
router.get('/', storeController.getStores);
router.get('/:id', storeController.getStoreById);
router.post('/', storeController.createStore);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);
router.post('/:id/test', storeController.testConnection);

export default router;
