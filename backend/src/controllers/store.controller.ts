import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { storeService } from '../services/store.service';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const storeController = {
  async getStores(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { connectorId } = req.query;
      const stores = await storeService.getStores(
        req.user.id,
        connectorId ? parseInt(connectorId as string) : undefined
      );

      res.json({ stores });
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getStoreById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const storeId = parseInt(req.params.id);
      const store = await storeService.getStoreById(storeId, req.user.id);

      res.json({ store });
    } catch (error: any) {
      console.error('Error fetching store:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  async createStore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { connectorId, name, storeType, dataType, config, isDefault } = req.body;

      // Validation
      if (!connectorId || !name || !storeType || !dataType) {
        return res.status(400).json({ error: 'Missing required fields: connectorId, name, storeType, dataType' });
      }

      const store = await storeService.createStore({
        connectorId: parseInt(connectorId),
        name,
        storeType,
        dataType,
        config,
        isDefault,
        userId: req.user.id,
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'store.create',
        actionDescription: `Created store: ${name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ store });
    } catch (error: any) {
      console.error('Error creating store:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateStore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const storeId = parseInt(req.params.id);
      const { name, config, isDefault, isActive } = req.body;

      const store = await storeService.updateStore(storeId, req.user.id, {
        name,
        config,
        isDefault,
        isActive,
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'store.update',
        actionDescription: `Updated store: ${store.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ store });
    } catch (error: any) {
      console.error('Error updating store:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  async deleteStore(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const storeId = parseInt(req.params.id);
      await storeService.deleteStore(storeId, req.user.id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'store.delete',
        actionDescription: `Deleted store ID: ${storeId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Store deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting store:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  async testConnection(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const storeId = parseInt(req.params.id);
      const result = await storeService.testStoreConnection(storeId, req.user.id);

      res.json(result);
    } catch (error: any) {
      console.error('Error testing store connection:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
