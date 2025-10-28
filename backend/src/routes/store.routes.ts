import { Router } from 'express';
import { storeController } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/stores - Get all stores
router.get('/', storeController.getStores);

// GET /api/stores/:id - Get store by ID
router.get('/:id', storeController.getStoreById);

// POST /api/stores - Create store
router.post('/', storeController.createStore);

// PUT /api/stores/:id - Update store
router.put('/:id', storeController.updateStore);

// DELETE /api/stores/:id - Delete store
router.delete('/:id', storeController.deleteStore);

export default router;

