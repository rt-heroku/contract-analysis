import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { idpExecutionService } from '../services/idpExecution.service';
import { encryption } from '../utils/encryption';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const idpExecutionController = {
  /**
   * Get all user's IDP executions + shared ones
   */
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const [myExecutions, sharedExecutions] = await Promise.all([
        idpExecutionService.getUserExecutions(req.user.id),
        idpExecutionService.getSharedExecutions(req.user.id),
      ]);

      res.json({
        myExecutions,
        sharedExecutions,
      });
    } catch (error: any) {
      console.error('Error fetching IDP executions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get single IDP execution
   */
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const execution = await idpExecutionService.getById(id, req.user.id);

      if (!execution) {
        return res.status(404).json({ error: 'IDP Execution not found' });
      }

      res.json({ execution });
    } catch (error: any) {
      console.error('Error fetching IDP execution:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Create IDP execution
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name, description, protocol, host, basePath, orgId, actionId, actionVersion, authClientId, authClientSecret } = req.body;

      if (!name || !protocol || !host || !basePath || !orgId || !actionId || !actionVersion || !authClientId || !authClientSecret) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const execution = await idpExecutionService.create(req.user.id, {
        name,
        description,
        protocol,
        host,
        basePath,
        orgId,
        actionId,
        actionVersion,
        authClientId,
        authClientSecret,
      });

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'idp_execution.create',
        actionDescription: `Created IDP execution: ${name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { idpExecutionId: execution.id },
      });

      // Return with decrypted credentials
      const result = {
        ...execution,
        authClientId: encryption.decrypt(execution.authClientId),
        authClientSecret: encryption.decrypt(execution.authClientSecret),
      };

      res.status(201).json({ execution: result });
    } catch (error: any) {
      console.error('Error creating IDP execution:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Parse IDP URL
   */
  async parseUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const parsed = encryption.parseIdpUrl(url);

      if (!parsed) {
        return res.status(400).json({ 
          error: 'Invalid IDP URL format. Expected: protocol://host/api/v1/organizations/ORG_ID/actions/ACTION_ID/versions/VERSION/executions' 
        });
      }

      res.json({ parsed });
    } catch (error: any) {
      console.error('Error parsing IDP URL:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update IDP execution
   */
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const execution = await idpExecutionService.update(id, req.user.id, req.body);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'idp_execution.update',
        actionDescription: `Updated IDP execution: ${execution.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { idpExecutionId: id },
      });

      res.json({ execution });
    } catch (error: any) {
      console.error('Error updating IDP execution:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Delete IDP execution
   */
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      await idpExecutionService.delete(id, req.user.id);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'idp_execution.delete',
        actionDescription: `Deleted IDP execution ID: ${id}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { idpExecutionId: id },
      });

      res.json({ message: 'IDP Execution deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting IDP execution:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Share IDP execution
   */
  async share(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'User IDs array is required' });
      }

      await idpExecutionService.share(id, req.user.id, userIds);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'idp_execution.share',
        actionDescription: `Shared IDP execution ID: ${id} with ${userIds.length} user(s)`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { idpExecutionId: id, sharedWithUserIds: userIds },
      });

      res.json({ message: 'IDP Execution shared successfully' });
    } catch (error: any) {
      console.error('Error sharing IDP execution:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Unshare IDP execution
   */
  async unshare(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const userIdToRemove = parseInt(req.params.userId);

      await idpExecutionService.unshare(id, req.user.id, userIdToRemove);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'idp_execution.unshare',
        actionDescription: `Unshared IDP execution ID: ${id} with user ID: ${userIdToRemove}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { idpExecutionId: id, unsharedUserId: userIdToRemove },
      });

      res.json({ message: 'IDP Execution unshared successfully' });
    } catch (error: any) {
      console.error('Error unsharing IDP execution:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get shared users for an execution
   */
  async getSharedUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const sharedUsers = await idpExecutionService.getSharedUsers(id, req.user.id);

      res.json({ sharedUsers });
    } catch (error: any) {
      console.error('Error fetching shared users:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },
};

