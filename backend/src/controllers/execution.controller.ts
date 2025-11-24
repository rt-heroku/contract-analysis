import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { executionService } from '../services/execution.service';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const executionController = {
  /**
   * Get all executions
   */
  async getExecutions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { processId, status, limit } = req.query;

      const filters: any = {};
      if (processId) filters.processId = parseInt(processId as string);
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string);

      const executions = await executionService.getExecutions(req.user.id, filters);

      res.json({ executions });
    } catch (error: any) {
      console.error('Error fetching executions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get execution by ID
   */
  async getExecutionById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const executionId = req.params.id;
      const execution = await executionService.getExecutionById(executionId, req.user.id);

      res.json({ execution });
    } catch (error: any) {
      console.error('Error fetching execution:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Get execution statistics
   */
  async getExecutionStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { processId } = req.query;

      const stats = await executionService.getExecutionStats(
        req.user.id,
        processId ? parseInt(processId as string) : undefined
      );

      res.json({ stats });
    } catch (error: any) {
      console.error('Error fetching execution stats:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Cancel execution
   */
  async cancelExecution(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const executionId = req.params.id;
      const result = await executionService.cancelExecution(executionId, req.user.id);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'execution.cancel',
        actionDescription: `Cancelled execution: ${executionId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error cancelling execution:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Retry execution
   */
  async retryExecution(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const executionId = req.params.id;

      // Get original execution
      const execution = await executionService.getExecutionById(executionId, req.user.id);

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      // Re-execute the process with same context
      const { ProcessExecutor } = require('../execution-engine/ProcessExecutor');
      const processExecutor = new ProcessExecutor();

      const result = await processExecutor.execute(
        execution.processId,
        req.user.id,
        execution.executionContext
      );

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'execution.retry',
        actionDescription: `Retried execution: ${executionId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: { newExecutionId: result.executionId },
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error retrying execution:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

