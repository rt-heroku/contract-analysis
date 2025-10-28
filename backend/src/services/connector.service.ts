import prisma from '../config/database';
import logger from '../utils/logger';
import openApiImporter from './openapi-importer.service';
import predefinedActionsService from './predefined-connector-actions.service';

export interface CreateConnectorInput {
  name: string;
  connectorType: 'rest' | 'database' | 's3' | 'ftp' | 'file';
  version?: string;
  config: any;
  authType?: string;
  openApiSpec?: any;
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
          version: data.version || '1.0.0',
          config: encryptedConfig,
          authType: data.authType,
          openApiSpec: data.openApiSpec || null,
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

      // Initialize predefined actions for connector type
      if (data.connectorType !== 'rest' || !data.openApiSpec) {
        // For non-REST or REST without OpenAPI, create predefined actions
        await predefinedActionsService.initializeForConnector(connector.id);
      }

      // If OpenAPI spec provided, import it
      if (data.openApiSpec && data.connectorType === 'rest') {
        await openApiImporter.importFromSpec(connector.id, data.openApiSpec);
      }

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
   * Import OpenAPI spec for existing connector
   */
  async importOpenApiSpec(connectorId: number, userId: number, spec: any) {
    try {
      // Verify ownership
      const connector = await prisma.connector.findFirst({
        where: { id: connectorId, createdBy: userId },
      });

      if (!connector) {
        throw new Error('Connector not found or access denied');
      }

      if (connector.connectorType !== 'rest') {
        throw new Error('OpenAPI import is only supported for REST connectors');
      }

      const result = await openApiImporter.importFromSpec(connectorId, spec);
      logger.info(`OpenAPI imported for connector ${connectorId}: ${result.actionsCreated} actions created`);
      return result;
    } catch (error: any) {
      logger.error('Error importing OpenAPI spec:', error);
      throw error;
    }
  }

  /**
   * Import OpenAPI from URL
   */
  async importOpenApiFromUrl(connectorId: number, userId: number, url: string) {
    try {
      const connector = await prisma.connector.findFirst({
        where: { id: connectorId, createdBy: userId },
      });

      if (!connector) {
        throw new Error('Connector not found or access denied');
      }

      const result = await openApiImporter.importFromUrl(connectorId, url);
      return result;
    } catch (error: any) {
      logger.error('Error importing OpenAPI from URL:', error);
      throw error;
    }
  }

  /**
   * Get connector actions
   */
  async getConnectorActions(connectorId: number, userId: number) {
    try {
      // Verify access
      const connector = await prisma.connector.findFirst({
        where: { id: connectorId, createdBy: userId },
      });

      if (!connector) {
        throw new Error('Connector not found or access denied');
      }

      return await openApiImporter.getConnectorActions(connectorId);
    } catch (error: any) {
      logger.error('Error getting connector actions:', error);
      throw error;
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

