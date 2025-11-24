import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import dbExplorerService from '../services/dbExplorer.service';
import loggingService from '../services/logging.service';
import logger from '../utils/logger';
import { getClientIp, getUserAgent } from '../utils/helpers';

/**
 * Create an index
 */
export const createIndex = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, name, columns, isUnique } = req.body;

    if (!schemaName || !tableName || !name || !columns || columns.length === 0) {
      return res.status(400).json({ error: 'Schema name, table name, index name, and columns are required' });
    }

    // Build CREATE INDEX statement
    const columnList = columns.map((col: string) => `"${col}"`).join(', ');
    const ddl = `CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX "${name}" ON "${schemaName}"."${tableName}" (${columnList});`;

    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.create_index',
      actionDescription: `Created index ${name} on table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: `Index "${name}" created successfully`,
      ddl,
    });
  } catch (error: any) {
    logger.error('Create index error:', error);
    res.status(500).json({ error: error.message || 'Failed to create index' });
  }
};

/**
 * Drop an index
 */
export const dropIndex = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, indexName, cascade } = req.body;

    if (!schemaName || !indexName) {
      return res.status(400).json({ error: 'Schema name and index name are required' });
    }

    const ddl = `DROP INDEX "${schemaName}"."${indexName}"${cascade ? ' CASCADE' : ''};`;

    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.drop_index',
      actionDescription: `Dropped index: ${schemaName}.${indexName}${cascade ? ' (CASCADE)' : ''}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: `Index "${indexName}" dropped successfully`,
    });
  } catch (error: any) {
    logger.error('Drop index error:', error);
    res.status(500).json({ error: error.message || 'Failed to drop index' });
  }
};

