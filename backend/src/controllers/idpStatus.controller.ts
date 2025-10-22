import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import muleSoftService from '../services/muleSoft.service';
import { idpExecutionService } from '../services/idpExecution.service';
import prisma from '../config/database';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';
import { decrypt } from '../utils/encryption';

export const idpStatusController = {
  /**
   * Get IDP processing status
   */
  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { executionId, jobId, idpExecutionId } = req.body;

      if (!executionId || !jobId || !idpExecutionId) {
        return res.status(400).json({ 
          error: 'executionId, jobId, and idpExecutionId are required' 
        });
      }

      // Get IDP execution configuration
      const idpExecution = await prisma.idpExecution.findUnique({
        where: { id: parseInt(idpExecutionId) },
      });

      if (!idpExecution) {
        return res.status(404).json({ error: 'IDP execution not found' });
      }

      // Decrypt credentials
      const idpConfig = {
        protocol: idpExecution.protocol,
        host: idpExecution.host,
        basePath: idpExecution.basePath,
        orgId: idpExecution.orgId,
        actionId: idpExecution.actionId,
        actionVersion: idpExecution.actionVersion,
        authClientId: decrypt(idpExecution.authClientId),
        authClientSecret: decrypt(idpExecution.authClientSecret),
      };

      // Get status from MuleSoft
      const statusData = await muleSoftService.getProcessingStatus(
        executionId,
        idpConfig,
        jobId
      );

      // Update contract analysis if status changed
      await prisma.contractAnalysis.updateMany({
        where: { jobId, executionId },
        data: {
          status: statusData.status || statusData.documentStatus || 'PROCESSING',
          mulesoftResponse: statusData,
          updatedAt: new Date(),
        },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        jobId,
        actionType: ACTION_TYPES.PROCESSING.CONTRACT_PROCESSING,
        actionDescription: `Checked IDP status for execution ${executionId}: ${statusData.status}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ status: statusData });
    } catch (error: any) {
      console.error('Error getting IDP status:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Request manual review
   */
  async requestReview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { 
        executionId, 
        jobId, 
        idpExecutionId, 
        anypointUsername, 
        anypointPassword,
        saveCredentials 
      } = req.body;

      if (!executionId || !jobId || !idpExecutionId) {
        return res.status(400).json({ 
          error: 'executionId, jobId, and idpExecutionId are required' 
        });
      }

      // Get IDP execution configuration
      const idpExecution = await prisma.idpExecution.findUnique({
        where: { id: parseInt(idpExecutionId) },
      });

      if (!idpExecution) {
        return res.status(404).json({ error: 'IDP execution not found' });
      }

      // Decrypt credentials
      const idpConfig = {
        protocol: idpExecution.protocol,
        host: idpExecution.host,
        basePath: idpExecution.basePath,
        orgId: idpExecution.orgId,
        actionId: idpExecution.actionId,
        actionVersion: idpExecution.actionVersion,
        authClientId: decrypt(idpExecution.authClientId),
        authClientSecret: decrypt(idpExecution.authClientSecret),
      };

      // Use provided credentials or decrypt stored ones
      let username = anypointUsername;
      let password = anypointPassword;

      if (!username && idpExecution.anypointUsername) {
        username = decrypt(idpExecution.anypointUsername);
      }
      if (!password && idpExecution.anypointPassword) {
        password = decrypt(idpExecution.anypointPassword);
      }

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Anypoint credentials are required',
          needsCredentials: true 
        });
      }

      // Request review from MuleSoft
      const reviewData = await muleSoftService.requestReview(
        executionId,
        idpConfig,
        jobId,
        username,
        password
      );

      // Save credentials if requested
      if (saveCredentials && anypointUsername && anypointPassword) {
        const { encrypt } = await import('../utils/encryption');
        await prisma.idpExecution.update({
          where: { id: parseInt(idpExecutionId) },
          data: {
            anypointUsername: encrypt(anypointUsername),
            anypointPassword: encrypt(anypointPassword),
          },
        });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        jobId,
        actionType: ACTION_TYPES.PROCESSING.CONTRACT_PROCESSING,
        actionDescription: `Requested manual review for execution ${executionId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ review: reviewData });
    } catch (error: any) {
      console.error('Error requesting review:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Approve manual review
   */
  async approveReview(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { executionId, jobId, idpExecutionId, approvedData } = req.body;

      if (!executionId || !jobId || !idpExecutionId || !approvedData) {
        return res.status(400).json({ 
          error: 'executionId, jobId, idpExecutionId, and approvedData are required' 
        });
      }

      // Get IDP execution configuration
      const idpExecution = await prisma.idpExecution.findUnique({
        where: { id: parseInt(idpExecutionId) },
      });

      if (!idpExecution) {
        return res.status(404).json({ error: 'IDP execution not found' });
      }

      // Decrypt credentials
      const idpConfig = {
        protocol: idpExecution.protocol,
        host: idpExecution.host,
        basePath: idpExecution.basePath,
        orgId: idpExecution.orgId,
        actionId: idpExecution.actionId,
        actionVersion: idpExecution.actionVersion,
        authClientId: decrypt(idpExecution.authClientId),
        authClientSecret: decrypt(idpExecution.authClientSecret),
      };

      // Approve review in MuleSoft
      const approvalData = await muleSoftService.approveReview(
        executionId,
        idpConfig,
        jobId,
        approvedData
      );

      // Update contract analysis with approved data
      await prisma.contractAnalysis.updateMany({
        where: { jobId, executionId },
        data: {
          status: 'SUCCEEDED',
          mulesoftResponse: approvalData,
          updatedAt: new Date(),
        },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        jobId,
        actionType: ACTION_TYPES.PROCESSING.CONTRACT_PROCESSING,
        actionDescription: `Approved manual review for execution ${executionId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ success: true, data: approvalData });
    } catch (error: any) {
      console.error('Error approving review:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

