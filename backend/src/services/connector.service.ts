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
    const { encryptConnectorConfig, isEncrypted } = require('../utils/encryption');
    
    // Don't re-encrypt if already encrypted
    if (config.password && !isEncrypted(config.password)) {
      return encryptConnectorConfig(config);
    }
    
    return config;
  }

  /**
   * Decrypt sensitive config fields
   */
  private decryptConfig(config: any): any {
    const { decryptConnectorConfig } = require('../utils/encryption');
    return decryptConnectorConfig(config);
  }

  /**
   * Test connector connection with config (before creating)
   */
  async testConnectionWithConfig(connectorType: string, config: any) {
    try {
      logger.info(`Testing ${connectorType} connection`);

      switch (connectorType) {
        case 'database':
          return await this.testDatabaseConnection(config);
        case 'rest':
          return await this.testRestConnection(config);
        case 'inference':
          return await this.testInferenceConnection(config);
        default:
          return {
            success: false,
            message: `Connection testing not implemented for ${connectorType}`,
          };
      }
    } catch (error: any) {
      logger.error(`Error testing ${connectorType} connection:`, error);
      return {
        success: false,
        message: error.message || 'Connection test failed',
      };
    }
  }

  /**
   * Test database connection (PostgreSQL)
   */
  private async testDatabaseConnection(config: any) {
    const { Pool } = require('pg');
    const startTime = Date.now();
    
    let pool: any = null;
    
    try {
      // Decrypt password if encrypted
      const { decryptConnectorConfig } = require('../utils/encryption');
      const decryptedConfig = decryptConnectorConfig(config);
      
      // Build connection config
      const poolConfig: any = {
        host: decryptedConfig.host,
        port: decryptedConfig.port || 5432,
        database: decryptedConfig.database,
        user: decryptedConfig.user,
        password: decryptedConfig.password,
        connectionTimeoutMillis: decryptedConfig.connectTimeout || 10000,
        query_timeout: decryptedConfig.queryTimeout || 30000,
      };

      // SSL configuration
      if (decryptedConfig.ssl) {
        poolConfig.ssl = {
          rejectUnauthorized: decryptedConfig.sslmode === 'verify-full',
        };
      }

      // Application name
      if (decryptedConfig.applicationName) {
        poolConfig.application_name = decryptedConfig.applicationName;
      }

      // Create pool
      pool = new Pool(poolConfig);

      // Test query
      const testQuery = decryptedConfig.testQuery || 'SELECT version()';
      const result = await pool.query(testQuery);
      
      const responseTime = Date.now() - startTime;

      // Extract version info
      let version = 'Unknown';
      if (result.rows && result.rows.length > 0) {
        const firstRow = result.rows[0];
        version = firstRow.version || firstRow[Object.keys(firstRow)[0]] || 'Unknown';
      }

      return {
        success: true,
        message: 'Database connection successful',
        details: {
          version,
          responseTime,
          rowCount: result.rowCount,
        },
      };
    } catch (error: any) {
      logger.error('Database connection test failed:', error);
      
      // Provide user-friendly error messages
      let message = 'Database connection failed';
      if (error.code === 'ECONNREFUSED') {
        message = 'Connection refused. Check host and port.';
      } else if (error.code === 'ENOTFOUND') {
        message = 'Host not found. Check hostname.';
      } else if (error.code === '28P01') {
        message = 'Authentication failed. Check username and password.';
      } else if (error.code === '3D000') {
        message = 'Database does not exist.';
      } else if (error.message) {
        message = error.message;
      }

      return {
        success: false,
        message,
        details: {
          code: error.code,
          originalMessage: error.message,
        },
      };
    } finally {
      // Always close the pool
      if (pool) {
        try {
          await pool.end();
        } catch (err) {
          logger.error('Error closing test pool:', err);
        }
      }
    }
  }

  /**
   * Test REST API connection
   */
  private async testRestConnection(config: any) {
    // TODO: Implement REST API connection test
    return {
      success: true,
      message: 'REST API connection test not yet implemented',
    };
  }

  /**
   * Test Inference connection
   */
  private async testInferenceConnection(config: any) {
    // TODO: Implement Inference connection test
    return {
      success: true,
      message: 'Inference connection test not yet implemented',
    };
  }

  /**
   * Test connector connection
   */
  async testConnection(connectorId: number, userId: number) {
    try {
      const connector = await this.getConnectorById(connectorId, userId);
      logger.info(`Testing connection for connector ${connector.name}`);

      return await this.testConnectionWithConfig(
        connector.connectorType,
        connector.config
      );
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

