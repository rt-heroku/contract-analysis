# Configuration Documentation

**Last Updated:** January 23, 2025, 8:45 AM

## Overview

This document details all configuration mechanisms, environment variables, defaults, validation, and secrets management across the system.

---

## Environment Variables

### Backend Environment Variables

**File:** `backend/.env`

```bash
# ==================== CORE ====================
NODE_ENV=development                    # 'development' | 'production' | 'test'
PORT=5000                               # Backend server port
DATABASE_URL=postgresql://...           # PostgreSQL connection string

# ==================== SECURITY ====================
JWT_SECRET=your-secret-key-min-32-chars # JWT signing key (REQUIRED)
ENCRYPTION_KEY=64-char-hex-string       # AES-256-GCM key (REQUIRED, 32 bytes hex)
SESSION_EXPIRY=86400                    # Session expiration in seconds (default: 24h)

# ==================== MULESOFT ====================
MULESOFT_PROTOCOL=https
MULESOFT_HOST=api.mulesoft.com
MULESOFT_BASE_PATH=/idp/v1
MULESOFT_ORG_ID=your-org-id
MULESOFT_ACTION_ID=your-action-id
MULESOFT_ACTION_VERSION=1.0.0
MULESOFT_AUTH_CLIENT_ID=your-client-id
MULESOFT_AUTH_CLIENT_SECRET=your-client-secret

# ==================== AI SERVICES ====================
ANTHROPIC_API_KEY=sk-ant-...            # Claude API key (optional)
OPENAI_API_KEY=sk-...                   # OpenAI API key (optional)
AI_DEFAULT_PROVIDER=anthropic           # 'anthropic' | 'openai'
AI_DEFAULT_MODEL=claude-3-opus-20240229

# ==================== FILE STORAGE ====================
UPLOAD_MAX_SIZE=10485760                # 10MB in bytes
UPLOAD_ALLOWED_TYPES=pdf,xlsx,csv,xls,txt

# ==================== REDIS (OPTIONAL) ====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ==================== CORS ====================
CORS_ORIGIN=http://localhost:3000       # Frontend URL
CORS_CREDENTIALS=true

# ==================== LOGGING ====================
LOG_LEVEL=info                          # 'error' | 'warn' | 'info' | 'debug'
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m                        # Max log file size
LOG_MAX_FILES=14d                       # Keep logs for 14 days

# ==================== RATE LIMITING ====================
RATE_LIMIT_WINDOW_MS=900000             # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100             # Max requests per window

# ==================== EMAIL (OPTIONAL) ====================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com

# ==================== MONITORING (OPTIONAL) ====================
SENTRY_DSN=https://...                  # Error tracking
NEW_RELIC_LICENSE_KEY=...               # APM

# ==================== FEATURE FLAGS ====================
ENABLE_AI_FEATURES=true
ENABLE_PROCESS_ENGINE=true
ENABLE_PAGE_BUILDER=true
ENABLE_API_LOGGING=true
```

---

### Frontend Environment Variables

**File:** `frontend/.env`

```bash
# ==================== API ====================
VITE_API_URL=http://localhost:5000/api  # Backend API base URL

# ==================== APP ====================
VITE_APP_NAME=Document Processing Platform
VITE_APP_VERSION=1.0.0

# ==================== FEATURES ====================
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_DB_EXPLORER=true
VITE_ENABLE_PROCESS_BUILDER=true

# ==================== ANALYTICS (OPTIONAL) ====================
VITE_GOOGLE_ANALYTICS_ID=G-...
VITE_MIXPANEL_TOKEN=...

# ==================== ERROR TRACKING (OPTIONAL) ====================
VITE_SENTRY_DSN=https://...
```

---

## Configuration Files

### Backend Configuration

#### 1. Database Configuration

**File:** `backend/src/config/database.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

export default prisma;
```

**Logging Levels:**
- **Development:** Log queries, errors, warnings
- **Production:** Log errors only

---

#### 2. Environment Loader

