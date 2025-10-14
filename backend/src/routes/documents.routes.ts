import { Router } from 'express';
import documentsController from '../controllers/documents.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.get('/', authenticate, documentsController.getDocuments);
router.post(
  '/upload', 
  authenticate, 
  documentsController.getUploadMiddleware(), 
  documentsController.uploadDocument
);
router.get('/:id/download', authenticate, documentsController.downloadDocument);
router.delete('/:id', authenticate, documentsController.deleteDocument);

export default router;

