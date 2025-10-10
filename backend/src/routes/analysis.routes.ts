import { Router } from 'express';
import analysisController from '../controllers/analysis.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/start', authenticate, analysisController.startProcessing);
router.get('/', authenticate, analysisController.getAnalysisHistory);
router.get('/statistics', authenticate, analysisController.getStatistics);
router.get('/:id', authenticate, analysisController.getAnalysis);
router.delete('/:id', authenticate, analysisController.deleteAnalysis);

export default router;

