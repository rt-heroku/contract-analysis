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
          continue;
        }

        // Create new connector
        await prisma.connector.create({
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

