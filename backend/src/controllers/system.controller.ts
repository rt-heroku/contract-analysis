import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

class SystemController {
  async getMenu(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { role: true },
      });

      const roleIds = userRoles.map((ur) => ur.roleId);

      // If no roles or no roleIds, return empty menu (frontend will use fallback)
      if (roleIds.length === 0) {
        return res.json({ menu: [] });
      }

      // Get menu items accessible by user's roles
      const menuPermissions = await prisma.menuPermission.findMany({
        where: {
          roleId: {
            in: roleIds,
          },
        },
        include: {
          menuItem: true,
        },
      });

      // Get unique menu items
      const menuItemIds = [...new Set(menuPermissions.map((mp) => mp.menuItemId))];

      // If no menu items, return empty menu (frontend will use fallback)
      if (menuItemIds.length === 0) {
        return res.json({ menu: [] });
      }

      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
          isActive: true,
        },
        orderBy: {
          orderIndex: 'asc',
        },
      });

      // Build menu tree
      const menuTree = this.buildMenuTree(menuItems);

      res.json({ menu: menuTree });
    } catch (error: any) {
      // Return empty menu on error (frontend will use fallback)
      res.json({ menu: [] });
    }
  }

  private buildMenuTree(items: any[]): any[] {
    const itemMap = new Map();
    const rootItems: any[] = [];

    // Create map of all items
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build tree
    items.forEach((item) => {
      const mappedItem = itemMap.get(item.id);
      if (item.parentId === null) {
        rootItems.push(mappedItem);
      } else {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children.push(mappedItem);
        }
      }
    });

    return rootItems;
  }

  async getPublicSettings(_req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { isSecret: false },
        select: {
          settingKey: true,
          settingValue: true,
          description: true,
        },
      });

      // Convert to key-value object
      const settingsObj = settings.reduce((acc: any, setting) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {});

      res.json({ settings: settingsObj });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new SystemController();

