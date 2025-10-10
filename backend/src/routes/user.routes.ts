import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { updateProfileSchema, changePasswordSchema } from '../utils/validators';

const router = Router();

// Get current user with roles
router.get('/me', authenticate, userController.getMe);

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.post('/avatar', authenticate, userController.updateAvatar);
router.delete('/avatar', authenticate, userController.deleteAvatar);
router.put('/password', authenticate, validate(changePasswordSchema), userController.changePassword);
router.get('/activity', authenticate, userController.getActivityLogs);

export default router;


