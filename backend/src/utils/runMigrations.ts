import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import logger from './logger';

/**
 * Migration Runner
 * Automatically runs SQL migration files from the migrations folder
 * Tracks which migrations have been applied using schema_migrations table
 */

interface Migration {
  filename: string;
  filepath: string;
  appliedAt?: Date;
}

class MigrationRunner {
  private pool: Pool;
  private migrationsDir: string;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create connection pool
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    // Migrations directory (relative to this file: src/utils -> ../../migrations)
    this.migrationsDir = path.join(__dirname, '../../migrations');
  }

  /**
   * Create schema_migrations table if it doesn't exist
   */
  private async ensureMigrationsTable(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW(),
          checksum VARCHAR(64),
          execution_time_ms INTEGER,
          success BOOLEAN DEFAULT true,
          error_message TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
        ON schema_migrations(filename);
        
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
        ON schema_migrations(applied_at DESC);
      `);
      
      logger.info('✓ Schema migrations table ready');
    } catch (error: any) {
      logger.error('Error creating schema_migrations table:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get list of all SQL files in migrations directory
   */
  private async getMigrationFiles(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsDir);
      
      // Filter for .sql files and sort alphabetically
      const sqlFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return sqlFiles.map(filename => ({
        filename,
        filepath: path.join(this.migrationsDir, filename),
      }));
    } catch (error: any) {
      logger.error('Error reading migrations directory:', error);
      throw error;
    }
  }

  /**
   * Get list of already applied migrations
   */
  private async getAppliedMigrations(): Promise<Set<string>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT filename FROM schema_migrations WHERE success = true ORDER BY applied_at'
      );
      
      return new Set(result.rows.map(row => row.filename));
    } catch (error: any) {
      logger.error('Error fetching applied migrations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a single migration file
   */
  private async executeMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      logger.info(`\n📄 Executing migration: ${migration.filename}`);
      
      // Read SQL file content
      const sql = await fs.readFile(migration.filepath, 'utf-8');
      
      // Execute the SQL
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      await client.query(
        `INSERT INTO schema_migrations (filename, execution_time_ms, success)
         VALUES ($1, $2, true)
         ON CONFLICT (filename) DO UPDATE
         SET applied_at = NOW(), execution_time_ms = $2, success = true`,
        [migration.filename, executionTime]
      );
      
      logger.info(`✅ Migration completed: ${migration.filename} (${executionTime}ms)`);
    } catch (error: any) {
      await client.query('ROLLBACK');
      
      const executionTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';
      
      // Record failed migration
      try {
        await client.query(
          `INSERT INTO schema_migrations (filename, execution_time_ms, success, error_message)
           VALUES ($1, $2, false, $3)
           ON CONFLICT (filename) DO UPDATE
           SET applied_at = NOW(), execution_time_ms = $2, success = false, error_message = $3`,
          [migration.filename, executionTime, errorMessage]
        );
      } catch (recordError: any) {
        logger.error('Error recording failed migration:', recordError);
      }
      
      logger.error(`❌ Migration failed: ${migration.filename}`);
      logger.error(`Error: ${errorMessage}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      logger.info('\n🚀 Starting Migration Runner...\n');
      
      // Ensure migrations table exists
      await this.ensureMigrationsTable();
      
      // Get all migration files
      const allMigrations = await this.getMigrationFiles();
      logger.info(`📁 Found ${allMigrations.length} migration file(s)`);
      
      if (allMigrations.length === 0) {
        logger.info('No migration files found');
        return;
      }
      
      // Get already applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      logger.info(`✓ ${appliedMigrations.size} migration(s) already applied`);
      
      // Filter for pending migrations
      const pendingMigrations = allMigrations.filter(
        migration => !appliedMigrations.has(migration.filename)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('\n✅ All migrations are up to date!');
        return;
      }
      
      logger.info(`\n📋 ${pendingMigrations.length} pending migration(s) to apply:\n`);
      pendingMigrations.forEach(m => logger.info(`   • ${m.filename}`));
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('\n✅ All migrations completed successfully!\n');
      
      // Show summary
      await this.showMigrationSummary();
      
    } catch (error: any) {
      logger.error('\n❌ Migration process failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  /**
   * Show summary of all migrations
   */
  private async showMigrationSummary(): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          filename,
          applied_at,
          execution_time_ms,
          success
        FROM schema_migrations
        ORDER BY applied_at DESC
        LIMIT 10
      `);
      
      if (result.rows.length > 0) {
        logger.info('📊 Recent Migrations:');
        result.rows.forEach(row => {
          const status = row.success ? '✅' : '❌';
          const time = row.execution_time_ms ? `${row.execution_time_ms}ms` : 'N/A';
          const date = new Date(row.applied_at).toISOString();
          logger.info(`   ${status} ${row.filename} (${time}) - ${date}`);
        });
      }
    } catch (error: any) {
      logger.error('Error showing migration summary:', error);
    } finally {
      client.release();
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const runner = new MigrationRunner();
  
  try {
    await runner.runMigrations();
    process.exit(0);
  } catch (error: any) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default MigrationRunner;

