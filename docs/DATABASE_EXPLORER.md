# Database Explorer

## Overview

The Database Explorer is a comprehensive database management interface integrated into the application. It provides a full-featured SQL client similar to pgAdmin or DBeaver, allowing users to explore, query, and manage PostgreSQL databases directly from the web interface.

## Features

### 🗂️ Database Object Browser

- **Hierarchical Tree View:** Browse databases, schemas, tables, views, functions, sequences, and more
- **Real-time Loading:** Lazy-load objects as you expand tree nodes
- **Quick Navigation:** Click on any object to view its details
- **Row Count Indicators:** See table row counts at a glance

### 💻 SQL Query Editor

Powered by Monaco Editor with full SQL syntax highlighting:

- **Auto-completion:** SQL keywords, table names, column names, and PostgreSQL functions
- **Multi-tab Support:** Work with multiple queries simultaneously
- **Keyboard Shortcuts:**
  - `Ctrl/Cmd + Enter` - Execute query
  - `Ctrl/Cmd + S` - Save to history
  - `Ctrl/Cmd + Shift + F` - Format SQL
- **Query Execution:** Run full query or selected text
- **Query Explain:** View execution plan with EXPLAIN ANALYZE
- **Execution Stats:** See execution time and rows affected

### 📊 Results Grid

- **Sortable Columns:** Click headers to sort ascending/descending
- **Pagination:** Handle large result sets efficiently (default 50 rows per page)
- **Copy Cell Values:** Hover over cells to copy individual values
- **Export Options:**
  - CSV format
  - JSON format
- **Data Type Formatting:**
  - NULL values clearly indicated
  - Numbers right-aligned
  - JSON/JSONB syntax highlighted
  - Boolean values formatted

### 📋 Object Details Panel

View comprehensive information about database objects:

#### Tables
- **Columns Tab:** Data types, nullable, defaults, constraints
- **Indexes Tab:** Index definitions, types (B-tree, Hash, etc.), unique/non-unique
- **Foreign Keys Tab:** Relationships, ON DELETE/UPDATE rules
- **DDL Tab:** Complete CREATE TABLE statement with syntax highlighting

#### Functions
- **Overview:** Return type, arguments, language
- **Definition:** Full function source code

#### Sequences
- **Properties:** Start value, increment, min/max values, current value

### 🕐 Query History

- **Automatic Logging:** All executed queries saved with execution time and status
- **Searchable:** Filter queries by text
- **Re-execute:** Click any query to load it into the editor
- **Status Tracking:** Success/error indication with error messages

### ⭐ Query Favorites

- **Save Queries:** Save frequently-used queries with custom names
- **Organize:** Add descriptions and tags
- **Quick Access:** Load favorites into editor with one click
- **Share:** (Future feature) Share favorites with team members

### 🗺️ ERD Visualization

- **Schema Diagram:** Visual representation of table relationships
- **Auto-layout:** Intelligent positioning using Dagre algorithm
- **Interactive:** Pan, zoom, and explore the schema
- **Relationship Lines:** Foreign key relationships clearly displayed
- **Legend:** Visual guide for keys and relationships

## Getting Started

### Prerequisites

1. **Database Connector:** Create a database connector in the Connectors section
2. **Permissions:** Admin role required (can be customized)

### Creating a Database Connector

1. Navigate to **Connectors** page
2. Click **New Connector**
3. Select **Database** type
4. Fill in connection details:
   - Host (e.g., `localhost`)
   - Port (e.g., `5432`)
   - Database name
   - Username
   - Password
   - SSL (optional)
5. Click **Test Connection** to verify
6. Save the connector

### Accessing the Database Explorer

1. Click **Database Explorer** in the main menu
2. Select a connector from the dropdown
3. Browse the object tree on the left
4. Start writing queries!

## Usage Examples

### Example 1: Simple SELECT Query

```sql
SELECT 
  id,
  email,
  first_name,
  last_name,
  created_at
FROM users
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 100;
```

**Tips:**
- Use `Ctrl/Cmd + Enter` to execute
- Results appear in the grid below
- Click column headers to sort
- Export results to CSV or JSON

### Example 2: Join Query

```sql
SELECT 
  u.email,
  u.first_name,
  r.name as role_name,
  ur.created_at as assigned_at
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
WHERE u.is_active = true
ORDER BY u.email;
```

### Example 3: Aggregate Query

```sql
SELECT 
  r.name as role,
  COUNT(ur.user_id) as user_count,
  MIN(ur.created_at) as first_assigned,
  MAX(ur.created_at) as last_assigned
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY user_count DESC;
```

