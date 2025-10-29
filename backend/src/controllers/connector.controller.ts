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

  async importOpenApi(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connectorId = parseInt(req.params.id);
      const { openApiSpec, url } = req.body;

      console.log('=== OpenAPI Import Request ===');
      console.log('Connector ID:', connectorId);
      console.log('URL provided:', !!url);
      console.log('Spec provided:', !!openApiSpec);
      if (openApiSpec) {
        console.log('Spec type:', typeof openApiSpec);
        console.log('Spec preview:', typeof openApiSpec === 'string' ? openApiSpec.substring(0, 200) : JSON.stringify(openApiSpec).substring(0, 200));
      }

      let result;
      if (url) {
        console.log('Importing from URL:', url);
        result = await connectorService.importOpenApiFromUrl(connectorId, req.user.id, url);
      } else if (openApiSpec) {
        console.log('Importing from provided spec');
        result = await connectorService.importOpenApiSpec(connectorId, req.user.id, openApiSpec);
      } else {
        return res.status(400).json({ error: 'Either openApiSpec or url is required' });
      }

      console.log('Import successful:', result);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'connector.import_openapi',
        actionDescription: `Imported OpenAPI spec for connector ${connectorId}: ${result.actionsCreated} actions created`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json(result);
    } catch (error: any) {
      console.error('=== OpenAPI Import Error ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message || 'Failed to import OpenAPI spec' });
    }
  },

  async getConnectorActions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const connectorId = parseInt(req.params.id);
      const actions = await connectorService.getConnectorActions(connectorId, req.user.id);

      res.json({ actions });
    } catch (error: any) {
      console.error('Error fetching connector actions:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

