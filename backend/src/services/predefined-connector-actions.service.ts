import prisma from '../config/database';
import logger from '../utils/logger';

interface ActionDefinition {
  operation: string;
  displayName: string;
  description: string;
  parameters: any;
}

// Database Connector Actions
const DATABASE_ACTIONS: ActionDefinition[] = [
  {
    operation: 'query',
    displayName: 'Execute Query',
    description: 'Execute a SELECT query and return results',
    parameters: {
      sql: { type: 'string', required: true, description: 'SQL query to execute' },
      values: { type: 'array', required: false, description: 'Parameter values for prepared statement' },
    },
  },
  {
    operation: 'query_all',
    displayName: 'Query All (Paginated)',
    description: 'Execute a SELECT query with pagination',
    parameters: {
      sql: { type: 'string', required: true, description: 'SQL query' },
      values: { type: 'array', required: false, description: 'Parameter values' },
      page: { type: 'number', required: false, default: 1, description: 'Page number' },
      pageSize: { type: 'number', required: false, default: 100, description: 'Records per page' },
    },
  },
  {
    operation: 'insert',
    displayName: 'Insert Record',
    description: 'Insert a new record into a table',
    parameters: {
      table: { type: 'string', required: true, description: 'Table name' },
      data: { type: 'object', required: true, description: 'Record data' },
    },
  },
  {
    operation: 'update',
    displayName: 'Update Record',
    description: 'Update existing record(s)',
    parameters: {
      table: { type: 'string', required: true, description: 'Table name' },
      data: { type: 'object', required: true, description: 'Data to update' },
      where: { type: 'object', required: true, description: 'WHERE conditions' },
    },
  },
  {
    operation: 'delete',
    displayName: 'Delete Record',
    description: 'Delete record(s) from table',
    parameters: {
      table: { type: 'string', required: true, description: 'Table name' },
      where: { type: 'object', required: true, description: 'WHERE conditions' },
    },
  },
  {
    operation: 'execute',
    displayName: 'Execute SQL',
    description: 'Execute any SQL statement',
    parameters: {
      sql: { type: 'string', required: true, description: 'SQL statement' },
      values: { type: 'array', required: false, description: 'Parameter values' },
    },
  },
  {
    operation: 'transaction',
    displayName: 'Transaction',
    description: 'Execute multiple queries in a transaction',
    parameters: {
      queries: { type: 'array', required: true, description: 'Array of SQL queries' },
    },
  },
];

// File System Connector Actions
const FILE_ACTIONS: ActionDefinition[] = [
  {
    operation: 'read',
    displayName: 'Read File',
    description: 'Read file contents',
    parameters: {
      path: { type: 'string', required: true, description: 'File path' },
      encoding: { type: 'string', required: false, default: 'utf8', description: 'File encoding' },
    },
  },
  {
    operation: 'write',
    displayName: 'Write File',
    description: 'Write content to file',
    parameters: {
      path: { type: 'string', required: true, description: 'File path' },
      content: { type: 'string', required: true, description: 'File content' },
      encoding: { type: 'string', required: false, default: 'utf8', description: 'File encoding' },
    },
  },
  {
    operation: 'append',
    displayName: 'Append to File',
    description: 'Append content to existing file',
    parameters: {
      path: { type: 'string', required: true, description: 'File path' },
      content: { type: 'string', required: true, description: 'Content to append' },
    },
  },
  {
    operation: 'delete',
    displayName: 'Delete File',
    description: 'Delete a file',
    parameters: {
      path: { type: 'string', required: true, description: 'File path' },
    },
  },
  {
    operation: 'exists',
    displayName: 'File Exists',
    description: 'Check if file exists',
    parameters: {
      path: { type: 'string', required: true, description: 'File path' },
    },
  },
  {
    operation: 'list',
    displayName: 'List Directory',
    description: 'List files in directory',
    parameters: {
      path: { type: 'string', required: true, description: 'Directory path' },
      recursive: { type: 'boolean', required: false, default: false, description: 'List recursively' },
    },
  },
  {
    operation: 'copy',
    displayName: 'Copy File',
    description: 'Copy file to new location',
    parameters: {
      source: { type: 'string', required: true, description: 'Source file path' },
      destination: { type: 'string', required: true, description: 'Destination path' },
    },
  },
  {
    operation: 'move',
    displayName: 'Move/Rename File',
    description: 'Move or rename file',
    parameters: {
      source: { type: 'string', required: true, description: 'Source file path' },
      destination: { type: 'string', required: true, description: 'Destination path' },
    },
  },
  {
    operation: 'mkdir',
    displayName: 'Create Directory',
    description: 'Create a new directory',
    parameters: {
      path: { type: 'string', required: true, description: 'Directory path' },
      recursive: { type: 'boolean', required: false, default: false, description: 'Create parent directories' },
    },
  },
  {
    operation: 'stat',
    displayName: 'Get File Stats',
    description: 'Get file metadata (size, dates, etc.)',
    parameters: {
      path: { type: 'string', required: true, description: 'File path' },
    },
  },
];

