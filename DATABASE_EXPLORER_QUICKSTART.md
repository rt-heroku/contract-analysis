# Database Explorer - Quick Start Guide

## 🚀 Installation & Setup

### 1. Database Migration

Run the Prisma migration to add the required database tables:

```bash
cd backend
npx prisma db push
```

This will create:
- `db_queries` - Query history and favorites
- `db_connections` - Active database connections

### 2. Add Menu Item

Run the SQL script to add the Database Explorer to the menu:

```bash
# Using psql
psql $DATABASE_URL -f add-db-explorer-menu.sql

# Or using any PostgreSQL client, execute the SQL from:
# add-db-explorer-menu.sql
```

This grants access to users with the **admin** role.

### 3. Create a Database Connector

Before using the Database Explorer, you need at least one database connector:

1. Navigate to **Connectors** page
2. Click **New Connector**
3. Fill in details:
   - **Name:** My Database
   - **Type:** database
   - **Host:** localhost (or your database host)
   - **Port:** 5432
   - **Database:** your_database_name
   - **User:** your_username
   - **Password:** your_password
   - **SSL:** Check if required
4. Click **Test Connection**
5. If successful, click **Save**

### 4. Access the Database Explorer

1. Login as an admin user
2. Click **Database Explorer** in the menu
3. Select your connector from the dropdown
4. Start exploring!

## 📖 Quick Usage Guide

### Browse Database Objects

1. **Left sidebar** shows the object tree
2. Click to expand: Schemas → Tables/Views/Functions
3. Click on a table to:
   - See columns, indexes, foreign keys
   - Auto-generate SELECT query
   - View table DDL

### Write & Execute Queries

1. Type SQL in the **Query Editor** (center panel)
2. Press `Ctrl/Cmd + Enter` to execute
3. View results in the **Results Grid** below
4. Use toolbar buttons:
   - **Execute** - Run query
   - **Explain** - View execution plan
   - **Format** - Format SQL
   - **⭐** - Save as favorite

### Multiple Query Tabs

- Click **+** button to add new query tab
- Switch between tabs to work on multiple queries
- Close tabs with **×** button

### View Query History

1. Click **Code** icon in header
2. Browse recent queries
3. Click to load query into editor
4. ⭐ Mark queries as favorites

### Export Results

1. Execute a query
2. In Results Grid, click:
   - **CSV** - Export as CSV file
   - **JSON** - Export as JSON file

## 💡 Tips & Tricks

### Auto-completion

As you type, the editor suggests:
- SQL keywords (`SELECT`, `FROM`, `WHERE`, etc.)
- PostgreSQL functions (`NOW()`, `JSONB_BUILD_OBJECT()`, etc.)
- Press `Ctrl + Space` to trigger manually

### Execute Selected Text

1. Select part of your query
2. Press `Ctrl/Cmd + Enter`
3. Only selected text executes

Perfect for testing parts of complex queries!

### Format SQL

Press `Ctrl/Cmd + Shift + F` to auto-format your SQL with proper indentation.

### Copy Cell Values

Hover over any cell in the results grid and click the copy icon to copy the value.

### Sort Results

Click any column header to sort ascending/descending.

### Pagination

Large result sets are automatically paginated (50 rows per page). Navigate with:
- Previous/Next buttons
- Page number buttons

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Execute query |
| `Ctrl/Cmd + S` | Save to history |
| `Ctrl/Cmd + Shift + F` | Format SQL |
| `Ctrl/Cmd + /` | Comment line |
| `Ctrl/Cmd + F` | Find in editor |

## 🎯 Common Tasks

### View all users

```sql
SELECT * FROM users LIMIT 100;
```

### Count records in table

```sql
SELECT COUNT(*) as total FROM users;
```

### Find specific record

```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Join tables

```sql
SELECT 
  u.email,
  r.name as role
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id;
```

### Get table structure

1. Click on table in tree
2. Go to **Columns** tab
3. Or click **DDL** tab for CREATE statement

## ⚠️ Important Notes

### Safety

- **Always use WHERE clause** with UPDATE/DELETE
- **Test with LIMIT first** for large queries
- **Save important queries** as favorites
- **No confirmation** for destructive operations

### Permissions

- Currently **admin-only** access
- Can be customized in menu permissions
- All queries logged with user ID

### Performance

- Use **LIMIT** for large tables
- Check **Explain** for slow queries
- Close unused query tabs
- Collapse tree nodes when not needed

## 🆘 Troubleshooting

### "Failed to load schemas"

- Check connector configuration
- Verify database is running
- Check network connectivity
- Review backend logs

### Query timeout

- Query is too slow
- Add LIMIT to reduce rows
- Check indexes with EXPLAIN
- Break into smaller queries

### No results shown

- Check for errors in Results area
- Verify query syntax
- Check table has data

## 📚 Full Documentation

For complete documentation, see: [DATABASE_EXPLORER.md](./docs/DATABASE_EXPLORER.md)

Includes:
- Complete feature list
- Advanced usage examples
- PostgreSQL feature support
- API reference
- Component architecture
- Troubleshooting guide

## 🎉 You're Ready!

You now have a powerful database management interface integrated into your application. Happy querying!

---

**Questions?** Check the full documentation or contact your system administrator.

