import { Pool, PoolClient, QueryResult } from 'pg';
import logger from '../utils/logger';
import prisma from '../config/database';

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number; // Max pool size
}

interface QueryExecutionResult {
  rows: any[];
  fields: any[];
  rowCount: number;
  executionTime: number;
  command: string;
}

interface SchemaInfo {
  schemas: string[];
}

interface TableInfo {
  tableName: string;
  schemaName: string;
  tableType: string; // 'BASE TABLE', 'VIEW', 'MATERIALIZED VIEW'
  rowCount?: number;
  tableSize?: string;
  description?: string;
}

interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string;
  maxLength?: number;
  numericPrecision?: number;
  numericScale?: number;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  description?: string;
}

interface IndexInfo {
  indexName: string;
  tableName: string;
  schemaName: string;
  indexType: string;
  isUnique: boolean;
  isPrimary: boolean;
  columns: string[];
  definition: string;
}

interface ForeignKeyInfo {
  constraintName: string;
  tableName: string;
  schemaName: string;
  columnName: string;
  referencedTableName: string;
  referencedSchemaName: string;
  referencedColumnName: string;
  onDelete: string;
  onUpdate: string;
}

interface FunctionInfo {
  functionName: string;
  schemaName: string;
  returnType: string;
  arguments: string;
  language: string;
  definition: string;
  description?: string;
}

interface TriggerInfo {
  triggerName: string;
  tableName: string;
  schemaName: string;
  eventManipulation: string;
  actionTiming: string;
  actionStatement: string;
}

interface SequenceInfo {
  sequenceName: string;
  schemaName: string;
  dataType: string;
  startValue: string;
  minValue: string;
  maxValue: string;
  incrementBy: string;
  lastValue?: string;
}

class DatabaseExplorerService {
  private pools: Map<string, Pool> = new Map();
  private activeQueries: Map<string, boolean> = new Map();