### Example 4: Using PostgreSQL Functions

```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as records,
  JSONB_AGG(
    JSONB_BUILD_OBJECT(
      'id', id,
      'name', first_name || ' ' || last_name
    )
  ) as users
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Example 5: Subqueries

```sql
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  (
    SELECT COUNT(*)
    FROM activity_logs al
    WHERE al.user_id = u.id
  ) as activity_count,
  (
    SELECT MAX(created_at)
    FROM activity_logs al
    WHERE al.user_id = u.id
  ) as last_activity
FROM users u
WHERE u.is_active = true
ORDER BY last_activity DESC NULLS LAST;
```

## PostgreSQL Feature Support

The Database Explorer fully supports PostgreSQL features including:

### Data Types
- ✅ Numeric: `integer`, `bigint`, `decimal`, `numeric`, `real`, `double precision`
- ✅ Character: `char`, `varchar`, `text`
- ✅ Date/Time: `date`, `time`, `timestamp`, `timestamptz`, `interval`
- ✅ Boolean: `boolean`
- ✅ Binary: `bytea`
- ✅ JSON: `json`, `jsonb`
- ✅ Arrays: Any PostgreSQL array type
- ✅ UUID: `uuid`
- ✅ Geometric: `point`, `line`, `circle`, `polygon`, etc.
- ✅ Network: `inet`, `cidr`, `macaddr`
- ✅ Text Search: `tsvector`, `tsquery`
- ✅ XML: `xml`
- ✅ Range Types: `int4range`, `daterange`, `tstzrange`, etc.

### Functions & Operators
- ✅ String Functions: `CONCAT`, `SUBSTRING`, `UPPER`, `LOWER`, `TRIM`, etc.
- ✅ Date Functions: `NOW()`, `CURRENT_DATE`, `EXTRACT`, `DATE_TRUNC`, `AGE`, etc.
- ✅ Aggregate Functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `STRING_AGG`, `ARRAY_AGG`, `JSON_AGG`
- ✅ Window Functions: `ROW_NUMBER`, `RANK`, `LAG`, `LEAD`, `FIRST_VALUE`, etc.
- ✅ JSON Functions: `JSONB_BUILD_OBJECT`, `JSONB_AGG`, `->`, `->>`, `@>`, etc.
- ✅ Array Functions: `ARRAY_LENGTH`, `ARRAY_APPEND`, `UNNEST`, etc.

### Advanced Features
- ✅ CTEs (Common Table Expressions): `WITH` clauses
- ✅ Recursive CTEs: `WITH RECURSIVE`
- ✅ Lateral Joins: `LATERAL` subqueries
- ✅ Full Text Search: `@@`, `to_tsvector`, `to_tsquery`
- ✅ Materialized Views
- ✅ Sequences: `NEXTVAL`, `CURRVAL`, `SETVAL`
- ✅ Indexes: B-tree, Hash, GiST, GIN, BRIN, SP-GiST
- ✅ Foreign Keys with constraints
- ✅ Triggers and Functions
- ✅ Stored Procedures

## Security & Best Practices

### 🔒 Security

1. **Admin Only Access:** By default, only admin users can access the Database Explorer
2. **Connection Credentials:** Stored securely in the database (encrypted recommended)
3. **Query Logging:** All queries logged with user ID for audit trail
4. **No Direct Exposure:** Database credentials never sent to frontend
5. **Connection Pooling:** Secure, managed connections with automatic cleanup

### ✅ Best Practices

1. **Use LIMIT:** Always limit result sets for large tables
   ```sql
   SELECT * FROM large_table LIMIT 1000;
   ```

2. **Avoid SELECT *:** Specify needed columns
   ```sql
   -- ❌ Avoid
   SELECT * FROM users;
   
   -- ✅ Better
   SELECT id, email, first_name FROM users;
   ```

3. **Use Indexes:** Check query execution plans
   - Click "Explain" button to see execution plan
   - Look for sequential scans on large tables
   - Consider adding indexes for frequently queried columns

4. **Transaction Safety:** Be careful with UPDATE/DELETE
   ```sql
   -- Always use WHERE clause
   UPDATE users SET is_active = false WHERE id = 123;
   
   -- Never do this without WHERE
   -- UPDATE users SET is_active = false;  ⚠️
   ```

5. **Save Complex Queries:** Use favorites for frequently-used queries

6. **Test Queries:** Test with small LIMIT first, then increase
   ```sql
   -- Test first
   SELECT * FROM orders WHERE status = 'pending' LIMIT 10;
   
   -- Then run full query
   SELECT * FROM orders WHERE status = 'pending';
   ```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Execute query (or selected text) |
| `Ctrl/Cmd + S` | Save query to history |
| `Ctrl/Cmd + Shift + F` | Format SQL |
| `Ctrl/Cmd + /` | Toggle line comment |
| `Ctrl/Cmd + D` | Duplicate line |
| `Ctrl/Cmd + F` | Find in editor |
| `Ctrl/Cmd + H` | Find and replace |
| `F5` | Refresh object browser |

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to database

**Solutions:**
1. Verify database is running
2. Check host and port are correct
3. Verify username and password
4. Check firewall rules
5. Ensure database allows connections from application server
6. Test connection from Connectors page first

### Query Timeouts

**Problem:** Query takes too long and times out

**Solutions:**
1. Add appropriate indexes
2. Use LIMIT to reduce result set
3. Optimize query using EXPLAIN ANALYZE
4. Break complex queries into smaller parts
5. Consider materialized views for expensive aggregations

### Slow Performance

**Problem:** Database Explorer is slow

**Solutions:**
1. Limit expanded nodes in object tree
2. Use pagination for large result sets
3. Close unused query tabs
4. Clear query history periodically
5. Check database server resources

## API Reference

### Backend Endpoints

All endpoints require authentication and admin role.

#### Get Database Connectors
```
GET /api/db-explorer/connectors
```

#### Get Schemas
```
GET /api/db-explorer/:connectorId/schemas
```

#### Get Tables
```
GET /api/db-explorer/:connectorId/schemas/:schemaName/tables
```

#### Get Table Columns
```
GET /api/db-explorer/:connectorId/schemas/:schemaName/tables/:tableName/columns
```

#### Execute Query
```
POST /api/db-explorer/:connectorId/query
Body: { query: string, saveToHistory?: boolean }
```

#### Get Query History
```
GET /api/db-explorer/queries/history?connectorId=:id&page=:page&limit=:limit
```

#### Save Favorite Query
```
POST /api/db-explorer/queries/favorites
Body: { connectorId: number, queryText: string, queryName: string }
```

## Component Architecture

### Reusable Components

All Database Explorer components are designed to be reusable:

#### `<DbTree />`
```typescript
import { DbTree } from '@/components/db-explorer/DbTree';

