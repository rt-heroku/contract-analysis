import prisma from '../config/database';
import logger from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export const autoConnectorService = {
  /**
   * Detect and create connectors from environment variables
   * This runs on system startup
   */
  async detectAndCreateConnectors(systemUserId: number): Promise<void> {
    try {
      logger.info('Starting auto-detection of connectors from environment variables...');

      await this.detectDatabaseConnector(systemUserId);
      await this.detectRedisConnector(systemUserId);
      await this.detectS3Connector(systemUserId);
      await this.detectFileConnector(systemUserId);

      logger.info('Auto-detection of connectors completed');
    } catch (error: any) {
      logger.error('Error in auto-connector detection:', error);
      // Don't throw - we want the app to start even if auto-detection fails
    }
  },

  async detectDatabaseConnector(systemUserId: number): Promise<void> {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        logger.info('No DATABASE_URL found, skipping database connector');
        return;
      }

      // Parse database URL
      const dbName = this.extractDatabaseName(databaseUrl);
      const dbHost = this.extractDatabaseHost(databaseUrl);

      // Check if connector already exists
      const existing = await prisma.connector.findFirst({
        where: {
          connectorType: 'database',
          isAutoCreated: true,
          name: `Database - ${dbName}`,
        },
      });

      if (existing) {
        logger.info(`Database connector already exists: ${existing.name}`);
        return;
      }

      // Create connector (no sensitive info displayed)
      const connector = await prisma.connector.create({
        data: {
          name: `Database - ${dbName}`,
          connectorType: 'database',
          config: {
            host: dbHost,
            database: dbName,
            // Connection string stored but not exposed in UI
            _connectionString: databaseUrl,
          },
          isAutoCreated: true,
          isActive: true,
          createdBy: systemUserId,
        },
      });

      logger.info(`Auto-created database connector: ${connector.name} (ID: ${connector.id})`);
    } catch (error: any) {
      logger.error('Error detecting database connector:', error);
    }
  },

  async detectRedisConnector(systemUserId: number): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
      if (!redisUrl) {
        logger.info('No REDIS_URL found, skipping Redis connector');
        return;
      }

      // Parse Redis URL
      const redisHost = this.extractRedisHost(redisUrl);

      // Check if connector already exists
      const existing = await prisma.connector.findFirst({
        where: {
          connectorType: 'redis',
          isAutoCreated: true,
        },
      });

      if (existing) {
        logger.info(`Redis connector already exists: ${existing.name}`);
        return;
      }

      // Create connector
      const connector = await prisma.connector.create({
        data: {
          name: `Redis - ${redisHost}`,
          connectorType: 'redis',
          config: {
            host: redisHost,
            // Connection string stored but not exposed in UI
            _connectionString: redisUrl,
          },
          isAutoCreated: true,
          isActive: true,
          createdBy: systemUserId,
        },
      });

      logger.info(`Auto-created Redis connector: ${connector.name} (ID: ${connector.id})`);
    } catch (error: any) {
      logger.error('Error detecting Redis connector:', error);
    }
  },

  async detectS3Connector(systemUserId: number): Promise<void> {
    try {
      const s3AccessKey = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
      const s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
      const s3Region = process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
      const s3Bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;

      if (!s3AccessKey || !s3SecretKey) {
        logger.info('No S3 credentials found, skipping S3 connector');
        return;
      }

      // Check if connector already exists
      const existing = await prisma.connector.findFirst({
        where: {
          connectorType: 's3',
          isAutoCreated: true,
        },
      });

      if (existing) {
        logger.info(`S3 connector already exists: ${existing.name}`);
        return;
      }

      // Create connector
      const connector = await prisma.connector.create({
        data: {
          name: `S3 - ${s3Region}`,
          connectorType: 's3',
          config: {
            region: s3Region,
            bucket: s3Bucket,
            // Credentials stored but not exposed in UI
            _accessKeyId: s3AccessKey,
            _secretAccessKey: s3SecretKey,
          },
          isAutoCreated: true,
          isActive: true,
          createdBy: systemUserId,
        },
      });

      logger.info(`Auto-created S3 connector: ${connector.name} (ID: ${connector.id})`);
    } catch (error: any) {
      logger.error('Error detecting S3 connector:', error);
    }
  },

  async detectFileConnector(systemUserId: number): Promise<void> {
    try {
      // Check if temp file connector already exists
      const existing = await prisma.connector.findFirst({
        where: {
          connectorType: 'file',
          isAutoCreated: true,
        },
      });

      if (existing) {
        logger.info(`File connector already exists: ${existing.name}`);
        return;
      }

      // Create temp folder with timestamp
      const tempBasePath = path.join(process.cwd(), 'temp');
      const tempFolderName = `files_${Date.now()}`;
      const tempFolderPath = path.join(tempBasePath, tempFolderName);

      // Ensure temp directory exists
      await fs.mkdir(tempFolderPath, { recursive: true });

      // Create connector
      const connector = await prisma.connector.create({
        data: {
          name: `File System (Temp) - ${tempFolderName}`,
          connectorType: 'file',
          config: {
            basePath: tempFolderPath,
            note: 'This is a temporary file system connector. Files will be lost on restart.',
          },
          isAutoCreated: true,
          isActive: true,
          createdBy: systemUserId,
        },
      });

      logger.info(`Auto-created file connector: ${connector.name} (ID: ${connector.id})`);
      logger.warn(`Temp folder created at: ${tempFolderPath} - Files will be lost on restart`);
    } catch (error: any) {
      logger.error('Error detecting file connector:', error);
    }
  },

  // Helper functions to parse connection strings
  extractDatabaseName(dbUrl: string): string {
    try {
      const url = new URL(dbUrl);
      const pathname = url.pathname.substring(1); // Remove leading slash
      return pathname.split('?')[0] || 'database';
    } catch {
      return 'database';
    }
  },

  extractDatabaseHost(dbUrl: string): string {
    try {
      const url = new URL(dbUrl);
      return url.hostname || 'localhost';
    } catch {
      return 'localhost';
    }
  },

  extractRedisHost(redisUrl: string): string {
    try {
      const url = new URL(redisUrl);
      return url.hostname || 'localhost';
    } catch {
      return 'localhost';
    }
  },
};

export default autoConnectorService;

