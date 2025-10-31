import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { pagesController } from '../controllers/pages.controller';

const router = Router();

// Public routes (no authentication required)
router.get('/slug/:slug', pagesController.getBySlug);

// Protected routes (authentication required)
router.get('/', authenticate, pagesController.getAll);
router.get('/:id', authenticate, pagesController.getById);
router.post('/', authenticate, pagesController.create);
router.put('/:id', authenticate, pagesController.update);
router.delete('/:id', authenticate, pagesController.delete);
router.post('/:id/publish', authenticate, pagesController.publish);
router.post('/import', authenticate, pagesController.import);
router.get('/:id/export', authenticate, pagesController.export);

export default router;

