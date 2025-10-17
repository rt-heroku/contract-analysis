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
      const sharedWith = Array.isArray(exec.sharedWith) 
        ? exec.sharedWith 
        : (exec.sharedWith as any)?.length ? JSON.parse(JSON.stringify(exec.sharedWith)) : [];
      return sharedWith.includes(userId) && exec.userId !== userId;
    });

    // Mask sensitive data for shared executions
    return sharedExecutions.map(exec => ({
      ...exec,
      authClientId: encryption.maskSecret(encryption.decrypt(exec.authClientId)),
      authClientSecret: '***',
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

    // Check access
    const sharedWith = Array.isArray(execution.sharedWith) 
      ? execution.sharedWith 
      : (execution.sharedWith as any)?.length ? JSON.parse(JSON.stringify(execution.sharedWith)) : [];
    const hasAccess = execution.userId === userId || sharedWith.includes(userId);
    
    if (!hasAccess) {
      return null;
    }

    // If shared (not owner), mask credentials
    if (execution.userId !== userId) {
      return {
        ...execution,
        authClientId: encryption.maskSecret(encryption.decrypt(execution.authClientId)),
        authClientSecret: '***',
      };
    }

    // Owner gets decrypted credentials
    return {
      ...execution,
      authClientId: encryption.decrypt(execution.authClientId),
      authClientSecret: encryption.decrypt(execution.authClientSecret),
    };
  },

  /**
   * Update IDP execution
   */
  async update(id: number, userId: number, data: any) {
    // Verify ownership
    const existing = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Not authorized');
    }

    // Encrypt credentials if provided
    const updateData: any = { ...data };
    if (data.authClientId) {
      updateData.authClientId = encryption.encrypt(data.authClientId);
    }
    if (data.authClientSecret) {
      updateData.authClientSecret = encryption.encrypt(data.authClientSecret);
    }

    const updated = await prisma.idpExecution.update({
      where: { id },
      data: updateData,
    });

    // Return with decrypted credentials
    return {
      ...updated,
      authClientId: encryption.decrypt(updated.authClientId),
      authClientSecret: encryption.decrypt(updated.authClientSecret),
    };
  },

  /**
   * Delete (soft delete)
   */
  async delete(id: number, userId: number) {
    // Verify ownership
    const existing = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
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
  async share(id: number, ownerId: number, userIds: number[]) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!execution || execution.userId !== ownerId) {
      throw new Error('Not authorized');
    }

    const currentSharedWith = (execution.sharedWith as number[]) || [];
    const newSharedWith = Array.from(new Set([...currentSharedWith, ...userIds]));

    return await prisma.idpExecution.update({
      where: { id },
      data: { sharedWith: newSharedWith },
    });
  },

  /**
   * Unshare
   */
  async unshare(id: number, ownerId: number, userIdToRemove: number) {
    const execution = await prisma.idpExecution.findUnique({
      where: { id },
    });

    if (!execution || execution.userId !== ownerId) {
      throw new Error('Not authorized');
    }

    const currentSharedWith = (execution.sharedWith as number[]) || [];
    const newSharedWith = currentSharedWith.filter((uid: number) => uid !== userIdToRemove);

    return await prisma.idpExecution.update({
      where: { id },
      data: { sharedWith: newSharedWith },
    });
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

    // Check if user has access (owner or shared with)
    const sharedWith = (execution.sharedWith as number[]) || [];
    const hasAccess = execution.userId === userId || sharedWith.includes(userId);
    
    if (!hasAccess) {
      throw new Error('Access denied to this IDP Execution');
    }

    // Return with decrypted credentials
    return {
      ...execution,
      authClientId: encryption.decrypt(execution.authClientId),
      authClientSecret: encryption.decrypt(execution.authClientSecret),
    };
  },
};