**File:** `backend/src/config/env.ts`

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes = 64 hex chars
  SESSION_EXPIRY: z.string().transform(Number).default('86400'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Validate
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parseResult.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parseResult.data;
```

**Validation:**
- ✅ Required variables checked on startup
- ✅ Type coercion (string → number)
- ✅ Format validation (hex key length)
- ❌ Missing variables = server won't start

---

#### 3. MuleSoft Configuration

**File:** `backend/src/config/muleSoft.ts`

```typescript
export const muleSoftConfig = {
  protocol: process.env.MULESOFT_PROTOCOL || 'https',
  host: process.env.MULESOFT_HOST || 'api.mulesoft.com',
  basePath: process.env.MULESOFT_BASE_PATH || '/idp/v1',
  orgId: process.env.MULESOFT_ORG_ID,
  actionId: process.env.MULESOFT_ACTION_ID,
  actionVersion: process.env.MULESOFT_ACTION_VERSION,
  auth: {
    clientId: process.env.MULESOFT_AUTH_CLIENT_ID,
    clientSecret: process.env.MULESOFT_AUTH_CLIENT_SECRET,
  },
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Validate required fields
if (!muleSoftConfig.orgId || !muleSoftConfig.actionId) {
  console.warn('⚠️ MuleSoft configuration incomplete - document processing disabled');
}
```

---

#### 4. Logging Configuration

**File:** `backend/src/utils/logger.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'document-processing-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File output (errors only)
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    
    // File output (all logs)
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/app.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14,
    }),
  ],
});

export default logger;
```

---

### Frontend Configuration

#### Vite Configuration

**File:** `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          editor: ['@monaco-editor/react'],
          flow: ['reactflow'],
        },
      },
    },
  },
});
```

---

## Default Values

### Backend Defaults

| Variable | Default Value | Fallback Behavior |
|----------|---------------|-------------------|
| `PORT` | 5000 | Uses default |
| `NODE_ENV` | development | Safe default |
| `LOG_LEVEL` | info | Moderate logging |
| `SESSION_EXPIRY` | 86400 (24h) | Reasonable timeout |
| `RATE_LIMIT_WINDOW_MS` | 900000 (15min) | Standard rate limit |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Per window |
| `UPLOAD_MAX_SIZE` | 10485760 (10MB) | Reasonable file size |
| `CORS_ORIGIN` | http://localhost:3000 | Dev default |

**Critical (No Defaults):**
- `DATABASE_URL` - Must be provided
- `JWT_SECRET` - Must be provided
- `ENCRYPTION_KEY` - Must be provided

---

### Frontend Defaults

| Variable | Default Value | Fallback Behavior |
|----------|---------------|-------------------|
| `VITE_API_URL` | http://localhost:5000/api | Dev API |
| `VITE_APP_NAME` | Document Processing | Generic name |
| `VITE_ENABLE_AI_FEATURES` | true | Enable by default |

---

## Secrets Management

### Current Approach (Environment Variables)

**Storage:**
- Development: `.env` file (gitignored)
- Production: Environment variables in hosting platform

**Security:**
```
.env (local)
  ↓
Environment Variables (server)
  ↓
Application (runtime)
```

**Issues:**
- ⚠️ No encryption at rest
- ⚠️ No rotation strategy
- ⚠️ No audit trail
- ⚠️ Shared among all processes

---

### Recommended Approach (Secrets Manager)

**Option 1: AWS Secrets Manager**

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getSecret(secretName: string) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return JSON.parse(response.SecretString!);
}

// Usage
const dbCreds = await getSecret('prod/database');
const jwtSecret = await getSecret('prod/jwt-secret');
```

**Option 2: HashiCorp Vault**

```typescript
import Vault from 'node-vault';

const vault = Vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

async function getSecret(path: string) {
  const result = await vault.read(`secret/data/${path}`);
  return result.data.data;
}

// Usage
const secrets = await getSecret('production/app');
```

---

## Configuration Validation

### Startup Validation

**File:** `backend/src/server.ts`

```typescript
import { env } from './config/env';
import logger from './utils/logger';

// Validate critical configuration
function validateConfig() {
  const errors: string[] = [];

  // Check database connection
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  // Check JWT secret
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  // Check encryption key
  if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length !== 64) {
    errors.push('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  if (errors.length > 0) {
    errors.forEach(error => logger.error(`❌ ${error}`));
    process.exit(1);
  }

  logger.info('✅ Configuration validated');
}

// Run validation before starting server
validateConfig();
```

