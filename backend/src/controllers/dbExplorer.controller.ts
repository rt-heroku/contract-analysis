import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import dbExplorerService from '../services/dbExplorer.service';
import prisma from '../config/database';
import logger from '../utils/logger';

/**
 * Test database connection
 */
export const testConnection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;

    const result = await dbExplorerService.testConnection({
      host,
      port: parseInt(port),
      database,
      user,
      password,
      ssl: ssl || false,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to test connection',
    });
  }
};

/**
 * Get all schemas
 */
export const getSchemas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;

    const schemas = await dbExplorerService.getSchemas(connectorId, userId);

    res.json(schemas);
  } catch (error: any) {
    logger.error('Get schemas error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch schemas' });
  }
};

/**
 * Get tables in schema
 */
export const getTables = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const userId = req.user!.id;

    const tables = await dbExplorerService.getTables(connectorId, userId, schemaName);

    res.json({ tables });
  } catch (error: any) {
    logger.error('Get tables error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tables' });
  }
};

/**
 * Get columns for a table
 */
export const getColumns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const tableName = req.params.tableName;
    const userId = req.user!.id;

    const columns = await dbExplorerService.getColumns(connectorId, userId, schemaName, tableName);

    res.json({ columns });
  } catch (error: any) {
    logger.error('Get columns error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch columns' });
  }
};

/**
 * Get indexes for a table
 */
export const getIndexes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const tableName = req.params.tableName;
    const userId = req.user!.id;

    const indexes = await dbExplorerService.getIndexes(connectorId, userId, schemaName, tableName);

    res.json({ indexes });
  } catch (error: any) {
    logger.error('Get indexes error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch indexes' });
  }
};

/**
 * Get foreign keys for a table
 */
export const getForeignKeys = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const tableName = req.params.tableName;
    const userId = req.user!.id;

    const foreignKeys = await dbExplorerService.getForeignKeys(connectorId, userId, schemaName, tableName);

    res.json({ foreignKeys });
  } catch (error: any) {
    logger.error('Get foreign keys error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch foreign keys' });
  }
};

/**
 * Get functions in schema
 */
export const getFunctions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const userId = req.user!.id;

    const functions = await dbExplorerService.getFunctions(connectorId, userId, schemaName);

    res.json({ functions });
  } catch (error: any) {
    logger.error('Get functions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch functions' });
  }
};

/**
 * Get triggers for a table
 */
export const getTriggers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const tableName = req.params.tableName;
    const userId = req.user!.id;

    const triggers = await dbExplorerService.getTriggers(connectorId, userId, schemaName, tableName);

    res.json({ triggers });
  } catch (error: any) {
    logger.error('Get triggers error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch triggers' });
  }
};

/**
 * Get sequences in schema
 */
export const getSequences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const userId = req.user!.id;

    const sequences = await dbExplorerService.getSequences(connectorId, userId, schemaName);

    res.json({ sequences });
  } catch (error: any) {
    logger.error('Get sequences error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sequences' });
  }
};

/**
 * Get materialized views in schema
 */
export const getMaterializedViews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const userId = req.user!.id;

    const views = await dbExplorerService.getMaterializedViews(connectorId, userId, schemaName);

    res.json({ views });
  } catch (error: any) {
    logger.error('Get materialized views error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch materialized views' });
  }
};

/**
 * Get table DDL
 */
export const getTableDDL = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const tableName = req.params.tableName;
    const userId = req.user!.id;

    const ddl = await dbExplorerService.getTableDDL(connectorId, userId, schemaName, tableName);

    res.json({ ddl });
  } catch (error: any) {
    logger.error('Get table DDL error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch table DDL' });
  }
};

/**
 * Execute SQL query
 */
