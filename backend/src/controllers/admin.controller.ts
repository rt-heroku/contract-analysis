import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import userService from '../services/user.service';
import loggingService from '../services/logging.service';
import prisma from '../config/database';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';

class AdminController {
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const result = await userService.getAllUsers(page, limit, search);

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.VIEW_USERS,
          actionDescription: 'Viewed user list',
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      const user = await userService.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.VIEW_USER,
          actionDescription: `Viewed user #${userId}`,
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
        });
      }

      res.json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      const user = await userService.updateUser(userId, req.body);

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.UPDATE_USER,
          actionDescription: `Updated user #${userId}`,
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
          metadata: req.body,
        });
      }

      res.json({
        message: 'User updated successfully',
        user,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      await userService.deleteUser(userId);

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.DELETE_USER,
          actionDescription: `Deleted user #${userId}`,
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
        });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetUserPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
      }

      await userService.resetUserPassword(userId, newPassword);

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.UPDATE_USER,
          actionDescription: `Reset password for user #${userId}`,
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
        });
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters: any = {};
      if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
      if (req.query.actionType) filters.actionType = req.query.actionType as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await loggingService.getAllActivityLogs(filters, page, limit);

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.VIEW_LOGS,
          actionDescription: 'Viewed activity logs',
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getApiLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters: any = {};
      if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
      if (req.query.status) filters.status = parseInt(req.query.status as string);
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await loggingService.getApiLogs(filters, page, limit);

      // Log activity
      if (req.user) {
        await loggingService.logActivity({
          userId: req.user.id,
          actionType: ACTION_TYPES.ADMIN.VIEW_API_LOGS,
          actionDescription: 'Viewed API logs',
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req),
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSystemSettings(_req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { isSecret: false },
      });

      res.json({ settings });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AdminController();

