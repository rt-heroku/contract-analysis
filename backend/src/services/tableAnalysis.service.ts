import { PrismaClient } from '@prisma/client';
import dbExplorerService from './dbExplorer.service';
import systemPromptService from './systemPrompt.service';

const prisma = new PrismaClient();

export interface TableContext {
  table_name: string;
  schema_name: string;
  sequential_scans: number;
  index_scans: number;
  live_rows: number;
  dead_rows: number;
  bloat_ratio: number;
  table_size: string;
  index_size: string;
  last_vacuum: string | null;
  last_autovacuum: string | null;
  last_analyze: string | null;
  create_statement: string;
  indexes_list: string;
  foreign_keys_list: string;
  db_uptime_days: number;
  scan_ratio: number;
}

type AnalysisScenario = 
  | 'HIGH_BLOAT' 
  | 'MISSING_INDEX' 
  | 'SLOW_QUERY' 
  | 'SMALL_HIGH_ACTIVITY' 
  | 'LARGE_TABLE' 
  | 'GENERAL_HEALTH';

class TableAnalysisService {
  /**
   * Aggregate all table context for analysis
   */
  async aggregateTableContext(
    connectorId: number,
    userId: number,
    schemaName: string,
    tableName: string
  ): Promise<TableContext> {
    // Get stats
    const stats = await dbExplorerService.getTableStats(connectorId, userId, schemaName, tableName);
    
    // Get performance metrics
    const performance = await dbExplorerService.getTablePerformance(connectorId, userId, schemaName, tableName);
    
    // Get DDL
    const ddl = await dbExplorerService.getTableDDL(connectorId, userId, schemaName, tableName);
    
    // Get indexes
    const indexes = await dbExplorerService.getIndexes(connectorId, userId, schemaName, tableName);
    
    // Get foreign keys
    const foreignKeys = await dbExplorerService.getForeignKeys(connectorId, userId, schemaName, tableName);
    
    // Get database uptime
    const uptimeQuery = `SELECT EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) / 86400 AS uptime_days;`;
    const uptimeResult = await dbExplorerService.executeQuery(connectorId, userId, uptimeQuery);
    const uptimeDays = Math.round(uptimeResult.rows[0]?.uptime_days || 0);
    
    // Format indexes list
    const indexesList = indexes.length > 0
      ? indexes.map(idx => `- ${idx.indexName} (${idx.columns.join(', ')}): ${idx.indexType}${idx.isUnique ? ' UNIQUE' : ''}`).join('\n')
      : 'No indexes (excluding primary key)';
    
    // Format foreign keys list
    const fkList = foreignKeys.length > 0
      ? foreignKeys.filter(fk => fk.direction === 'outgoing').map(fk => 
          `- ${fk.constraintName}: ${fk.columnName} → ${fk.referencedSchemaName}.${fk.referencedTableName}(${fk.referencedColumnName})`
        ).join('\n')
      : 'No foreign keys';
    
    // Calculate scan ratio
    const totalScans = (performance.table?.seq_scan || 0) + (performance.table?.idx_scan || 0);
    const scanRatio = totalScans > 0 
      ? ((performance.table?.idx_scan || 0) / totalScans).toFixed(2)
      : '0.00';
    
    return {
      table_name: tableName,
      schema_name: schemaName,
      sequential_scans: performance.table?.seq_scan || 0,
      index_scans: performance.table?.idx_scan || 0,
      live_rows: performance.table?.live_rows || stats.liveTuples || 0,
      dead_rows: performance.table?.dead_rows || stats.deadTuples || 0,
      bloat_ratio: performance.table?.bloat_ratio || 0,
      table_size: stats.tableSize || '0 bytes',
      index_size: stats.indexSize || '0 bytes',
      last_vacuum: stats.lastVacuum ? new Date(stats.lastVacuum).toISOString() : 'Never',
      last_autovacuum: stats.lastAutovacuum ? new Date(stats.lastAutovacuum).toISOString() : 'Never',
      last_analyze: stats.lastAnalyze ? new Date(stats.lastAnalyze).toISOString() : 'Never',
      create_statement: ddl,
      indexes_list: indexesList,
      foreign_keys_list: fkList,
      db_uptime_days: uptimeDays,
      scan_ratio: parseFloat(scanRatio),
    };
  }

