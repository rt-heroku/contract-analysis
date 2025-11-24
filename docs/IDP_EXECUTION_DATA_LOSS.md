# IDP Execution Data Loss Investigation

## Issue Summary

All 4 IDP executions in the database contain **empty encrypted data**. While the encryption structure is valid (salt, IV, and authentication tag are present), there are **0 bytes of actual encrypted credential data**.

## Findings

### Inspection Results

Running `npm run encryption:inspect` revealed:

```
All 4 entries:
- ✅ Valid base64 encoding
- ✅ Proper encryption structure (96 bytes)
- ❌ 0 bytes of encrypted data

Structure breakdown:
- Salt: 64 bytes ✅
- IV: 16 bytes ✅
- Auth Tag: 16 bytes ✅
- Encrypted Data: 0 bytes ❌
```

### Affected Entries

| ID | Name | User | Created | Last Modified |
|----|------|------|---------|--------------|
| 1 | Prem Pack | leilah.squires@salesforce.com | Nov 4 | Nov 4 (20 days ago) |
| 2 | Contract | admin@demo.com | Nov 6 | Nov 7 (17 days ago) |
| 3 | ServiceWire | leilah.squires@salesforce.com | Nov 7 | Nov 19 (5 days ago) |
| 4 | Puffer-PO-IDP-Demo | leilah.squires@salesforce.com | Nov 12 | Nov 12 (12 days ago) |

### Timeline

The data loss occurred sometime between:
- **Original creation**: Nov 4-12, 2025
- **Last modification**: Nov 19, 2025 (5 days ago)

## Root Cause Analysis

### What Happened

The credentials were replaced with **empty strings** at some point, which were then encrypted. When you encrypt an empty string with AES-256-GCM:
- Salt is generated (64 bytes)
- IV is generated (16 bytes)
- Authentication tag is created (16 bytes)
- But the encrypted data portion is 0 bytes

This results in a valid encryption structure that cannot be decrypted to meaningful data.

### Why No Key Works

The issue is NOT a wrong encryption key - the data itself is gone. Any decryption attempt fails because:
1. The authentication tag was created for empty data
2. Attempting to decrypt with any key cannot recover data that doesn't exist
3. The tag validation fails when trying to decrypt nothing

### Possible Causes

1. **Schema Migration**: The `prisma db push --accept-data-loss` command may have:
   - Altered the column type
   - Reset values to empty strings during column modification
   - Truncated data during migration

2. **Update Operation**: An update query may have inadvertently set credentials to empty strings

3. **Application Bug**: A bug in the application may have saved empty values

## Impact

- **Users affected**: 2 (leilah.squires@salesforce.com and admin@demo.com)
- **Entries affected**: 4 IDP executions
- **Data loss**: Complete loss of encrypted credentials (client IDs, client secrets, usernames, passwords)
- **Recoverability**: Data cannot be recovered without database backup from before Nov 4, 2025

## Solutions

### Option 1: Re-enter Credentials (Recommended)

Since there are only 4 entries and the data cannot be recovered, users should:

1. **Delete corrupted entries**:
   ```bash
   cd backend
   npm run encryption:cleanup delete
   ```

2. **Re-create IDP executions** through the UI with correct credentials

**Advantages**:
- Fast and simple
- Ensures correct current credentials
- Clean slate

### Option 2: Restore from Backup (If Available)

If you have a database backup from before November 4, 2025:

1. Export just the `idp_executions` table from backup
2. Restore it to current database
3. Verify encryption keys match between backup and current environment

**Note**: This requires the encryption key used when the backup was created.

## Prevention

To prevent this in the future:

### 1. Add Data Validation

Add a check to prevent saving empty encrypted credentials:

```typescript
// In idpExecution.service.ts create method
if (!data.authClientId || !data.authClientSecret) {
  throw new Error('Client ID and Client Secret are required');
}

// Validate before encryption
if (data.authClientId.trim() === '') {
  throw new Error('Client ID cannot be empty');
}
```

### 2. Backup Before Schema Changes

Always backup the database before running migrations:

```bash
# For Heroku Postgres
heroku pg:backups:capture --app contract
heroku pg:backups:capture --app contract-dev
```

### 3. Test Migrations on Dev First

Never run schema migrations directly on production. Always:
1. Test on dev environment
2. Verify data integrity
3. Then apply to production

### 4. Add Encryption Validation

Update the encryption utility to validate data length:

```typescript
// In encryption.ts
export function encrypt(text: string): string {
  if (!text || text.trim() === '') {
    throw new Error('Cannot encrypt empty string');
  }
  // ... existing encryption logic
}
```

### 5. Monitor Encryption Data Integrity

Run periodic checks:

```bash
# Add to monitoring/health checks
npm run encryption:inspect
```

## Action Items

### Immediate Actions

1. ✅ Investigate and confirm root cause (DONE - empty encrypted data)
2. ⚠️ Notify affected users about data loss
3. ⚠️ Delete corrupted entries: `npm run encryption:cleanup delete`
4. ⚠️ Have users re-create their IDP executions

### Short-term Actions

1. Add validation to prevent empty credential encryption
2. Add data integrity checks in CI/CD
3. Document backup/restore procedures

### Long-term Actions

1. Implement automatic database backups before deployments
2. Add monitoring for encryption data integrity
3. Consider adding audit logging for credential updates
4. Review schema migration process

## Verification Steps

After cleanup and re-creation:

1. **Verify new entries have data**:
   ```bash
   npm run encryption:inspect
   ```
   Should show: `Encrypted data: X bytes` (where X > 0)

2. **Test decryption works**:
   ```bash
   npm run encryption:list
   ```
   Should show: `✅ Client ID decrypts to: ...`

3. **Test in application**:
   - Navigate to IDP Executions page
   - All entries should load without errors
   - No `[DECRYPTION_ERROR]` messages

## Related Documents

- [Encryption Tool Guide](./ENCRYPTION_TOOL_GUIDE.md)
- [Encryption Key Fix Documentation](./ENCRYPTION_KEY_FIX.md)

## Diagnostic Commands

```bash
# Inspect encryption data structure
npm run encryption:inspect

# List and test decryption
npm run encryption:list

# Find corrupted entries
npm run encryption:cleanup

# Delete corrupted entries
npm run encryption:cleanup delete
```

## Conclusion

The decryption errors were NOT caused by a wrong encryption key. The actual credential data was lost during a database operation (likely schema migration) between November 4-19, 2025. The encrypted fields contain only the encryption metadata (salt, IV, tag) but no actual encrypted credential data.

**Resolution**: Users must re-enter their IDP execution credentials as the original data cannot be recovered.

