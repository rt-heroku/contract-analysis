# Encryption Format Migration Guide

## Overview

This guide covers migrating encrypted data from the **old CBC format** to the **new GCM format**.

### What Changed

**Old Format (CBC):**
- Algorithm: `aes-256-cbc`
- Format: `IV:ENCRYPTED_DATA` (hex with colon separator)
- Key Source: `ENCRYPTION_KEY` OR fallback to `JWT_SECRET` via scrypt
- Example: `a6b14964b88da81d0a211715cd2d88c2:eb46632307364e25...`

**New Format (GCM):**
- Algorithm: `aes-256-gcm`
- Format: `SALT+IV+TAG+ENCRYPTED` (binary, base64 encoded)
- Key Source: `ENCRYPTION_KEY` only (with PBKDF2)
- Example: `dGhpcyBpcyBhIHRlc3QgZW5jcnlwdGlvbiBzdHJpbmc...`

## Why Migration is Needed

The new GCM format provides:
- ✅ Better security (authenticated encryption)
- ✅ Protection against tampering
- ✅ Resistance to padding oracle attacks
- ✅ Per-record salts for additional security

However, existing data encrypted with CBC format cannot be read by the new code. This one-time migration converts all existing data to the new format.

## Prerequisites

### 1. Backup Database

```bash
# Heroku Postgres
heroku pg:backups:capture --app contract-dev
heroku pg:backups:capture --app contract

# Verify backup exists
heroku pg:backups --app contract-dev
```

### 2. Verify Environment Variables

Both environments need:
- `ENCRYPTION_KEY` - Required for new format
- `JWT_SECRET` - May be needed if old data used it

```bash
# Check dev
heroku config:get ENCRYPTION_KEY -a contract-dev
heroku config:get JWT_SECRET -a contract-dev

# Check prod
heroku config:get ENCRYPTION_KEY -a contract
heroku config:get JWT_SECRET -a contract
```

### 3. Test Database Access

```bash
# Connect to database
cd backend

# Set environment variable
export DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev)

# Test connection
npm run migration:verify-key
```

## Migration Process

### Step 1: Verify Which Key is Used

This determines whether your data was encrypted with `ENCRYPTION_KEY` or `JWT_SECRET`:

```bash
cd backend

# For contract-dev
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run migration:verify-key
```

**Expected Output:**
```
✅ RESULT: Data can be decrypted with: ENCRYPTION_KEY
```

or

```
✅ RESULT: Data can be decrypted with: JWT_SECRET
```

### Step 2: Dry Run Migration

Test the migration without modifying data:

```bash
# For contract-dev (dry run - no changes)
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run migration:encrypt-format
```

**Review the output carefully:**
- How many records will be migrated?
- Are there any errors?
- Are all records in legacy format?

### Step 3: Execute Migration

Once dry run looks good, execute the actual migration:

```bash
# For contract-dev (ACTUAL MIGRATION)
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run migration:encrypt-format --execute
```

**What Happens:**
1. Script waits 5 seconds (Ctrl+C to cancel)
2. Processes each IDP execution:
   - Detects format (CBC vs GCM)
   - Decrypts with old key
   - Re-encrypts with new GCM format
   - Updates database
3. Shows summary with results

### Step 4: Verify Migration

Check that all data can be decrypted with new format:

```bash
# Verify data is in new format
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run encryption:inspect
```

**Expected Output:**
```
All entries should show:
  Encrypted data: X bytes (where X > 0)
  ✅ Proper encryption format
```

### Step 5: Test Application

1. **Keep the old (reverted) version running** for now
2. **Deploy the new code** to a test dyno or staging
3. **Test IDP executions:**
   - View list
   - Edit an execution
   - See decrypted values
   - Save changes
4. **If successful**, deploy to production

### Step 6: Repeat for Production

Once dev is working:

```bash
# Backup production
heroku pg:backups:capture --app contract

# Verify key
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract) \
npm run migration:verify-key

# Dry run
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract) \
npm run migration:encrypt-format

# Execute (if dry run looks good)
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract) \
npm run migration:encrypt-format --execute

# Verify
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract) \
npm run encryption:inspect
```

## Affected Tables

### 1. `idp_executions` ✅ Handled by Migration

Fields migrated:
- `auth_client_id`
- `auth_client_secret`  
- `anypoint_username`
- `anypoint_password`

### 2. `connectors` ⚠️ May Need Manual Review

The `config` JSON field may contain encrypted values:
- `password`
- `apiKey`
- `token`
- `_accessKeyId`
- `_secretAccessKey`

The migration script will **detect** but **not automatically migrate** connector configs. Review the output to see if connectors need attention.

## Troubleshooting

### Error: "Neither ENCRYPTION_KEY nor JWT_SECRET is set"

