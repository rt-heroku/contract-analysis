# AI Database Optimizer - Implementation Summary

## Overview

The AI Database Optimizer is a comprehensive feature that uses AI to analyze PostgreSQL table health and provide actionable performance recommendations. It leverages the existing connector architecture to work with any AI provider (OpenAI, Claude, etc.).

## Architecture

### Backend Components

#### 1. Database Schema (`schema.prisma`)

**SystemPrompt Model**
```prisma
model SystemPrompt {
  id               Int       @id @default(autoincrement())
  name             String    @unique
  featureType      String    @map("feature_type")
  description      String?
  promptTemplate   String    @map("prompt_template") @db.Text
  variables        Json?     // Expected variables in template
  processingConfig Json?     @map("processing_config") // AI config overrides
  isActive         Boolean   @default(true) @map("is_active")
  version          Int       @default(1)
  metadata         Json?     // Additional metadata
  createdBy        Int       @map("created_by")
  updatedBy        Int?      @map("updated_by")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
}
```

**DbAnalysisResult Model**
```prisma
model DbAnalysisResult {
  id               Int       @id @default(autoincrement())
  connectorId      Int       @map("connector_id")
  schemaName       String    @map("schema_name")
  tableName        String    @map("table_name")
  analysisType     String    @map("analysis_type") // 'health_check' | 'performance_optimization'
  scenarioDetected String    @map("scenario_detected")
  healthScore      Int?      @map("health_score")
  summary          String    @db.Text
  recommendations  Json
  rawResponse      Json      @map("raw_response")
  executedActions  Json?     @map("executed_actions")
  createdBy        Int       @map("created_by")
  createdAt        DateTime  @default(now()) @map("created_at")
}
```

#### 2. Services

**systemPrompt.service.ts**
- Manages CRUD operations for AI prompts
- Supports versioning and activation/deactivation
- Renders prompts with variables using template substitution

**tableAnalysis.service.ts**
- **Key Method:** `getTableContext(connectorId, userId, schema, table)`
  - Collects comprehensive table data:
    - Performance metrics (bloat, scans, dead tuples)
    - Schema information (columns, data types, constraints)
    - Index usage statistics
    - Foreign key relationships
    - Query statistics (when `pg_stat_statements` available)
- **Scenario Detection:** Analyzes collected data to determine analysis type:
  - `high_bloat`: Bloat ratio > 20%
  - `missing_indexes`: High sequential scans, few indexes
  - `slow_queries`: High total query time (when available)
  - `caching_strategy`: High cache hit ratio needed
  - `large_table_optimization`: Tables > 10GB
  - `general_health`: Default

**aiAnalysis.service.ts**
- **Main Method:** `analyzeTable(connectorId, userId, schema, table, analysisType)`
  - Orchestrates full analysis workflow:
    1. Get table context from `tableAnalysis.service`
    2. Detect scenario
    3. Fetch appropriate system prompt
    4. Render prompt with context
    5. Call AI via connector architecture
    6. Parse and store results
- **Connector Integration:** Uses same pattern as query builder
  - Fetches active inference connector
  - Reads configuration (apiKey, baseUrl, modelId)
  - Makes OpenAI-compatible API call
- **Safety:** No auto-execution of SQL - all recommendations are advisory

#### 3. API Endpoints (`tableAnalysis.routes.ts`)

```typescript
POST /table-analysis/:connectorId/schemas/:schema/tables/:table/analyze-health
POST /table-analysis/:connectorId/schemas/:schema/tables/:table/performance-tips
GET  /table-analysis/:connectorId/schemas/:schema/tables/:table/latest-analysis
GET  /table-analysis/:connectorId/schemas/:schema/tables/:table/analysis-history
GET  /table-analysis/analysis/:analysisId
POST /table-analysis/analysis/:analysisId/execute
```

#### 4. AI Prompts (6 Scenarios)

All prompts seeded via `seedAnalysisPrompts.ts`:

1. **General Health Check**
   - Overall table assessment
   - Health score (0-100)
   - General recommendations

2. **High Bloat**
   - VACUUM/AUTOVACUUM recommendations
   - Bloat reduction strategies
   - Maintenance scheduling

3. **Missing Indexes**
   - Index recommendations with SQL
   - Composite index suggestions
   - Impact analysis

4. **Slow Queries**
   - Query optimization tips
   - Index and rewrite suggestions
   - Execution plan analysis

5. **Caching Strategy**
   - Cache configuration recommendations
   - Shared buffers sizing
   - Working memory tuning

6. **Large Table Optimization**
   - Partitioning strategies
   - Archival recommendations
   - Compression options

### Frontend Components

#### 1. AnalysisButtons.tsx

Two action buttons with loading states:
- **"Analyze Table Health"**: Calls `/analyze-health`, shows read-only analysis
- **"Get Performance Tips"**: Calls `/performance-tips`, shows actionable checklist

