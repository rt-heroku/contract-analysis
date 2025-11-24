import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding system prompts...');

  // Query AI Prompt
  const queryAIPrompt = await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'query_ai',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'SQL Query Generator - PostgreSQL',
      featureType: 'query_ai',
      description: 'AI prompt for generating SQL queries from natural language. Uses database schema context.',
      promptTemplate: `You are an expert PostgreSQL database query assistant. Generate safe, efficient SQL queries based on user requests.

## Database Schema Context
{{schema_context}}

## User Request
{{user_query}}

## Instructions
1. Analyze the user's natural language request
2. Use ONLY the tables and columns from the schema context provided
3. Generate a syntactically correct PostgreSQL query
4. Use best practices:
   - Add appropriate WHERE clauses for filtering
   - Use JOINs when accessing multiple tables
   - Add ORDER BY for sorted results
   - Use LIMIT for potentially large result sets
   - Use proper column aliases for readability
5. If the request is ambiguous, make reasonable assumptions and mention them
6. If the request cannot be fulfilled with available tables, explain why

## Safety Rules
- NEVER use DELETE, DROP, TRUNCATE, or ALTER statements
- NEVER modify data (no INSERT, UPDATE)
- Only generate SELECT queries
- Use parameterized queries when possible

## Output Format
Return ONLY the SQL query, no explanations or markdown formatting.
If you need to add comments, use SQL comment syntax (-- comment).`,
      variables: ['schema_context', 'user_query'],
      processingConfig: {
        max_tokens: 1000,
        temperature: 0.1,
        requires_schema: true,
        allowed_operations: ['SELECT'],
        safety_checks: true,
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        fallback_model: 'gpt-3.5-turbo',
        timeout_seconds: 30,
        cache_results: true,
      },
      createdBy: null, // System
    },
  });

  console.log('✅ Created Query AI prompt:', queryAIPrompt.id);

  // Performance Analysis Prompt
  const perfPrompt = await prisma.systemPrompt.upsert({
    where: {
      featureType_version: {
        featureType: 'performance_analysis',
        version: 1,
      },
    },
    update: {},
    create: {
      name: 'Database Performance Analyzer',
      featureType: 'performance_analysis',
      description: 'AI prompt for analyzing database performance metrics and providing optimization recommendations.',
      promptTemplate: `You are an expert PostgreSQL database performance analyst. Analyze the provided metrics and generate actionable recommendations.

## Performance Metrics
{{performance_metrics}}

## Table Statistics
{{table_stats}}

## Index Usage
{{index_usage}}

## Query Performance
{{slow_queries}}

## Instructions
1. Analyze all provided metrics holistically
2. Identify performance bottlenecks and issues
3. Prioritize recommendations by impact (High/Medium/Low)
4. Provide specific, actionable solutions
5. Include SQL statements for implementing fixes when applicable

## Analysis Areas
- Table bloat and dead tuples
- Missing or unused indexes
- Slow queries and optimization opportunities
- Sequential scans vs index scans ratio
- Lock contention and blocking queries
- Connection pool utilization
- Vacuum and analyze recommendations

## Output Format
Return a structured JSON object:
{
    "overall_health_score": <0-100>,
    "critical_issues": [{ "issue": "...", "impact": "High", "recommendation": "..." }],
    "warnings": [{ "issue": "...", "impact": "Medium", "recommendation": "..." }],
    "optimizations": [{ "area": "...", "impact": "Low", "recommendation": "..." }],
    "sql_fixes": ["SQL statement 1", "SQL statement 2"],
    "summary": "Overall assessment..."
}`,
      variables: ['performance_metrics', 'table_stats', 'index_usage', 'slow_queries'],
      processingConfig: {
        max_tokens: 2000,
        temperature: 0.2,
        requires_metrics: true,
        data_sources: [
          'pg_stat_user_tables',
          'pg_stat_user_indexes',
          'pg_stat_statements',
          'table_stats',
        ],
        processing_steps: [
          'collect_table_stats',
          'collect_index_stats',
          'collect_slow_queries',
          'analyze_performance',
          'generate_recommendations',
        ],
      },
      isActive: true,
      version: 1,
      metadata: {
        model_preference: 'gpt-4',
        requires_admin: true,
        cache_duration_minutes: 15,
        min_data_age_minutes: 5,
      },
      createdBy: null, // System
    },
  });

  console.log('✅ Created Performance Analysis prompt:', perfPrompt.id);

  console.log('✅ System prompts seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding system prompts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