  /**
   * Create or get existing connection pool
   */
  async getPool(connectorId: number, userId: number): Promise<Pool> {
    const cacheKey = `${connectorId}-${userId}`;

    // Return existing pool if available
    if (this.pools.has(cacheKey)) {
      const pool = this.pools.get(cacheKey)!;
      return pool;
    }

    // Fetch connector configuration from database
    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
    });

    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    if (connector.connectorType !== 'database') {
      throw new Error(`Connector ${connectorId} is not a database connector`);
    }

    const config = connector.config as any;

    // Create new pool
    const poolConfig: any = {
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false, // Accept self-signed certs
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10, // Max 10 connections per pool
    };

    const pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error(`Database pool error for connector ${connectorId}:`, err);
      this.pools.delete(cacheKey);
    });

    // Test connection
    try {
      const client = await pool.connect();
      client.release();
      this.pools.set(cacheKey, pool);
      logger.info(`Created database pool for connector ${connectorId}`);
    } catch (error) {
      await pool.end();
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return pool;
  }

  /**
   * Execute SQL query
   */
  async executeQuery(
    connectorId: number,
    userId: number,
    query: string,
    params: any[] = [],
    options: { timeout?: number; maxRows?: number } = {}
  ): Promise<QueryExecutionResult> {
    const pool = await this.getPool(connectorId, userId);
    const client = await pool.connect();
    const queryId = `${connectorId}-${userId}-${Date.now()}`;

    try {
      this.activeQueries.set(queryId, true);

      // Set statement timeout if specified
      if (options.timeout) {
        await client.query(`SET statement_timeout = ${options.timeout}`);
      }

      const startTime = Date.now();
      const result: QueryResult = await client.query(query, params);
      const executionTime = Date.now() - startTime;

      // Limit rows if specified
      let rows = result.rows;
      if (options.maxRows && rows.length > options.maxRows) {
        rows = rows.slice(0, options.maxRows);
      }

      return {
        rows,
        fields: result.fields.map((field) => ({
          name: field.name,
          dataTypeID: field.dataTypeID,
          tableID: field.tableID,
          columnID: field.columnID,
        })),
        rowCount: result.rowCount || 0,
        executionTime,
        command: result.command,
      };
    } catch (error: any) {
      logger.error(`Query execution error for connector ${connectorId}:`, error);
      throw new Error(`Query execution failed: ${error.message}`);
    } finally {
      this.activeQueries.delete(queryId);
      client.release();
    }
  }

  /**
   * Cancel running query
   */
  async cancelQuery(queryId: string): Promise<void> {
    if (this.activeQueries.has(queryId)) {
      // PostgreSQL query cancellation would require pg_cancel_backend
      // For now, we just mark it as cancelled
      this.activeQueries.delete(queryId);
    }
  }

  /**
   * Get all schemas in the database
   */
  async getSchemas(connectorId: number, userId: number): Promise<SchemaInfo> {
    const query = `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `;

    const result = await this.executeQuery(connectorId, userId, query);
    return {
      schemas: result.rows.map((row: any) => row.schema_name),
    };
  }

  /**
   * Get all tables in a schema
   */
  async getTables(connectorId: number, userId: number, schemaName: string): Promise<TableInfo[]> {
    const query = `
      SELECT 
        t.table_name,
        t.table_schema as schema_name,
        t.table_type,
        pg_catalog.obj_description(c.oid, 'pg_class') as description
      FROM information_schema.tables t
      LEFT JOIN pg_catalog.pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
      WHERE t.table_schema = $1
        AND t.table_type IN ('BASE TABLE', 'VIEW')
      ORDER BY t.table_name;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName]);
    
    // Get row counts separately (can be slow for large tables)
    const tablesWithCounts = await Promise.all(
      result.rows.map(async (row: any) => {
        try {
          const countQuery = `SELECT COUNT(*) as count FROM "${schemaName}"."${row.table_name}"`;
          const countResult = await this.executeQuery(connectorId, userId, countQuery);
          return {
            tableName: row.table_name,
            schemaName: row.schema_name,
            tableType: row.table_type,
            rowCount: parseInt(countResult.rows[0]?.count || '0'),
            description: row.description,
          };
        } catch (error) {
          // If count fails, return without count
          return {
            tableName: row.table_name,
            schemaName: row.schema_name,
            tableType: row.table_type,
            description: row.description,
          };
        }
      })
    );
    
    return tablesWithCounts;
  }

  /**
   * Get columns for a table
   */
  async getColumns(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<ColumnInfo[]> {
    const query = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable = 'YES' as is_nullable,
        c.column_default as default_value,
        c.character_maximum_length as max_length,
        c.numeric_precision,
        c.numeric_scale,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
        CASE WHEN u.column_name IS NOT NULL THEN true ELSE false END as is_unique,
        pgd.description
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      ) fk ON c.column_name = fk.column_name
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      ) u ON c.column_name = u.column_name
      LEFT JOIN pg_catalog.pg_statio_all_tables st
        ON c.table_schema = st.schemaname AND c.table_name = st.relname
      LEFT JOIN pg_catalog.pg_description pgd
        ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows.map((row: any) => ({
      columnName: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable,
      defaultValue: row.default_value,
      maxLength: row.max_length,
      numericPrecision: row.numeric_precision,
      numericScale: row.numeric_scale,
      isPrimaryKey: row.is_primary_key,
      isForeignKey: row.is_foreign_key,
      isUnique: row.is_unique,
      description: row.description,
    }));
  }

  /**
   * Get indexes for a table
   */
  async getIndexes(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<IndexInfo[]> {
    const query = `
      SELECT 
        i.relname as index_name,
        t.relname as table_name,
        n.nspname as schema_name,
        am.amname as index_type,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        ARRAY_AGG(a.attname ORDER BY a.attnum) as columns,
        pg_get_indexdef(i.oid) as definition
      FROM pg_class t
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_am am ON i.relam = am.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE n.nspname = $1 AND t.relname = $2
      GROUP BY i.relname, t.relname, n.nspname, am.amname, ix.indisunique, ix.indisprimary, i.oid
      ORDER BY i.relname;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows.map((row: any) => ({
      indexName: row.index_name,
      tableName: row.table_name,
      schemaName: row.schema_name,
      indexType: row.index_type,
      isUnique: row.is_unique,
      isPrimary: row.is_primary,
      columns: row.columns,
      definition: row.definition,
    }));
  }

  /**
   * Get foreign keys for a table
   */
  async getForeignKeys(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<ForeignKeyInfo[]> {
    const query = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        tc.table_schema as schema_name,
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.table_schema AS referenced_schema_name,
        ccu.column_name AS referenced_column_name,
        rc.delete_rule as on_delete,
        rc.update_rule as on_update
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
      ORDER BY tc.constraint_name;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows.map((row: any) => ({
      constraintName: row.constraint_name,
      tableName: row.table_name,
      schemaName: row.schema_name,
      columnName: row.column_name,
      referencedTableName: row.referenced_table_name,
      referencedSchemaName: row.referenced_schema_name,
      referencedColumnName: row.referenced_column_name,
      onDelete: row.on_delete,
      onUpdate: row.on_update,
    }));
  }

  /**
   * Get functions/stored procedures
   */
  async getFunctions(connectorId: number, userId: number, schemaName: string): Promise<FunctionInfo[]> {
    const query = `
      SELECT 
        p.proname as function_name,
        n.nspname as schema_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        l.lanname as language,
        p.prosrc as definition,
        d.description
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      LEFT JOIN pg_description d ON p.oid = d.objoid
      WHERE n.nspname = $1
      ORDER BY p.proname;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName]);
    return result.rows.map((row: any) => ({
      functionName: row.function_name,
      schemaName: row.schema_name,
      returnType: row.return_type,
      arguments: row.arguments,
      language: row.language,
      definition: row.definition,
      description: row.description,
    }));
  }

  /**
   * Get triggers for a table
   */
  async getTriggers(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<TriggerInfo[]> {
    const query = `
      SELECT 
        trigger_name,
        event_object_table as table_name,
        event_object_schema as schema_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = $1
        AND event_object_table = $2
      ORDER BY trigger_name;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows.map((row: any) => ({
      triggerName: row.trigger_name,
      tableName: row.table_name,
      schemaName: row.schema_name,
      eventManipulation: row.event_manipulation,
      actionTiming: row.action_timing,
      actionStatement: row.action_statement,
    }));
  }

  /**
   * Get sequences
   */
  async getSequences(connectorId: number, userId: number, schemaName: string): Promise<SequenceInfo[]> {
    const query = `
      SELECT 
        c.relname as sequence_name,
        n.nspname as schema_name,
        format_type(s.seqtypid, NULL) as data_type,
        s.seqstart::text as start_value,
        s.seqmin::text as min_value,
        s.seqmax::text as max_value,
        s.seqincrement::text as increment_by
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_sequence s ON s.seqrelid = c.oid
      WHERE n.nspname = $1
      ORDER BY c.relname;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName]);
    
    // Get last values separately
    const sequencesWithValues = await Promise.all(
      result.rows.map(async (row: any) => {
        try {
          const valueQuery = `SELECT last_value::text as last_value FROM "${schemaName}"."${row.sequence_name}"`;
          const valueResult = await this.executeQuery(connectorId, userId, valueQuery);
          return {
            sequenceName: row.sequence_name,
            schemaName: row.schema_name,
            dataType: row.data_type,
            startValue: row.start_value,
            minValue: row.min_value,
            maxValue: row.max_value,
            incrementBy: row.increment_by,
            lastValue: valueResult.rows[0]?.last_value,
          };
        } catch (error) {
          // If getting last value fails, return without it
          return {
            sequenceName: row.sequence_name,
            schemaName: row.schema_name,
            dataType: row.data_type,
            startValue: row.start_value,
            minValue: row.min_value,
            maxValue: row.max_value,
            incrementBy: row.increment_by,
          };
        }
      })
    );
    
    return sequencesWithValues;
  }

  /**
   * Get materialized views
   */
  async getMaterializedViews(connectorId: number, userId: number, schemaName: string): Promise<TableInfo[]> {
    const query = `
      SELECT 
        c.relname as table_name,
        n.nspname as schema_name,
        'MATERIALIZED VIEW' as table_type,
        pg_catalog.obj_description(c.oid, 'pg_class') as description
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'm'
        AND n.nspname = $1
      ORDER BY c.relname;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName]);
    return result.rows.map((row: any) => ({
      tableName: row.table_name,
      schemaName: row.schema_name,
      tableType: row.table_type,
      description: row.description,
    }));
  }

  /**
   * Get table DDL
   */
  async getTableDDL(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<string> {
    // For PostgreSQL, we need to construct the DDL from metadata
    const columns = await this.getColumns(connectorId, userId, schemaName, tableName);
    const indexes = await this.getIndexes(connectorId, userId, schemaName, tableName);
    const foreignKeys = await this.getForeignKeys(connectorId, userId, schemaName, tableName);

    let ddl = `CREATE TABLE "${schemaName}"."${tableName}" (\n`;

    // Add columns
    const columnDefs = columns.map(col => {
      let def = `  "${col.columnName}" ${col.dataType}`;
      if (col.maxLength) def += `(${col.maxLength})`;
      if (!col.isNullable) def += ' NOT NULL';
      if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
      return def;
    });

    ddl += columnDefs.join(',\n');

    // Add primary key
    const pkColumns = columns.filter(c => c.isPrimaryKey).map(c => `"${c.columnName}"`);
    if (pkColumns.length > 0) {
      ddl += `,\n  PRIMARY KEY (${pkColumns.join(', ')})`;
    }

    ddl += '\n);';

    // Add indexes
    for (const index of indexes) {
      if (!index.isPrimary) {
        ddl += `\n\nCREATE ${index.isUnique ? 'UNIQUE ' : ''}INDEX "${index.indexName}" ON "${schemaName}"."${tableName}" (${index.columns.map(c => `"${c}"`).join(', ')});`;
      }
    }

    // Add foreign keys
    for (const fk of foreignKeys) {
      ddl += `\n\nALTER TABLE "${schemaName}"."${tableName}" ADD CONSTRAINT "${fk.constraintName}" FOREIGN KEY ("${fk.columnName}") REFERENCES "${fk.referencedSchemaName}"."${fk.referencedTableName}" ("${fk.referencedColumnName}")`;
      if (fk.onDelete !== 'NO ACTION') ddl += ` ON DELETE ${fk.onDelete}`;
      if (fk.onUpdate !== 'NO ACTION') ddl += ` ON UPDATE ${fk.onUpdate}`;
      ddl += ';';
    }

    return ddl;
  }

  /**
   * Test database connection
   */
  async testConnection(config: ConnectionConfig): Promise<{ success: boolean; message: string; version?: string }> {
    // Handle SSL configuration for self-signed certificates
    const poolConfig: any = {
      ...config,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
    };
    const pool = new Pool(poolConfig);

    try {
      const client = await pool.connect();
      const result = await client.query('SELECT version()');
      const version = result.rows[0].version;
      client.release();
      await pool.end();

      return {
        success: true,
        message: 'Connection successful',
        version,
      };
    } catch (error: any) {
      await pool.end();
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Close all connections for a user/connector
   */
  async closeConnections(connectorId?: number, userId?: number): Promise<void> {
    if (connectorId && userId) {
      const cacheKey = `${connectorId}-${userId}`;
      const pool = this.pools.get(cacheKey);
      if (pool) {
        await pool.end();
        this.pools.delete(cacheKey);
        logger.info(`Closed database pool for connector ${connectorId}, user ${userId}`);
      }
    } else {
      // Close all pools
      for (const [key, pool] of this.pools.entries()) {
        await pool.end();
        this.pools.delete(key);
      }
      logger.info('Closed all database pools');
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(connectorId: number, userId: number): Promise<any> {
    const query = `
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
        pg_database_size(current_database()) as database_size,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema')) as table_count,
        (SELECT count(*) FROM information_schema.views WHERE table_schema NOT IN ('pg_catalog', 'information_schema')) as view_count,
        (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')) as function_count;
    `;

    const result = await this.executeQuery(connectorId, userId, query);
    return result.rows[0];
  }
}

export default new DatabaseExplorerService();

