# Encryption Tool Guide

## Overview

The encryption tool (`backend/src/scripts/encryption-tool.ts`) helps you test, encrypt, decrypt, and migrate encrypted IDP execution credentials when the encryption key has changed.

## Problem Scenario

When the `ENCRYPTION_KEY` environment variable changes between deployments or environments, existing encrypted data in the database can no longer be decrypted, causing the error:

```
Error: Unsupported state or unable to authenticate data
```

This tool allows you to:
1. Test if a key can decrypt existing data
2. Find the correct old encryption key
3. Migrate all data from the old key to a new key

## Available Commands

### 1. List All IDP Executions
Shows all IDP executions and tests if they can be decrypted with the current key.

```bash
cd backend
ENCRYPTION_KEY=<your_key> npm run encryption:list
```

**Example output:**
```
📋 Found 4 IDP executions

ID: 1 | Name: Prem Pack | User: 11
  ✅ Client ID decrypts to: abc123def4...
  
ID: 2 | Name: Contract | User: 15
  ❌ Failed to decrypt Client ID
```

### 2. Test Decrypt a Value
Test if a specific encrypted value can be decrypted with a given key.

```bash
ENCRYPTION_KEY=<test_key> npm run encryption:test "<encrypted_base64_value>"
```

**Example:**
```bash
ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a \
  npm run encryption:test "aGVsbG8gd29ybGQ..."
```

**Success output:**
```
✅ Decryption successful!
Decrypted value: my-client-id-value
```

**Failure output:**
```
❌ Decryption failed: Unsupported state or unable to authenticate data
```

### 3. Encrypt a Value
Encrypt a plain text value with a given key.

```bash
ENCRYPTION_KEY=<your_key> npm run encryption:encrypt "<plain_value>"
```

**Example:**
```bash
ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a \
  npm run encryption:encrypt "my-client-id"
```

**Output:**
```
✅ Encryption successful!
Encrypted value: aGVsbG8gd29ybGQh...
```

### 4. Migrate All IDP Executions
Re-encrypt all IDP executions from an old key to a new key.

```bash
OLD_ENCRYPTION_KEY=<old_key> ENCRYPTION_KEY=<new_key> npm run encryption:migrate
```

**Example:**
```bash
OLD_ENCRYPTION_KEY=abc123... \
ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a \
npm run encryption:migrate
```

**Output:**
```
🔄 Migrating 4 IDP executions...

Processing ID 1: Prem Pack
  ✅ Decrypted with old key
  ✅ Re-encrypted with new key
  ✅ Updated in database

Processing ID 2: Contract
  ✅ Decrypted with old key
  ✅ Re-encrypted with new key
  ✅ Updated in database

📊 Migration complete:
  ✅ Success: 4
  ❌ Failed: 0
```

## Step-by-Step Migration Guide

### Step 1: Check Current State

First, verify the issue exists with your current key:

```bash
cd backend
ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env | cut -d '=' -f2) npm run encryption:list
```

If you see `❌ Failed to decrypt Client ID` for all entries, you need to find the old key.

### Step 2: Get Encrypted Value from Database

Connect to your database and get one encrypted value:

```bash
# For local development
psql $DATABASE_URL -c "SELECT id, name, auth_client_id FROM idp_executions WHERE is_active = true LIMIT 1;"
```

Copy the `auth_client_id` value (it will be a long base64 string).

### Step 3: Test Different Keys

Try different potential encryption keys. Common scenarios:

**Scenario A: Test with Heroku dev environment key:**
```bash
ENCRYPTION_KEY=$(heroku config:get ENCRYPTION_KEY -a contract-dev) \
  npm run encryption:test "<encrypted_value_from_db>"
```

**Scenario B: Test with Heroku prod environment key:**
```bash
ENCRYPTION_KEY=$(heroku config:get ENCRYPTION_KEY -a contract) \
  npm run encryption:test "<encrypted_value_from_db>"
```

**Scenario C: Test with a key from git history:**
```bash
# Search for old keys in git history
git log --all -S "ENCRYPTION_KEY" -- "*.env*"

# Then test with the old key
ENCRYPTION_KEY=<old_key_from_history> npm run encryption:test "<encrypted_value_from_db>"
```

### Step 4: Find the Working Key

