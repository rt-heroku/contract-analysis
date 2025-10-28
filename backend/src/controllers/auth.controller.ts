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
      const user = await authService.register(req.body);

      // Log registration
      await loggingService.logActivity({
        userId: user.id,
        actionType: ACTION_TYPES.AUTH.REGISTER,
        actionDescription: `User registered: ${user.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

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
        return res.status(404).json({ error: 'User not found' });
      }

      // Extract roles and permissions
      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissions = user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.name)
      );

      const { passwordHash, ...userWithoutPassword } = user;

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

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      // Log password change
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'auth.change_password',
        actionDescription: 'User changed password',
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Change password error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Check if any admin users exist in the system
   * Used to determine if first-time setup is needed
   */
  async checkAdminExists(req: AuthenticatedRequest, res: Response) {
    try {
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        return res.json({ adminExists: false, needsSetup: true });
      }

      const adminCount = await prisma.userRole.count({
        where: {
          roleId: adminRole.id,
          user: {
            isActive: true,
          },
        },
      });

      res.json({
        adminExists: adminCount > 0,
        needsSetup: adminCount === 0,
      });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] Check admin error:', error);
      res.status(500).json({ error: 'Failed to check admin status' });
    }
  }

  /**
   * First-time enrollment - creates the first admin user
   * Only works if no admin users exist
   */
  async enrollFirstAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if any admin users exist
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' },
        include: {
          userRoles: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!adminRole) {
        return res.status(500).json({ error: 'Admin role not found in database' });
      }

      const activeAdmins = adminRole.userRoles.filter(ur => ur.user.isActive);

      if (activeAdmins.length > 0) {
        return res.status(400).json({
          error: 'Admin users already exist. Use regular registration.',
        });
      }

      // Register the first admin user
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Create user
      const user = await authService.register({
        email,
        password,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
      });

      // Assign admin role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      // Update default menu item for admin
      await prisma.user.update({
        where: { id: user.id },
        data: { defaultMenuItem: 'dashboard' },
      });

      // Log the first admin creation
      await loggingService.logActivity({
        userId: user.id,
        actionType: 'auth.first_admin_enrolled',
        actionDescription: `First admin user enrolled: ${user.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({
        message: 'First admin user created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error: any) {
      console.error('🔐 [Auth Controller] First admin enrollment error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
