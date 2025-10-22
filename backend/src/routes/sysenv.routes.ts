import { Router } from 'express';
import { sysenvController } from '../controllers/sysenv.controller';

const router = Router();

// Public endpoint for system debugging
router.get('/', sysenvController.getSystemInfo);

export default router;
