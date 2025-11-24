# IDP Execution Decryption Error Fix

## Issue Description

**Error:** `Unsupported state or unable to authenticate data`

This error occurred when the `/api/idp-executions` endpoint tried to decrypt stored credentials (client IDs, client secrets, usernames, passwords) from the database. The error happened because:

1. The IDP execution credentials are stored encrypted in the database using AES-256-GCM encryption
2. The encryption uses the `ENCRYPTION_KEY` environment variable
3. The `ENCRYPTION_KEY` in production (Heroku) is different from the key used to encrypt the original data
4. When decryption is attempted with the wrong key, it fails with an authentication error

## Root Cause

The encryption implementation uses:
- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key derivation:** PBKDF2 with 100,000 iterations
- **Authentication:** GCM mode provides authenticated encryption

When the encryption key changes between environments or deployments:
- Existing encrypted data in the database cannot be decrypted
- The authentication tag verification fails
- The application crashes with "unable to authenticate data"

## Solution Implemented

Added comprehensive error handling around all credential decryption operations in:

### Files Modified
1. `backend/src/services/idpExecution.service.ts`
2. `backend/src/controllers/idpExecution.controller.ts`

### Changes Made

#### 1. List Operations (getUserExecutions, getSharedExecutions, getAllOtherExecutions)
- Wrapped decryption in try-catch blocks
- On failure, shows `[DECRYPTION_ERROR]` instead of crashing
- Logs the error for debugging
- API continues to work, showing which entries have decryption issues

#### 2. Detail Operations (getById, getForProcessing)
- Wrapped decryption in try-catch blocks
- On failure for owners viewing their own data, throws a clear error message
- Error message: "Failed to decrypt credentials. The encryption key may have changed."
- For shared executions (non-owners), shows `[DECRYPTION_ERROR]` placeholder

#### 3. Update Operations
- Added error handling when returning updated credentials
- Owners get a clear error if decryption fails
- Admins see `[DECRYPTION_ERROR]` placeholder if decrypting someone else's credentials fails

#### 4. Create Operations
- Added error handling after creating new executions
- Prevents crash if newly encrypted data cannot be immediately decrypted

## Deployment

- **Commit:** `f71fb95`
- **Heroku Release:** v54
- **Deployed:** November 24, 2025

## How to Verify the Fix

1. Navigate to the IDP Executions page in the application
2. The page should load successfully (no more 500 errors)
3. Executions with decryption issues will show `[DECRYPTION_ERROR]` for the client ID
4. New executions created after the fix will work normally

## Long-Term Solutions

### Option 1: Re-enter Credentials (Recommended for Few Executions)
If you have only a few IDP executions:
1. Delete the old executions with `[DECRYPTION_ERROR]`
2. Create new executions with fresh credentials
3. The new executions will be encrypted with the current `ENCRYPTION_KEY`

### Option 2: Re-encrypt Existing Data (Recommended for Many Executions)
If you have many IDP executions and the original encryption key:

1. Create a migration script to re-encrypt data:
```typescript
// backend/src/utils/migrateEncryption.ts
import prisma from '../config/database';
import { encrypt, decrypt } from './encryption';

async function migrateEncryption(oldKey: string, newKey: string) {
  const executions = await prisma.idpExecution.findMany();
  
  for (const exec of executions) {
    try {
      // Decrypt with old key (set temporarily)
      process.env.ENCRYPTION_KEY = oldKey;
      const oldDecrypt = (data: string) => decrypt(data);
      
      const decryptedClientId = oldDecrypt(exec.authClientId);
      const decryptedSecret = oldDecrypt(exec.authClientSecret);
      const decryptedUsername = exec.anypointUsername ? oldDecrypt(exec.anypointUsername) : null;
      const decryptedPassword = exec.anypointPassword ? oldDecrypt(exec.anypointPassword) : null;
      
      // Re-encrypt with new key
      process.env.ENCRYPTION_KEY = newKey;
      const newEncrypt = (data: string) => encrypt(data);
      
      await prisma.idpExecution.update({
        where: { id: exec.id },
        data: {
          authClientId: newEncrypt(decryptedClientId),
          authClientSecret: newEncrypt(decryptedSecret),
          anypointUsername: decryptedUsername ? newEncrypt(decryptedUsername) : null,
          anypointPassword: decryptedPassword ? newEncrypt(decryptedPassword) : null,
        },
      });
      
      console.log(`Re-encrypted execution ${exec.id}`);
    } catch (error) {
      console.error(`Failed to re-encrypt execution ${exec.id}:`, error);
    }
  }
}
```

2. Run the migration (one-time operation)

### Option 3: Set Consistent Encryption Key
Ensure the `ENCRYPTION_KEY` environment variable is consistent across all environments:

```bash
# Check current key in Heroku
heroku config:get ENCRYPTION_KEY -a contract

# If needed, update to match your development key
heroku config:set ENCRYPTION_KEY="your-64-char-hex-key" -a contract
```

**⚠️ Warning:** Changing the encryption key will break decryption of existing data unless you re-encrypt it first using Option 2.

## Prevention

To prevent this issue in the future:

1. **Document the encryption key:** Store it securely in a password manager or secrets vault
2. **Consistent keys:** Use the same `ENCRYPTION_KEY` across all environments (dev, staging, prod)
3. **Key rotation:** If you need to rotate keys, always migrate existing data first
4. **Backup before key changes:** Always backup the database before changing encryption keys

## Technical Details

### Encryption Implementation
- **File:** `backend/src/utils/encryption.ts`
- **Algorithm:** AES-256-GCM
- **Key derivation:** PBKDF2 (100,000 iterations, SHA-512)
- **Salt:** 64 bytes (random per encryption)
- **IV:** 16 bytes (random per encryption)
- **Auth tag:** 16 bytes (GCM authentication)

### Encrypted Fields in Database
Table: `idp_execution`
- `authClientId` (encrypted)
- `authClientSecret` (encrypted)
- `anypointUsername` (encrypted, nullable)
- `anypointPassword` (encrypted, nullable)

## Related Files
- `backend/src/utils/encryption.ts` - Encryption utilities
- `backend/src/services/idpExecution.service.ts` - IDP execution business logic
- `backend/src/controllers/idpExecution.controller.ts` - API endpoints
- `prisma/schema.prisma` - Database schema

## Additional Notes

- The fix is backward compatible - it doesn't change how encryption works
- Existing properly encrypted data continues to work normally
- Only data encrypted with a different key will show `[DECRYPTION_ERROR]`
- The application no longer crashes when encountering decryption errors
- Users can continue using other features while affected executions show errors

