# Dynamic Secrets Configuration

## Overview

The application uses a **dynamic secrets system** that loads sensitive configuration values (JWT_SECRET and ENCRYPTION_KEY) from the database first, with fallback to environment variables. This prevents authentication issues caused by inconsistent secret values during deployment.

## The Problem

### Traditional Approach (Prone to Errors)

```
1. Deploy app → environment variables set
2. Seed database → uses ENV vars to hash passwords
3. Environment variables change (or weren't set correctly)
4. Authentication fails → password hashes don't match
```

**Result:** Users can't login even with correct passwords!

### Why This Happens

- Heroku config vars may not be available during database seeding
- Config vars might be changed after initial setup
- Different values between environments (staging vs production)
- Missing config vars default to fallback values
- Password hashes created with one secret can't be verified with another

## The Solution

### Priority Order

```
1. Database (system_settings table) ← HIGHEST PRIORITY
2. Environment Variables (process.env)
3. Development Defaults (dev only) ← LOWEST PRIORITY
```

### How It Works

```typescript
// secrets.ts
export async function getJwtSecret(): Promise<string> {
  // 1. Try database first
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'jwt_secret' },
  });
  
  if (setting?.settingValue) {
    return setting.settingValue; // ← Use DB value
  }
  
  // 2. Fall back to environment variable
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  // 3. Development default
  if (process.env.NODE_ENV === 'development') {
    return 'dev-jwt-secret-change-in-production';
  }
  
  throw new Error('JWT_SECRET not configured');
}
```

## Configuration

### Setting Secrets in Database

#### Option 1: SQL (Recommended for Production)

```sql
-- Set JWT_SECRET
INSERT INTO "system_settings" (setting_key, setting_value, description, is_secret, created_at, updated_at)
VALUES (
  'jwt_secret',
  'your-super-secret-jwt-key-min-32-chars',
  'Secret key for JWT token generation',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value, updated_at = NOW();

-- Set ENCRYPTION_KEY
INSERT INTO "system_settings" (setting_key, setting_value, description, is_secret, created_at, updated_at)
VALUES (
  'encryption_key',
  'your-super-secret-encryption-key-32c',
  'Key for encrypting sensitive data',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value, updated_at = NOW();
```

#### Option 2: Heroku CLI

```bash
# Set via direct database command
heroku psql --app contract-dev --command "INSERT INTO system_settings (setting_key, setting_value, is_secret, created_at, updated_at) VALUES ('jwt_secret', 'your-secret-here', true, NOW(), NOW()) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;"
```

#### Option 3: Admin UI (If Available)

Navigate to **Admin → Settings** and set:
- `jwt_secret` → Your JWT secret key
- `encryption_key` → Your encryption key

### Setting Secrets via Environment Variables

```bash
# Local development (.env file)
JWT_SECRET=your-jwt-secret-key
ENCRYPTION_KEY=your-encryption-key-32-characters

# Heroku
heroku config:set JWT_SECRET=your-jwt-secret --app contract-dev
heroku config:set ENCRYPTION_KEY=your-encryption-key --app contract-dev
```

## Secret Requirements

### JWT_SECRET

- **Purpose:** Signs and verifies JWT authentication tokens
- **Minimum Length:** 32 characters recommended
- **Format:** Any string (alphanumeric + special chars)
- **Example:** `a9f8h3k2j5l6m7n8p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6`

**Generation:**
```bash
# Generate secure random string (macOS/Linux)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### ENCRYPTION_KEY

- **Purpose:** Encrypts sensitive data stored in database
- **Required Length:** Exactly 32 characters
- **Format:** Alphanumeric only
- **Example:** `abcdef1234567890abcdef1234567890`

**Generation:**
```bash
# Generate 32-character hex string
openssl rand -hex 16

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Implementation Details

### Caching

To avoid excessive database queries, secrets are cached for **5 minutes**:

```typescript
let secretsCache: {
  jwtSecret?: string;
  encryptionKey?: string;
  lastFetch?: number;
} = {};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### Server Startup

Secrets are pre-loaded when the server starts:

```typescript
// server.ts
const startServer = async () => {
  await prisma.$connect();
  
  // Initialize secrets from database
  await initializeSecrets(); // ← Load and cache secrets
  
  app.listen(PORT);
};
```

### Authentication Flow

```typescript
// auth.service.ts
generateToken(payload: JWTPayload): string {
  const jwtSecret = getJwtSecretSync(); // ← Uses cached value
  return jwt.sign(payload, jwtSecret, { expiresIn: '4h' });
}

verifyToken(token: string): JWTPayload {
  const jwtSecret = getJwtSecretSync(); // ← Uses cached value
  return jwt.verify(token, jwtSecret);
}
```

## Migration from Static Config

### Before (Static)

```typescript
// config/env.ts
const config = {
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
};

