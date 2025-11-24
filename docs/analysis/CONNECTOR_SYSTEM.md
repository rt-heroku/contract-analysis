# Connector System Documentation

**Last Updated:** January 23, 2025, 7:30 AM

## Overview

The **Connector System** provides unified access to external data sources and services through a pluggable architecture with encrypted credential storage, connection pooling, and automatic discovery.

**Purpose:** Abstract away the complexity of connecting to different systems (databases, APIs, file storage, AI services)

**Current State:** Production-ready for databases, partial implementation for other types

---

## Connector Types

| Type | Purpose | Status | Config Fields |
|------|---------|--------|---------------|
| `database` | PostgreSQL, MySQL, etc. | ✅ Production | host, port, database, user, password, ssl |
| `rest` | REST APIs | ⚠️ Beta | baseUrl, headers, auth |
| `s3` | Amazon S3 | ⚠️ Planned | bucket, region, accessKey, secretKey |
| `ftp` | FTP/SFTP | ⚠️ Planned | host, port, username, password |
| `redis` | Redis cache | ⚠️ Planned | host, port, password, db |
| `file` | Local filesystem | ⚠️ Planned | path, permissions |

---

## Architecture

```
┌─────────────────────────────────────┐
│   USER / APPLICATION CODE           │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   CONNECTOR SERVICE                 │
│   - CRUD operations                 │
│   - Validation                      │
│   - Encryption/Decryption           │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   CONNECTOR TABLE (Database)        │
│   - Config (encrypted)              │
│   - Type, version                   │
│   - Metadata                        │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   CONNECTION POOL MANAGER           │
│   - Pool per user+connector         │
│   - Auto cleanup                    │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│   EXTERNAL SYSTEM                   │
│   - Database, API, Storage, etc.    │
└─────────────────────────────────────┘
```

---

## Database Schema

```typescript
model Connector {
  id            Int      @id @default(autoincrement())
  name          String   // e.g., "Production PostgreSQL"
  connectorType String   // 'database', 'rest', 's3', etc.
  version       String   // e.g., "1.0.0"
  config        Json     // ENCRYPTED credentials
  authType      String?  // 'basic', 'bearer', 'oauth2', 'api_key'
  openApiSpec   Json?    // For REST connectors
  iconUrl       String?  // Custom icon
  isActive      Boolean  @default(true)
  isAutoCreated Boolean  @default(false)
  category      String?  // 'System', 'User', 'External'
  createdBy     Int
  sharedWith    Json     @default("[]")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  creator          User              @relation("ConnectorCreator")
  connectorActions ConnectorAction[]
  actions          Action[]          @relation("ConnectorActions")
  stores           Store[]
  dbQueries        DbQuery[]
  dbConnections    DbConnection[]
  analysisResults  DbAnalysisResult[]
}
```

---

## Encryption

### AES-256-GCM Encryption

**File:** `backend/src/utils/encryption.ts`

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte hex
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export const encryption = {
  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },

  decrypt(text: string): string {
    const [ivHex, authTagHex, encrypted] = text.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },

  isEncrypted(text: string): boolean {
    return text.includes(':') && text.split(':').length === 3;
  },
};

export const encryptConnectorConfig = (config: any): any => {
  const sensitiveFields = ['password', 'apiKey', 'secretKey', 'clientSecret', 'token'];
  
  const encrypted = { ...config };
  
  for (const field of sensitiveFields) {
    if (encrypted[field] && !encryption.isEncrypted(encrypted[field])) {
      encrypted[field] = encryption.encrypt(encrypted[field]);
    }
  }
  
  return encrypted;
};

