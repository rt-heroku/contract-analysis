import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import aiAnalysisService from '../services/aiAnalysis.service';
import tableAnalysisService from '../services/tableAnalysis.service';
import logger from '../utils/logger';
import loggingService from '../services/logging.service';

/**
 * Analyze table health with AI
 */
export const analyzeTableHealth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const { schemaName, tableName } = req.params;
    const userId = req.user!.id;

    logger.info(`Analyzing table health: ${schemaName}.${tableName}`);

    const result = await aiAnalysisService.analyzeTable(
      connectorId,
      userId,
      schemaName,
      tableName,
      'health_check'
    );

    await loggingService.logActivity({
      userId,
      actionType: 'db.table.analyze_health',
      actionDescription: `Analyzed health of table ${schemaName}.${tableName}`,
      metadata: {
        connectorId,
        schemaName,
        tableName,
        scenario: result.scenario,
        healthScore: result.healthScore,
      },
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Analyze table health error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze table health' });
  }
};

/**
 * Get performance optimization recommendations with AI
 */
export const getPerformanceTips = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const { schemaName, tableName } = req.params;
    const userId = req.user!.id;

    logger.info(`Getting performance tips: ${schemaName}.${tableName}`);

    const result = await aiAnalysisService.analyzeTable(
      connectorId,
      userId,
      schemaName,
      tableName,
      'performance_optimization'
    );

    await loggingService.logActivity({
      userId,
      actionType: 'db.table.analyze_performance',
      actionDescription: `Analyzed performance of table ${schemaName}.${tableName}`,
      metadata: {
        connectorId,
        schemaName,
        tableName,
        scenario: result.scenario,
        healthScore: result.healthScore,
      },
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Get performance tips error:', error);
    res.status(500).json({ error: error.message || 'Failed to get performance tips' });
  }
};

/**
 * Get latest analysis for a table
 */
export const getLatestAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const { schemaName, tableName } = req.params;

    const analysis = await tableAnalysisService.getLatestAnalysis(
      connectorId,
      schemaName,
      tableName
    );

    if (!analysis) {
      return res.json(null);
    }

    // Parse recommendations if they're stored as JSON
    let parsedRecommendations = analysis.recommendations;
    if (typeof parsedRecommendations === 'string') {
      try {
        parsedRecommendations = JSON.parse(parsedRecommendations);
      } catch (e) {
        // Keep as-is if not JSON
      }
    }

    // Extract recommendations array if it's nested
    const recommendations = parsedRecommendations?.recommendations || parsedRecommendations || [];

    res.json({
      id: analysis.id,
      scenarioDetected: analysis.scenarioDetected,
      healthScore: analysis.healthScore,
      summary: analysis.summary || 'No summary available',
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      rawResponse: parsedRecommendations,
      executedActions: analysis.actionsTaken,
      executor: analysis.executor,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    });
  } catch (error: any) {
    logger.error('Get latest analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to get latest analysis' });
  }
};

/**
 * Get analysis history for a table
 */
export const getAnalysisHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const { schemaName, tableName } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await tableAnalysisService.getAnalysisHistory(
      connectorId,
      schemaName,
      tableName,
      limit
    );

    res.json(history.map(h => ({
      id: h.id,
      scenario: h.scenarioDetected,
      healthScore: h.healthScore,
      analysisType: h.analysisType,
      executor: h.executor,
      createdAt: h.createdAt,
    })));
  } catch (error: any) {
    logger.error('Get analysis history error:', error);
    res.status(500).json({ error: error.message || 'Failed to get analysis history' });
  }
};

/**
 * Get analysis by ID
 */
export const getAnalysisById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysisId = parseInt(req.params.analysisId);

    const analysis = await aiAnalysisService.getAnalysisById(analysisId);

    res.json(analysis);
  } catch (error: any) {
    logger.error('Get analysis by ID error:', error);
    res.status(500).json({ error: error.message || 'Failed to get analysis' });
  }
};

/**
 * Execute a recommendation action
 */
export const executeRecommendation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysisId = parseInt(req.params.analysisId);
    const { actionIndex, sql } = req.body;
    const userId = req.user!.id;

    if (typeof actionIndex !== 'number' || !sql) {
      return res.status(400).json({ error: 'Invalid request: actionIndex and sql are required' });
    }

    const result = await aiAnalysisService.executeRecommendation(
      analysisId,
      userId,
      actionIndex,
      sql
    );

    await loggingService.logActivity({
      userId,
      actionType: 'db.analysis.execute_recommendation',
      actionDescription: `Executed recommendation ${actionIndex} from analysis ${analysisId}`,
      metadata: { analysisId, actionIndex, sql: sql.substring(0, 200) },
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Execute recommendation error:', error);
    res.status(500).json({ error: error.message || 'Failed to execute recommendation' });
  }
};