```typescript
interface AnalysisButtonsProps {
  connectorId: number;
  schema: string;
  table: string;
  onAnalysisComplete: (analysis: any) => void;
}
```

#### 2. LastAnalysisPanel.tsx

Collapsible panel showing last analysis:
- Health score (color-coded)
- Scenario detected
- Summary (truncated)
- Recommendation count
- Timestamp ("last analyzed X ago")
- "View Full Analysis" button
- Auto-refreshes after new analysis

```typescript
interface LastAnalysisPanelProps {
  connectorId: number;
  schema: string;
  table: string;
  onViewDetails: (analysis: any) => void;
  refreshTrigger?: number;
}
```

#### 3. AnalysisResultModal.tsx

Full-screen modal displaying results:
- **Header**: Icon, title, timestamp
- **Health Score**: Large display with color coding (for health checks)
- **Scenario Badge**: Detected analysis type
- **Summary**: AI-generated overview
- **Recommendations**: 
  - Read-only list for health checks
  - Interactive checklist for performance tips
- **Additional Insights**: Optional metadata from AI

```typescript
interface AnalysisResult {
  id: number;
  type: 'health' | 'performance';
  scenarioDetected: string;
  healthScore?: number;
  summary: string;
  recommendations: any[];
  rawResponse: any;
  createdAt: string;
}
```

#### 4. RecommendationChecklist.tsx

Interactive checklist for actionable items:
- **Checkboxes**: User selects items to execute
- **Priority Badges**: High/Medium/Low with color coding
- **Category Tags**: Type of recommendation
- **Impact & Effort**: Metadata for each item
- **SQL Display**: Code block with copy button
- **Warning Messages**: Safety notices for manual execution
- **Execute Button**: Tracks selected items via API
- **Progress Indicator**: Shows executed count

```typescript
interface Recommendation {
  title: string;
  description: string;
  sql?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  impact?: string;
  effort?: string;
}
```

## User Workflow

### Health Check Flow

1. User navigates to table → Performance tab
2. Clicks "Analyze Table Health"
3. Backend:
   - Collects table context
   - Detects scenario
   - Calls AI with appropriate prompt
   - Stores result
4. Modal opens showing:
   - Health score (0-100)
   - Scenario detected
   - Summary
   - Recommendations (read-only)
5. User reads recommendations
6. Analysis appears in "Last Analysis" panel

### Performance Tips Flow

1. User clicks "Get Performance Tips"
2. Backend performs same analysis
3. Modal opens with **interactive checklist**
4. User:
   - Reviews recommendations
   - Selects items to execute
   - Copies SQL commands
   - Executes manually in database client
   - Clicks "Execute Selected" to track actions
5. Backend records executed actions
6. Checklist shows progress (X of Y executed)
7. Last Analysis panel updates

### View Last Analysis

1. User expands "Last Analysis" panel
2. Sees:
   - Health score
   - Scenario
   - Summary (truncated)
   - Recommendation count
3. Clicks "View Full Analysis"
4. Modal reopens with full details

## Configuration

### System Prompt Variables

Each prompt expects these variables:
```typescript
{
  schemaName: string;
  tableName: string;
  tableSize: string;
  rowCount: number;
  deadTuples: number;
  bloatRatio: number;
  seqScans: number;
  idxScans: number;
  indexes: Array<{
    name: string;
    columns: string[];
    scans: number;
    size: string;
  }>;
  foreignKeys: Array<{
    constraintName: string;
    referencedTable: string;
    columns: string[];
  }>;
  queryStats?: Array<{
    query: string;
    calls: number;
    totalTime: number;
    meanTime: number;
  }>;
}
```

### Scenario Detection Thresholds

Currently in `tableAnalysis.service.ts`:
```typescript
BLOAT_THRESHOLD: 20,           // 20% bloat
SEQ_SCAN_THRESHOLD: 10000,     // 10k sequential scans
INDEX_COUNT_THRESHOLD: 2,      // Min 2 indexes expected
QUERY_TIME_THRESHOLD: 10000,   // 10s total time
TABLE_SIZE_THRESHOLD_GB: 10,   // 10GB
```

**Future Enhancement**: Move to `system_prompts.processing_config` for admin configuration

### AI Provider Configuration

Uses existing connector architecture:
1. Finds active connector with type = 'inference'
2. Reads config:
   ```json
   {
     "apiKey": "sk-...",
     "baseUrl": "https://api.openai.com/v1",
     "endpoint": "/chat/completions",
     "modelId": "gpt-4",
     "temperature": 0.7,
     "maxTokens": 2000
   }
   ```
3. Makes OpenAI-compatible request
4. Works with: OpenAI, Claude (via gateway), Azure OpenAI, any compatible API

## Safety & Security

