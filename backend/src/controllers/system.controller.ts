import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

class SystemController {
  getMenu = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      console.log('🔍 [Menu API] User ID:', req.user.id);

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { role: true },
      });

      const roleIds = userRoles.map((ur) => ur.roleId);
      console.log('🔍 [Menu API] Role IDs:', roleIds);

      // If no roles or no roleIds, return empty menu (frontend will use fallback)
      if (roleIds.length === 0) {
        console.log('⚠️ [Menu API] No roles found for user');
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

      console.log('🔍 [Menu API] Menu permissions count:', menuPermissions.length);

      // Get unique menu items
      const menuItemIds = [...new Set(menuPermissions.map((mp) => mp.menuItemId))];
      console.log('🔍 [Menu API] Menu item IDs:', menuItemIds);

      // If no menu items, return empty menu (frontend will use fallback)
      if (menuItemIds.length === 0) {
        console.log('⚠️ [Menu API] No menu items found for roles');
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

      console.log('🔍 [Menu API] Active menu items count:', menuItems.length);
      console.log('🔍 [Menu API] Menu items:', menuItems.map(m => ({ id: m.id, title: m.title, parentId: m.parentId })));

      // Build menu tree
      const menuTree = this.buildMenuTree(menuItems);
      console.log('🔍 [Menu API] Menu tree count:', menuTree.length);
      console.log('🔍 [Menu API] Menu tree:', menuTree.map(m => ({ id: m.id, title: m.title, children: m.children?.length })));

      res.json({ menu: menuTree });
    } catch (error: any) {
      // Log the error for debugging
      console.error('❌ [Menu API] Error:', error.message);
      console.error('❌ [Menu API] Stack:', error.stack);
      // Return empty menu on error (frontend will use fallback)
      res.json({ menu: [] });
    }
  }

  private buildMenuTree = (items: any[]): any[] => {
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

  getPublicSettings = async (_req: AuthenticatedRequest, res: Response) => {
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

