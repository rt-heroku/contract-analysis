import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import authService from '../services/auth.service';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';
import prisma from '../config/database';

class AuthController {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      console.debug('🔐 [Auth Controller] Register attempt for:', req.body.email);
      const user = await authService.register(req.body);

      // Log registration
      await loggingService.logActivity({
        userId: user.id,
        actionType: ACTION_TYPES.AUTH.REGISTER,
        actionDescription: `User registered: ${user.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      console.debug('🔐 [Auth Controller] Registration successful for:', user.email);
      res.status(201).json({
        message: 'Registration successful',
        user,
      });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const ipAddress = getClientIp(req);
      const userAgent = getUserAgent(req);

      console.debug('🔐 [Auth Controller] Login attempt for:', req.body.email);
      const result = await authService.login(req.body, ipAddress, userAgent);

      // Log login
      await loggingService.logActivity({
        userId: result.user.id,
        actionType: ACTION_TYPES.AUTH.LOGIN,
        actionDescription: `User logged in: ${result.user.email}`,
        ipAddress,
        userAgent,
        metadata: {
          stayLoggedIn: req.body.stayLoggedIn || false,
        },
      });

      console.debug('🔐 [Auth Controller] Login successful for:', result.user.email);
      console.debug('🔐 [Auth Controller] Token generated, length:', result.token.length);
      console.debug('🔐 [Auth Controller] Session expires at:', result.expiresAt);

      res.json({
        message: 'Login successful',
        token: result.token,
        expiresAt: result.expiresAt,
        user: result.user,
      });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Login error:', error);
      // Log failed login
      await loggingService.logActivity({
        actionType: ACTION_TYPES.AUTH.LOGIN_FAILED,
        actionDescription: `Failed login attempt: ${req.body.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        status: 'failed',
      });

      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      console.debug('🔐 [Auth Controller] Logout called');
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await authService.logout(token);

        // Log logout
        if (req.user) {
          await loggingService.logActivity({
            userId: req.user.id,
            actionType: ACTION_TYPES.AUTH.LOGOUT,
            actionDescription: `User logged out: ${req.user.email}`,
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
          });
          console.debug('🔐 [Auth Controller] User logged out:', req.user.email);
        }
      }

      res.json({ message: 'Logout successful' });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Logout error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      console.debug('🔐 [Auth Controller] Get current user called for:', req.user?.id);
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          profile: true,
        },
      });

      if (!user) {
        console.debug('🔐 [Auth Controller] User not found:', req.user.id);
        return res.status(404).json({ error: 'User not found' });
      }

      // Extract roles and permissions
      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissions = user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.name)
      );

      const { passwordHash, ...userWithoutPassword } = user;

      console.debug('🔐 [Auth Controller] Returning current user:', user.email);
      res.json({ 
        user: {
          ...userWithoutPassword,
          roles,
          permissions,
        }
      });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Get current user error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;
      console.debug('🔐 [Auth Controller] Change password called for user:', req.user.id);

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      // Log password change
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'auth.change_password',
        actionDescription: 'User changed password',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      console.debug('🔐 [Auth Controller] Password changed successfully for user:', req.user.id);
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Change password error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
