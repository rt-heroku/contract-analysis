import prisma from '../config/database';
import logger from '../utils/logger';

export interface CreateActionInput {
  name: string;
  displayName: string;
  description?: string;
  actionType: 'system' | 'user_defined' | 'connector';
  category: string;
  icon?: string;
  color?: string;
  configSchema: any;
  inputSchema: any;
  outputSchema: any;
  executorType: 'builtin' | 'rest_api' | 'script';
  executorConfig: any;
  isSystem?: boolean;
  createdBy: number;
  sharedWith?: number[];
}

export interface UpdateActionInput {
  displayName?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  configSchema?: any;
  inputSchema?: any;
  outputSchema?: any;
  executorType?: 'builtin' | 'rest_api' | 'script';
  executorConfig?: any;
  isActive?: boolean;
  sharedWith?: number[];
}

class ActionService {
  /**
   * Get all actions accessible by user (own + shared + system)
   */
  async getActions(userId: number, filters?: {
    category?: string;
    actionType?: string;
    isActive?: boolean;
  }) {
    try {
      const where: any = {
        OR: [
          { createdBy: userId },
          { isSystem: true },
        ],
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.actionType) {
        where.actionType = filters.actionType;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const actions = await prisma.action.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { isSystem: 'desc' },
          { category: 'asc' },
          { displayName: 'asc' },
        ],
      });

      return actions;
    } catch (error: any) {
      logger.error('Error fetching actions:', error);
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }
  }

  /**
   * Get action by ID
   */
  async getActionById(actionId: number, userId: number) {
    try {
      const action = await prisma.action.findFirst({
        where: {
          id: actionId,
          OR: [
            { createdBy: userId },
            { isSystem: true },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!action) {
        throw new Error('Action not found or access denied');
      }

      return action;
    } catch (error: any) {
      logger.error(`Error fetching action ${actionId}:`, error);
      throw error;
    }
  }

  /**
   * Create new action
   */
  async createAction(data: CreateActionInput) {
    try {
      const action = await prisma.action.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          actionType: data.actionType,
          category: data.category,
          icon: data.icon,
          color: data.color,
          configSchema: data.configSchema,
          inputSchema: data.inputSchema,
          outputSchema: data.outputSchema,
          executorType: data.executorType,
          executorConfig: data.executorConfig,
          isSystem: data.isSystem || false,
          createdBy: data.createdBy,
          sharedWith: data.sharedWith || [],
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Action created: ${action.name} by user ${data.createdBy}`);
      return action;
    } catch (error: any) {
      logger.error('Error creating action:', error);
      throw new Error(`Failed to create action: ${error.message}`);
    }
  }

  /**
   * Update action
   */
  async updateAction(actionId: number, userId: number, data: UpdateActionInput) {
    try {
      // Check ownership
      const existing = await prisma.action.findFirst({
        where: { id: actionId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Action not found or you do not have permission to update it');
      }

      if (existing.isSystem) {
        throw new Error('Cannot update system actions');
      }

      const action = await prisma.action.update({
        where: { id: actionId },
        data: {
          displayName: data.displayName,
          description: data.description,
          category: data.category,
          icon: data.icon,
          color: data.color,
          configSchema: data.configSchema,
          inputSchema: data.inputSchema,
          outputSchema: data.outputSchema,
          executorType: data.executorType,
          executorConfig: data.executorConfig,
          isActive: data.isActive,
          sharedWith: data.sharedWith,
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Action updated: ${action.name} by user ${userId}`);
      return action;
    } catch (error: any) {
      logger.error(`Error updating action ${actionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete action
   */
  async deleteAction(actionId: number, userId: number) {
    try {
      const existing = await prisma.action.findFirst({
        where: { id: actionId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Action not found or you do not have permission to delete it');
      }

      if (existing.isSystem) {
        throw new Error('Cannot delete system actions');
      }

      await prisma.action.delete({
        where: { id: actionId },
      });

      logger.info(`Action deleted: ${existing.name} by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error deleting action ${actionId}:`, error);
      throw error;
    }
  }

  /**
   * Share action with users
   */
  async shareAction(actionId: number, userId: number, shareWithUserIds: number[]) {
    try {
      const existing = await prisma.action.findFirst({
        where: { id: actionId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Action not found or you do not have permission to share it');
      }

      const currentShared = Array.isArray(existing.sharedWith) ? existing.sharedWith as number[] : [];
      const newShared = [...new Set([...currentShared, ...shareWithUserIds])];

      const action = await prisma.action.update({
        where: { id: actionId },
        data: { sharedWith: newShared as any },
      });

      logger.info(`Action ${action.name} shared with ${shareWithUserIds.length} users by user ${userId}`);
      return action;
    } catch (error: any) {
      logger.error(`Error sharing action ${actionId}:`, error);
      throw error;
    }
  }

  /**
   * Get system actions
   */
  async getSystemActions() {
    try {
      return await prisma.action.findMany({
        where: { isSystem: true, isActive: true },
        orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
      });
    } catch (error: any) {
      logger.error('Error fetching system actions:', error);
      throw error;
    }
  }
}

export const actionService = new ActionService();

