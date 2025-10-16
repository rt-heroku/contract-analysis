import { Router } from 'express';
import analysisController from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

router.post('/start', authenticate, analysisController.startProcessing);
router.post('/:id/analyze', authenticate, analysisController.runAnalysis);
router.get('/', authenticate, analysisController.getAnalysisHistory);
router.get('/statistics', authenticate, analysisController.getStatistics);
router.get('/by-upload/:uploadId', authenticate, analysisController.getAnalysisByUpload);
router.get('/:id/contract', authenticate, analysisController.getContractAnalysis);
router.get('/:id', authenticate, analysisController.getAnalysis);
router.delete('/:id', authenticate, requireAdmin, analysisController.deleteAnalysis);

// Sharing routes
router.get('/:id/shared-users', authenticate, analysisController.getSharedUsers);
router.post('/:id/share', authenticate, analysisController.shareAnalysis);
router.delete('/:id/share/:userId', authenticate, analysisController.unshareAnalysis);

export default router;


