import { Router } from 'express';
import multer from 'multer';
import uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 52428800, // 50MB max
  },
});

router.post('/', authenticate, upload.single('file'), uploadController.uploadFile);
router.get('/', authenticate, uploadController.getUserUploads);
router.delete('/:id', authenticate, uploadController.deleteUpload);

export default router;


