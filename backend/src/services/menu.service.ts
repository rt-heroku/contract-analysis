import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const menuService = {
  /**
   * Get all menu items
   */
  async getAllMenuItems() {
    return await prisma.menuItem.findMany({
      include: {
        parent: true,
        children: {
          orderBy: { orderIndex: 'asc' },
        },
        permissions: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  },

  /**
   * Get menu items by role
   */
  async getMenuByRole(roleId: number) {
    const menuPermissions = await prisma.menuPermission.findMany({
      where: { roleId },
      include: {
        menuItem: {
          include: {
            children: {
              where: {
                isActive: true,
                permissions: {
                  some: { roleId },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    // Extract unique parent menu items (no parent)
    const menuItems = menuPermissions
      .map((mp) => mp.menuItem)
      .filter((item, index, self) => 
        item.isActive && 
        !item.parentId && 
        index === self.findIndex((t) => t.id === item.id)
      )
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return menuItems;
  },

  /**
   * Create a new menu item
   */
  async createMenuItem(data: {
    title: string;
    icon?: string;
    route?: string;
    isExternal?: boolean;
    parentId?: number;
    orderIndex?: number;
  }) {
    return await prisma.menuItem.create({
      data: {
        title: data.title,
        icon: data.icon,
        route: data.route,
        isExternal: data.isExternal || false,
        parentId: data.parentId,
        orderIndex: data.orderIndex || 0,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  },

  /**
   * Update a menu item
   */
  async updateMenuItem(
    id: number,
    data: {
      title?: string;
      icon?: string;
      route?: string;
      isExternal?: boolean;
      parentId?: number;
      orderIndex?: number;
      isActive?: boolean;
    }
  ) {
    return await prisma.menuItem.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true,
      },
    });
  },

  /**
   * Delete a menu item
   */
  async deleteMenuItem(id: number) {
    // First, delete all menu permissions for this item
    await prisma.menuPermission.deleteMany({
      where: { menuItemId: id },
    });

    // Then delete the menu item (children will be cascade deleted)
    return await prisma.menuItem.delete({
      where: { id },
    });
  },

  /**
   * Assign menu item to role
   */
  async assignMenuToRole(menuItemId: number, roleId: number) {
    return await prisma.menuPermission.create({
      data: {
        menuItemId,
        roleId,
      },
      include: {
        menuItem: true,
        role: true,
      },
    });
  },

  /**
   * Remove menu item from role
   */
  async removeMenuFromRole(menuItemId: number, roleId: number) {
    return await prisma.menuPermission.deleteMany({
      where: {
        menuItemId,
        roleId,
      },
    });
  },

  /**
   * Get menu permissions for a role
   */
  async getRoleMenuPermissions(roleId: number) {
    return await prisma.menuPermission.findMany({
      where: { roleId },
      include: {
        menuItem: true,
      },
    });
  },

  /**
   * Bulk assign menus to role
   */
  async bulkAssignMenusToRole(menuItemIds: number[], roleId: number) {
    // First, remove all existing menu permissions for this role
    await prisma.menuPermission.deleteMany({
      where: { roleId },
    });

    // Then, create new permissions
    const data = menuItemIds.map((menuItemId) => ({
      menuItemId,
      roleId,
    }));

    return await prisma.menuPermission.createMany({
      data,
    });
  },

  /**
   * Reorder menu items
   */
  async reorderMenuItems(updates: { id: number; orderIndex: number }[]) {
    const promises = updates.map((update) =>
      prisma.menuItem.update({
        where: { id: update.id },
        data: { orderIndex: update.orderIndex },
      })
    );

    return await Promise.all(promises);
  },
};

