import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import dbExplorerService from '../services/dbExplorer.service';
import loggingService from '../services/logging.service';
import logger from '../utils/logger';
import { getClientIp, getUserAgent } from '../utils/helpers';

/**
 * Insert a new row into a table
 */
export const insertRow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, data } = req.body;

    if (!schemaName || !tableName || !data) {
      return res.status(400).json({ error: 'Schema name, table name, and data are required' });
    }

    // Build INSERT statement
    const columns = Object.keys(data);
    const values = Object.values(data);

    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `INSERT INTO "${schemaName}"."${tableName}" (${columnNames}) VALUES (${placeholders}) RETURNING *;`;

    const result = await dbExplorerService.executeQuery(connectorId, userId, query, values);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.insert_row',
      actionDescription: `Inserted row into table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: 'Row inserted successfully',
      row: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Insert row error:', error);
    res.status(500).json({ error: error.message || 'Failed to insert row' });
  }
};

/**
 * Update existing row(s)
 */
export const updateRows = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, data, where } = req.body;

    if (!schemaName || !tableName || !data || !where) {
      return res.status(400).json({ error: 'Schema name, table name, data, and where clause are required' });
    }

    // Build UPDATE statement
    const updates = Object.keys(data);
    const values = Object.values(data);

    let paramIndex = 1;
    const setClause = updates.map(col => `"${col}" = $${paramIndex++}`).join(', ');

    // Build WHERE clause
    const whereClauses: string[] = [];
    const whereValues: any[] = [];

    Object.entries(where).forEach(([col, val]) => {
      whereClauses.push(`"${col}" = $${paramIndex++}`);
      whereValues.push(val);
    });

    const query = `UPDATE "${schemaName}"."${tableName}" SET ${setClause} WHERE ${whereClauses.join(' AND ')} RETURNING *;`;
    const allValues = [...values, ...whereValues];

    const result = await dbExplorerService.executeQuery(connectorId, userId, query, allValues);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.update_rows',
      actionDescription: `Updated ${result.rowCount} row(s) in table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: `${result.rowCount} row(s) updated successfully`,
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error: any) {
    logger.error('Update rows error:', error);
    res.status(500).json({ error: error.message || 'Failed to update rows' });
  }
};

/**
 * Delete row(s) from a table
 */
export const deleteRows = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, where } = req.body;

    if (!schemaName || !tableName || !where) {
      return res.status(400).json({ error: 'Schema name, table name, and where clause are required' });
    }

    // Build DELETE statement
    let paramIndex = 1;
    const whereClauses: string[] = [];
    const values: any[] = [];

    Object.entries(where).forEach(([col, val]) => {
      whereClauses.push(`"${col}" = $${paramIndex++}`);
      values.push(val);
    });

    const query = `DELETE FROM "${schemaName}"."${tableName}" WHERE ${whereClauses.join(' AND ')} RETURNING *;`;

    const result = await dbExplorerService.executeQuery(connectorId, userId, query, values);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.delete_rows',
      actionDescription: `Deleted ${result.rowCount} row(s) from table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: `${result.rowCount} row(s) deleted successfully`,
      rowCount: result.rowCount,
    });
  } catch (error: any) {
    logger.error('Delete rows error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete rows' });
  }
};

/**
 * Bulk insert multiple rows
 */
export const bulkInsert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, rows } = req.body;

    if (!schemaName || !tableName || !rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Schema name, table name, and rows array are required' });
    }

    // Validate all rows have same columns
    const firstRowKeys = Object.keys(rows[0]);
    const allSameKeys = rows.every(row => 
      Object.keys(row).length === firstRowKeys.length &&
      Object.keys(row).every(key => firstRowKeys.includes(key))
    );

    if (!allSameKeys) {
      return res.status(400).json({ error: 'All rows must have the same columns' });
    }

    // Build bulk INSERT statement
    const columns = firstRowKeys;
    const columnNames = columns.map(col => `"${col}"`).join(', ');

    let paramIndex = 1;
    const values: any[] = [];
    const valueGroups: string[] = [];

    rows.forEach(row => {
      const rowValues = columns.map(col => row[col]);
      values.push(...rowValues);
      
      const placeholders = columns.map(() => `$${paramIndex++}`).join(', ');
      valueGroups.push(`(${placeholders})`);
    });

    const query = `INSERT INTO "${schemaName}"."${tableName}" (${columnNames}) VALUES ${valueGroups.join(', ')} RETURNING *;`;

    const result = await dbExplorerService.executeQuery(connectorId, userId, query, values);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.bulk_insert',
      actionDescription: `Bulk inserted ${rows.length} row(s) into table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: `${rows.length} row(s) inserted successfully`,
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error: any) {
    logger.error('Bulk insert error:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk insert rows' });
  }
};

/**
 * Bulk delete multiple rows
 */
export const bulkDelete = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName, whereConditions } = req.body;

    if (!schemaName || !tableName || !whereConditions || !Array.isArray(whereConditions) || whereConditions.length === 0) {
      return res.status(400).json({ error: 'Schema name, table name, and where conditions array are required' });
    }

    // Build DELETE statement with OR conditions
    let paramIndex = 1;
    const orClauses: string[] = [];
    const values: any[] = [];

    whereConditions.forEach(whereClause => {
      const andClauses: string[] = [];
      Object.entries(whereClause).forEach(([col, val]) => {
        andClauses.push(`"${col}" = $${paramIndex++}`);
        values.push(val);
      });
      if (andClauses.length > 0) {
        orClauses.push(`(${andClauses.join(' AND ')})`);
      }
    });

    const query = `DELETE FROM "${schemaName}"."${tableName}" WHERE ${orClauses.join(' OR ')};`;

    const result = await dbExplorerService.executeQuery(connectorId, userId, query, values);

    // Log activity
    await loggingService.logActivity({
      userId,
      actionType: 'database.bulk_delete',
      actionDescription: `Bulk deleted ${result.rowCount} row(s) from table: ${schemaName}.${tableName}`,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    res.json({
      success: true,
      message: `${result.rowCount} row(s) deleted successfully`,
      rowCount: result.rowCount,
    });
  } catch (error: any) {
    logger.error('Bulk delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk delete rows' });
  }
};