  /**
   * Detect which scenario applies to this table
   */
  detectScenario(context: TableContext): AnalysisScenario {
    // High bloat (most critical)
    if (context.bloat_ratio > 50) {
      return 'HIGH_BLOAT';
    }
    
    // Missing indexes (high sequential scans, low index usage)
    if (context.sequential_scans > 1000 && context.scan_ratio < 0.1) {
      return 'MISSING_INDEX';
    }
    
    // Small high-activity table
    if (context.live_rows < 1000 && context.sequential_scans > 10000) {
      return 'SMALL_HIGH_ACTIVITY';
    }
    
    // Large table
    if (context.live_rows > 1000000) {
      return 'LARGE_TABLE';
    }
    
    // Default: general health check
    return 'GENERAL_HEALTH';
  }

  /**
   * Get appropriate system prompt based on scenario
   */
  async getPromptForScenario(scenario: AnalysisScenario): Promise<any> {
    const featureTypeMap: Record<AnalysisScenario, string> = {
      HIGH_BLOAT: 'db_performance_bloat',
      MISSING_INDEX: 'db_performance_indexes',
      SLOW_QUERY: 'db_query_optimization',
      SMALL_HIGH_ACTIVITY: 'db_caching_strategy',
      LARGE_TABLE: 'db_large_table_optimization',
      GENERAL_HEALTH: 'db_health_analysis',
    };
    
    const featureType = featureTypeMap[scenario];
    const prompt = await systemPromptService.getActivePromptByFeature(featureType);
    
    if (!prompt) {
      throw new Error(`No active prompt found for scenario: ${scenario}`);
    }
    
    return prompt;
  }

  /**
   * Render prompt with table context
   */
  renderAnalysisPrompt(promptTemplate: string, context: TableContext): string {
    return systemPromptService.renderPrompt(promptTemplate, context as any);
  }

  /**
   * Store analysis result
   */
  async storeAnalysisResult(
    connectorId: number,
    userId: number,
    schemaName: string,
    tableName: string,
    analysisType: string,
    scenario: AnalysisScenario,
    context: TableContext,
    aiResponse: string,
    healthScore?: number
  ) {
    // Parse AI response to extract recommendations and summary
    let recommendations = null;
    let summary = 'No summary available';
    try {
      const parsed = JSON.parse(aiResponse);
      recommendations = parsed.recommendations || parsed;
      summary = parsed.summary || parsed.analysis || 'No summary available';
      healthScore = parsed.health_score || healthScore;
    } catch (e) {
      // If not JSON, store as-is
      recommendations = { raw_response: aiResponse };
      summary = aiResponse;
    }
    
    return prisma.dbAnalysisResult.create({
      data: {
        connectorId,
        schemaName,
        tableName,
        analysisType,
        scenarioDetected: scenario,
        healthScore,
        summary,
        tableContext: context as any,
        aiAnalysis: aiResponse,
        recommendations,
        executedBy: userId,
      },
    });
  }

  /**
   * Get latest analysis for a table
   */
  async getLatestAnalysis(
    connectorId: number,
    schemaName: string,
    tableName: string
  ) {
    return prisma.dbAnalysisResult.findFirst({
      where: {
        connectorId,
        schemaName,
        tableName,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get analysis history for a table
   */
  async getAnalysisHistory(
    connectorId: number,
    schemaName: string,
    tableName: string,
    limit: number = 10
  ) {
    return prisma.dbAnalysisResult.findMany({
      where: {
        connectorId,
        schemaName,
        tableName,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update executed actions
   */
  async updateExecutedActions(
    analysisId: number,
    executedActions: any[]
  ) {
    return prisma.dbAnalysisResult.update({
      where: { id: analysisId },
      data: {
        actionsTaken: executedActions,
        updatedAt: new Date(),
      },
    });
  }
}

export default new TableAnalysisService();