### No Auto-Execution
- All SQL commands are **advisory only**
- User must manually execute in database client
- "Execute Selected" only tracks that action was taken
- Prevents accidental schema changes

### Activity Logging
All operations are logged:
- `db_analysis.health_check` - Health analysis performed
- `db_analysis.performance_tips` - Performance tips generated
- `db_analysis.action_executed` - Recommendation executed

### Permission Checks
All endpoints require:
- Authentication (`authenticate` middleware)
- Admin role (`requireAdmin` middleware)

## Data Collection

### Always Available
- Table size and row count
- Index definitions and sizes
- Foreign key relationships
- Column schema
- Basic performance metrics (from `pg_stat_user_tables`)

### Optional (if `pg_stat_statements` enabled)
- Query statistics
- Execution times
- Query patterns

### Historical Data
Uses available `pg_stat` views:
- `pg_stat_user_tables` - Table access statistics
- `pg_stat_user_indexes` - Index usage
- `pg_statio_user_tables` - I/O statistics
- `pg_stat_statements` - Query performance (if available)

Database uptime checked to contextualize statistics.

## Testing Scenarios

### Scenario 1: New Table (Minimal Data)
- **Trigger**: Small table, few indexes, low usage
- **Expected**: General health check
- **Recommendations**: Basic indexing, monitoring setup

### Scenario 2: High Bloat Table
- **Trigger**: Bloat ratio > 20%
- **Expected**: High bloat scenario
- **Recommendations**: VACUUM, AUTOVACUUM tuning, REINDEX

### Scenario 3: Missing Indexes
- **Trigger**: High seq scans, few indexes
- **Expected**: Missing indexes scenario
- **Recommendations**: Specific index creation SQL

### Scenario 4: Large Table
- **Trigger**: Table size > 10GB
- **Expected**: Large table optimization
- **Recommendations**: Partitioning, archival, compression

### Scenario 5: Query Performance Issues
- **Trigger**: High total query time (when `pg_stat_statements` available)
- **Expected**: Slow queries scenario
- **Recommendations**: Query optimization, index tuning

### Scenario 6: Caching Needs
- **Trigger**: Low cache hit ratio
- **Expected**: Caching strategy scenario
- **Recommendations**: Buffer pool tuning, memory configuration

## Error Handling

### Frontend
- Loading states during API calls
- Error boundaries for component failures
- Graceful degradation when no analysis exists
- Toast notifications for user actions

### Backend
- Try-catch blocks around AI calls
- Fallback to general health if scenario detection fails
- Validation of AI responses
- Database transaction handling
- Activity logging for audit trail

## Deployment Checklist

- [x] Database migrations applied (`system_prompts`, `db_analysis_results`)
- [x] System prompts seeded (6 scenarios)
- [x] Backend services implemented
- [x] API endpoints created
- [x] Frontend components built
- [x] Imports corrected
- [x] No linter errors
- [x] Git commits with descriptive messages
- [ ] Test with real database table
- [ ] Verify AI connector configuration
- [ ] Test all 6 scenarios
- [ ] Verify action tracking
- [ ] Check activity logging
- [ ] Performance testing

## Future Enhancements

### Phase 2
- [ ] Parametrizable thresholds (move to `processing_config`)
- [ ] Historical analysis tracking and trending
- [ ] Comparison of analyses over time
- [ ] Export analysis to PDF/CSV
- [ ] Schedule automated analyses
- [ ] Email notifications for critical issues

### Phase 3
- [ ] Multi-table analysis (schema-wide)
- [ ] Cross-table optimization recommendations
- [ ] Custom scenario creation by admin
- [ ] A/B testing of recommendations
- [ ] Performance impact tracking
- [ ] ROI calculation for optimizations

## Maintenance

### Updating Prompts
1. Admin UI (future) or direct database update
2. Update `version` field
3. Toggle `is_active` for testing
4. Monitor analysis results

### Adding New Scenarios
1. Add prompt to `seedAnalysisPrompts.ts`
2. Update scenario detection logic in `tableAnalysis.service.ts`
3. Add threshold configuration
4. Update `getScenarioLabel` in frontend components
5. Test with appropriate table

### Monitoring
- Check `db_analysis_results` table for trends
- Monitor `executed_actions` for adoption
- Review activity logs for usage patterns
- Track API response times

## Troubleshooting

### Issue: Analysis returns empty recommendations
**Solution**: Check AI prompt rendering, verify table context data collection

### Issue: Modal not opening
**Solution**: Check browser console, verify API response format, check state management

### Issue: SQL commands not executing
**Solution**: Verify user has database permissions, check SQL syntax, review postgres logs

### Issue: Scenario detection always returns general_health
**Solution**: Check threshold values, verify table statistics are being collected, review detection logic

---

**Implemented by**: AI Assistant (Claude Sonnet 4.5)  
**Date**: January 22, 2025  
**Status**: ✅ Complete - Ready for Testing