// auth.service.ts
jwt.sign(payload, config.jwtSecret);
```

### After (Dynamic)

```typescript
// config/secrets.ts
const jwtSecret = await getJwtSecret(); // ← Loads from DB first

// auth.service.ts
import { getJwtSecretSync } from '../config/secrets';
jwt.sign(payload, getJwtSecretSync());
```

## Deployment Checklist

### Initial Deployment

- [ ] **Step 1:** Deploy application
- [ ] **Step 2:** Generate secure secrets
- [ ] **Step 3:** Set secrets in database (SQL or Admin UI)
- [ ] **Step 4:** **OR** Set environment variables
- [ ] **Step 5:** Restart application
- [ ] **Step 6:** Create first admin user (CLI or First-Time Setup)
- [ ] **Step 7:** Test login

### Rotating Secrets

⚠️  **Warning:** Changing secrets will invalidate all existing sessions and passwords!

- [ ] **Step 1:** Notify users of planned maintenance
- [ ] **Step 2:** Generate new secrets
- [ ] **Step 3:** Update database settings
- [ ] **Step 4:** Clear secrets cache (restart app)
- [ ] **Step 5:** Reset all user passwords using CLI
- [ ] **Step 6:** Notify users to set new passwords

## Troubleshooting

### Issue: "JWT_SECRET not configured"

**Symptom:** Server won't start

**Solutions:**
1. Check database for `jwt_secret` setting
2. Verify environment variable is set: `echo $JWT_SECRET`
3. Ensure database is accessible

```bash
# Quick fix - set environment variable
export JWT_SECRET="temporary-secret-change-asap"
```

### Issue: "Invalid or expired token"

**Symptom:** Can't login despite correct password

**Cause:** JWT_SECRET changed between token generation and verification

**Solution:**
```bash
# Reset user passwords
npm run users -- RESET admin@demo.com NewPassword123
```

### Issue: Passwords don't match

**Symptom:** Login fails with correct password

**Cause:** ENCRYPTION_KEY or JWT_SECRET mismatch

**Solution:**
```bash
# Verify secrets are consistent
heroku config:get JWT_SECRET --app contract-dev
heroku psql --app contract-dev --command "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('jwt_secret', 'encryption_key');"

# Reset password after fixing secrets
npm run users -- RESET user@demo.com NewPassword
```

### Issue: Cache not updating

**Symptom:** Changes to database secrets not reflected

**Solution:** Restart the application to clear cache
```bash
heroku restart --app contract-dev
```

## Best Practices

### 1. Set Secrets BEFORE First User Creation

```bash
# Wrong order (may cause issues)
heroku run bash users.sh CREATE admin@demo.com pass123
heroku config:set JWT_SECRET=newsecret

# Correct order
heroku config:set JWT_SECRET=newsecret
heroku restart
heroku run bash users.sh CREATE admin@demo.com pass123
```

### 2. Use Database for Production

✅ **Recommended:**
```sql
-- Secrets in database
INSERT INTO system_settings ...
```

❌ **Not Recommended:**
```bash
# Secrets only in environment
heroku config:set JWT_SECRET=...
```

**Why?** Database is the single source of truth and survives config changes.

### 3. Document Secret Changes

```markdown
## Secret Change Log

2025-01-15: Initial JWT_SECRET set in database
2025-02-01: Rotated JWT_SECRET (security audit)
2025-03-15: Added ENCRYPTION_KEY to database
```

### 4. Test Secret Changes in Staging

```bash
# Staging
heroku run bash users.sh RESET admin@staging.com TestPass --app contract-staging
# Test login works

# Production (only if staging works)
heroku run bash users.sh RESET admin@prod.com ProdPass --app contract-prod
```

### 5. Monitor Failed Login Attempts

```sql
-- Check for authentication errors
SELECT * FROM activity_logs 
WHERE action_type = 'auth.login_failed' 
ORDER BY created_at DESC 
LIMIT 20;
```

## Security Considerations

### Secret Storage

- ✅ Secrets stored in database are marked as `is_secret = true`
- ✅ Secrets should never appear in application logs
- ✅ Secrets should never be committed to version control
- ✅ Use environment variables as fallback only

### Secret Rotation

- 🔄 Rotate secrets quarterly or after security incidents
- 📝 Document all secret changes
- 🔔 Notify users before rotation
- ✅ Test in staging before production

### Access Control

- 🔒 Only admins can view/edit secret settings
- 🔒 CLI requires database access (admin-level)
- 🔒 Heroku config access should be limited

## See Also

- [User Management CLI](./USER_MANAGEMENT_CLI.md)
- [First-Time Setup Guide](./FIRST_TIME_SETUP.md)
- [Authentication System](./AUTH_SYSTEM.md)
- [Deployment Guide](./DEPLOYMENT.md)

