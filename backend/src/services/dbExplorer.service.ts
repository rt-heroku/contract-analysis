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
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default?: string;
  max_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  is_unique: boolean;
  is_indexed: boolean;
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
  direction?: 'outgoing' | 'incoming';
  // Aliases for frontend compatibility
  constraint_name?: string;
  foreign_table_name?: string;
  foreign_table_schema?: string;
  foreign_column_name?: string;
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

    // Decrypt the config (passwords are encrypted in DB)
    const { decryptConnectorConfig } = require('../utils/encryption');
    const config = decryptConnectorConfig(connector.config) as any;

    // Create new pool
    const poolConfig: any = {
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password, // Now decrypted
      ssl: config.ssl ? { rejectUnauthorized: false } : false, // Accept self-signed certs
      connectionTimeoutMillis: config.connectTimeout || 5000,
      idleTimeoutMillis: config.idleTimeout || 30000,
      max: config.poolMax || 10, // Use configured pool size or default to 10
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
        AND t.table_name NOT LIKE 'pg_%'  -- Exclude PostgreSQL system tables/views
        AND t.table_name NOT LIKE 'sql_%' -- Exclude SQL standard information tables
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
      column_name: row.column_name,
      data_type: row.data_type,
      is_nullable: row.is_nullable,
      column_default: row.default_value,
      max_length: row.max_length,
      numeric_precision: row.numeric_precision,
      numeric_scale: row.numeric_scale,
      is_primary_key: row.is_primary_key,
      is_foreign_key: row.is_foreign_key,
      is_unique: row.is_unique,
      is_indexed: row.is_unique, // Temporarily map is_unique to is_indexed
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
      columns: Array.isArray(row.columns) ? row.columns : (row.columns ? [row.columns] : []),
      definition: row.definition,
    }));
  }

  /**
   * Get foreign keys for a table (both outgoing and incoming)
   */
  async getForeignKeys(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<ForeignKeyInfo[]> {
    // Get outgoing foreign keys (this table references other tables)
    const outgoingQuery = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        tc.table_schema as schema_name,
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.table_schema AS referenced_schema_name,
        ccu.column_name AS referenced_column_name,
        rc.delete_rule as on_delete,
        rc.update_rule as on_update,
        'outgoing' as direction
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

    // Get incoming foreign keys (other tables reference this table)
    const incomingQuery = `
      SELECT
        tc.constraint_name,
        ccu.table_name,
        ccu.table_schema as schema_name,
        ccu.column_name,
        tc.table_name AS referenced_table_name,
        tc.table_schema AS referenced_schema_name,
        kcu.column_name AS referenced_column_name,
        rc.delete_rule as on_delete,
        rc.update_rule as on_update,
        'incoming' as direction
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
        AND ccu.table_schema = $1
        AND ccu.table_name = $2
      ORDER BY tc.constraint_name;
    `;

    const outgoingResult = await this.executeQuery(connectorId, userId, outgoingQuery, [schemaName, tableName]);
    const incomingResult = await this.executeQuery(connectorId, userId, incomingQuery, [schemaName, tableName]);
    
    const allFKs = [...outgoingResult.rows, ...incomingResult.rows];
    
    return allFKs.map((row: any) => ({
      // Return both snake_case and camelCase for compatibility
      constraint_name: row.constraint_name,
      constraintName: row.constraint_name,
      table_name: row.table_name,
      tableName: row.table_name,
      schema_name: row.schema_name,
      schemaName: row.schema_name,
      column_name: row.column_name,
      columnName: row.column_name,
      referenced_table_name: row.referenced_table_name,
      referencedTableName: row.referenced_table_name,
      foreign_table_name: row.referenced_table_name, // Alias for frontend
      referenced_schema_name: row.referenced_schema_name,
      referencedSchemaName: row.referenced_schema_name,
      foreign_table_schema: row.referenced_schema_name, // Alias for frontend
      referenced_column_name: row.referenced_column_name,
      referencedColumnName: row.referenced_column_name,
      foreign_column_name: row.referenced_column_name, // Alias for frontend
      on_delete: row.on_delete,
      onDelete: row.on_delete,
      on_update: row.on_update,
      onUpdate: row.on_update,
      direction: row.direction, // 'outgoing' or 'incoming'
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
      let def = `  "${col.column_name}" ${col.data_type}`;
      if (col.max_length) def += `(${col.max_length})`;
      if (!col.is_nullable) def += ' NOT NULL';
      if (col.column_default) def += ` DEFAULT ${col.column_default}`;
      return def;
    });

    ddl += columnDefs.join(',\n');

    // Add primary key
    const pkColumns = columns.filter(c => c.is_primary_key).map(c => `"${c.column_name}"`);
    if (pkColumns.length > 0) {
      ddl += `,\n  PRIMARY KEY (${pkColumns.join(', ')})`;
    }

    ddl += '\n);';

    // Add indexes
    for (const index of indexes) {
      if (!index.isPrimary) {
        // Ensure columns is an array
        const columns = Array.isArray(index.columns) ? index.columns : [index.columns].filter(Boolean);
        if (columns.length > 0) {
          ddl += `\n\nCREATE ${index.isUnique ? 'UNIQUE ' : ''}INDEX "${index.indexName}" ON "${schemaName}"."${tableName}" (${columns.map(c => `"${c}"`).join(', ')});`;
        }
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
   * Get constraints for a table
   */
  async getConstraints(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<any[]> {
    const query = `
      SELECT
        con.conname as name,
        con.contype as type,
        pg_get_constraintdef(con.oid) as definition,
        CASE con.contype
          WHEN 'c' THEN 'CHECK'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 't' THEN 'TRIGGER'
          WHEN 'x' THEN 'EXCLUSION'
        END as constraint_type
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = $1 AND rel.relname = $2
      ORDER BY con.conname;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows;
  }

  /**
   * Get policies for a table
   */
  async getPolicies(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<any[]> {
    const query = `
      SELECT
        pol.polname as name,
        pol.polcmd as command,
        CASE pol.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
        END as command_type,
        pol.polpermissive as is_permissive,
        pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
        pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expression,
        r.rolname as role
      FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_roles r ON r.oid = ANY(pol.polroles)
      WHERE n.nspname = $1 AND c.relname = $2
      ORDER BY pol.polname;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows;
  }

  /**
   * Get rules for a table
   */
  async getRules(connectorId: number, userId: number, schemaName: string, tableName: string): Promise<any[]> {
    const query = `
      SELECT
        r.rulename as name,
        CASE r.ev_type
          WHEN '1' THEN 'SELECT'
          WHEN '2' THEN 'UPDATE'
          WHEN '3' THEN 'INSERT'
          WHEN '4' THEN 'DELETE'
        END as event_type,
        r.is_instead as is_instead,
        pg_get_ruledef(r.oid) as definition
      FROM pg_rewrite r
      JOIN pg_class c ON c.oid = r.ev_class
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relname = $2 AND r.rulename != '_RETURN'
      ORDER BY r.rulename;
    `;

    const result = await this.executeQuery(connectorId, userId, query, [schemaName, tableName]);
    return result.rows;
  }

  /**
   * Get schema ERD data (tables with columns and relationships)
   */
  async getSchemaERD(connectorId: number, userId: number, schemaName: string): Promise<any> {
    // Get all tables with their columns
    const tablesQuery = `
      SELECT
        t.table_name,
        t.table_type,
        json_agg(
          json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES',
            'isPrimaryKey', EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
              WHERE tc.table_schema = t.table_schema
                AND tc.table_name = t.table_name
                AND tc.constraint_type = 'PRIMARY KEY'
                AND kcu.column_name = c.column_name
            )
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%'
        AND t.table_name NOT LIKE 'sql_%'
      GROUP BY t.table_name, t.table_type
      ORDER BY t.table_name;
    `;

    // Get all foreign key relationships
    const relationshipsQuery = `
      SELECT DISTINCT
        tc.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_name as to_table,
        ccu.column_name as to_column,
        tc.constraint_name as name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND tc.table_name NOT LIKE 'pg_%'
        AND tc.table_name NOT LIKE 'sql_%'
        AND ccu.table_name NOT LIKE 'pg_%'
        AND ccu.table_name NOT LIKE 'sql_%'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    const [tablesResult, relationshipsResult] = await Promise.all([
      this.executeQuery(connectorId, userId, tablesQuery, [schemaName]),
      this.executeQuery(connectorId, userId, relationshipsQuery, [schemaName]),
    ]);

    logger.info(`ERD Query Results for schema "${schemaName}":`, {
      tablesCount: tablesResult.rows.length,
      relationshipsCount: relationshipsResult.rows.length,
      sampleRelationships: relationshipsResult.rows.slice(0, 5).map((r: any) => ({
        from: `${r.from_table}.${r.from_column}`,
        to: `${r.to_table}.${r.to_column}`,
      })),
    });

    return {
      tables: tablesResult.rows,
      relationships: relationshipsResult.rows,
    };
  }

  /**
   * Get inference connector for AI operations
   */
  private async getInferenceConnector(): Promise<any> {
    // Get the selected inference connector from settings
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'db_explorer_ai_connector_id' },
    });

    if (!setting || !setting.settingValue) {
      throw new Error('No AI connector configured. Please configure an inference connector in system settings.');
    }

    const connectorId = parseInt(setting.settingValue);
    const connector = await prisma.connector.findFirst({
      where: {
        id: connectorId,
        connectorType: 'inference',
        isActive: true,
      },
    });

    if (!connector) {
      throw new Error('Configured AI connector not found or inactive');
    }

    return connector;
  }

  /**
   * Generate SQL using AI with full context and conversation history
   */
  async generateAISQL(
    connectorId: number, 
    userId: number, 
    schemaName: string, 
    prompt: string,
    history: Array<{ role: string; content: string; sql?: string }> = []
  ): Promise<any> {
    // Get all tables in schema with basic info
    const tablesQuery = `
      SELECT 
        t.table_name,
        obj_description(to_regclass($1 || '.' || t.table_name)) as table_comment,
        (SELECT count(*) FROM information_schema.columns c 
         WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = $1 AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%'
        AND t.table_name NOT LIKE 'sql_%'
      ORDER BY t.table_name;
    `;
    const tablesResult = await this.executeQuery(connectorId, userId, tablesQuery, [schemaName]);
    const allTables = tablesResult.rows.map((row: any) => row.table_name.toLowerCase());
    const tableList = tablesResult.rows;

    // Extract table names from prompt (simple regex matching)
    const tableNamePattern = /\b([a-z_][a-z0-9_]*)\b/gi;
    const potentialTables = prompt.match(tableNamePattern) || [];

    // Filter to only valid tables mentioned in prompt
    const mentionedTables = potentialTables
      .map(t => t.toLowerCase())
      .filter(t => allTables.includes(t))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    // Include detailed context for mentioned tables, or top 5 tables if none mentioned
    const tablesToInclude = mentionedTables.length > 0 
      ? mentionedTables 
      : allTables.slice(0, 5);

    // Gather context for each table
    const tableContexts = await Promise.all(
      tablesToInclude.map(async (tableName) => {
        try {
          const [ddl, indexes, constraints] = await Promise.all([
            this.getTableDDL(connectorId, userId, schemaName, tableName),
            this.getIndexes(connectorId, userId, schemaName, tableName),
            this.getConstraints(connectorId, userId, schemaName, tableName),
          ]);

          return {
            tableName,
            ddl,
            indexes: indexes.slice(0, 10), // Limit to first 10 indexes
            constraints: constraints.slice(0, 10), // Limit to first 10 constraints
          };
        } catch (error) {
          logger.warn(`Failed to get context for table ${tableName}:`, error);
          return null;
        }
      })
    );

    const validContexts = tableContexts.filter(c => c !== null);

    // Build AI prompt with full context
    const contextPrompt = this.buildAIPrompt(prompt, schemaName, tableList, validContexts);

    // Get inference connector configuration
    const inferenceConnector = await this.getInferenceConnector();
    const config = inferenceConnector.config as any;

    logger.info(`Using inference connector: ${inferenceConnector.name} (ID: ${inferenceConnector.id})`);
    logger.info(`Connector config - Model: ${config.modelId}, BaseURL: ${config.baseUrl}`);

    if (!config.apiKey) {
      throw new Error('Inference connector is missing API key configuration');
    }

    // Build the API URL (baseUrl + endpoint)
    // Normalize baseUrl by removing trailing slashes
    let baseUrl = (config.baseUrl || 'https://api.openai.com/v1').trim();
    baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    
    // Get endpoint from config, default to /chat/completions
    const endpoint = config.endpoint || '/chat/completions';
    
    const apiUrl = `${baseUrl}${endpoint}`;
    
    logger.info(`Calling AI API: ${apiUrl} with model: ${config.modelId || 'gpt-4o-mini'}`);
    logger.info(`Conversation history: ${history.length} messages`);

    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert PostgreSQL database assistant. Your role is to help users generate SQL queries and answer questions about their database.

IMPORTANT INSTRUCTIONS:
1. If you receive database schema context, use it to generate accurate SQL queries
2. If you have questions or need clarification, ASK the user - don't make assumptions
3. If tables are missing from the detailed context, refer to the "Available Tables" list
4. When generating SQL:
   - Return ONLY the SQL query, ready to execute
   - No markdown formatting, no explanations (unless the user asks for them)
   - Ensure column names and table names match the schema exactly
5. When asking questions:
   - Be specific about what information you need
   - Suggest possible options based on the schema
6. Always be helpful and conversational

The user can provide additional details in follow-up messages. Keep the conversation natural.`,
      },
    ];

    // Add conversation history
    for (const msg of history) {
      if (msg.role === 'user') {
        messages.push({
          role: 'user',
          content: msg.content,
        });
      } else if (msg.role === 'assistant') {
        // Include both the explanation and SQL in the assistant message
        let assistantContent = msg.content;
        if (msg.sql) {
          assistantContent += `\n\n${msg.sql}`;
        }
        messages.push({
          role: 'assistant',
          content: assistantContent,
        });
      }
    }

    // Add current prompt with full schema context
    messages.push({
      role: 'user',
      content: contextPrompt,
    });

    // Call Inference API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId || 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`AI API error (${response.status}): ${errorText} - URL: ${apiUrl}`);
      throw new Error(`AI API error (${response.status}): ${errorText}`);
    }

    const responseData: any = await response.json();
    const generatedText: string = responseData.choices[0]?.message?.content || '';

    logger.debug('AI Response:', generatedText.substring(0, 200));

    // Detect if response contains SQL or is a question/clarification
    const lines = generatedText.split('\n');
    const sqlStartIndex = lines.findIndex((line: string) => {
      const trimmed = line.trim().toUpperCase();
      return trimmed.startsWith('SELECT') ||
             trimmed.startsWith('INSERT') ||
             trimmed.startsWith('UPDATE') ||
             trimmed.startsWith('DELETE') ||
             trimmed.startsWith('WITH') ||
             trimmed.startsWith('CREATE') ||
             trimmed.startsWith('ALTER') ||
             trimmed.startsWith('DROP');
    });
    
    let sql = '';
    let explanation = generatedText.trim();

    if (sqlStartIndex >= 0) {
      // SQL detected - extract it
      const sqlLines = lines.slice(sqlStartIndex);
      sql = sqlLines.join('\n').trim();
      
      // Remove markdown code blocks if present
      sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract explanation (text before SQL)
      if (sqlStartIndex > 0) {
        explanation = lines.slice(0, sqlStartIndex).join('\n').trim();
      } else {
        explanation = 'Generated SQL query based on your requirements.';
      }
    } else {
      // No SQL detected - AI is asking questions or providing clarification
      sql = ''; // Empty SQL indicates this is a conversation message, not a query
      explanation = generatedText.trim();
    }

    return {
      sql,
      explanation: explanation || 'SQL query generated successfully.',
      tablesUsed: tablesToInclude,
    };
  }

  /**
   * Build comprehensive AI prompt with schema context
   */
  private buildAIPrompt(userPrompt: string, schemaName: string, allTables: any[], tableContexts: any[]): string {
    let prompt = `# Database Schema Context\n\nSchema: ${schemaName}\n\n`;

    // Add complete table list first so AI knows what's available
    prompt += `## Available Tables (${allTables.length} total):\n\n`;
    allTables.forEach((table: any) => {
      prompt += `- **${table.table_name}** (${table.column_count} columns)`;
      if (table.table_comment) {
        prompt += ` - ${table.table_comment}`;
      }
      prompt += '\n';
    });
    prompt += '\n---\n\n';

    // Add detailed DDL for mentioned/relevant tables
    if (tableContexts.length > 0) {
      prompt += `## Detailed Table Schemas:\n\n`;
      for (const context of tableContexts) {
        prompt += `### Table: ${context.tableName}\n\n`;
        prompt += `#### DDL:\n\`\`\`sql\n${context.ddl}\n\`\`\`\n\n`;

        // Add indexes
        if (context.indexes.length > 0) {
          prompt += `#### Indexes:\n`;
          context.indexes.forEach((idx: any) => {
            const unique = idx.isUnique ? 'UNIQUE ' : '';
            const columns = Array.isArray(idx.columns) ? idx.columns.join(', ') : idx.columns;
            prompt += `- ${unique}${idx.indexName} ON (${columns})\n`;
          });
          prompt += '\n';
        }

        // Add constraints
        if (context.constraints.length > 0) {
          prompt += `#### Constraints:\n`;
          context.constraints.forEach((con: any) => {
            prompt += `- ${con.name} (${con.constraint_type}): ${con.definition}\n`;
          });
          prompt += '\n';
        }
      }
      prompt += '---\n\n';
    }

    prompt += `# User Request\n\n${userPrompt}\n\n`;
    prompt += `# Instructions\n\n`;
    prompt += `1. Review the COMPLETE list of available tables above (${allTables.length} tables total)\n`;
    prompt += `2. If the user mentions tables that don't exist, suggest similar table names from the available list\n`;
    prompt += `3. If detailed DDL is not provided for a table, make reasonable assumptions based on the table name\n`;
    prompt += `4. Generate a PostgreSQL query that fulfills the user's request\n`;
    prompt += `5. Use correct table and column names from the provided schema context\n`;
    prompt += `6. Return ONLY the SQL query, ready to execute, without explanations or markdown\n`;
    prompt += `7. The query should be clean, efficient, and follow PostgreSQL best practices\n`;
    prompt += `\nIMPORTANT: You have a complete list of ${allTables.length} tables. Use this list to understand what's available in the database.\n`;

    return prompt;
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

  /**
   * Get detailed table statistics
   */
  async getTableStats(connectorId: number, userId: number, schemaName: string, tableName: string) {
    try {
      // First check if table exists
      const existsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = '${schemaName}' 
          AND table_name = '${tableName}'
        ) as table_exists;
      `;
      
      const existsResult = await this.executeQuery(connectorId, userId, existsQuery);
      
      if (!existsResult.rows[0]?.table_exists) {
        // Table doesn't exist, return default stats
        return {
          rowCount: 0,
          totalSize: '0 bytes',
          tableSize: '0 bytes',
          indexSize: '0 bytes',
          indexCount: 0,
          liveTuples: 0,
          deadTuples: 0,
          inserts: 0,
          updates: 0,
          deletes: 0,
          lastVacuum: null,
          lastAutovacuum: null,
          lastAnalyze: null,
          lastAutoanalyze: null,
          vacuumCount: 0,
          autovacuumCount: 0,
          analyzeCount: 0,
          autoanalyzeCount: 0,
        };
      }

      const query = `
        SELECT
          COALESCE((SELECT count(*) FROM "${schemaName}"."${tableName}"), 0) as row_count,
          pg_size_pretty(pg_total_relation_size('"${schemaName}"."${tableName}"')) as total_size,
          pg_size_pretty(pg_relation_size('"${schemaName}"."${tableName}"')) as table_size,
          pg_size_pretty(pg_indexes_size('"${schemaName}"."${tableName}"')) as index_size,
          (SELECT count(*) FROM pg_indexes WHERE schemaname = '${schemaName}' AND tablename = '${tableName}') as index_count,
          COALESCE(n_live_tup, 0) as live_tuples,
          COALESCE(n_dead_tup, 0) as dead_tuples,
          COALESCE(n_tup_ins, 0) as inserts,
          COALESCE(n_tup_upd, 0) as updates,
          COALESCE(n_tup_del, 0) as deletes,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          COALESCE(vacuum_count, 0) as vacuum_count,
          COALESCE(autovacuum_count, 0) as autovacuum_count,
          COALESCE(analyze_count, 0) as analyze_count,
          COALESCE(autoanalyze_count, 0) as autoanalyze_count
        FROM pg_stat_user_tables
        WHERE schemaname = '${schemaName}' AND relname = '${tableName}';
      `;

      const result = await this.executeQuery(connectorId, userId, query);
      const row = result.rows[0] || {};

      // Convert snake_case to camelCase for frontend
      return {
        rowCount: row.row_count || 0,
        totalSize: row.total_size || '0 bytes',
        tableSize: row.table_size || '0 bytes',
        indexSize: row.index_size || '0 bytes',
        indexCount: row.index_count || 0,
        liveTuples: row.live_tuples || 0,
        deadTuples: row.dead_tuples || 0,
        inserts: row.inserts || 0,
        updates: row.updates || 0,
        deletes: row.deletes || 0,
        lastVacuum: row.last_vacuum,
        lastAutovacuum: row.last_autovacuum,
        lastAnalyze: row.last_analyze,
        lastAutoanalyze: row.last_autoanalyze,
        vacuumCount: row.vacuum_count || 0,
        autovacuumCount: row.autovacuum_count || 0,
        analyzeCount: row.analyze_count || 0,
        autoanalyzeCount: row.autoanalyze_count || 0,
      };
    } catch (error) {
      logger.error(`Error getting table stats for ${schemaName}.${tableName}:`, error);
      // Return default stats if query fails
      return {
        rowCount: 0,
        totalSize: '0 bytes',
        tableSize: '0 bytes',
        indexSize: '0 bytes',
        indexCount: 0,
        liveTuples: 0,
        deadTuples: 0,
        inserts: 0,
        updates: 0,
        deletes: 0,
        lastVacuum: null,
        lastAutovacuum: null,
        lastAnalyze: null,
        lastAutoanalyze: null,
        vacuumCount: 0,
        autovacuumCount: 0,
        analyzeCount: 0,
        autoanalyzeCount: 0,
      };
    }
  }

  /**
   * Get table dependencies (views, functions that depend on this table)
   */
  async getTableDependencies(connectorId: number, userId: number, schemaName: string, tableName: string) {
    const query = `
      SELECT DISTINCT
        dependent_ns.nspname as dependent_schema,
        dependent_view.relname as dependent_view,
        dependent_view.relkind as dependent_type
      FROM pg_depend
      JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
      JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
      JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
      JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
      JOIN pg_namespace source_ns ON source_table.relnamespace = source_ns.oid
      WHERE source_ns.nspname = '${schemaName}'
        AND source_table.relname = '${tableName}'
        AND source_table.relkind = 'r'
        AND pg_depend.deptype = 'n'
      ORDER BY dependent_schema, dependent_view;
    `;

    const result = await this.executeQuery(connectorId, userId, query);
    
    // Also get functions that reference this table
    // Exclude aggregate functions (prokind = 'a') since pg_get_functiondef doesn't work on them
    const funcQuery = `
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.prokind != 'a'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND pg_get_functiondef(p.oid) LIKE '%${tableName}%';
    `;

    let functions = [];
    try {
      const funcResult = await this.executeQuery(connectorId, userId, funcQuery);
      functions = funcResult.rows;
    } catch (error) {
      // If function query fails, just return empty array for functions
      console.warn('Failed to get table functions:', error);
    }

    return {
      views: result.rows.filter(r => r.dependent_type === 'v'),
      materializedViews: result.rows.filter(r => r.dependent_type === 'm'),
      functions,
    };
  }

  /**
   * Get table performance metrics
   */
  async getTablePerformance(connectorId: number, userId: number, schemaName: string, tableName: string) {
    try {
      const query = `
        SELECT 
          schemaname,
          relname as tablename,
          seq_scan,
          seq_tup_read,
          CASE WHEN seq_scan > 0 THEN seq_tup_read::float / seq_scan ELSE 0 END as avg_seq_read,
          idx_scan,
          idx_tup_fetch,
          CASE WHEN idx_scan > 0 THEN idx_tup_fetch::float / idx_scan ELSE 0 END as avg_idx_fetch,
          n_tup_ins as inserts_per_sec,
          n_tup_upd as updates_per_sec,
          n_tup_del as deletes_per_sec,
          n_tup_hot_upd as hot_updates,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          CASE WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup * 100) ELSE 0 END as bloat_ratio
        FROM pg_stat_user_tables
        WHERE schemaname = '${schemaName}' AND relname = '${tableName}';
      `;

      const statsResult = await this.executeQuery(connectorId, userId, query);

    // Get index usage stats
    const indexQuery = `
      SELECT
        indexrelname as index_name,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE schemaname = '${schemaName}' AND relname = '${tableName}'
      ORDER BY idx_scan DESC;
    `;

    const indexResult = await this.executeQuery(connectorId, userId, indexQuery);

    // Get table bloat estimate
    const bloatQuery = `
      SELECT 
        current_database() as db,
        schemaname,
        tablename,
        ROUND(CASE WHEN otta=0 OR sml.relpages=0 THEN 0.0 
          ELSE sml.relpages/otta::numeric END,1) AS tbloat,
        CASE WHEN relpages < otta THEN 0 
          ELSE relpages::bigint - otta END AS wastedbytes,
        pg_size_pretty((CASE WHEN relpages < otta THEN 0 
          ELSE relpages::bigint - otta END * bs)::bigint) AS wastedsize
      FROM (
        SELECT
          schemaname, tablename, cc.reltuples, cc.relpages, bs,
          CEIL((cc.reltuples*((datahdr+ma-
            (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
        FROM (
          SELECT
            ma,bs,schemaname,tablename,
            (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
            (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
          FROM (
            SELECT
              schemaname, tablename, hdr, ma, bs,
              SUM((1-null_frac)*avg_width) AS datawidth,
              MAX(null_frac) AS maxfracsum,
              hdr+(
                SELECT 1+count(*)/8
                FROM pg_stats s2
                WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
              ) AS nullhdr
            FROM pg_stats s, (
              SELECT
                (SELECT current_setting('block_size')::numeric) AS bs,
                CASE WHEN SUBSTRING(v,12,3) IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                CASE WHEN v ~ 'mingw32' THEN 8 ELSE 4 END AS ma
              FROM (SELECT version() AS v) AS foo
            ) AS constants
            GROUP BY 1,2,3,4,5
          ) AS foo
        ) AS rs
        JOIN pg_class cc ON cc.relname = rs.tablename
        JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname AND nn.nspname <> 'information_schema'
      ) AS sml
      WHERE schemaname = '${schemaName}' AND tablename = '${tableName}';
    `;

      let bloatResult;
      try {
        bloatResult = await this.executeQuery(connectorId, userId, bloatQuery);
      } catch (error) {
        bloatResult = { rows: [] };
      }

      return {
        table: statsResult.rows[0] || {},
        indexes: indexResult.rows || [],
        bloat: bloatResult.rows[0] || {},
      };
    } catch (error) {
      console.error('Failed to get table performance:', error);
      // Return default performance data on error
      return {
        table: {},
        indexes: [],
        bloat: {},
      };
    }
  }
}

export default new DatabaseExplorerService();

