import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import dbExplorerService from '../services/dbExplorer.service';
import loggingService from '../services/logging.service';
import logger from '../utils/logger';
import { getClientIp, getUserAgent } from '../utils/helpers';

/**
 * Create a new table
 */
export const createTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, columns, primaryKey, indexes, foreignKeys } = req.body;

    // Validate input
    if (!schemaName || !tableName || !columns || columns.length === 0) {
      return res.status(400).json({ error: 'Schema name, table name, and columns are required' });
    }

    // Build CREATE TABLE DDL
    let ddl = `CREATE TABLE "${schemaName}"."${tableName}" (\n`;

    // Add columns
    const columnDefs = columns.map((col: any) => {
      let def = `  "${col.name}" ${col.dataType}`;
      if (col.length) def += `(${col.length})`;
      if (col.precision && col.scale) def += `(${col.precision}, ${col.scale})`;
      if (col.isNotNull) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      if (col.isUnique) def += ' UNIQUE';
      return def;
    });

    ddl += columnDefs.join(',\n');

    // Add primary key
    if (primaryKey && primaryKey.length > 0) {
      ddl += `,\n  PRIMARY KEY (${primaryKey.map((col: string) => `"${col}"`).join(', ')})`;
    }

    ddl += '\n);';

    // Execute CREATE TABLE
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Create indexes if specified
    if (indexes && indexes.length > 0) {
      for (const index of indexes) {
        const indexDDL = `CREATE ${index.isUnique ? 'UNIQUE ' : ''}INDEX "${index.name}" ON "${schemaName}"."${tableName}" (${index.columns.map((col: string) => `"${col}"`).join(', ')});`;
        await dbExplorerService.executeQuery(connectorId, userId, indexDDL);
      }
    }

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.create_table',
      actionDescription: `Created table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Table "${schemaName}"."${tableName}" created successfully`,
      ddl 
    });
  } catch (error: any) {
    logger.error('Create table error:', error);
    res.status(500).json({ error: error.message || 'Failed to create table' });
  }
};

/**
 * Drop a table
 */
export const dropTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, cascade } = req.body;

    if (!schemaName || !tableName) {
      return res.status(400).json({ error: 'Schema name and table name are required' });
    }

    const ddl = `DROP TABLE "${schemaName}"."${tableName}"${cascade ? ' CASCADE' : ''};`;
    
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.drop_table',
      actionDescription: `Dropped table: ${schemaName}.${tableName}${cascade ? ' (CASCADE)' : ''}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Table "${schemaName}"."${tableName}" dropped successfully` 
    });
  } catch (error: any) {
    logger.error('Drop table error:', error);
    res.status(500).json({ error: error.message || 'Failed to drop table' });
  }
};

/**
 * Truncate a table
 */
export const truncateTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, cascade } = req.body;

    if (!schemaName || !tableName) {
      return res.status(400).json({ error: 'Schema name and table name are required' });
    }

    const ddl = `TRUNCATE TABLE "${schemaName}"."${tableName}"${cascade ? ' CASCADE' : ''};`;
    
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.truncate_table',
      actionDescription: `Truncated table: ${schemaName}.${tableName}${cascade ? ' (CASCADE)' : ''}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Table "${schemaName}"."${tableName}" truncated successfully` 
    });
  } catch (error: any) {
    logger.error('Truncate table error:', error);
    res.status(500).json({ error: error.message || 'Failed to truncate table' });
  }
};

/**
 * Rename a table
 */
export const renameTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, newTableName } = req.body;

    if (!schemaName || !tableName || !newTableName) {
      return res.status(400).json({ error: 'Schema name, current table name, and new table name are required' });
    }

    const ddl = `ALTER TABLE "${schemaName}"."${tableName}" RENAME TO "${newTableName}";`;
    
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.rename_table',
      actionDescription: `Renamed table: ${schemaName}.${tableName} to ${newTableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Table renamed from "${tableName}" to "${newTableName}" successfully` 
    });
  } catch (error: any) {
    logger.error('Rename table error:', error);
    res.status(500).json({ error: error.message || 'Failed to rename table' });
  }
};

