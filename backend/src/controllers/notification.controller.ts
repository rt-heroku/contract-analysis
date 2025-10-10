import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

class NotificationController {
  /**
   * Get notifications for current user (paginated)
   */
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: { userId: req.user.id },
        }),
      ]);

      res.json({
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const unreadCount = await prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false,
        },
      });

      res.json({ unreadCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const notificationId = parseInt(req.params.id);

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: req.user.id,
        },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new NotificationController();
