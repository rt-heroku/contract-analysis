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

  /**
   * Create a new flow for an API
   */
  async createFlow(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const apiId = parseInt(req.params.id);
      const flowData = req.body;

      const flow = await mulesoftApiService.createFlow(apiId, req.user.id, flowData);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_flow.create',
        actionDescription: `Created flow: ${flowData.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: apiId, flowId: flow.id },
      });

      res.status(201).json(flow);
    } catch (error: any) {
      console.error('Error creating flow:', error);
      res.status(error.message.includes('not found') || error.message.includes('access') ? 404 : 500).json({
        error: error.message || 'Failed to create flow',
      });
    }
  },

  /**
   * Update a flow
   */
  async updateFlow(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const apiId = parseInt(req.params.id);
      const flowId = parseInt(req.params.flowId);
      const flowData = req.body;

      const flow = await mulesoftApiService.updateFlow(apiId, flowId, req.user.id, flowData);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_flow.update',
        actionDescription: `Updated flow: ${flowData.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: apiId, flowId },
      });

      res.json(flow);
    } catch (error: any) {
      console.error('Error updating flow:', error);
      res.status(error.message.includes('not found') || error.message.includes('access') ? 404 : 500).json({
        error: error.message || 'Failed to update flow',
      });
    }
  },

  /**
   * Delete a flow
   */
  async deleteFlow(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const apiId = parseInt(req.params.id);
      const flowId = parseInt(req.params.flowId);

      await mulesoftApiService.deleteFlow(apiId, flowId, req.user.id);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_flow.delete',
        actionDescription: `Deleted flow ID: ${flowId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { mulesoftApiId: apiId, flowId },
      });

      res.json({ message: 'Flow deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting flow:', error);
      res.status(error.message.includes('not found') || error.message.includes('access') ? 404 : 500).json({
        error: error.message || 'Failed to delete flow',
      });
    }
  },

  /**
   * Parse OpenAPI/RAML spec and return flow previews (no DB writes)
   */
  async parseFlowSpec(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const apiId = parseInt(req.params.id);
      const { openApiSpec, url } = req.body;

      console.log('=== Flow Spec Parse Request ===');
      console.log('API ID:', apiId);
      console.log('URL provided:', !!url);
      console.log('Spec provided:', !!openApiSpec);

      if (!url && !openApiSpec) {
        return res.status(400).json({ error: 'Either openApiSpec or url is required' });
      }

      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const result = await mulesoftApiService.parseFlowSpec(apiId, req.user.id, { openApiSpec, url }, isAdmin);

      console.log('Parse successful:', result);

      res.json(result);
    } catch (error: any) {
      console.error('=== Flow Spec Parse Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Failed to parse flow spec' });
    }
  },

  /**
   * Bulk create flows from parsed spec
   */
  async bulkCreateFlows(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const apiId = parseInt(req.params.id);
      const { flows, duplicateAction } = req.body;

      console.log('=== Bulk Create Flows Request ===');
      console.log('API ID:', apiId);
      console.log('Flows to create:', flows?.length);
      console.log('Duplicate action:', duplicateAction);

      if (!flows || !Array.isArray(flows) || flows.length === 0) {
        return res.status(400).json({ error: 'Flows array is required and must not be empty' });
      }

      if (!['skip', 'update', 'cancel'].includes(duplicateAction)) {
        return res.status(400).json({ error: 'Invalid duplicateAction. Must be: skip, update, or cancel' });
      }

      const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('Admin');
      const result = await mulesoftApiService.bulkCreateFlows(apiId, req.user.id, flows, duplicateAction, isAdmin);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'mulesoft_flow.bulk_import',
        actionDescription: `Imported ${result.created} flows from OpenAPI spec`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { 
          mulesoftApiId: apiId, 
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
        },
      });

      res.json(result);
    } catch (error: any) {
      console.error('=== Bulk Create Flows Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message === 'Not authorized') {
        return res.status(403).json({ error: error.message });
      }
      
      if (error.message === 'Import cancelled due to duplicates') {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Failed to create flows' });
    }
  },
};

