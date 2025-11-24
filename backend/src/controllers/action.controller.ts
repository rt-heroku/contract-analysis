import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { actionService } from '../services/action.service';
import loggingService from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/helpers';

export const actionController = {
  /**
   * Get all actions
   */
  async getActions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { category, actionType, isActive } = req.query;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (actionType) filters.actionType = actionType as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const actions = await actionService.getActions(req.user.id, filters);

      res.json({ actions });
    } catch (error: any) {
      console.error('Error fetching actions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get action by ID
   */
  async getActionById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const actionId = parseInt(req.params.id);
      const action = await actionService.getActionById(actionId, req.user.id);

      res.json({ action });
    } catch (error: any) {
      console.error('Error fetching action:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Create action
   */
  async createAction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const action = await actionService.createAction({
        ...req.body,
        createdBy: req.user.id,
      });

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'action.create',
        actionDescription: `Created action: ${action.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ action });
    } catch (error: any) {
      console.error('Error creating action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update action
   */
  async updateAction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const actionId = parseInt(req.params.id);
      const action = await actionService.updateAction(actionId, req.user.id, req.body);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'action.update',
        actionDescription: `Updated action: ${action.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ action });
    } catch (error: any) {
      console.error('Error updating action:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Delete action
   */
  async deleteAction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const actionId = parseInt(req.params.id);
      await actionService.deleteAction(actionId, req.user.id);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'action.delete',
        actionDescription: `Deleted action ID: ${actionId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting action:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
    }
  },

  /**
   * Share action
   */
  async shareAction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const actionId = parseInt(req.params.id);
      const { userIds } = req.body;

      if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: 'userIds must be an array' });
      }

      const action = await actionService.shareAction(actionId, req.user.id, userIds);

      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'action.share',
        actionDescription: `Shared action ${action.name} with ${userIds.length} users`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ action });
    } catch (error: any) {
      console.error('Error sharing action:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get system actions
   */
  async getSystemActions(req: AuthenticatedRequest, res: Response) {
    try {
      const actions = await actionService.getSystemActions();
      res.json({ actions });
    } catch (error: any) {
      console.error('Error fetching system actions:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

