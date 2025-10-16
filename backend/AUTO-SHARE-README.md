# Auto-Share Analysis Trigger

## Overview

This PostgreSQL trigger automatically shares a specific analysis record (demo/tutorial analysis) with all newly created users. This ensures every new user immediately has access to the demo analysis for training purposes.

## Trigger Details

**Trigger Name**: `trigger_auto_share_analysis`  
**Function**: `auto_share_analysis_with_new_user()`  
**Event**: `AFTER INSERT` on `users` table  
**Target Analysis**: Record ID `60` (Job ID: `job_1760577441170_e5dbe538-6f74-4a17-92b3-22c8b4fae357`)

## How It Works

1. When a new user is inserted into the `users` table
2. The trigger automatically fires
3. The new user's ID is added to the `shared_with` JSON array of analysis record #60
4. No code deployment needed - works at the database level

## Installation

The trigger has already been installed on the production database. To reinstall or install on another database:

```bash
psql "your_database_url" -f auto-share-analysis-trigger.sql
```

## What It Does

**Before User Creation**:
```json
{
  "id": 60,
  "shared_with": [2, 3]  // Users 2 and 3 have access
}
```

**After New User (ID 4) Registers**:
```json
{
  "id": 60,
  "shared_with": [2, 3, 4]  // New user 4 automatically added
}
```

## Verification

Check if the trigger is active:

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_share_analysis';
```

Check current shared users:

```sql
SELECT 
    id,
    job_id,
    shared_with,
    jsonb_array_length(shared_with) as shared_count
FROM analysis_records
WHERE id = 60;
```

## Modifying the Target Analysis

To change which analysis is auto-shared, edit the trigger function:

```sql
-- Open the function for editing
CREATE OR REPLACE FUNCTION auto_share_analysis_with_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_analysis_id INT := 60; -- Change this ID
    -- ... rest of function
```

Or drop and recreate with a different ID:

```sql
DROP TRIGGER trigger_auto_share_analysis ON users;
DROP FUNCTION auto_share_analysis_with_new_user();
-- Then run the SQL script again with the new ID
```

## Disable/Remove the Trigger

To temporarily disable:

```sql
ALTER TABLE users DISABLE TRIGGER trigger_auto_share_analysis;
```

To re-enable:

```sql
ALTER TABLE users ENABLE TRIGGER trigger_auto_share_analysis;
```

To permanently remove:

```sql
DROP TRIGGER IF EXISTS trigger_auto_share_analysis ON users;
DROP FUNCTION IF EXISTS auto_share_analysis_with_new_user();
```

## Benefits

✅ **No Code Changes**: Works at database level  
✅ **No Redeployment**: Immediate effect  
✅ **Automatic**: Every new user gets access  
✅ **Consistent**: Works regardless of registration method (API, admin panel, etc.)  
✅ **Efficient**: Single database operation per user  

## Current Status

- ✅ Trigger installed on production
- ✅ All existing users already have access
- ✅ Tested and verified working
- ✅ Monitoring: Check PostgreSQL logs for "Auto-shared analysis record" notices

## Notes

- The trigger only adds users to the `shared_with` array if they're not already present
- Does not affect the owner of the analysis record
- Updates the `updated_at` timestamp of the analysis record
- Works with user registration, admin creation, or any other insert method

