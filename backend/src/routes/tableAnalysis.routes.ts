import express from 'express';
import * as tableAnalysisController from '../controllers/tableAnalysis.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Analyze table health (general health check)
router.post(
  '/:connectorId/schemas/:schemaName/tables/:tableName/analyze-health',
  tableAnalysisController.analyzeTableHealth
);

// Get performance optimization tips (detects scenario, provides recommendations)
router.post(
  '/:connectorId/schemas/:schemaName/tables/:tableName/performance-tips',
  tableAnalysisController.getPerformanceTips
);

// Get latest analysis for a table
router.get(
  '/:connectorId/schemas/:schemaName/tables/:tableName/latest-analysis',
  tableAnalysisController.getLatestAnalysis
);

// Get analysis history for a table
router.get(
  '/:connectorId/schemas/:schemaName/tables/:tableName/analysis-history',
  tableAnalysisController.getAnalysisHistory
);

// Get specific analysis by ID
router.get(
  '/analysis/:analysisId',
  tableAnalysisController.getAnalysisById
);

// Execute a recommendation from an analysis
router.post(
  '/analysis/:analysisId/execute',
  tableAnalysisController.executeRecommendation
);

export default router;

