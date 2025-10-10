import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
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
}

export default new UserController();