---

## Runtime Configuration

### Database Settings

**Table:** `system_settings`

**Purpose:** Dynamic configuration changeable without restart

```typescript
interface SystemSetting {
  settingKey: string;
  settingValue: string;
  description: string;
  category: string;
  isSecret: boolean;
}
```

**Examples:**
```sql
INSERT INTO system_settings (setting_key, setting_value, category, is_secret) VALUES
  ('mulesoft_api_url', 'https://api.mulesoft.com', 'Integration', false),
  ('ai_default_model', 'claude-3-opus-20240229', 'AI', false),
  ('max_upload_size', '10485760', 'File', false),
  ('session_timeout', '86400', 'Security', false),
  ('enable_api_logging', 'true', 'Logging', false);
```

**Service:**
```typescript
// backend/src/services/settings.service.ts
export const settingsService = {
  async get(key: string): Promise<string | null> {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });
    return setting?.settingValue || null;
  },

  async set(key: string, value: string): Promise<void> {
    await prisma.systemSetting.upsert({
      where: { settingKey: key },
      update: { settingValue: value },
      create: { settingKey: key, settingValue: value },
    });
  },
};
```

---

## Configuration Precedence

**Order (highest to lowest):**

1. **Runtime database settings** (`system_settings` table)
2. **Environment variables** (`.env` or system)
3. **Configuration files** (`config/*.ts`)
4. **Default values** (hardcoded)

**Example:**
```typescript
// Check in order
const apiUrl = 
  (await settingsService.get('mulesoft_api_url')) || // 1. Database
  process.env.MULESOFT_API_URL ||                    // 2. Env var
  muleSoftConfig.baseUrl ||                          // 3. Config file
  'https://api.mulesoft.com';                        // 4. Default
```

---

## Configuration Best Practices

### ✅ Good Practices

1. **Use environment variables for secrets**
   ```bash
   JWT_SECRET=... # Good
   ```

2. **Validate on startup**
   ```typescript
   if (!env.JWT_SECRET) process.exit(1); // Good
   ```

3. **Provide defaults for non-critical**
   ```typescript
   const port = env.PORT || 5000; // Good
   ```

4. **Use schema validation (Zod)**
   ```typescript
   const envSchema = z.object({ /* ... */ }); // Good
   ```

5. **Log configuration (sanitized)**
   ```typescript
   logger.info('Starting with config:', {
     port: env.PORT,
     dbHost: dbUrl.split('@')[1], // Hide credentials
   });
   ```

---

### ❌ Bad Practices

1. **Hardcoded secrets**
   ```typescript
   const secret = 'my-secret-key'; // ❌ Bad
   ```

2. **No validation**
   ```typescript
   const key = process.env.KEY; // ❌ Might be undefined
   ```

3. **Exposing secrets in logs**
   ```typescript
   logger.info('JWT Secret:', env.JWT_SECRET); // ❌ Exposed
   ```

4. **Committed `.env` files**
   ```bash
   # ❌ Never commit
   git add .env # Bad!
   ```

---

## Configuration for Different Environments

### Development

```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/dev_db
JWT_SECRET=dev-secret-key-min-32-characters
LOG_LEVEL=debug
ENABLE_API_LOGGING=true
```

### Staging

```bash
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db:5432/staging_db
JWT_SECRET=staging-secret-from-vault
LOG_LEVEL=info
ENABLE_API_LOGGING=true
```

### Production

```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-db:5432/prod_db
JWT_SECRET=prod-secret-from-vault
LOG_LEVEL=warn
ENABLE_API_LOGGING=true
SENTRY_DSN=https://...
```

---

## Recommendations

### Short-Term
1. Add `.env.example` file with all variables
2. Improve validation error messages
3. Document all environment variables

### Medium-Term
1. Migrate to secrets manager (Vault/AWS)
2. Implement configuration hot-reload
3. Add configuration UI (admin panel)

### Long-Term
1. Centralized configuration service
2. Feature flags system
3. A/B testing configuration

---

**Document Status:** ✅ Complete  
**All 10 documents generated successfully!**