Keep testing until you get:
```
✅ Decryption successful!
Decrypted value: <actual-value>
```

Make note of the key that worked!

### Step 5: Migrate All Data

Once you've found the old key that works, migrate all IDP executions:

```bash
OLD_ENCRYPTION_KEY=<key_that_worked> \
ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a \
npm run encryption:migrate
```

### Step 6: Verify Migration

Verify all entries can now be decrypted with the new key:

```bash
ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a \
  npm run encryption:list
```

You should now see `✅` for all entries.

### Step 7: Test in Application

Navigate to the IDP Executions page in your application. All executions should now load without `[DECRYPTION_ERROR]` messages.

## Environment Variables

The tool uses these environment variables:

- **`ENCRYPTION_KEY`**: The current/new encryption key (64-character hex string)
- **`OLD_ENCRYPTION_KEY`**: The old encryption key to migrate from (only needed for migration)
- **`DATABASE_URL`**: The database connection string (from `.env` file)

## Getting Encryption Keys

### From Local `.env` File:
```bash
grep ENCRYPTION_KEY backend/.env
```

### From Heroku:
```bash
heroku config:get ENCRYPTION_KEY -a contract
heroku config:get ENCRYPTION_KEY -a contract-dev
```

### Generate New Key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Error: "Unsupported state or unable to authenticate data"
This means the key you're testing doesn't match the key used to encrypt the data. Try a different key.

### Error: "ENCRYPTION_KEY environment variable not set"
You forgot to set the `ENCRYPTION_KEY` environment variable before the command. Use:
```bash
ENCRYPTION_KEY=<your_key> npm run encryption:...
```

### Error: "Cannot connect to database"
Make sure your `DATABASE_URL` is set correctly in `backend/.env` and the database is accessible.

### Migration succeeded but application still shows errors
1. Verify the `ENCRYPTION_KEY` in your application environment matches the new key used for migration
2. Restart your application to ensure it picks up the correct key
3. Clear any application caches

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit encryption keys to git** - Keep them in `.env` files that are gitignored
2. **Don't share keys in plain text** - Use secure channels (password managers, secrets vaults)
3. **Backup before migration** - Always backup your database before running migration
4. **Test on dev first** - Test the migration process on development environment before production
5. **Rotate keys carefully** - When rotating keys, always migrate data immediately after

## Production Migration Checklist

Before running migration in production:

- [ ] Backup production database
- [ ] Test migration on development environment first
- [ ] Verify old key works with at least one production record
- [ ] Schedule maintenance window (optional, migration is fast)
- [ ] Have rollback plan ready
- [ ] Document the new encryption key in secure location
- [ ] Update all environment variables after migration
- [ ] Verify application works after migration
- [ ] Monitor application logs for decryption errors

## Examples

### Complete Migration Example for Production:

```bash
# Step 1: Get into backend directory
cd backend

# Step 2: Test current state (expect failures)
ENCRYPTION_KEY=$(heroku config:get ENCRYPTION_KEY -a contract) npm run encryption:list

# Step 3: Get an encrypted value from production database
heroku pg:psql -a contract -c "SELECT auth_client_id FROM idp_executions WHERE is_active = true LIMIT 1;"

# Step 4: Try to find the old key (example: test with dev key)
OLD_KEY=$(heroku config:get ENCRYPTION_KEY -a contract-dev)
ENCRYPTION_KEY=$OLD_KEY npm run encryption:test "<encrypted_value_from_step3>"

# Step 5: If that worked, migrate! (Connect to prod database)
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract) \
OLD_ENCRYPTION_KEY=$OLD_KEY \
ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a \
npm run encryption:migrate

# Step 6: Verify
ENCRYPTION_KEY=$(heroku config:get ENCRYPTION_KEY -a contract) npm run encryption:list

# Step 7: Ensure production environment key matches
heroku config:set ENCRYPTION_KEY=88110958cdb4ae0e366f436e53c505e9be25ecd6a0f8831046461521873e519a -a contract
```

## Additional Resources

- [Encryption implementation](../backend/src/utils/encryption.ts)
- [IDP Execution service](../backend/src/services/idpExecution.service.ts)
- [Decryption error fix documentation](./ENCRYPTION_KEY_FIX.md)

