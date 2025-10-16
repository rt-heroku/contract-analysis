import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import documentService from '../services/document.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';
import prisma from '../config/database';

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

  async getContractAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisRecordId = parseInt(req.params.id);

      // Check if user has admin role
      const isAdmin = req.user.roles.includes('admin');

      const analysis = await documentService.getAnalysisById(
        analysisRecordId,
        isAdmin ? undefined : req.user.id
      );

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis record not found' });
      }

      if (!analysis.contractAnalysis) {
        return res.status(404).json({ error: 'Contract analysis not yet available. Please wait for Step 1 to complete.' });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ANALYSIS.VIEW,
        actionDescription: `Viewed IDP response for analysis #${analysisRecordId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ contractAnalysis: analysis.contractAnalysis });
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

  async getAnalysisByUpload(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const uploadId = parseInt(req.params.uploadId);
      if (isNaN(uploadId)) {
        return res.status(400).json({ error: 'Invalid upload ID' });
      }

      // Find the most recent analysis record for this upload
      const analysisRecord = await prisma.analysisRecord.findFirst({
        where: {
          contractUploadId: uploadId,
          userId: req.user.id, // Security: only get user's own analyses
        },
        orderBy: { createdAt: 'desc' },
        include: {
          contractAnalysis: true,
          dataAnalysis: true,
        },
      });

      if (!analysisRecord) {
        return res.status(404).json({ error: 'Analysis not found for this upload' });
      }

      res.json({ analysisRecord });
    } catch (error: any) {
      console.error('Error fetching analysis by upload:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get shared users for an analysis
   */
  async getSharedUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisId = parseInt(req.params.id);

      const analysis = await prisma.analysisRecord.findUnique({
        where: { id: analysisId },
        select: { sharedWith: true },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Get user details for shared users
      const sharedUserIds = analysis.sharedWith || [];
      const users = await prisma.user.findMany({
        where: {
          id: { in: sharedUserIds },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      res.json({ sharedUsers: users });
    } catch (error: any) {
      console.error('Error fetching shared users:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Share analysis with a user
   */
  async shareAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const analysis = await prisma.analysisRecord.findUnique({
        where: { id: analysisId },
        select: { sharedWith: true, userId: true },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Check if user owns this analysis
      if (analysis.userId !== req.user.id) {
        return res.status(403).json({ error: 'You can only share your own analyses' });
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add user to sharedWith array if not already there
      const currentSharedWith = analysis.sharedWith || [];
      if (!currentSharedWith.includes(userId)) {
        await prisma.analysisRecord.update({
          where: { id: analysisId },
          data: {
            sharedWith: [...currentSharedWith, userId],
          },
        });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'analysis.share',
        actionDescription: `Shared analysis with ${targetUser.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { analysisId, sharedWithUserId: userId },
      });

      res.json({ message: 'Analysis shared successfully' });
    } catch (error: any) {
      console.error('Error sharing analysis:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Remove share from analysis
   */
  async unshareAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const analysisId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const analysis = await prisma.analysisRecord.findUnique({
        where: { id: analysisId },
        select: { sharedWith: true, userId: true },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      // Check if user owns this analysis
      if (analysis.userId !== req.user.id) {
        return res.status(403).json({ error: 'You can only unshare your own analyses' });
      }

      // Remove user from sharedWith array
      const currentSharedWith = analysis.sharedWith || [];
      await prisma.analysisRecord.update({
        where: { id: analysisId },
        data: {
          sharedWith: currentSharedWith.filter((id) => id !== userId),
        },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'analysis.unshare',
        actionDescription: `Removed share from analysis`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { analysisId, removedUserId: userId },
      });

      res.json({ message: 'Share removed successfully' });
    } catch (error: any) {
      console.error('Error unsharing analysis:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AnalysisController();