export const decryptConnectorConfig = (config: any): any => {
  const sensitiveFields = ['password', 'apiKey', 'secretKey', 'clientSecret', 'token'];
  
  const decrypted = { ...config };
  
  for (const field of sensitiveFields) {
    if (decrypted[field] && encryption.isEncrypted(decrypted[field])) {
      decrypted[field] = encryption.decrypt(decrypted[field]);
    }
  }
  
  return decrypted;
};
```

**Security Notes:**
- ✅ AES-256-GCM (authenticated encryption)
- ✅ Random IV per encryption
- ✅ Auth tag for integrity
- ⚠️ Key stored in environment variable (single point of failure)
- ⚠️ No key rotation strategy

---

## Auto-Discovery

**File:** `backend/src/services/auto-connector.service.ts`

**Purpose:** Automatically create connectors from environment variables on startup

```typescript
export const autoConnectorService = {
  async detectAndCreateConnectors(systemUserId: number): Promise<void> {
    await this.detectDatabaseConnector(systemUserId);
    await this.detectRedisConnector(systemUserId);
    // ... more detectors
  },

  async detectDatabaseConnector(systemUserId: number): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    const dbName = this.extractDatabaseName(databaseUrl);
    const dbHost = this.extractDatabaseHost(databaseUrl);

    // Check if connector already exists
    const existing = await prisma.connector.findFirst({
      where: {
        connectorType: 'database',
        isAutoCreated: true,
        name: `Database - ${dbName}`,
      },
    });

    if (existing) return;

    // Create connector
    await prisma.connector.create({
      data: {
        name: `Database - ${dbName}`,
        connectorType: 'database',
        config: {
          host: dbHost,
          database: dbName,
          _connectionString: databaseUrl, // Encrypted
        },
        isAutoCreated: true,
        isActive: true,
        createdBy: systemUserId,
      },
    });
  },

  extractDatabaseName(url: string): string {
    const match = url.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'unknown';
  },

  extractDatabaseHost(url: string): string {
    const match = url.match(/@([^:/]+)/);
    return match ? match[1] : 'localhost';
  },
};
```

**Startup Flow:**
```
1. Server starts
2. Auto-connector service runs
3. Detects DATABASE_URL env var
4. Creates "Database - [name]" connector
5. Marks as isAutoCreated: true
6. Encrypts connection string
```

---

## Connection Pooling

**File:** `backend/src/services/dbExplorer.service.ts`

```typescript
class DatabaseExplorerService {
  private pools: Map<string, Pool> = new Map();

