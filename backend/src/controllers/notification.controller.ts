import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import notificationService from '../services/notification.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';

class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await notificationService.getUserNotifications(
        req.user.id,
        page,
        limit
      );

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.NOTIFICATION.VIEW,
        actionDescription: 'Viewed notifications',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const count = await notificationService.getUnreadCount(req.user.id);

      res.json({ unreadCount: count });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const notificationId = parseInt(req.params.id);

      await notificationService.markAsRead(notificationId, req.user.id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.NOTIFICATION.MARK_READ,
        actionDescription: `Marked notification #${notificationId} as read`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await notificationService.markAllAsRead(req.user.id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.NOTIFICATION.MARK_READ,
        actionDescription: 'Marked all notifications as read',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new NotificationController();


