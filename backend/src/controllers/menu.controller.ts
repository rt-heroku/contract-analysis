import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { menuService } from '../services/menu.service';
import { loggingService } from '../services/logging.service';
import { getClientIp, getUserAgent } from '../utils/request';

export const menuController = {
  /**
   * Get all menu items
   */
  async getAllMenuItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const menuItems = await menuService.getAllMenuItems();

      res.json({ menuItems });
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Create menu item
   */
  async createMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { title, icon, route, isExternal, parentId, orderIndex } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const menuItem = await menuService.createMenuItem({
        title,
        icon,
        route,
        isExternal,
        parentId,
        orderIndex,
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.create',
        actionDescription: `Created menu item: ${title}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.status(201).json({ menuItem });
    } catch (error: any) {
      console.error('Error creating menu item:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update menu item
   */
  async updateMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);
      const { title, icon, route, isExternal, parentId, orderIndex, isActive } = req.body;

      const menuItem = await menuService.updateMenuItem(id, {
        title,
        icon,
        route,
        isExternal,
        parentId,
        orderIndex,
        isActive,
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.update',
        actionDescription: `Updated menu item: ${menuItem.title}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ menuItem });
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Delete menu item
   */
  async deleteMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const id = parseInt(req.params.id);

      await menuService.deleteMenuItem(id);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.delete',
        actionDescription: `Deleted menu item #${id}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Menu item deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Assign menu item to role
   */
  async assignMenuToRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { menuItemId, roleId } = req.body;

      if (!menuItemId || !roleId) {
        return res.status(400).json({ error: 'menuItemId and roleId are required' });
      }

      const menuPermission = await menuService.assignMenuToRole(menuItemId, roleId);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.assign',
        actionDescription: `Assigned menu item ${menuItemId} to role ${roleId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ menuPermission });
    } catch (error: any) {
      console.error('Error assigning menu to role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Remove menu item from role
   */
  async removeMenuFromRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { menuItemId, roleId } = req.body;

      if (!menuItemId || !roleId) {
        return res.status(400).json({ error: 'menuItemId and roleId are required' });
      }

      await menuService.removeMenuFromRole(menuItemId, roleId);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.remove',
        actionDescription: `Removed menu item ${menuItemId} from role ${roleId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Menu item removed from role' });
    } catch (error: any) {
      console.error('Error removing menu from role:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get role menu permissions
   */
  async getRoleMenuPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const roleId = parseInt(req.params.roleId);

      const menuPermissions = await menuService.getRoleMenuPermissions(roleId);

      res.json({ menuPermissions });
    } catch (error: any) {
      console.error('Error fetching role menu permissions:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Bulk assign menus to role
   */
  async bulkAssignMenusToRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { roleId, menuItemIds } = req.body;

      if (!roleId || !menuItemIds || !Array.isArray(menuItemIds)) {
        return res.status(400).json({ error: 'roleId and menuItemIds array are required' });
      }

      await menuService.bulkAssignMenusToRole(menuItemIds, roleId);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.bulk_assign',
        actionDescription: `Bulk assigned ${menuItemIds.length} menu items to role ${roleId}`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Menus assigned successfully' });
    } catch (error: any) {
      console.error('Error bulk assigning menus:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Reorder menu items
   */
  async reorderMenuItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { updates } = req.body;

      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: 'updates array is required' });
      }

      await menuService.reorderMenuItems(updates);

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'menu.reorder',
        actionDescription: `Reordered ${updates.length} menu items`,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      res.json({ message: 'Menu items reordered successfully' });
    } catch (error: any) {
      console.error('Error reordering menu items:', error);
      res.status(500).json({ error: error.message });
    }
  },
};

