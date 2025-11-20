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

interface InferenceConfig {
  name: string;
  apiKey: string;
  modelId: string;
  baseUrl: string;
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
 * Create standard connector actions for an inference connector
 */
async function createInferenceActions(connectorId: number): Promise<void> {
  const actions = [
    {
      operation: 'chat_completion',
      operationId: 'chat_completion',
      displayName: 'Chat Completion',
      description: 'Generate chat completion using the LLM',
      method: 'POST',
      path: '/chat/completions',
      parameters: {
        messages: { type: 'array', required: true, description: 'Array of message objects with role and content' },
        temperature: { type: 'number', required: false, default: 0.7, description: 'Sampling temperature (0-2)' },
        max_tokens: { type: 'number', required: false, description: 'Maximum tokens to generate' },
        stream: { type: 'boolean', required: false, default: false, description: 'Stream response' },
      },
      requestBody: {
        model: '{{modelId}}',
        messages: '{{messages}}',
        temperature: '{{temperature}}',
        max_tokens: '{{max_tokens}}',
      },
      responses: undefined,
    },
    {
      operation: 'text_completion',
      operationId: 'text_completion',
      displayName: 'Text Completion',
      description: 'Generate text completion',
      method: 'POST',
      path: '/completions',
      parameters: {
        prompt: { type: 'string', required: true, description: 'Text prompt' },
        temperature: { type: 'number', required: false, default: 0.7 },
        max_tokens: { type: 'number', required: false, default: 1000 },
      },
      requestBody: {
        model: '{{modelId}}',
        prompt: '{{prompt}}',
        temperature: '{{temperature}}',
        max_tokens: '{{max_tokens}}',
      },
      responses: undefined,
    },
    {
      operation: 'embeddings',
      operationId: 'embeddings',
      displayName: 'Generate Embeddings',
      description: 'Generate embeddings for text',
      method: 'POST',
      path: '/embeddings',
      parameters: {
        input: { type: 'string', required: true, description: 'Text to embed' },
      },
      requestBody: {
        model: '{{modelId}}',
        input: '{{input}}',
      },
      responses: undefined,
    },
  ];

  for (const action of actions) {
    try {
      await prisma.connectorAction.upsert({
        where: {
          connectorId_operation: {
            connectorId,
            operation: action.operation,
          },
        },
        update: {},
        create: {
          connectorId,
          operation: action.operation,
          operationId: action.operationId,
          displayName: action.displayName,
          description: action.description,
          method: action.method,
          path: action.path,
          parameters: action.parameters,
          requestBody: action.requestBody ?? undefined,
          responses: action.responses ?? undefined,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error(`Failed to create inference action ${action.operation}:`, error);
    }
  }
}

/**
 * Auto-detect and create Inference connectors from environment variables
 */
async function autoDetectInference(userId: number): Promise<void> {
  try {
    const inferenceConfigs: InferenceConfig[] = [];

    // Check for default INFERENCE_* env vars
    const inferenceKey = process.env.INFERENCE_KEY;
    const inferenceModelId = process.env.INFERENCE_MODEL_ID || 'gpt-4o-mini';
    const inferenceUrl = process.env.INFERENCE_URL || 'https://api.openai.com/v1';

    if (inferenceKey) {
      inferenceConfigs.push({
        name: 'AI',
        apiKey: inferenceKey,
        modelId: inferenceModelId,
        baseUrl: inferenceUrl,
      });
    }

    // Check for Heroku INFERENCE addons (HEROKU_INFERENCE_<COLOR>_KEY, etc.)
    const envKeys = Object.keys(process.env);
    const herokuInferenceKeys = envKeys.filter(key => key.startsWith('HEROKU_INFERENCE_') && key.endsWith('_KEY'));

    for (const keyVar of herokuInferenceKeys) {
      const color = keyVar.replace('HEROKU_INFERENCE_', '').replace('_KEY', '');
      const apiKey = process.env[keyVar];
      const modelId = process.env[`HEROKU_INFERENCE_${color}_MODEL_ID`] || 'gpt-4o-mini';
      const baseUrl = process.env[`HEROKU_INFERENCE_${color}_URL`] || 'https://api.openai.com/v1';

      if (apiKey) {
        const name = `Heroku AI ${color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()}`;
        inferenceConfigs.push({
          name,
          apiKey,
          modelId,
          baseUrl,
        });
      }
    }

    // Create connectors for each detected inference service
    for (const inferenceConfig of inferenceConfigs) {
      try {
        // Check if connector already exists
        const existing = await prisma.connector.findFirst({
          where: {
            name: inferenceConfig.name,
            connectorType: 'inference',
            isAutoCreated: true,
          },
        });

        if (existing) {
          logger.info(`Inference connector "${inferenceConfig.name}" already exists`);
          // Ensure actions exist for existing connectors
          await createInferenceActions(existing.id);
          continue;
        }

        // Create new connector
        const connector = await prisma.connector.create({
          data: {
            name: inferenceConfig.name,
            connectorType: 'inference',
            version: '1.0.0',
            config: {
              apiKey: inferenceConfig.apiKey,
              modelId: inferenceConfig.modelId,
              baseUrl: inferenceConfig.baseUrl,
            },
            isActive: true,
            isAutoCreated: true,
            createdBy: userId,
            sharedWith: [],
          },
        });

        logger.info(`Auto-created inference connector: ${inferenceConfig.name}`);

        // Create standard connector actions
        await createInferenceActions(connector.id);
        logger.info(`Auto-created connector actions for: ${inferenceConfig.name}`);
      } catch (error) {
        logger.error(`Failed to create connector for ${inferenceConfig.name}:`, error);
      }
    }
  } catch (error) {
    logger.error('Failed to auto-detect inference services:', error);
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
    await autoDetectInference(adminUserId);
    await initializeInferenceSettings();
  } catch (error) {
    logger.error('Failed to initialize auto-detection:', error);
  }
}

/**
 * Initialize default system settings for inference connectors
 */
async function initializeInferenceSettings(): Promise<void> {
  try {
    // Find the first inference connector
    const firstInferenceConnector = await prisma.connector.findFirst({
      where: {
        connectorType: 'inference',
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (firstInferenceConnector) {
      // Create or update setting for DB Explorer AI connector
      await prisma.systemSetting.upsert({
        where: {
          settingKey: 'db_explorer_ai_connector_id',
        },
        update: {},
        create: {
          settingKey: 'db_explorer_ai_connector_id',
          settingValue: firstInferenceConnector.id.toString(),
          description: 'Inference connector used for AI SQL generation in Database Explorer',
          category: 'AI',
          isSecret: false,
        },
      });

      logger.info(`Set default DB Explorer AI connector: ${firstInferenceConnector.name}`);
    }
  } catch (error) {
    logger.error('Failed to initialize inference settings:', error);
  }
}