<DbTree
  connectorId={1}
  onSelectObject={(object) => console.log(object)}
/>
```

#### `<SqlQueryEditor />`
```typescript
import { SqlQueryEditor } from '@/components/db-explorer/SqlQueryEditor';

<SqlQueryEditor
  value={query}
  onChange={setQuery}
  onExecute={executeQuery}
  isExecuting={loading}
/>
```

#### `<ResultsGrid />`
```typescript
import { ResultsGrid } from '@/components/db-explorer/ResultsGrid';

<ResultsGrid
  data={results}
  columns={columns}
  paginate={true}
  pageSize={50}
/>
```

#### `<ObjectDetailsPanel />`
```typescript
import { ObjectDetailsPanel } from '@/components/db-explorer/ObjectDetailsPanel';

<ObjectDetailsPanel
  connectorId={1}
  object={selectedObject}
/>
```

#### `<SchemaERD />`
```typescript
import { SchemaERD } from '@/components/db-explorer/SchemaERD';

<SchemaERD
  connectorId={1}
  schemaName="public"
/>
```

## Future Enhancements

### Planned Features

- [ ] **Multi-database Support:** MySQL, SQL Server, Oracle
- [ ] **Visual Query Builder:** Drag-and-drop query construction
- [ ] **Data Editor:** Edit table data inline with validation
- [ ] **Import/Export:** CSV, Excel import/export
- [ ] **Backup/Restore:** Database backup and restore functionality
- [ ] **User Permissions:** Fine-grained access control per database/table
- [ ] **Shared Queries:** Share queries with team members
- [ ] **Query Scheduling:** Run queries on schedule
- [ ] **Webhooks:** Trigger webhooks based on query results
- [ ] **Real-time Collaboration:** Multiple users working simultaneously
- [ ] **AI Assistant:** Natural language to SQL conversion
- [ ] **Performance Monitoring:** Query performance tracking and optimization suggestions

### Contributing

To contribute to the Database Explorer:

1. Create feature branch: `git checkout -b feature/db-explorer-enhancement`
2. Make changes following existing patterns
3. Test thoroughly with multiple database scenarios
4. Update documentation
5. Submit pull request

## Support

For issues or questions:

1. Check this documentation
2. Review troubleshooting section
3. Check application logs
4. Contact system administrator

## License

Part of the main application. See main application license.

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-19  
**Maintained By:** Development Team

