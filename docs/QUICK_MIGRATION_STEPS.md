# Quick Migration Steps - TL;DR

## What Happened

**Root Cause:** Database has data encrypted with **OLD CBC format** (`IV:DATA`), but current code expects **NEW GCM format** (`SALT+IV+TAG+DATA`).

**Solution:** One-time migration to convert all data from CBC → GCM.

## Quick Steps

### 1. Backup First! 🚨

```bash
heroku pg:backups:capture --app contract-dev
heroku pg:backups:capture --app contract
```

### 2. Test Which Key Works

```bash
cd backend
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run migration:verify-key
```

Expected: `✅ RESULT: Data can be decrypted with: ENCRYPTION_KEY`

### 3. Dry Run (No Changes)

```bash
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run migration:encrypt-format
```

Review output - shows what will happen.

### 4. Execute Migration

```bash
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run migration:encrypt-format --execute
```

Wait 5 seconds, then migration runs.

### 5. Verify

```bash
DATABASE_URL=$(heroku config:get DATABASE_URL -a contract-dev) \
npm run encryption:inspect
```

All entries should show: `Encrypted data: X bytes` (X > 0)

### 6. Deploy New Code

```bash
git push origin main
# Let GitHub workflow deploy
```

### 7. Test Application

- Open IDP Executions page
- Edit an execution
- Verify you can see decrypted values
- Save changes

### 8. Repeat for Production

Same steps but with `-a contract` instead of `-a contract-dev`.

## If Something Goes Wrong

### Rollback Database
```bash
heroku pg:backups:restore b### DATABASE_URL --app contract-dev
```

### Rollback Code
```bash
heroku releases:rollback v### --app contract-dev
```

## Timeline Estimate

- Backup: 30 seconds
- Verify key: 5 seconds
- Dry run: 5 seconds
- Execute: 1-2 seconds (4 records)
- Verify: 5 seconds
- Deploy: 3-5 minutes
- **Total: ~6-7 minutes**

## Files Changed

- `backend/src/scripts/verify-encryption-key.ts` - NEW
- `backend/src/scripts/migrate-encryption-format.ts` - NEW
- `backend/package.json` - Added npm scripts
- `docs/ENCRYPTION_MIGRATION_GUIDE.md` - Full guide

## After Migration

✅ All data in new GCM format  
✅ Better security (authenticated encryption)  
✅ No more CBC compatibility needed  
✅ Can deploy current code without issues  

## Need Help?

See full guide: [ENCRYPTION_MIGRATION_GUIDE.md](./ENCRYPTION_MIGRATION_GUIDE.md)