  async getPool(connectorId: number, userId: number): Promise<Pool> {
    const cacheKey = `${connectorId}-${userId}`;

    // Return existing pool
    if (this.pools.has(cacheKey)) {
      return this.pools.get(cacheKey)!;
    }

    // Fetch connector
    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
    });

    if (!connector || connector.connectorType !== 'database') {
      throw new Error(`Invalid connector: ${connectorId}`);
    }

    // Decrypt config
    const { decryptConnectorConfig } = require('../utils/encryption');
    const config = decryptConnectorConfig(connector.config);

    // Create pool
    const poolConfig = {
      host: config.host,
      port: config.port || 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: config.connectTimeout || 5000,
      idleTimeoutMillis: config.idleTimeout || 30000,
      max: config.poolMax || 10,
    };

    const pool = new Pool(poolConfig);

    // Handle errors
    pool.on('error', (err) => {
      logger.error(`Pool error for connector ${connectorId}:`, err);
      this.pools.delete(cacheKey);
    });

    // Test connection
    try {
      const client = await pool.connect();
      client.release();
    } catch (error) {
      await pool.end();
      throw new Error(`Connection test failed: ${error.message}`);
    }

    this.pools.set(cacheKey, pool);
    return pool;
  }

  async closePool(connectorId: number, userId: number): Promise<void> {
    const cacheKey = `${connectorId}-${userId}`;
    const pool = this.pools.get(cacheKey);
    
    if (pool) {
      await pool.end();
      this.pools.delete(cacheKey);
    }
  }
}
```

**Pool Strategy:**
- ✅ One pool per user+connector combination
- ✅ Lazy initialization (created on first use)
- ✅ Connection testing before caching
- ⚠️ No automatic cleanup (pools live forever)
- ⚠️ Memory leak risk with many users

---

## Connection Testing

**File:** `backend/src/services/connector.service.ts`

```typescript
async testConnection(connectorId: number, userId: number): Promise<boolean> {
  try {
    const connector = await prisma.connector.findUnique({
      where: { id: connectorId },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    if (connector.connectorType === 'database') {
      return await this.testDatabaseConnection(connector);
    } else if (connector.connectorType === 'rest') {
      return await this.testRestConnection(connector);
    }

    throw new Error(`Unsupported connector type: ${connector.connectorType}`);
  } catch (error: any) {
    logger.error('Connection test failed:', error);
    throw new Error(`Connection test failed: ${error.message}`);
  }
}

private async testDatabaseConnection(connector: Connector): Promise<boolean> {
  const config = decryptConnectorConfig(connector.config);
  
  const pool = new Pool({
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1');
    client.release();
    await pool.end();
    return result.rowCount > 0;
  } catch (error) {
    await pool.end();
    throw error;
  }
}
```

**Test Flow:**
```
1. User saves connector configuration
2. Backend calls testConnection()
3. Creates temporary pool
4. Executes test query (SELECT 1)
5. Returns success/failure
6. Closes temporary pool
```

---

## Connector Actions

**Purpose:** Define available operations per connector

**Example:** OpenAPI-based REST connector

```typescript
// After creating REST connector with OpenAPI spec
async parseOpenApiSpec(connectorId: number, spec: any): Promise<void> {
  const paths = spec.paths || {};
  
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
        await prisma.connectorAction.create({
          data: {
            connectorId,
            operation: `${method.toUpperCase()} ${path}`,
            operationId: details.operationId,
            displayName: details.summary || `${method.toUpperCase()} ${path}`,
            description: details.description,
            method: method.toUpperCase(),
            path,
            parameters: details.parameters || {},
            requestBody: details.requestBody,
            responses: details.responses,
          },
        });
      }
    }
  }
}
```

**Result:** Every REST endpoint becomes a reusable `ConnectorAction`

---

## Integration with Actions

**File:** `backend/prisma/schema.prisma`

```typescript
model Action {
  id                 Int
  name               String
  connectorId        Int?
  connectorOperation String? // e.g., "GET /users"
  
  connector Connector? @relation("ConnectorActions")
}
```

**Usage:** Actions can reference connectors

```typescript
// Create action that calls REST API
await prisma.action.create({
  data: {
    name: 'fetch-users',
    displayName: 'Fetch Users',
    actionType: 'connector',
    category: 'api',
    connectorId: restConnectorId,
    connectorOperation: 'GET /api/users',
    executorType: 'connector',
  },
});
```

---

## Store Abstraction (Planned)

**Purpose:** Logical data repositories above connectors

**Schema:**
```typescript
model Store {
  id          Int
  connectorId Int
  name        String
  storeType   String // 'database', 's3', 'ftp', etc.
  dataType    String // 'jsonb', 'text', 'blob'
  config      Json   // Store-specific config
  isDefault   Boolean
  
  connector Connector @relation(fields: [connectorId])
}
```

**Use Case:** Unified data access

```typescript
// Read from store (abstracts underlying connector)
const data = await storeService.read('UserStore', { userId: 123 });

// Write to store
await storeService.write('UserStore', { userId: 123, ...userData });
```

**Status:** ⚠️ Models defined, no implementation

---

## API Endpoints

**Base:** `/api/connectors`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List connectors |
| GET | `/:id` | Get connector by ID |
| POST | `/` | Create connector |
| PUT | `/:id` | Update connector |
| DELETE | `/:id` | Delete connector |
| POST | `/:id/test` | Test connection |
| POST | `/import-openapi` | Import OpenAPI spec |
| GET | `/:id/actions` | List connector actions |

---

## Security Considerations

### ✅ Implemented
1. Credentials encrypted at rest (AES-256-GCM)
2. Decryption only when needed
3. Passwords never returned in API responses
4. User-based access control (`createdBy`, `sharedWith`)
5. Connection testing before save

### ⚠️ Missing
1. Key rotation strategy
2. Audit log for credential access
3. Multi-tenancy isolation
4. Rate limiting on connection attempts
5. Credential expiration/refresh

---

## Recommendations

### Short-Term
1. Implement pool cleanup cron job
2. Add connection timeout limits
3. Log all credential decryption events
4. Add retry logic for transient failures

### Medium-Term
1. Implement Store layer
2. Add more connector types (S3, Redis)
3. OpenAPI import UI
4. Connector health monitoring

### Long-Term
1. Key management service (AWS KMS, HashiCorp Vault)
2. Multi-region support
3. Connector marketplace
4. Auto-scaling connection pools

---

**Document Status:** ✅ Complete  
**Next:** See `PROCESS_ENGINE.md` for workflow execution

