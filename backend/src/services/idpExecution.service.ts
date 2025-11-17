import prisma from '../config/database';
import { encryption } from '../utils/encryption';

export const idpExecutionService = {
  /**
   * Create new IDP execution
   */
  async create(userId: number, data: {
    name: string;
    description?: string;
    protocol: string;
    host: string;
    basePath: string;
    orgId: string;
    actionId: string;
    actionVersion: string;
    authClientId: string;
    authClientSecret: string;
    anypointUsername?: string;
    anypointPassword?: string;
  }) {
    return await prisma.idpExecution.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        protocol: data.protocol,
        host: data.host,
        basePath: data.basePath,
        orgId: data.orgId,
        actionId: data.actionId,
        actionVersion: data.actionVersion,
        authClientId: encryption.encrypt(data.authClientId),
        authClientSecret: encryption.encrypt(data.authClientSecret),
        anypointUsername: data.anypointUsername ? encryption.encrypt(data.anypointUsername) : null,
        anypointPassword: data.anypointPassword ? encryption.encrypt(data.anypointPassword) : null,
      },
    });
  },

  /**
   * Get user's IDP executions
   */
  async getUserExecutions(userId: number) {
    const executions = await prisma.idpExecution.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt credentials for owner
    return executions.map(exec => ({
      ...exec,
      authClientId: encryption.decrypt(exec.authClientId),
      authClientSecret: encryption.decrypt(exec.authClientSecret),
      anypointUsername: exec.anypointUsername ? encryption.decrypt(exec.anypointUsername) : null,
      anypointPassword: exec.anypointPassword ? encryption.decrypt(exec.anypointPassword) : null,
    }));
  },

  /**
   * Get shared IDP executions (masked credentials)
   */
  async getSharedExecutions(userId: number) {
    // Get all active executions
    const allExecutions = await prisma.idpExecution.findMany({
      where: {
        isActive: true,
      },
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
    });

    // Filter for executions shared with this user
    const sharedExecutions = allExecutions.filter(exec => {
      // Handle Json type from Prisma - normalize to array
      let sharedWith: number[] = [];
      
      if (exec.sharedWith) {
        if (Array.isArray(exec.sharedWith)) {
          sharedWith = exec.sharedWith as number[];
        } else if (typeof exec.sharedWith === 'object') {
          // Prisma Json might be an object, convert to array
          sharedWith = Object.values(exec.sharedWith as any).filter((v: any) => typeof v === 'number');
        }
      }
      
      return sharedWith.includes(userId) && exec.userId !== userId;
    });

    // Mask sensitive data for shared executions
    return sharedExecutions.map(exec => ({
      ...exec,
      authClientId: encryption.maskSecret(encryption.decrypt(exec.authClientId)),
      authClientSecret: '********',
      anypointUsername: null,
      anypointPassword: null,
    }));
  },

  /**
   * Get execution by ID (with decrypted credentials for owner)
   */
  async getById(id: number, userId: number) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id },
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
    });

    if (!execution || !execution.isActive) {
      return null;
    }

    // Check access - normalize sharedWith to array
    let sharedWith: number[] = [];
    if (execution.sharedWith) {
      if (Array.isArray(execution.sharedWith)) {
        sharedWith = execution.sharedWith as number[];
      } else if (typeof execution.sharedWith === 'object') {
        sharedWith = Object.values(execution.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }
    const hasAccess = execution.userId === userId || sharedWith.includes(userId);
    
    if (!hasAccess) {
      return null;
    }

    // If shared (not owner), mask credentials
    if (execution.userId !== userId) {
      return {
        ...execution,
        authClientId: encryption.maskSecret(encryption.decrypt(execution.authClientId)),
        authClientSecret: '********',
        anypointUsername: null,
        anypointPassword: null,
      };
    }

    // Owner gets decrypted credentials
    return {
      ...execution,
      authClientId: encryption.decrypt(execution.authClientId),
      authClientSecret: encryption.decrypt(execution.authClientSecret),
      anypointUsername: execution.anypointUsername ? encryption.decrypt(execution.anypointUsername) : null,
      anypointPassword: execution.anypointPassword ? encryption.decrypt(execution.anypointPassword) : null,
    };
  },

  /**
   * Update IDP execution
   */
  async update(id: number, userId: number, data: any, isAdmin: boolean = false) {
    // Verify ownership or admin access
    const existing = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('IDP Execution not found');
    }

    // Allow update if owner OR admin
    if (existing.userId !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Encrypt credentials if provided (skip empty strings to keep existing values)
    const updateData: any = { ...data };
    
    // Remove credential fields if empty (to keep existing values)
    if (data.authClientId && data.authClientId.trim() !== '') {
      updateData.authClientId = encryption.encrypt(data.authClientId);
    } else {
      delete updateData.authClientId;
    }
    
    if (data.authClientSecret && data.authClientSecret.trim() !== '') {
      updateData.authClientSecret = encryption.encrypt(data.authClientSecret);
    } else {
      delete updateData.authClientSecret;
    }
    
    if (data.anypointUsername !== undefined) {
      if (data.anypointUsername && data.anypointUsername.trim() !== '') {
        updateData.anypointUsername = encryption.encrypt(data.anypointUsername);
      } else if (data.anypointUsername === '') {
        // Empty string means keep existing
        delete updateData.anypointUsername;
      } else {
        // null means clear it
        updateData.anypointUsername = null;
      }
    }
    
    if (data.anypointPassword !== undefined) {
      if (data.anypointPassword && data.anypointPassword.trim() !== '') {
        updateData.anypointPassword = encryption.encrypt(data.anypointPassword);
      } else if (data.anypointPassword === '') {
        // Empty string means keep existing
        delete updateData.anypointPassword;
      } else {
        // null means clear it
        updateData.anypointPassword = null;
      }
    }

    const updated = await prisma.idpExecution.update({
      where: { id },
      data: updateData,
    });

    // Return with decrypted credentials if owner, masked if admin editing someone else's
    const isOwner = existing.userId === userId;
    
    if (isOwner) {
      return {
        ...updated,
        authClientId: encryption.decrypt(updated.authClientId),
        authClientSecret: encryption.decrypt(updated.authClientSecret),
        anypointUsername: updated.anypointUsername ? encryption.decrypt(updated.anypointUsername) : null,
        anypointPassword: updated.anypointPassword ? encryption.decrypt(updated.anypointPassword) : null,
      };
    } else {
      // Admin editing someone else's execution - return masked
      return {
        ...updated,
        authClientId: encryption.maskSecret(encryption.decrypt(updated.authClientId)),
        authClientSecret: '********',
        anypointUsername: null,
        anypointPassword: null,
      };
    }
  },

  /**
   * Delete (soft delete)
   */
  async delete(id: number, userId: number, isAdmin: boolean = false) {
    // Verify ownership or admin access
    const existing = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('IDP Execution not found');
    }

    // Allow deletion if owner OR admin
    if (existing.userId !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    return await prisma.idpExecution.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Share with users
   */
  async share(id: number, userId: number, userIds: number[], isAdmin: boolean = false) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new Error('IDP Execution not found');
    }

    // Allow sharing if owner OR admin
    if (execution.userId !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Normalize current sharedWith to array
    let currentSharedWith: number[] = [];
    if (execution.sharedWith) {
      if (Array.isArray(execution.sharedWith)) {
        currentSharedWith = execution.sharedWith as number[];
      } else if (typeof execution.sharedWith === 'object') {
        currentSharedWith = Object.values(execution.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }
    
    const newSharedWith = Array.from(new Set([...currentSharedWith, ...userIds]));

    return await prisma.idpExecution.update({
      where: { id },
      data: { sharedWith: newSharedWith },
    });
  },

  /**
   * Unshare
   */
  async unshare(id: number, userId: number, userIdToRemove: number, isAdmin: boolean = false) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      throw new Error('IDP Execution not found');
    }

    // Allow unsharing if owner OR admin
    if (execution.userId !== userId && !isAdmin) {
      throw new Error('Not authorized');
    }

    // Normalize current sharedWith to array
    let currentSharedWith: number[] = [];
    if (execution.sharedWith) {
      if (Array.isArray(execution.sharedWith)) {
        currentSharedWith = execution.sharedWith as number[];
      } else if (typeof execution.sharedWith === 'object') {
        currentSharedWith = Object.values(execution.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }
    
    const newSharedWith = currentSharedWith.filter((uid: number) => uid !== userIdToRemove);

    return await prisma.idpExecution.update({
      where: { id },
      data: { sharedWith: newSharedWith },
    });
  },

  /**
   * Get all other executions (admin only)
   */
  async getAllOtherExecutions(userId: number) {
    // Get all active executions that user doesn't own and aren't shared with them
    const allExecutions = await prisma.idpExecution.findMany({
      where: {
        isActive: true,
        userId: { not: userId },
      },
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
    });

    // Filter out executions that are shared with the user
    const otherExecutions = allExecutions.filter(exec => {
      // Handle Json type from Prisma - normalize to array
      let sharedWith: number[] = [];
      
      if (exec.sharedWith) {
        if (Array.isArray(exec.sharedWith)) {
          sharedWith = exec.sharedWith as number[];
        } else if (typeof exec.sharedWith === 'object') {
          // Prisma Json might be an object, convert to array
          sharedWith = Object.values(exec.sharedWith as any).filter((v: any) => typeof v === 'number');
        }
      }
      
      return !sharedWith.includes(userId);
    });

    // Mask sensitive data
    return otherExecutions.map(exec => ({
      ...exec,
      authClientId: encryption.maskSecret(encryption.decrypt(exec.authClientId)),
      authClientSecret: '********',
      anypointUsername: null,
      anypointPassword: null,
    }));
  },

  /**
   * Get shared users for an execution
   */
  async getSharedUsers(id: number, ownerId: number) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!execution || execution.userId !== ownerId) {
      throw new Error('Not authorized');
    }

    const sharedUserIds = (execution.sharedWith as number[]) || [];
    
    if (sharedUserIds.length === 0) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: sharedUserIds },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return users;
  },

  /**
   * Get decrypted execution for processing (internal use)
   */
  async getForProcessing(id: number, userId: number) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id, isActive: true },
    });
    
    if (!execution) {
      throw new Error('IDP Execution not found');
    }

    // Check if user has access (owner or shared with) - normalize sharedWith to array
    let sharedWith: number[] = [];
    if (execution.sharedWith) {
      if (Array.isArray(execution.sharedWith)) {
        sharedWith = execution.sharedWith as number[];
      } else if (typeof execution.sharedWith === 'object') {
        sharedWith = Object.values(execution.sharedWith as any).filter((v: any) => typeof v === 'number');
      }
    }
    const hasAccess = execution.userId === userId || sharedWith.includes(userId);
    
    if (!hasAccess) {
      throw new Error('Access denied to this IDP Execution');
    }

    // Return with decrypted credentials
    return {
      ...execution,
      authClientId: encryption.decrypt(execution.authClientId),
      authClientSecret: encryption.decrypt(execution.authClientSecret),
      anypointUsername: execution.anypointUsername ? encryption.decrypt(execution.anypointUsername) : null,
      anypointPassword: execution.anypointPassword ? encryption.decrypt(execution.anypointPassword) : null,
    };
  },
};

