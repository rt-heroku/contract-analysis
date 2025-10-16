import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const roleService = {
  /**
   * Get all roles with their permissions
   */
  async getAllRoles() {
    return await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: number) {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Get role by name
   */
  async getRoleByName(name: string) {
    return await prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  /**
   * Create a new role
   */
  async createRole(data: { name: string; description?: string }) {
    return await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  },

  /**
   * Update a role
   */
  async updateRole(id: number, data: { name?: string; description?: string }) {
    return await prisma.role.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    // Check if role has users
    const usersCount = await prisma.userRole.count({
      where: { roleId: id },
    });

    if (usersCount > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    return await prisma.role.delete({
      where: { id },
    });
  },

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  },

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, any[]> = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });

    return grouped;
  },

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: number) {
    return await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });
  },

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: number, permissionId: number) {
    return await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
      include: {
        permission: true,
      },
    });
  },

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: number, permissionId: number) {
    return await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  },

  /**
   * Bulk update role permissions
   */
  async bulkUpdateRolePermissions(roleId: number, permissionIds: number[]) {
    // First, remove all existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Then, create new permissions
    if (permissionIds.length > 0) {
      const data = permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      }));

      await prisma.rolePermission.createMany({
        data,
      });
    }

    // Return updated permissions
    return await this.getRolePermissions(roleId);
  },

  /**
   * Check if user has permission
   */
  async userHasPermission(userId: number, permissionName: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
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
    });

    // Check if any of the user's roles has the permission
    return userRoles.some((userRole) =>
      userRole.role.rolePermissions.some(
        (rp) => rp.permission.name === permissionName
      )
    );
  },

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: number) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
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
    });

    // Collect all unique permissions from all roles
    const permissionsMap = new Map();
    userRoles.forEach((userRole) => {
      userRole.role.rolePermissions.forEach((rp) => {
        permissionsMap.set(rp.permission.name, rp.permission);
      });
    });

    return Array.from(permissionsMap.values());
  },
};