**Solution:** Set the environment variable before running:
```bash
ENCRYPTION_KEY=<your_key> DATABASE_URL=<db_url> npm run migration:verify-key
```

### Error: "Could not decrypt data with any available key"

**Possible causes:**
1. Wrong `ENCRYPTION_KEY` or `JWT_SECRET` value
2. Data was encrypted with different credentials
3. You're connected to wrong database

**Solution:**
1. Verify you're using the same key that was used to encrypt the data
2. Check Heroku config: `heroku config -a contract-dev`
3. Try on the reverted (working) version to confirm keys work

### Error: "Invalid initialization vector"

**Cause:** Data is corrupted or in unexpected format

**Solution:**
1. Check if data length is correct: `npm run encryption:inspect`
2. Verify you're using the correct database
3. Restore from backup if data is corrupted

### Migration Partially Completed

If migration fails midway:

**Option 1: Resume**
- The script skips already-migrated records (GCM format)
- Simply run again: `npm run migration:encrypt-format --execute`

**Option 2: Rollback**
```bash
# Restore from backup
heroku pg:backups:restore <backup-id> DATABASE_URL --app contract-dev
```

## Post-Migration

### 1. Update Code

After successful migration, the codebase only needs the new GCM format code. Old CBC code can be removed.

### 2. Monitor Logs

Watch for any decryption errors:
```bash
heroku logs --tail --app contract-dev | grep -i decrypt
```

### 3. Document

Update your team about:
- Migration completed
- Only `ENCRYPTION_KEY` is used now
- `JWT_SECRET` is no longer used for encryption
- Old CBC format is deprecated

## Example Migration Session

```bash
# Terminal session example for contract-dev

$ cd backend

$ DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) npm run migration:verify-key

🔍 Verifying which encryption key is being used...
✅ RESULT: Data can be decrypted with: ENCRYPTION_KEY

$ DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) npm run migration:encrypt-format

Mode: 🟡 DRY RUN (no changes)

🔄 Processing idp_executions table...

  Processing ID 1: Prem Pack
    ✅ Decrypted with old CBC format
    ✅ Re-encrypted with new GCM format
    ℹ️  Would update in database (dry run)

[... 3 more entries ...]

IDP Executions:
  Total: 4
  Migrated: 4
  Skipped: 0
  Failed: 0

$ DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) npm run migration:encrypt-format --execute

⚠️  WARNING: This will modify your database!
   Waiting 5 seconds... (Ctrl+C to cancel)

[... migration runs ...]

✅ Migration completed successfully!

$ DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) npm run encryption:inspect

📋 Found 4 IDP executions

ID: 1 | Name: Prem Pack
  Encrypted data: 48 bytes ✅
  ✅ Proper encryption format

[... 3 more entries, all showing GCM format ...]

$ # Deploy new code
$ git push origin main
```

## Safety Checklist

Before migrating production:

- [ ] Database backup created and verified
- [ ] Migration tested on dev environment
- [ ] Dry run completed successfully
- [ ] Application tested with migrated dev data
- [ ] Team notified of maintenance window
- [ ] Rollback plan documented
- [ ] Keys verified and documented
- [ ] Monitoring in place for errors

## Rollback Plan

If migration causes issues:

### 1. Database Rollback
```bash
# List backups
heroku pg:backups --app contract-dev

# Restore specific backup
heroku pg:backups:restore b123 DATABASE_URL --app contract-dev
```

### 2. Code Rollback
```bash
# Rollback Heroku release
heroku releases:rollback v141 --app contract-dev

# Or redeploy previous commit
git push origin <previous-commit>:main
```

### 3. Verify Rollback
```bash
# Test that old code works with old data
heroku logs --tail --app contract-dev
```

## FAQs

**Q: Can I run this migration while users are active?**  
A: Yes, but it's recommended during low-traffic period. The migration is fast (< 1 second per record).

**Q: What happens if migration fails halfway?**  
A: Records already migrated stay in new format. Re-running will skip them and continue with remaining records.

**Q: Do I need to migrate connectors manually?**  
A: Check the migration output. If connectors have encrypted fields, review them manually.

**Q: Can I revert to old encryption after migration?**  
A: Only by restoring database backup. There's no reverse migration script.

**Q: Will new records created during migration be in old format?**  
A: No. New code always uses new GCM format, even during migration.

## Support

If you encounter issues:

1. Check Heroku logs: `heroku logs --tail --app contract-dev`
2. Run diagnostics: `npm run encryption:inspect`
3. Review this guide's troubleshooting section
4. Restore from backup if needed

## Related Documents

- [Encryption Tool Guide](./ENCRYPTION_TOOL_GUIDE.md)
- [IDP Execution Data Loss Investigation](./IDP_EXECUTION_DATA_LOSS.md)
- [Encryption Key Fix Documentation](./ENCRYPTION_KEY_FIX.md)

