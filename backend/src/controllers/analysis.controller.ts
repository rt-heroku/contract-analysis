import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import documentService from '../services/document.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';

class AnalysisController {
  async startProcessing(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { contractUploadId, dataUploadId, prompt, variables } = req.body;

      if (!contractUploadId || !dataUploadId) {
        return res.status(400).json({
          error: 'Both contract and data upload IDs are required',
        });
      }

      const result = await documentService.startProcessing(
        req.user.id,
        parseInt(contractUploadId),
        parseInt(dataUploadId),
        prompt,
        variables
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.PROCESSING.START,
        actionDescription: 'Started document processing',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: {
          contractUploadId,
          dataUploadId,
          analysisRecordId: result.analysisRecordId,
        },
      });

      res.status(202).json({
        message: 'Processing started',
        analysisRecordId: result.analysisRecordId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisId = parseInt(req.params.id);

      // Check if user has admin role
      const isAdmin = req.user.roles.includes('admin');

      const analysis = await documentService.getAnalysisById(
        analysisId,
        isAdmin ? undefined : req.user.id
      );

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ANALYSIS.VIEW,
        actionDescription: `Viewed analysis #${analysisId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ analysis });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAnalysisHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const result = await documentService.getUserAnalysisHistory(
        req.user.id,
        page,
        limit,
        search
      );

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ANALYSIS.VIEW_LIST,
        actionDescription: 'Viewed analysis history',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisId = parseInt(req.params.id);

      await documentService.deleteAnalysis(analysisId, req.user.id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ANALYSIS.DELETE,
        actionDescription: `Deleted analysis #${analysisId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Analysis deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async runAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisRecordId = parseInt(req.params.id);
      const { prompt, variables } = req.body;

      const result = await documentService.runAnalysis(
        req.user.id,
        analysisRecordId,
        prompt,
        variables
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.PROCESSING.START,
        actionDescription: 'Started Step 2 - Analysis',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: {
          analysisRecordId,
        },
      });

      res.status(202).json({
        message: 'Analysis started',
        analysisRecordId: result.analysisRecordId,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const stats = await documentService.getStatistics(req.user.id);

      res.json({ statistics: stats });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AnalysisController();


