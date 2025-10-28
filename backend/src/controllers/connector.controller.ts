import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { connectorService } from '../services/connector.service';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const connectorController = {
  async getConnectors(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { connectorType } = req.query;
      const connectors = await connectorService.getConnectors(
        req.user.id,
        connectorType as string | undefined
      );

      res.json({ connectors });
    } catch (error: any) {
      console.error('Error fetching connectors:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getConnectorById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connectorId = parseInt(req.params.id);
      const connector = await connectorService.getConnectorById(connectorId, req.user.id);

      res.json({ connector });
    } catch (error: any) {
      console.error('Error fetching connector:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  async createConnector(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connector = await connectorService.createConnector({
        ...req.body,
        createdBy: req.user.id,
      });

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'connector.create',
        actionDescription: `Created connector: ${connector.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ connector });
    } catch (error: any) {
      console.error('Error creating connector:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateConnector(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connectorId = parseInt(req.params.id);
      const connector = await connectorService.updateConnector(connectorId, req.user.id, req.body);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'connector.update',
        actionDescription: `Updated connector: ${connector.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ connector });
    } catch (error: any) {
      console.error('Error updating connector:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  async deleteConnector(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connectorId = parseInt(req.params.id);
      await connectorService.deleteConnector(connectorId, req.user.id);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'connector.delete',
        actionDescription: `Deleted connector ID: ${connectorId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting connector:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  async testConnection(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connectorId = parseInt(req.params.id);
      const result = await connectorService.testConnection(connectorId, req.user.id);

      res.json(result);
    } catch (error: any) {
      console.error('Error testing connection:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

