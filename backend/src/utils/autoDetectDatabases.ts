import prisma from '../config/database';
import logger from './logger';

interface DatabaseConfig {
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

/**
 * Parse PostgreSQL connection URL
 * Format: postgres://user:password@host:port/database
 */
function parsePostgresUrl(url: string): DatabaseConfig | null {
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.protocol.startsWith('postgres')) {
      return null;
    }

    return {
      name: '', // Will be set by caller
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      database: urlObj.pathname.slice(1), // Remove leading /
      user: urlObj.username,
      password: urlObj.password,
      ssl: urlObj.searchParams.get('sslmode') !== 'disable',
    };
  } catch (error) {
    logger.error('Failed to parse database URL:', error);
    return null;
  }
}

/**
 * Create standard connector actions for a database connector
 */
async function createConnectorActions(connectorId: number): Promise<void> {
  const actions = [
    {
      operation: 'query',
      operationId: 'execute_query',
      displayName: 'Execute Query',
      description: 'Execute a SELECT query and return results',
      method: null,
      path: null,
      parameters: {
        query: { type: 'string', required: true, description: 'SQL SELECT query to execute' },
      },
      requestBody: null,
      responses: { '200': { description: 'Query results' } },
    },
    {
      operation: 'execute_sql',
      operationId: 'execute_sql',
      displayName: 'Execute SQL',
      description: 'Execute any SQL statement',
      method: null,
      path: null,
      parameters: {
        query: { type: 'string', required: true, description: 'SQL statement to execute' },
      },
      requestBody: null,
      responses: { '200': { description: 'Execution result' } },
    },
    {
      operation: 'query_paginated',
      operationId: 'query_paginated',
      displayName: 'Query All (Paginated)',
      description: 'Execute a SELECT query with pagination',
      method: null,
      path: null,
      parameters: {
        query: { type: 'string', required: true, description: 'SQL SELECT query' },
        page: { type: 'number', required: false, description: 'Page number (default: 1)' },
        pageSize: { type: 'number', required: false, description: 'Page size (default: 50)' },
      },
      requestBody: null,
      responses: { '200': { description: 'Paginated query results' } },
    },
    {
      operation: 'insert',
      operationId: 'insert_record',
      displayName: 'Insert Record',
      description: 'Insert a new record into a table',
      method: null,
      path: null,
      parameters: {
        table: { type: 'string', required: true, description: 'Table name' },
        data: { type: 'object', required: true, description: 'Record data' },
      },
      requestBody: null,
      responses: { '200': { description: 'Insert result' } },
    },
    {
      operation: 'update',
      operationId: 'update_record',
      displayName: 'Update Record',
      description: 'Update existing record(s)',
      method: null,
      path: null,
      parameters: {
        table: { type: 'string', required: true, description: 'Table name' },
        data: { type: 'object', required: true, description: 'Data to update' },
        where: { type: 'object', required: true, description: 'WHERE conditions' },
      },
      requestBody: null,
      responses: { '200': { description: 'Update result' } },
    },
    {
      operation: 'delete',
      operationId: 'delete_record',
      displayName: 'Delete Record',
      description: 'Delete record(s) from table',
      method: null,
      path: null,
      parameters: {
        table: { type: 'string', required: true, description: 'Table name' },
        where: { type: 'object', required: true, description: 'WHERE conditions' },
      },
      requestBody: null,
      responses: { '200': { description: 'Delete result' } },
    },
    {
      operation: 'transaction',
      operationId: 'execute_transaction',
      displayName: 'Transaction',
      description: 'Execute multiple queries in a transaction',
      method: null,
      path: null,
      parameters: {
        queries: { type: 'array', required: true, description: 'Array of SQL statements' },
      },
      requestBody: null,
      responses: { '200': { description: 'Transaction result' } },
    },
  ];

  for (const action of actions) {
    try {
      // Check if action already exists
      const existing = await prisma.connectorAction.findFirst({
        where: {
          connectorId,
          operation: action.operation,
        },
      });

      if (existing) {
        continue;
      }

      // Create action
      await prisma.connectorAction.create({
        data: {
          connectorId,
          operation: action.operation,
          operationId: action.operationId,
          displayName: action.displayName,
          description: action.description,
          method: action.method,
          path: action.path,
          parameters: action.parameters,
          requestBody: action.requestBody ?? undefined, // Convert null to undefined for Prisma
          responses: action.responses ?? undefined, // Convert null to undefined for Prisma
          isActive: true,
        },
      });
    } catch (error) {
      logger.error(`Failed to create action ${action.operation} for connector ${connectorId}:`, error);
    }
  }
}