/**
 * Alter table - add column
 */
export const addColumn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, column } = req.body;

    if (!schemaName || !tableName || !column || !column.name || !column.dataType) {
      return res.status(400).json({ error: 'Schema name, table name, and column details are required' });
    }

    let columnDef = `"${column.name}" ${column.dataType}`;
    if (column.length) columnDef += `(${column.length})`;
    if (column.precision && column.scale) columnDef += `(${column.precision}, ${column.scale})`;
    if (column.isNotNull) columnDef += ' NOT NULL';
    if (column.defaultValue) columnDef += ` DEFAULT ${column.defaultValue}`;
    if (column.isUnique) columnDef += ' UNIQUE';

    const ddl = `ALTER TABLE "${schemaName}"."${tableName}" ADD COLUMN ${columnDef};`;
    
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.add_column',
      actionDescription: `Added column ${column.name} to table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Column "${column.name}" added successfully`,
      ddl 
    });
  } catch (error: any) {
    logger.error('Add column error:', error);
    res.status(500).json({ error: error.message || 'Failed to add column' });
  }
};

/**
 * Alter table - drop column
 */
export const dropColumn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, columnName, cascade } = req.body;

    if (!schemaName || !tableName || !columnName) {
      return res.status(400).json({ error: 'Schema name, table name, and column name are required' });
    }

    const ddl = `ALTER TABLE "${schemaName}"."${tableName}" DROP COLUMN "${columnName}"${cascade ? ' CASCADE' : ''};`;
    
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.drop_column',
      actionDescription: `Dropped column ${columnName} from table: ${schemaName}.${tableName}${cascade ? ' (CASCADE)' : ''}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Column "${columnName}" dropped successfully` 
    });
  } catch (error: any) {
    logger.error('Drop column error:', error);
    res.status(500).json({ error: error.message || 'Failed to drop column' });
  }
};

/**
 * Copy table structure (no data)
 */
export const copyTableStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, newTableName } = req.body;

    if (!schemaName || !tableName || !newTableName) {
      return res.status(400).json({ error: 'Schema name, source table name, and new table name are required' });
    }

    const ddl = `CREATE TABLE "${schemaName}"."${newTableName}" (LIKE "${schemaName}"."${tableName}" INCLUDING ALL);`;
    
    await dbExplorerService.executeQuery(connectorId, userId, ddl);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.copy_table_structure',
      actionDescription: `Copied structure from ${schemaName}.${tableName} to ${newTableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Table structure copied to "${newTableName}" successfully` 
    });
  } catch (error: any) {
    logger.error('Copy table structure error:', error);
    res.status(500).json({ error: error.message || 'Failed to copy table structure' });
  }
};

/**
 * Duplicate table (structure + data)
 */
export const duplicateTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, newTableName } = req.body;

    if (!schemaName || !tableName || !newTableName) {
      return res.status(400).json({ error: 'Schema name, source table name, and new table name are required' });
    }

    // Copy structure
    const ddl1 = `CREATE TABLE "${schemaName}"."${newTableName}" (LIKE "${schemaName}"."${tableName}" INCLUDING ALL);`;
    await dbExplorerService.executeQuery(connectorId, userId, ddl1);

    // Copy data
    const ddl2 = `INSERT INTO "${schemaName}"."${newTableName}" SELECT * FROM "${schemaName}"."${tableName}";`;
    await dbExplorerService.executeQuery(connectorId, userId, ddl2);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.duplicate_table',
      actionDescription: `Duplicated table ${schemaName}.${tableName} to ${newTableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({ 
      success: true, 
      message: `Table duplicated to "${newTableName}" successfully` 
    });
  } catch (error: any) {
    logger.error('Duplicate table error:', error);
    res.status(500).json({ error: error.message || 'Failed to duplicate table' });
  }
};

