import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database analysis prompts...');

  // Configuration thresholds (shared across prompts)
  const config = {
    thresholds: {
      bloat_warning: 30,
      bloat_critical: 50,
      scan_ratio_poor: 0.1,
      large_table_rows: 1000000,
      high_activity_scans: 10000,
      small_table_rows: 1000,
      slow_query_ms: 1000,
    },
    safety: {
      allow_execution: false,
      require_admin: true,
      show_risks: true,
    },
  };

  // 1. General Health Check
  await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'db_health_analysis',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'Database Table Health Analyzer',
      featureType: 'db_health_analysis',
      description: 'Comprehensive table health check with actionable recommendations',
      promptTemplate: `You are a PostgreSQL database health analyst. Perform a comprehensive analysis of this table.

**Table:** {{table_name}}
**Schema:** {{schema_name}}

**Performance Metrics:**
- Sequential Scans: {{sequential_scans}}
- Index Scans: {{index_scans}}
- Live Rows: {{live_rows}}
- Dead Rows: {{dead_rows}}
- Bloat Ratio: {{bloat_ratio}}%
- Table Size: {{table_size}}
- Index Size: {{index_size}}
- Last VACUUM: {{last_vacuum}}
- Last ANALYZE: {{last_analyze}}

**Table Schema:**
\`\`\`sql
{{create_statement}}
\`\`\`

**Current Indexes:**
{{indexes_list}}

**Foreign Keys:**
{{foreign_keys_list}}

**Database Uptime:** {{db_uptime_days}} days

**Provide a comprehensive health report with:**

1. **Health Score (0-100)** - Overall assessment
2. **Critical Issues** - Immediate attention required
3. **Warnings** - Address soon
4. **Performing Well** - What's working
5. **Optimization Opportunities** - Improvements
6. **Actionable Recommendations** - Specific SQL commands

**CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any text before or after the JSON.**

**JSON structure to return:**
{
  "health_score": 85,
  "summary": "Brief overall assessment",
  "critical_issues": [
    {
      "issue": "Description of critical problem",
      "impact": "High",
      "recommendation": "What to do",
      "sql": "EXACT SQL COMMAND HERE"
    }
  ],
  "warnings": [
    {
      "issue": "Description of warning",
      "impact": "Medium", 
      "recommendation": "What to do"
    }
  ],
  "performing_well": [
    "List of things working correctly"
  ],
  "optimizations": [
    {
      "area": "What can be improved",
      "impact": "Low|Medium|High",
      "recommendation": "How to improve",
      "sql": "SQL command if applicable"
    }
  ]
}

**IMPORTANT:** 
- Return ONLY valid JSON, no markdown, no explanations
- Include exact SQL commands in the "sql" field
- Use null for "sql" if no SQL needed`,
      variables: ['table_name', 'schema_name', 'sequential_scans', 'index_scans', 'live_rows', 'dead_rows', 'bloat_ratio', 'table_size', 'index_size', 'last_vacuum', 'last_analyze', 'create_statement', 'indexes_list', 'foreign_keys_list', 'db_uptime_days'],
      processingConfig: {
        max_tokens: 3000,
        temperature: 0.2,
        response_format: 'json',
        ...config,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        scenario: 'GENERAL_HEALTH',
      },
    },
  });

  // 2. High Bloat Performance Issue
  await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'db_performance_bloat',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'High Bloat Optimizer',
      featureType: 'db_performance_bloat',
      description: 'Addresses excessive table bloat issues',
      promptTemplate: `You are a PostgreSQL optimization expert. A table has CRITICAL BLOAT that needs immediate attention.

**CRITICAL ISSUE - High Bloat Detected**

**Table:** {{table_name}} ({{schema_name}})
- Bloat Ratio: {{bloat_ratio}}%
- Live Rows: {{live_rows}}
- Dead Rows: {{dead_rows}}
- Table Size: {{table_size}}
- Last VACUUM: {{last_vacuum}}
- Last AUTOVACUUM: {{last_autovacuum}}
- Last ANALYZE: {{last_analyze}}

**Table Schema:**
\`\`\`sql
{{create_statement}}
\`\`\`

**Indexes:**
{{indexes_list}}

**Write Activity:**
- Database Uptime: {{db_uptime_days}} days

**CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any text before or after the JSON.**

**JSON structure to return:**
{
  "health_score": 30,
  "summary": "Critical bloat requires immediate action",
  "immediate_actions": [
    {
      "priority": 1,
      "action": "Run VACUUM or VACUUM FULL",
      "sql": "EXACT SQL COMMAND",
      "locks_table": true|false,
      "estimated_duration": "5-30 minutes",
      "risk_level": "low|medium|high",
      "explanation": "Why this action is needed"
    }
  ],
  "root_cause": "Why bloat is happening",
  "prevention_strategy": [
    {
      "config": "autovacuum_vacuum_scale_factor",
      "current": "0.2 (default)",
      "recommended": "0.05",
      "sql": "ALTER TABLE {{table_name}} SET (autovacuum_vacuum_scale_factor = 0.05);",
      "reason": "Explanation"
    }
  ],
  "expected_results": {
    "space_reclaimed": "Estimated size reduction",
    "performance_improvement": "Expected impact"
  },
  "warnings": [
    "VACUUM FULL locks the table - schedule during maintenance window",
    "Other important warnings"
  ]
}
\`\`\`

**Return ONLY valid JSON.**`,
      variables: ['table_name', 'schema_name', 'bloat_ratio', 'live_rows', 'dead_rows', 'table_size', 'last_vacuum', 'last_autovacuum', 'last_analyze', 'create_statement', 'indexes_list', 'db_uptime_days'],
      processingConfig: {
        max_tokens: 2500,
        temperature: 0.1,
        response_format: 'json',
        trigger_threshold: 50,
        ...config,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        scenario: 'HIGH_BLOAT',
      },
    },
  });

  // 3. Missing Indexes
  await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'db_performance_indexes',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'Missing Index Detector',
      featureType: 'db_performance_indexes',
      description: 'Identifies missing indexes from high sequential scans',
      promptTemplate: `You are a PostgreSQL query optimization expert. This table has EXCESSIVE SEQUENTIAL SCANS.

**PERFORMANCE ISSUE - Missing Indexes**

**Table:** {{table_name}} ({{schema_name}})
- Sequential Scans: {{sequential_scans}}
- Index Scans: {{index_scans}}
- Scan Ratio: {{scan_ratio}} (seq/total)
- Table Size: {{table_size}}
- Row Count: {{live_rows}}

**Table Schema:**
\`\`\`sql
{{create_statement}}
\`\`\`

**Current Indexes:**
{{indexes_list}}

**CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any text before or after the JSON.**

**JSON structure to return:**
{
  "health_score": 45,
  "summary": "High sequential scans indicate missing indexes",
  "recommended_indexes": [
    {
      "index_name": "idx_table_column",
      "columns": ["column1", "column2"],
      "index_type": "btree",
      "reason": "Why this index helps",
      "sql": "CREATE INDEX idx_table_column ON {{table_name}} (column1, column2);",
      "estimated_impact": "50% faster queries on column1 filters",
      "is_covering": false,
      "priority": "High|Medium|Low"
    }
  ],
  "composite_index_recommendations": [
    {
      "columns": ["col1", "col2", "col3"],
      "reason": "Supports multi-column queries",
      "sql": "CREATE INDEX ...",
      "query_pattern": "Typical query this helps"
    }
  ],
  "warnings": [
    "Avoid over-indexing (recommend max 5-7 indexes)",
    "Each index adds write overhead"
  ],
  "monitoring": [
    "Check pg_stat_user_indexes after creation",
    "Monitor query performance changes"
  ]
}
\`\`\`

**IMPORTANT:**
- Suggest 3-5 most impactful indexes
- Consider index maintenance overhead
- Recommend composite indexes where beneficial
- Return ONLY valid JSON`,
      variables: ['table_name', 'schema_name', 'sequential_scans', 'index_scans', 'scan_ratio', 'table_size', 'live_rows', 'create_statement', 'indexes_list'],
      processingConfig: {
        max_tokens: 2500,
        temperature: 0.15,
        response_format: 'json',
        trigger_condition: 'seq_scans > 1000 && scan_ratio < 0.1',
        ...config,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        scenario: 'MISSING_INDEX',
      },
    },
  });

  // 4. Slow Query Optimization
  await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'db_query_optimization',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'Slow Query Optimizer',
      featureType: 'db_query_optimization',
      description: 'Analyzes and optimizes slow-running queries',
      promptTemplate: `You are a PostgreSQL query optimization specialist. Analyze and optimize slow queries.

**Table:** {{table_name}} ({{schema_name}})

**Table Schema:**
\`\`\`sql
{{create_statement}}
\`\`\`

**Current Indexes:**
{{indexes_list}}

**Slow Query Analysis:**
{{slow_queries}}

**Table Stats:**
- Size: {{table_size}}
- Rows: {{live_rows}}

**CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any text before or after the JSON.**

**JSON structure to return:**
{
  "health_score": 40,
  "summary": "Slow queries detected requiring optimization",
  "query_optimizations": [
    {
      "query_description": "Brief description",
      "original_query": "ORIGINAL SQL",
      "issues": [
        "Sequential scan on large table",
        "Missing index on WHERE clause"
      ],
      "optimized_query": "OPTIMIZED SQL or null if no rewrite needed",
      "required_indexes": [
        {
          "sql": "CREATE INDEX ...",
          "reason": "Speeds up WHERE clause"
        }
      ],
      "expected_improvement": "10x faster",
      "execution_stats": {
        "current_avg_ms": 5000,
        "estimated_avg_ms": 500
      }
    }
  ],
  "general_tips": [
    "Use EXPLAIN ANALYZE to verify improvements",
    "Monitor after changes"
  ]
}
\`\`\`

**Return ONLY valid JSON.**`,
      variables: ['table_name', 'schema_name', 'create_statement', 'indexes_list', 'slow_queries', 'table_size', 'live_rows'],
      processingConfig: {
        max_tokens: 3000,
        temperature: 0.15,
        response_format: 'json',
        ...config,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        scenario: 'SLOW_QUERY',
      },
    },
  });

  // 5. Small High-Activity Table
  await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'db_caching_strategy',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'Caching Strategy Advisor',
      featureType: 'db_caching_strategy',
      description: 'Caching recommendations for high-activity small tables',
      promptTemplate: `You are a PostgreSQL caching and optimization expert. A SMALL TABLE has UNUSUALLY HIGH ACTIVITY.

**PATTERN DETECTED - Small High-Activity Table**

**Table:** {{table_name}} ({{schema_name}})
- Row Count: {{live_rows}} rows
- Sequential Scans: {{sequential_scans}}
- Index Scans: {{index_scans}}
- Uptime: {{db_uptime_days}} days

**Table Schema:**
\`\`\`sql
{{create_statement}}
\`\`\`

**This pattern suggests potential for caching optimization.**

**CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any text before or after the JSON.**

**JSON structure to return:**
{
  "health_score": 60,
  "summary": "Small table with high activity - good caching candidate",
  "caching_recommendations": [
    {
      "strategy": "Application-level caching",
      "reason": "Table is small and read-heavy",
      "implementation": "Cache entire table in Redis/Memcached",
      "cache_ttl": "5-15 minutes",
      "invalidation_trigger": "On INSERT/UPDATE/DELETE",
      "estimated_benefit": "90% reduction in database queries"
    }
  ],
  "alternative_strategies": [
    {
      "approach": "Materialized view",
      "sql": "CREATE MATERIALIZED VIEW ...",
      "refresh_strategy": "REFRESH MATERIALIZED VIEW ...",
      "pros": ["Built into PostgreSQL", "No external dependency"],
      "cons": ["Refresh overhead", "Slightly stale data"]
    }
  ],
  "index_optimizations": [
    {
      "sql": "CREATE INDEX ...",
      "reason": "Even small tables benefit from proper indexing"
    }
  ],
  "monitoring": [
    "Track cache hit rate",
    "Monitor cache invalidations"
  ]
}
\`\`\`

**Return ONLY valid JSON.**`,
      variables: ['table_name', 'schema_name', 'live_rows', 'sequential_scans', 'index_scans', 'db_uptime_days', 'create_statement'],
      processingConfig: {
        max_tokens: 2000,
        temperature: 0.2,
        response_format: 'json',
        trigger_condition: 'live_rows < 1000 && seq_scans > 10000',
        ...config,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        scenario: 'SMALL_HIGH_ACTIVITY',
      },
    },
  });

  // 6. Large Table Optimization
  await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'db_large_table_optimization',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'Large Table Partitioning Advisor',
      featureType: 'db_large_table_optimization',
      description: 'Partitioning and optimization strategies for large tables',
      promptTemplate: `You are a PostgreSQL expert in large-table optimization and partitioning strategies.

**LARGE TABLE OPTIMIZATION**

**Table:** {{table_name}} ({{schema_name}})
- Row Count: {{live_rows}} rows
- Table Size: {{table_size}}
- Index Size: {{index_size}}
- Sequential Scans: {{sequential_scans}}
- Index Scans: {{index_scans}}
- Bloat Ratio: {{bloat_ratio}}%

**Table Schema:**
\`\`\`sql
{{create_statement}}
\`\`\`

**Current Indexes:**
{{indexes_list}}

**CRITICAL: Return ONLY a raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any text before or after the JSON.**

**JSON structure to return:**
{
  "health_score": 55,
  "summary": "Large table requires special optimization strategies",
  "partitioning_analysis": {
    "recommended": true|false,
    "partition_type": "RANGE|LIST|HASH",
    "partition_key": "date_column or id_column",
    "reason": "Why partitioning helps",
    "strategy": "Partition by month/year/range",
    "sql_example": "CREATE TABLE {{table_name}}_2024_01 PARTITION OF ...",
    "benefits": [
      "Faster queries on time-range filters",
      "Easier data archival"
    ],
    "migration_complexity": "Low|Medium|High"
  },
  "index_strategy": [
    {
      "recommendation": "Use partial indexes for large tables",
      "sql": "CREATE INDEX ... WHERE date > '2024-01-01';",
      "benefit": "Smaller index, faster searches"
    }
  ],
  "archival_strategy": {
    "recommended": true|false,
    "approach": "Move old data to archive table",
    "retention_period": "Keep last 2 years in main table",
    "sql": "CREATE TABLE {{table_name}}_archive AS SELECT * FROM {{table_name}} WHERE date < '2022-01-01';"
  },
  "vacuum_strategy": {
    "custom_settings": [
      {
        "setting": "autovacuum_vacuum_scale_factor",
        "value": "0.01",
        "sql": "ALTER TABLE {{table_name}} SET (autovacuum_vacuum_scale_factor = 0.01);",
        "reason": "More aggressive vacuuming for large tables"
      }
    ]
  },
  "performance_tuning": [
    {
      "area": "Query patterns",
      "recommendation": "Use covering indexes",
      "sql": "CREATE INDEX ... INCLUDE (col1, col2);"
    }
  ],
  "migration_plan": [
    "Step 1: Create partitioned structure",
    "Step 2: Migrate data in batches",
    "Step 3: Switch application to new structure"
  ]
}
\`\`\`

**Return ONLY valid JSON.**`,
      variables: ['table_name', 'schema_name', 'live_rows', 'table_size', 'index_size', 'sequential_scans', 'index_scans', 'bloat_ratio', 'create_statement', 'indexes_list'],
      processingConfig: {
        max_tokens: 3000,
        temperature: 0.2,
        response_format: 'json',
        trigger_condition: 'live_rows > 1000000 || size > 1GB',
        ...config,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        scenario: 'LARGE_TABLE',
      },
    },
  });

  console.log('✅ All 6 database analysis prompts seeded successfully!');
  console.log('   - db_health_analysis');
  console.log('   - db_performance_bloat');
  console.log('   - db_performance_indexes');
  console.log('   - db_query_optimization');
  console.log('   - db_caching_strategy');
  console.log('   - db_large_table_optimization');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding analysis prompts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

