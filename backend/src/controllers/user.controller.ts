import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import userService from '../services/user.service';
import authService from '../services/auth.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';

class UserController {
  /**
   * Get current user with roles
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await userService.getUserWithRoles(req.user.id);

      res.json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profile = await userService.getUserProfile(req.user.id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.USER.VIEW_PROFILE,
        actionDescription: 'Viewed profile',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ profile });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const profile = await userService.updateUserProfile(req.user.id, req.body);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.USER.UPDATE_PROFILE,
        actionDescription: 'Updated profile',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: req.body,
      });

      res.json({
        message: 'Profile updated successfully',
        profile,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { avatarBase64 } = req.body;

      if (!avatarBase64) {
        return res.status(400).json({ error: 'Avatar data is required' });
      }

      await userService.updateAvatar(req.user.id, avatarBase64);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.USER.UPDATE_AVATAR,
        actionDescription: 'Updated avatar',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Avatar updated successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      await userService.updateAvatar(req.user.id, null);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.USER.UPDATE_AVATAR,
        actionDescription: 'Removed avatar',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Avatar removed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.USER.CHANGE_PASSWORD,
        actionDescription: 'Changed password',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Password changed successfully. Please login again.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await loggingService.getUserActivityLogs(req.user.id, page, limit);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Request permissions upgrade (for viewers)
   */
  async requestPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all admins
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        return res.status(500).json({ error: 'Admin role not found' });
      }

      const adminUserRoles = await prisma.userRole.findMany({
        where: { roleId: adminRole.id },
        select: { userId: true },
      });

      const adminIds = adminUserRoles.map((ur) => ur.userId);

      // Create notifications for all admins
      const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

      await prisma.notification.createMany({
        data: adminIds.map((adminId) => ({
          userId: adminId,
          title: 'Permission Request',
          message: `${userName} (${user.email}) has requested elevated permissions.`,
          type: 'info',
          actionUrl: '/admin/users',
        })),
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'user.request_permissions',
        actionDescription: `Requested permission upgrade`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Permission request sent to administrators' });
    } catch (error: any) {
      console.error('Error requesting permissions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search users (for sharing)
   */
  async searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { q } = req.query;
      const searchTerm = (q as string) || '';

      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: req.user.id } }, // Exclude current user
            {
              OR: [
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        take: 10,
      });

      res.json({ users });
    } catch (error: any) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();


