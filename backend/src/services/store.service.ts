import prisma from '../config/database';
import logger from '../utils/logger';

export interface CreateStoreInput {
  name: string;
  storeType: 'database' | 's3' | 'ftp' | 'local_file' | 'redis';
  config: any;
  isDefault?: boolean;
  createdBy: number;
}

export interface UpdateStoreInput {
  name?: string;
  config?: any;
  isDefault?: boolean;
  isActive?: boolean;
}

class StoreService {
  /**
   * Get all stores for user
   */
  async getStores(userId: number, storeType?: string) {
    try {
      const where: any = { createdBy: userId };

      if (storeType) {
        where.storeType = storeType;
      }

      const stores = await prisma.store.findMany({
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
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      });

      return stores;
    } catch (error: any) {
      logger.error('Error fetching stores:', error);
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }
  }

  /**
   * Get store by ID
   */
  async getStoreById(storeId: number, userId: number) {
    try {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          createdBy: userId,
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

      if (!store) {
        throw new Error('Store not found or access denied');
      }

      return store;
    } catch (error: any) {
      logger.error(`Error fetching store ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Create new store
   */
  async createStore(data: CreateStoreInput) {
    try {
      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await prisma.store.updateMany({
          where: {
            createdBy: data.createdBy,
            storeType: data.storeType,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const store = await prisma.store.create({
        data: {
          name: data.name,
          storeType: data.storeType,
          config: data.config,
          isDefault: data.isDefault || false,
          createdBy: data.createdBy,
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

      logger.info(`Store created: ${store.name} by user ${data.createdBy}`);
      return store;
    } catch (error: any) {
      logger.error('Error creating store:', error);
      throw new Error(`Failed to create store: ${error.message}`);
    }
  }

  /**
   * Update store
   */
  async updateStore(storeId: number, userId: number, data: UpdateStoreInput) {
    try {
      const existing = await prisma.store.findFirst({
        where: { id: storeId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Store not found or you do not have permission to update it');
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await prisma.store.updateMany({
          where: {
            createdBy: userId,
            storeType: existing.storeType,
            isDefault: true,
            id: { not: storeId },
          },
          data: { isDefault: false },
        });
      }

      const store = await prisma.store.update({
        where: { id: storeId },
        data: {
          name: data.name,
          config: data.config,
          isDefault: data.isDefault,
          isActive: data.isActive,
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

      logger.info(`Store updated: ${store.name} by user ${userId}`);
      return store;
    } catch (error: any) {
      logger.error(`Error updating store ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Delete store
   */
  async deleteStore(storeId: number, userId: number) {
    try {
      const existing = await prisma.store.findFirst({
        where: { id: storeId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Store not found or you do not have permission to delete it');
      }

      await prisma.store.delete({
        where: { id: storeId },
      });

      logger.info(`Store deleted: ${existing.name} by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error deleting store ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Get default store for a type
   */
  async getDefaultStore(userId: number, storeType: string) {
    try {
      const store = await prisma.store.findFirst({
        where: {
          createdBy: userId,
          storeType,
          isDefault: true,
          isActive: true,
        },
      });

      return store;
    } catch (error: any) {
      logger.error(`Error fetching default store for type ${storeType}:`, error);
      throw error;
    }
  }
}

export const storeService = new StoreService();

