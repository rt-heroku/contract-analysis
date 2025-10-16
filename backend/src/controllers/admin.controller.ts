import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';
import loggingService from '../services/logging.service';
import { ACTION_TYPES } from '../utils/constants';
import { getClientIp, getUserAgent } from '../utils/helpers';

class AdminController {
  /**
   * Get activity logs (paginated, searchable)
   */
  async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { actionType: { contains: search, mode: 'insensitive' } },
          { actionDescription: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.activityLog.count({ where }),
      ]);

      res.json({
        logs,
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
   * Get API logs (paginated, searchable)
   */
  async getApiLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { requestUrl: { contains: search, mode: 'insensitive' } },
          { jobId: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.apiLog.findMany({
          where,
          include: {
            user: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.apiLog.count({ where }),
      ]);

      res.json({
        logs,
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
   * Get active sessions (paginated)
   */
  async getSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where: {
            expiresAt: { gt: new Date() }, // Only active sessions
          },
          include: {
            user: {
              select: { email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.session.count({
          where: {
            expiresAt: { gt: new Date() },
          },
        }),
      ]);

      res.json({
        sessions,
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
   * Get users (paginated, searchable)
   */
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      // Transform data to include role as string
      const transformedUsers = await Promise.all(
        users.map(async (user) => {
          const roles = await prisma.role.findMany({
            where: {
              userRoles: {
                some: { userId: user.id },
              },
            },
          });

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: roles.length > 0 ? roles[0].name : 'user',
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          };
        })
      );

      res.json({
        users: transformedUsers,
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
   * Delete a user
   */
  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = parseInt(req.params.id);

      // Prevent self-deletion
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Check if user exists
      const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ADMIN.DELETE_USER,
        actionDescription: `Deleted user ${userToDelete.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user active status
   */
  async updateUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = parseInt(req.params.id);
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }

      // Prevent self-deactivation
      if (userId === req.user.id && !isActive) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ADMIN.UPDATE_USER,
        actionDescription: `${isActive ? 'Activated' : 'Deactivated'} user ${user.email}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'User status updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new user
   */
  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { email, password, firstName, lastName, role, defaultMenuItem } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!role || !['admin', 'user', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required (admin, user, or viewer)' });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Get role ID
      const roleRecord = await prisma.role.findUnique({
        where: { name: role },
      });

      if (!roleRecord) {
        return res.status(400).json({ error: 'Role not found' });
      }

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
          defaultMenuItem: defaultMenuItem || null,
          isActive: true,
        },
      });

      // Assign role
      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: roleRecord.id,
        },
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ADMIN.CREATE_USER,
        actionDescription: `Created user ${newUser.email} with role ${role}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role,
          isActive: newUser.isActive,
        },
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update a user
   */
  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = parseInt(req.params.id);
      const { email, password, firstName, lastName, role, defaultMenuItem, isActive } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate role if provided
      if (role && !['admin', 'user', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required (admin, user, or viewer)' });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email },
        });

        if (emailExists) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (defaultMenuItem !== undefined) updateData.defaultMenuItem = defaultMenuItem;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Update role if provided
      if (role) {
        // Get role ID
        const roleRecord = await prisma.role.findUnique({
          where: { name: role },
        });

        if (!roleRecord) {
          return res.status(400).json({ error: 'Role not found' });
        }

        // Delete old role assignments
        await prisma.userRole.deleteMany({
          where: { userId },
        });

        // Create new role assignment
        await prisma.userRole.create({
          data: {
            userId,
            roleId: roleRecord.id,
          },
        });
      }

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: ACTION_TYPES.ADMIN.UPDATE_USER,
        actionDescription: `Updated user ${updatedUser.email}${role ? ` - changed role to ${role}` : ''}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role,
          isActive: updatedUser.isActive,
        },
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all roles
   */
  async getRoles(req: AuthenticatedRequest, res: Response) {
    try {
      const roles = await prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({ roles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AdminController();
