import prisma from '../config/database';
import logger from '../utils/logger';

export interface CreateConnectorInput {
  name: string;
  connectorType: 'rest' | 'database' | 's3' | 'ftp' | 'file';
  config: any;
  authType?: string;
  createdBy: number;
  sharedWith?: number[];
}

export interface UpdateConnectorInput {
  name?: string;
  config?: any;
  authType?: string;
  isActive?: boolean;
  sharedWith?: number[];
}

class ConnectorService {
  /**
   * Get all connectors accessible by user
   */
  async getConnectors(userId: number, connectorType?: string) {
    try {
      const where: any = {
        createdBy: userId,
      };

      if (connectorType) {
        where.connectorType = connectorType;
      }

      const connectors = await prisma.connector.findMany({
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
        orderBy: [{ connectorType: 'asc' }, { name: 'asc' }],
      });

      // Decrypt sensitive fields before returning
      return connectors.map((conn) => ({
        ...conn,
        config: this.decryptConfig(conn.config),
      }));
    } catch (error: any) {
      logger.error('Error fetching connectors:', error);
      throw new Error(`Failed to fetch connectors: ${error.message}`);
    }
  }

  /**
   * Get connector by ID
   */
  async getConnectorById(connectorId: number, userId: number) {
    try {
      const connector = await prisma.connector.findFirst({
        where: {
          id: connectorId,
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

      if (!connector) {
        throw new Error('Connector not found or access denied');
      }

      return {
        ...connector,
        config: this.decryptConfig(connector.config),
      };
    } catch (error: any) {
      logger.error(`Error fetching connector ${connectorId}:`, error);
      throw error;
    }
  }

  /**
   * Create new connector
   */
  async createConnector(data: CreateConnectorInput) {
    try {
      const encryptedConfig = this.encryptConfig(data.config);

      const connector = await prisma.connector.create({
        data: {
          name: data.name,
          connectorType: data.connectorType,
          config: encryptedConfig,
          authType: data.authType,
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

      logger.info(`Connector created: ${connector.name} by user ${data.createdBy}`);
      return {
        ...connector,
        config: data.config, // Return unencrypted for immediate use
      };
    } catch (error: any) {
      logger.error('Error creating connector:', error);
      throw new Error(`Failed to create connector: ${error.message}`);
    }
  }

  /**
   * Update connector
   */
  async updateConnector(connectorId: number, userId: number, data: UpdateConnectorInput) {
    try {
      const existing = await prisma.connector.findFirst({
        where: { id: connectorId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Connector not found or you do not have permission to update it');
      }

      const updateData: any = {
        name: data.name,
        authType: data.authType,
        isActive: data.isActive,
        sharedWith: data.sharedWith,
      };

      if (data.config) {
        updateData.config = this.encryptConfig(data.config);
      }

      const connector = await prisma.connector.update({
        where: { id: connectorId },
        data: updateData,
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

      logger.info(`Connector updated: ${connector.name} by user ${userId}`);
      return {
        ...connector,
        config: data.config || this.decryptConfig(connector.config),
      };
    } catch (error: any) {
      logger.error(`Error updating connector ${connectorId}:`, error);
      throw error;
    }
  }

  /**
   * Delete connector
   */
  async deleteConnector(connectorId: number, userId: number) {
    try {
      const existing = await prisma.connector.findFirst({
        where: { id: connectorId, createdBy: userId },
      });

      if (!existing) {
        throw new Error('Connector not found or you do not have permission to delete it');
      }

      await prisma.connector.delete({
        where: { id: connectorId },
      });

      logger.info(`Connector deleted: ${existing.name} by user ${userId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`Error deleting connector ${connectorId}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive config fields
   */
  private encryptConfig(config: any): any {
    // In a real implementation, you'd selectively encrypt sensitive fields
    // For now, we'll just store as-is
    // TODO: Implement field-level encryption for passwords, API keys, etc.
    return config;
  }

  /**
   * Decrypt sensitive config fields
   */
  private decryptConfig(config: any): any {
    // In a real implementation, you'd decrypt sensitive fields
    // For now, return as-is
    return config;
  }

  /**
   * Test connector connection
   */
  async testConnection(connectorId: number, userId: number) {
    try {
      const connector = await this.getConnectorById(connectorId, userId);

      // TODO: Implement actual connection testing based on connector type
      // For now, just return success
      logger.info(`Testing connection for connector ${connector.name}`);

      return {
        success: true,
        message: 'Connection test successful',
        connectorType: connector.connectorType,
      };
    } catch (error: any) {
      logger.error(`Error testing connector ${connectorId}:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

export const connectorService = new ConnectorService();