export const executeQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const { query, params, timeout, maxRows, saveToHistory, queryName } = req.body;
    const userId = req.user!.id;

    // Execute query
    const result = await dbExplorerService.executeQuery(
      connectorId,
      userId,
      query,
      params || [],
      { timeout, maxRows }
    );

    // Save to history if requested
    if (saveToHistory) {
      await prisma.dbQuery.create({
        data: {
          userId,
          connectorId,
          queryText: query,
          queryName: queryName || null,
          executionTime: result.executionTime,
          rowsAffected: result.rowCount,
          status: 'success',
        },
      });
    }

    res.json(result);
  } catch (error: any) {
    logger.error('Execute query error:', error);

    // Log failed query if saveToHistory was requested
    if (req.body.saveToHistory) {
      try {
        await prisma.dbQuery.create({
          data: {
            userId: req.user!.id,
            connectorId: parseInt(req.params.connectorId),
            queryText: req.body.query,
            queryName: req.body.queryName || null,
            status: 'error',
            errorMessage: error.message,
          },
        });
      } catch (e) {
        logger.error('Failed to log query error:', e);
      }
    }

    res.status(500).json({ error: error.message || 'Failed to execute query' });
  }
};

/**
 * Get query history
 */
export const getQueryHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (connectorId) {
      where.connectorId = connectorId;
    }

    const [queries, total] = await Promise.all([
      prisma.dbQuery.findMany({
        where,
        include: {
          connector: {
            select: {
              id: true,
              name: true,
              connectorType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dbQuery.count({ where }),
    ]);

    res.json({
      queries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Get query history error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch query history' });
  }
};

/**
 * Save query as favorite
 */
export const saveFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { connectorId, queryText, queryName, description, tags } = req.body;

    const query = await prisma.dbQuery.create({
      data: {
        userId,
        connectorId,
        queryText,
        queryName,
        description,
        isFavorite: true,
        tags: tags || [],
      },
    });

    res.json({ query });
  } catch (error: any) {
    logger.error('Save favorite error:', error);
    res.status(500).json({ error: error.message || 'Failed to save favorite' });
  }
};

/**
 * Get favorite queries
 */
export const getFavorites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const connectorId = req.query.connectorId ? parseInt(req.query.connectorId as string) : undefined;

    const where: any = { userId, isFavorite: true };
    if (connectorId) {
      where.connectorId = connectorId;
    }

    const queries = await prisma.dbQuery.findMany({
      where,
      include: {
        connector: {
          select: {
            id: true,
            name: true,
            connectorType: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ queries });
  } catch (error: any) {
    logger.error('Get favorites error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch favorites' });
  }
};

/**
 * Update favorite query
 */
export const updateFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queryId = parseInt(req.params.queryId);
    const userId = req.user!.id;
    const { queryText, queryName, description, tags, isFavorite } = req.body;

    // Check ownership
    const existing = await prisma.dbQuery.findUnique({
      where: { id: queryId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Query not found' });
    }

    const query = await prisma.dbQuery.update({
      where: { id: queryId },
      data: {
        queryText,
        queryName,
        description,
        tags,
        isFavorite,
      },
    });

    res.json({ query });
  } catch (error: any) {
    logger.error('Update favorite error:', error);
    res.status(500).json({ error: error.message || 'Failed to update favorite' });
  }
};

/**
 * Delete query/favorite
 */
export const deleteQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queryId = parseInt(req.params.queryId);
    const userId = req.user!.id;

    // Check ownership
    const existing = await prisma.dbQuery.findUnique({
      where: { id: queryId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Query not found' });
    }

    await prisma.dbQuery.delete({
      where: { id: queryId },
    });

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Delete query error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete query' });
  }
};

/**
 * Get table data with pagination
 */
export const getTableData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const schemaName = req.params.schemaName;
    const tableName = req.params.tableName;
    const userId = req.user!.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const sortColumn = req.query.sortColumn as string;
    const sortOrder = (req.query.sortOrder as string) || 'ASC';
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

    // Build WHERE clause from filters
    let whereClause = '';
    const filterParams: any[] = [];
    let paramIndex = 1;

    if (Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([column, value]) => {
        filterParams.push(`%${value}%`);
        return `"${column}"::text ILIKE $${paramIndex++}`;
      });
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Build ORDER BY clause
    let orderClause = '';
    if (sortColumn) {
      orderClause = `ORDER BY "${sortColumn}" ${sortOrder}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM "${schemaName}"."${tableName}" ${whereClause}`;
    const countResult = await dbExplorerService.executeQuery(connectorId, userId, countQuery, filterParams);
    const total = parseInt(countResult.rows[0].count);

    // Get data
    filterParams.push(limit, offset);
    const dataQuery = `SELECT * FROM "${schemaName}"."${tableName}" ${whereClause} ${orderClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const dataResult = await dbExplorerService.executeQuery(connectorId, userId, dataQuery, filterParams);

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Get table data error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch table data' });
  }
};

/**
 * Get constraints for a table
 */
export const getConstraints = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName } = req.params;

    const constraints = await dbExplorerService.getConstraints(connectorId, userId, schemaName, tableName);

    res.json(constraints);
  } catch (error: any) {
    logger.error('Get constraints error:', error);
    res.status(500).json({ error: error.message || 'Failed to get constraints' });
  }
};

/**
 * Get policies for a table
 */
export const getPolicies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName } = req.params;

    const policies = await dbExplorerService.getPolicies(connectorId, userId, schemaName, tableName);

    res.json(policies);
  } catch (error: any) {
    logger.error('Get policies error:', error);
    res.status(500).json({ error: error.message || 'Failed to get policies' });
  }
};

/**
 * Get rules for a table
 */
export const getRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName, tableName } = req.params;

    const rules = await dbExplorerService.getRules(connectorId, userId, schemaName, tableName);

    res.json(rules);
  } catch (error: any) {
    logger.error('Get rules error:', error);
    res.status(500).json({ error: error.message || 'Failed to get rules' });
  }
};

/**
 * Get all tables with relationships for ERD
 */
export const getSchemaERD = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { schemaName } = req.params;

    const erdData = await dbExplorerService.getSchemaERD(connectorId, userId, schemaName);

    res.json(erdData);
  } catch (error: any) {
    logger.error('Get schema ERD error:', error);
    res.status(500).json({ error: error.message || 'Failed to get schema ERD' });
  }
};

/**
 * Get AI connector configuration (for debugging)
 */
export const getAIConnectorInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get the setting
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'db_explorer_ai_connector_id' },
    });

    if (!setting || !setting.settingValue) {
      return res.json({ 
        configured: false, 
        message: 'No AI connector configured in system settings' 
      });
    }

    const connectorId = parseInt(setting.settingValue);
    const connector = await prisma.connector.findFirst({
      where: {
        id: connectorId,
        connectorType: 'inference',
      },
    });

    if (!connector) {
      return res.json({ 
        configured: false, 
        message: 'Configured connector not found',
        settingValue: setting.settingValue 
      });
    }

    const config = connector.config as any;

    res.json({
      configured: true,
      connector: {
        id: connector.id,
        name: connector.name,
        isActive: connector.isActive,
        modelId: config.modelId,
        baseUrl: config.baseUrl,
        hasApiKey: !!config.apiKey,
      },
    });
  } catch (error: any) {
    logger.error('Get AI connector info error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI connector info' });
  }
};

/**
 * Generate SQL using AI
 */
export const generateAISQL = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;
    const { prompt, schemaName = 'public' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await dbExplorerService.generateAISQL(connectorId, userId, schemaName, prompt);

    res.json(result);
  } catch (error: any) {
    logger.error('AI SQL generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate SQL' });
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const userId = req.user!.id;

    const stats = await dbExplorerService.getDatabaseStats(connectorId, userId);

    res.json(stats);
  } catch (error: any) {
    logger.error('Get database stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch database stats' });
  }
};

/**
 * Get database connectors
 */
export const getConnectors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const connectors = await prisma.connector.findMany({
      where: {
        connectorType: 'database',
        isActive: true,
        OR: [
          { createdBy: userId },
          { isAutoCreated: true }, // Include auto-detected databases
        ],
      },
      select: {
        id: true,
        name: true,
        connectorType: true,
        version: true,
        iconUrl: true,
        isAutoCreated: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isAutoCreated: 'desc' }, // Auto-created first
        { name: 'asc' },
      ],
    });

    res.json({ connectors });
  } catch (error: any) {
    logger.error('Get connectors error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch connectors' });
  }
};

/**
 * Explain query (EXPLAIN ANALYZE)
 */
export const explainQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const connectorId = parseInt(req.params.connectorId);
    const { query } = req.body;
    const userId = req.user!.id;

    const explainQuery = `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) ${query}`;
    const result = await dbExplorerService.executeQuery(connectorId, userId, explainQuery);

    res.json({ explain: result.rows[0]['QUERY PLAN'] });
  } catch (error: any) {
    logger.error('Explain query error:', error);
    res.status(500).json({ error: error.message || 'Failed to explain query' });
  }
};

