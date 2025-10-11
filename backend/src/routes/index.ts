import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import uploadRoutes from './upload.routes';
import analysisRoutes from './analysis.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import systemRoutes from './system.routes';
import settingsRoutes from './settings.routes';
import promptRoutes from './prompt.routes';
import dashboardRoutes from './dashboard.routes';
import flowRoutes from './flow.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/uploads', uploadRoutes);
router.use('/analysis', analysisRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/system', systemRoutes);
router.use('/settings', settingsRoutes);
router.use('/prompts', promptRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/flows', flowRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

