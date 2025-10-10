import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import settingsController, { upload } from '../controllers/settings.controller';

const router = Router();

// Public settings (no auth required)
router.get('/public', settingsController.getPublicSettings);

// Admin-only routes
router.get('/all', authenticate, settingsController.getAllSettings);
router.put('/:settingKey', authenticate, settingsController.updateSetting);
router.post('/upload-logo', authenticate, upload.single('logo'), settingsController.uploadLogo);

export default router;

