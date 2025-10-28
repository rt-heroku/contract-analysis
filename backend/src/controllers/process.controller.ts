import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { processService } from '../services/process.service';
import { ProcessExecutor } from '../execution-engine/ProcessExecutor';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

const processExecutor = new ProcessExecutor();

export const processController = {
  /**
   * Get all processes
   */
  async getProcesses(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { category, isActive, isTemplate } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isTemplate !== undefined) filters.isTemplate = isTemplate === 'true';

      const processes = await processService.getProcesses(req.user.id, filters);

      res.json({ processes });
    } catch (error: any) {
      console.error('Error fetching processes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get process by ID
   */
  async getProcessById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      const process = await processService.getProcessById(processId, req.user.id);

      res.json({ process });
    } catch (error: any) {
      console.error('Error fetching process:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Create process
   */
  async createProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const process = await processService.createProcess({
        ...req.body,
        createdBy: req.user.id,
      });

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.create',
        actionDescription: `Created process: ${process.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ process });
    } catch (error: any) {
      console.error('Error creating process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update process
   */
  async updateProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      const process = await processService.updateProcess(processId, req.user.id, req.body);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.update',
        actionDescription: `Updated process: ${process.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ process });
    } catch (error: any) {
      console.error('Error updating process:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Delete process
   */
  async deleteProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      await processService.deleteProcess(processId, req.user.id);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.delete',
        actionDescription: `Deleted process ID: ${processId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting process:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Execute process
   */
  async executeProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      const { inputContext = {} } = req.body;

      // Start execution asynchronously
      const result = await processExecutor.execute(processId, req.user.id, inputContext);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.execute',
        actionDescription: `Executed process ID: ${processId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { executionId: result.executionId },
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error executing process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Share process
   */
  async shareProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      const { userIds } = req.body;

      if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds must be an array' });
      }

      const process = await processService.shareProcess(processId, req.user.id, userIds);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.share',
        actionDescription: `Shared process ${process.name} with ${userIds.length} users`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ process });
    } catch (error: any) {
      console.error('Error sharing process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Export process
   */
  async exportProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      const exportData = await processService.exportProcess(processId, req.user.id);

      res.json({ exportData });
    } catch (error: any) {
      console.error('Error exporting process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Import process
   */
  async importProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { importData } = req.body;

      if (!importData) {
        return res.status(400).json({ error: 'importData is required' });
      }

      const process = await processService.importProcess(req.user.id, importData);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.import',
        actionDescription: `Imported process: ${process.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ process });
    } catch (error: any) {
      console.error('Error importing process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Clone process
   */
  async cloneProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const processId = parseInt(req.params.id);
      const { name } = req.body;

      const process = await processService.cloneProcess(processId, req.user.id, name);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'process.clone',
        actionDescription: `Cloned process: ${process.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ process });
    } catch (error: any) {
      console.error('Error cloning process:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