// S3 Connector Actions
const S3_ACTIONS: ActionDefinition[] = [
  {
    operation: 'upload',
    displayName: 'Upload Object',
    description: 'Upload file to S3 bucket',
    parameters: {
      key: { type: 'string', required: true, description: 'Object key (path)' },
      content: { type: 'string', required: true, description: 'File content (base64 or text)' },
      contentType: { type: 'string', required: false, description: 'MIME type' },
    },
  },
  {
    operation: 'download',
    displayName: 'Download Object',
    description: 'Download file from S3 bucket',
    parameters: {
      key: { type: 'string', required: true, description: 'Object key (path)' },
    },
  },
  {
    operation: 'delete',
    displayName: 'Delete Object',
    description: 'Delete object from S3',
    parameters: {
      key: { type: 'string', required: true, description: 'Object key (path)' },
    },
  },
  {
    operation: 'list',
    displayName: 'List Objects',
    description: 'List objects in bucket',
    parameters: {
      prefix: { type: 'string', required: false, description: 'Filter by prefix' },
      maxKeys: { type: 'number', required: false, default: 1000, description: 'Maximum objects to return' },
    },
  },
  {
    operation: 'exists',
    displayName: 'Object Exists',
    description: 'Check if object exists',
    parameters: {
      key: { type: 'string', required: true, description: 'Object key (path)' },
    },
  },
  {
    operation: 'copy',
    displayName: 'Copy Object',
    description: 'Copy object within or between buckets',
    parameters: {
      sourceKey: { type: 'string', required: true, description: 'Source object key' },
      destinationKey: { type: 'string', required: true, description: 'Destination object key' },
      destinationBucket: { type: 'string', required: false, description: 'Destination bucket (if different)' },
    },
  },
  {
    operation: 'move',
    displayName: 'Move Object',
    description: 'Move object (copy + delete)',
    parameters: {
      sourceKey: { type: 'string', required: true, description: 'Source object key' },
      destinationKey: { type: 'string', required: true, description: 'Destination object key' },
    },
  },
  {
    operation: 'get_url',
    displayName: 'Get Presigned URL',
    description: 'Generate presigned URL for temporary access',
    parameters: {
      key: { type: 'string', required: true, description: 'Object key (path)' },
      expiresIn: { type: 'number', required: false, default: 3600, description: 'URL expiration (seconds)' },
    },
  },
];

// FTP Connector Actions
const FTP_ACTIONS: ActionDefinition[] = [
  {
    operation: 'upload',
    displayName: 'Upload File',
    description: 'Upload file to FTP server',
    parameters: {
      remotePath: { type: 'string', required: true, description: 'Remote file path' },
      content: { type: 'string', required: true, description: 'File content' },
    },
  },
  {
    operation: 'download',
    displayName: 'Download File',
    description: 'Download file from FTP server',
    parameters: {
      remotePath: { type: 'string', required: true, description: 'Remote file path' },
    },
  },
  {
    operation: 'list',
    displayName: 'List Directory',
    description: 'List files in directory',
    parameters: {
      remotePath: { type: 'string', required: false, default: '/', description: 'Directory path' },
    },
  },
  {
    operation: 'delete',
    displayName: 'Delete File',
    description: 'Delete file from FTP server',
    parameters: {
      remotePath: { type: 'string', required: true, description: 'Remote file path' },
    },
  },
  {
    operation: 'mkdir',
    displayName: 'Create Directory',
    description: 'Create directory on FTP server',
    parameters: {
      remotePath: { type: 'string', required: true, description: 'Directory path' },
    },
  },
  {
    operation: 'exists',
    displayName: 'File Exists',
    description: 'Check if file exists',
    parameters: {
      remotePath: { type: 'string', required: true, description: 'Remote file path' },
    },
  },
];

export class PredefinedConnectorActionsService {
  /**
   * Initialize predefined actions for a connector
   */
  async initializeForConnector(connectorId: number): Promise<number> {
    try {
      const connector = await prisma.connector.findUnique({
        where: { id: connectorId },
      });

      if (!connector) {
        throw new Error(`Connector ${connectorId} not found`);
      }

      const actions = this.getActionsForType(connector.connectorType);
      logger.info(`Initializing ${actions.length} predefined actions for ${connector.connectorType} connector`);

      let created = 0;
      for (const actionDef of actions) {
        await this.createOrUpdateConnectorAction(connectorId, actionDef);
        created++;
      }

      logger.info(`Created ${created} predefined actions for connector ${connectorId}`);
      return created;
    } catch (error: any) {
      logger.error('Error initializing predefined connector actions:', error);
      throw error;
    }
  }

  /**
   * Get action definitions for connector type
   */
  private getActionsForType(connectorType: string): ActionDefinition[] {
    switch (connectorType) {
      case 'database':
        return DATABASE_ACTIONS;
      case 'file':
      case 'filesystem':
      case 'local_file':
        return FILE_ACTIONS;
      case 's3':
        return S3_ACTIONS;
      case 'ftp':
      case 'sftp':
        return FTP_ACTIONS;
      default:
        logger.warn(`No predefined actions for connector type: ${connectorType}`);
        return [];
    }
  }

  /**
   * Create or update connector action
   */
  private async createOrUpdateConnectorAction(connectorId: number, actionDef: ActionDefinition): Promise<any> {
    try {
      const existing = await prisma.connectorAction.findFirst({
        where: {
          connectorId,
          operation: actionDef.operation,
        },
      });

      if (existing) {
        return await prisma.connectorAction.update({
          where: { id: existing.id },
          data: {
            displayName: actionDef.displayName,
            description: actionDef.description,
            parameters: actionDef.parameters as any,
          },
        });
      } else {
        return await prisma.connectorAction.create({
          data: {
            connectorId,
            operation: actionDef.operation,
            displayName: actionDef.displayName,
            description: actionDef.description,
            parameters: actionDef.parameters as any,
          },
        });
      }
    } catch (error: any) {
      logger.error(`Error creating connector action ${actionDef.operation}:`, error);
      throw error;
    }
  }
}

export default new PredefinedConnectorActionsService();

