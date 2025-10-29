import prisma from '../config/database';
import logger from './logger';

/**
 * Sync connector actions from connector_actions table to actions table
 * This makes connector actions visible in the Actions library
 */
export async function syncConnectorActions() {
  try {
    logger.info('Syncing connector actions to actions table...');

    // Get all connector actions
    const connectorActions = await prisma.connectorAction.findMany({
      where: { isActive: true },
      include: {
        connector: {
          select: {
            id: true,
            name: true,
            connectorType: true,
            createdBy: true,
          },
        },
      },
    });

    logger.info(`Found ${connectorActions.length} connector actions to sync`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const connectorAction of connectorActions) {
      try {
        // Create unique action name: connector_type_operation
        const actionName = `${connectorAction.connector.connectorType}_${connectorAction.connectorId}_${connectorAction.operation}`
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');

        // Check if action already exists
        const existing = await prisma.action.findUnique({
          where: { name: actionName },
        });

        const actionData = {
          name: actionName,
          displayName: connectorAction.displayName,
          description: connectorAction.description || `${connectorAction.connector.name} - ${connectorAction.displayName}`,
          actionType: 'connector',
          category: getCategoryFromConnectorType(connectorAction.connector.connectorType),
          connectorId: connectorAction.connectorId,
          connectorOperation: connectorAction.operation,
          icon: getIconFromConnectorType(connectorAction.connector.connectorType),
          color: getColorFromConnectorType(connectorAction.connector.connectorType),
          configSchema: {
            type: 'object',
            properties: connectorAction.parameters || {},
          },
          inputSchema: {
            type: 'object',
            properties: typeof connectorAction.parameters === 'object' && connectorAction.parameters !== null
              ? (connectorAction.parameters as any)
              : {},
          },
          outputSchema: connectorAction.responses || {
            type: 'object',
            properties: {
              data: { type: 'object' },
              status: { type: 'number' },
            },
          },
          executorType: 'connector',
          executorConfig: {
            connectorId: connectorAction.connectorId,
            operation: connectorAction.operation,
            method: connectorAction.method,
            path: connectorAction.path,
            parameters: connectorAction.parameters,
            requestBody: connectorAction.requestBody,
          },
          isSystem: false,
          isActive: connectorAction.isActive,
          createdBy: connectorAction.connector.createdBy,
          sharedWith: [],
        };

        if (existing) {
          // Update existing action
          await prisma.action.update({
            where: { id: existing.id },
            data: actionData,
          });
          updated++;
          logger.debug(`Updated action: ${actionName}`);
        } else {
          // Create new action
          await prisma.action.create({
            data: actionData,
          });
          created++;
          logger.debug(`Created action: ${actionName}`);
        }
      } catch (error: any) {
        logger.error(`Error syncing connector action ${connectorAction.id}:`, error);
        skipped++;
      }
    }

    logger.info(`Connector actions sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);
    logger.info('✅ Connector actions are now visible in the Actions library');

    return { created, updated, skipped, total: connectorActions.length };
  } catch (error: any) {
    logger.error('Error syncing connector actions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getCategoryFromConnectorType(connectorType: string): string {
  const categoryMap: Record<string, string> = {
    rest: 'api',
    database: 'storage',
    s3: 'storage',
    ftp: 'storage',
    file: 'storage',
    redis: 'storage',
  };
  return categoryMap[connectorType] || 'custom';
}

function getIconFromConnectorType(connectorType: string): string {
  const iconMap: Record<string, string> = {
    rest: 'Network',
    database: 'Database',
    s3: 'Save',
    ftp: 'Upload',
    file: 'FileText',
    redis: 'Zap',
  };
  return iconMap[connectorType] || 'Plug';
}

function getColorFromConnectorType(connectorType: string): string {
  const colorMap: Record<string, string> = {
    rest: '#10b981',
    database: '#3b82f6',
    s3: '#f59e0b',
    ftp: '#8b5cf6',
    file: '#6366f1',
    redis: '#ef4444',
  };
  return colorMap[connectorType] || '#6b7280';
}

// Run if called directly
if (require.main === module) {
  syncConnectorActions();
}

export default syncConnectorActions;

