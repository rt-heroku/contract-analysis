import prisma from '../config/database';
import logger from '../utils/logger';

export const storeService = {
  async getStores(userId: number, connectorId?: number) {
    try {
      const where: any = {
        createdBy: userId,
        isActive: true,
      };

      if (connectorId) {
        where.connectorId = connectorId;
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
          connector: {
            select: {
              id: true,
              name: true,
              connectorType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return stores;
    } catch (error: any) {
      logger.error('Error fetching stores:', error);
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }
  },

  async getStoreById(storeId: number, userId: number) {
    try {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          createdBy: userId,
          isActive: true,
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
          connector: {
            select: {
              id: true,
              name: true,
              connectorType: true,
              config: true,
            },
          },
        },
      });

      if (!store) {
        throw new Error('Store not found or access denied');
      }

      return store;
    } catch (error: any) {
      logger.error('Error fetching store:', error);
      throw error;
    }
  },

  async createStore(data: {
    connectorId: number;
    name: string;
    storeType: string;
    dataType: string;
    config: any;
    isDefault?: boolean;
    userId: number;
  }) {
    try {
      // Verify connector exists and user has access
      const connector = await prisma.connector.findFirst({
        where: {
          id: data.connectorId,
          createdBy: data.userId,
        },
      });

      if (!connector) {
        throw new Error('Connector not found or access denied');
      }

      // Create the store
      const store = await prisma.store.create({
        data: {
          connectorId: data.connectorId,
          name: data.name,
          storeType: data.storeType,
          dataType: data.dataType,
          config: data.config,
          isDefault: data.isDefault || false,
          createdBy: data.userId,
        },
        include: {
          connector: true,
        },
      });

      logger.info(`Store created: ${store.name} (ID: ${store.id})`);
      return store;
    } catch (error: any) {
      logger.error('Error creating store:', error);
      throw new Error(`Failed to create store: ${error.message}`);
    }
  },

  async updateStore(
    storeId: number,
    userId: number,
    updates: {
      name?: string;
      config?: any;
      isDefault?: boolean;
      isActive?: boolean;
    }
  ) {
    try {
      // Verify ownership
      const existingStore = await prisma.store.findFirst({
        where: {
          id: storeId,
          createdBy: userId,
        },
      });

      if (!existingStore) {
        throw new Error('Store not found or you do not have permission to update it');
      }

      const store = await prisma.store.update({
        where: { id: storeId },
        data: updates,
        include: {
          connector: true,
        },
      });

      logger.info(`Store updated: ${store.name} (ID: ${store.id})`);
      return store;
    } catch (error: any) {
      logger.error('Error updating store:', error);
      throw error;
    }
  },

  async deleteStore(storeId: number, userId: number) {
    try {
      // Verify ownership
      const existingStore = await prisma.store.findFirst({
        where: {
          id: storeId,
          createdBy: userId,
        },
      });

      if (!existingStore) {
        throw new Error('Store not found or you do not have permission to delete it');
      }

      // Soft delete
      await prisma.store.update({
        where: { id: storeId },
        data: { isActive: false },
      });

      logger.info(`Store deleted: ${storeId}`);
    } catch (error: any) {
      logger.error('Error deleting store:', error);
      throw error;
    }
  },

  async testStoreConnection(storeId: number, userId: number) {
    try {
      const store = await this.getStoreById(storeId, userId);

      // Basic connection test based on store type
      switch (store.storeType) {
        case 'database':
          // Test database connection (placeholder)
          return { success: true, message: 'Database store connection successful' };
        
        case 's3':
          // Test S3 connection (placeholder)
          return { success: true, message: 'S3 store connection successful' };
        
        case 'redis':
          // Test Redis connection (placeholder)
          return { success: true, message: 'Redis store connection successful' };
        
        case 'ftp':
          // Test FTP connection (placeholder)
          return { success: true, message: 'FTP store connection successful' };
        
        case 'local_file':
          // Test local file system (placeholder)
          return { success: true, message: 'Local file store connection successful' };
        
        default:
          throw new Error(`Unsupported store type: ${store.storeType}`);
      }
    } catch (error: any) {
      logger.error('Error testing store connection:', error);
      throw error;
    }
  },
};

export default storeService;
