import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { roleService } from '../services/role.service';
import { loggingService } from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/request';

export const roleController = {
  /**
   * Get all roles
   */
  async getAllRoles(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const roles = await roleService.getAllRoles();

      res.json({ roles });
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get role by ID
   */
  async getRoleById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const role = await roleService.getRoleById(id);

      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      res.json({ role });
    } catch (error: any) {
      console.error('Error fetching role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Create role
   */
  async createRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const role = await roleService.createRole({ name, description });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'role.create',
        actionDescription: `Created role: ${name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ role });
    } catch (error: any) {
      console.error('Error creating role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update role
   */
  async updateRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const { name, description } = req.body;

      const role = await roleService.updateRole(id, { name, description });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'role.update',
        actionDescription: `Updated role: ${role.name}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ role });
    } catch (error: any) {
      console.error('Error updating role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Delete role
   */
  async deleteRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);

      await roleService.deleteRole(id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'role.delete',
        actionDescription: `Deleted role #${id}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get all permissions
   */
  async getAllPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const permissions = await roleService.getAllPermissions();

      res.json({ permissions });
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const permissions = await roleService.getPermissionsByCategory();

      res.json({ permissions });
    } catch (error: any) {
      console.error('Error fetching permissions by category:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get role permissions
   */
  async getRolePermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const roleId = parseInt(req.params.roleId);
      const permissions = await roleService.getRolePermissions(roleId);

      res.json({ permissions });
    } catch (error: any) {
      console.error('Error fetching role permissions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { roleId, permissionId } = req.body;

      if (!roleId || !permissionId) {
        return res.status(400).json({ error: 'roleId and permissionId are required' });
      }

      const rolePermission = await roleService.assignPermissionToRole(roleId, permissionId);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'role.assign_permission',
        actionDescription: `Assigned permission ${permissionId} to role ${roleId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ rolePermission });
    } catch (error: any) {
      console.error('Error assigning permission to role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { roleId, permissionId } = req.body;

      if (!roleId || !permissionId) {
        return res.status(400).json({ error: 'roleId and permissionId are required' });
      }

      await roleService.removePermissionFromRole(roleId, permissionId);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'role.remove_permission',
        actionDescription: `Removed permission ${permissionId} from role ${roleId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Permission removed from role' });
    } catch (error: any) {
      console.error('Error removing permission from role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Bulk update role permissions
   */
  async bulkUpdateRolePermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { roleId, permissionIds } = req.body;

      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        return res.status(400).json({ error: 'roleId and permissionIds array are required' });
      }

      const permissions = await roleService.bulkUpdateRolePermissions(roleId, permissionIds);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'role.bulk_update_permissions',
        actionDescription: `Updated permissions for role ${roleId} (${permissionIds.length} permissions)`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ permissions, message: 'Role permissions updated successfully' });
    } catch (error: any) {
      console.error('Error bulk updating role permissions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get user permissions (for permission checking on frontend)
   */
  async getUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const permissions = await roleService.getUserPermissions(req.user.id);

      res.json({ permissions });
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

