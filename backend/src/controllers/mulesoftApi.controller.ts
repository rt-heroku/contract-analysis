import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { mulesoftApiService } from '../services/mulesoftApi.service';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const mulesoftApiController = {
  /**
   * Get all user's MuleSoft APIs + shared ones + all others (if admin)
   */
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');

      const promises: Promise<any>[] = [
        mulesoftApiService.getUserApis(req.user.id),
        mulesoftApiService.getSharedApis(req.user.id),
      ];

      // Add all other APIs for admins
      if (isAdmin) {
        promises.push(mulesoftApiService.getAllOtherApis(req.user.id));
      }

      const results = await Promise.all(promises);

      const response: any = {
        myApis: results[0],
        sharedApis: results[1],
      };

      if (isAdmin) {
        response.allOtherApis = results[2];
      }

      res.json(response);
    } catch (error: any) {
      console.error('Error fetching MuleSoft APIs:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get single MuleSoft API
   */
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const api = await mulesoftApiService.getById(id, req.user.id, isAdmin);

      if (!api) {
        return res.status(404).json({ error: 'MuleSoft API not found' });
      }

      res.json({ api });
    } catch (error: any) {
      console.error('Error fetching MuleSoft API:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Create MuleSoft API
   */
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name, description, baseUrl, authType, authConfig, timeout } = req.body;

      if (!name || !baseUrl || !authType) {
        return res.status(400).json({ error: 'Missing required fields: name, baseUrl, authType' });
      }

      const api = await mulesoftApiService.create(req.user.id, {
        name,
        description,
        baseUrl,
        authType,
        authConfig,
        timeout,
      });

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.create',
        actionDescription: `Created MuleSoft API: ${name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: api.id },
      });

      res.status(201).json({ api });
    } catch (error: any) {
      console.error('Error creating MuleSoft API:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update MuleSoft API
   */
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const api = await mulesoftApiService.update(id, req.user.id, req.body, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.update',
        actionDescription: `Updated MuleSoft API: ${api.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: id },
      });

      res.json({ api });
    } catch (error: any) {
      console.error('Error updating MuleSoft API:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Delete MuleSoft API
   */
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      await mulesoftApiService.delete(id, req.user.id, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.delete',
        actionDescription: `Deleted MuleSoft API ID: ${id}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: id },
      });

      res.json({ message: 'MuleSoft API deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting MuleSoft API:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Refresh flows from /flows endpoint
   */
  async refreshFlows(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const result = await mulesoftApiService.refreshFlows(id, req.user.id, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.refresh_flows',
        actionDescription: `Refreshed flows for MuleSoft API ID: ${id}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: id, flowCount: result.flowCount },
      });

      res.json({ message: 'Flows refreshed successfully', flowCount: result.flowCount });
    } catch (error: any) {
      console.error('Error refreshing flows:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Test API connection
   */
  async testConnection(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const result = await mulesoftApiService.testConnection(id, req.user.id, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.test_connection',
        actionDescription: `Tested connection for MuleSoft API ID: ${id}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: id, success: result.success },
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error testing connection:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Share MuleSoft API
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

      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      await mulesoftApiService.share(id, req.user.id, userIds, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.share',
        actionDescription: `Shared MuleSoft API ID: ${id} with ${userIds.length} user(s)`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: id, sharedWithUserIds: userIds },
      });

      res.json({ message: 'MuleSoft API shared successfully' });
    } catch (error: any) {
      console.error('Error sharing MuleSoft API:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Unshare MuleSoft API
   */
  async unshare(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const userIdToRemove = parseInt(req.params.userId);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');

      await mulesoftApiService.unshare(id, req.user.id, userIdToRemove, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_api.unshare',
        actionDescription: `Unshared MuleSoft API ID: ${id} with user ID: ${userIdToRemove}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: id, unsharedUserId: userIdToRemove },
      });

      res.json({ message: 'MuleSoft API unshared successfully' });
    } catch (error: any) {
      console.error('Error unsharing MuleSoft API:', error);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get shared users for an API
   */
  async getSharedUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const sharedUsers = await mulesoftApiService.getSharedUsers(id, req.user.id, isAdmin);

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