/**
 * Auto-detect and create database connectors from environment variables
 * Creates connectors for:
 * - DATABASE_URL (named "Database")
 * - HEROKU_POSTGRESQL_<COLOR>_URL (named "Heroku PostgreSQL <Color>")
 */
export async function autoDetectDatabases(userId: number): Promise<void> {
  try {
    const databases: DatabaseConfig[] = [];

    // Check for DATABASE_URL (main database)
    const mainDbUrl = process.env.DATABASE_URL;
    if (mainDbUrl) {
      const config = parsePostgresUrl(mainDbUrl);
      if (config) {
        config.name = 'Database';
        databases.push(config);
      }
    }

    // Check for Heroku PostgreSQL add-ons
    // Format: HEROKU_POSTGRESQL_<COLOR>_URL
    const herokuDbPattern = /^HEROKU_POSTGRESQL_([A-Z]+)_URL$/;
    
    Object.keys(process.env).forEach((key) => {
      const match = key.match(herokuDbPattern);
      if (match) {
        const color = match[1];
        const url = process.env[key];
        if (url) {
          const config = parsePostgresUrl(url);
          if (config) {
            // Format color name: AMBER -> Amber, RED_RUBY -> Red Ruby
            const formattedColor = color
              .split('_')
              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
              .join(' ');
            config.name = `Heroku PostgreSQL ${formattedColor}`;
            databases.push(config);
          }
        }
      }
    });

    if (databases.length === 0) {
      logger.info('No database environment variables found for auto-detection');
      return;
    }

    // Create connectors for detected databases
    for (const dbConfig of databases) {
      try {
        // Check if connector already exists
        const existing = await prisma.connector.findFirst({
          where: {
            name: dbConfig.name,
            connectorType: 'database',
            isAutoCreated: true,
          },
        });

        if (existing) {
          logger.info(`Database connector "${dbConfig.name}" already exists`);
          // Ensure actions exist for existing connectors
          await createConnectorActions(existing.id);
          continue;
        }

        // Create new connector
        const connector = await prisma.connector.create({
          data: {
            name: dbConfig.name,
            connectorType: 'database',
            version: '1.0.0',
            config: {
              host: dbConfig.host,
              port: dbConfig.port,
              database: dbConfig.database,
              user: dbConfig.user,
              password: dbConfig.password,
              ssl: dbConfig.ssl,
            },
            isActive: true,
            isAutoCreated: true,
            createdBy: userId,
            sharedWith: [],
          },
        });

        logger.info(`Auto-created database connector: ${dbConfig.name}`);

        // Create standard connector actions
        await createConnectorActions(connector.id);
        logger.info(`Auto-created connector actions for: ${dbConfig.name}`);
      } catch (error) {
        logger.error(`Failed to create connector for ${dbConfig.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to auto-detect databases:', error);
  }
}

/**
 * Initialize auto-detection on app startup
 * Finds the first admin user and creates connectors
 */
export async function initializeAutoDetection(): Promise<void> {
  try {
    // Find first admin user
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' },
      include: {
        userRoles: {
          include: {
            user: true,
          },
          take: 1,
        },
      },
    });

    if (!adminRole || adminRole.userRoles.length === 0) {
      logger.warn('No admin user found for auto-detecting databases');
      return;
    }

    const adminUserId = adminRole.userRoles[0].userId;
    await autoDetectDatabases(adminUserId);
  } catch (error) {
    logger.error('Failed to initialize database auto-detection:', error);
  }
}

