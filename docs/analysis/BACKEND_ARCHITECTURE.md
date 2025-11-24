# Backend Architecture Documentation

**Last Updated:** January 23, 2025, 7:00 AM

## Table of Contents
1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Layered Architecture](#layered-architecture)
4. [Routing Patterns](#routing-patterns)
5. [Controller Patterns](#controller-patterns)
6. [Service Layer Patterns](#service-layer-patterns)
7. [Middleware](#middleware)
8. [Authentication & Authorization](#authentication--authorization)
9. [Error Handling](#error-handling)
10. [Validation Patterns](#validation-patterns)
11. [API Endpoint Inventory](#api-endpoint-inventory)
12. [Code Organization Best Practices](#code-organization-best-practices)

---

## Overview

The backend is a **Node.js/Express.js** application written in **TypeScript** following a **layered architecture pattern**.

**Key Statistics:**
- **36 Controllers** (handling HTTP requests)
- **23 Services** (business logic)
- **29 Route files** (API definitions)
- **6 Middleware** (cross-cutting concerns)
- **1 Main Server** (`server.ts`)
- **1 Process Executor** (workflow engine)
- **20+ Action Types** (process building blocks)

**Architecture Style:** Layered monolith with service-oriented design

---

## Folder Structure

```
backend/src/
├── config/              # Configuration modules
│   ├── database.ts      # Prisma client setup
│   ├── env.ts           # Environment variable loading
│   ├── muleSoft.ts      # MuleSoft API configuration
│   ├── llmModels.ts     # AI model configurations
│   ├── secrets.ts       # Secret management
│   └── static.ts        # Static file serving
│
├── controllers/         # HTTP request handlers (36 files)
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── analysis.controller.ts
│   ├── process.controller.ts
│   ├── action.controller.ts
│   ├── connector.controller.ts
│   ├── dbExplorer.controller.ts
│   ├── flow.controller.ts
│   ├── pages.controller.ts
│   ├── prompt.controller.ts
│   ├── role.controller.ts
│   ├── store.controller.ts
│   ├── systemPrompt.controller.ts
│   ├── tableAnalysis.controller.ts
│   └── ... (22 more)
│
├── services/            # Business logic (23 files)
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── document.service.ts
│   ├── dbExplorer.service.ts      # 1,914 lines (LARGEST)
│   ├── process.service.ts
│   ├── action.service.ts
│   ├── connector.service.ts
│   ├── mulesoft.service.ts
│   ├── logging.service.ts
│   ├── systemPrompt.service.ts
│   ├── tableAnalysis.service.ts
│   ├── aiAnalysis.service.ts
│   └── ... (11 more)
│
├── routes/              # API route definitions (29 files)
│   ├── index.ts         # Main router (aggregates all routes)
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── analysis.routes.ts
│   ├── process.routes.ts
│   ├── action.routes.ts
│   ├── connector.routes.ts
│   ├── dbExplorer.routes.ts
│   ├── flow.routes.ts
│   ├── pages.routes.ts
│   ├── systemPrompt.routes.ts
│   ├── tableAnalysis.routes.ts
│   └── ... (17 more)
│
├── middleware/          # Request interceptors (6 files)
│   ├── auth.ts          # JWT validation
│   ├── admin.ts         # Admin role check
│   ├── activityLogger.ts # Activity logging
│   ├── errorHandler.ts  # Global error handling
│   ├── roleCheck.ts     # Role-based checks
│   └── validator.ts     # Request validation
│
├── execution-engine/    # Process execution runtime
│   ├── ProcessExecutor.ts
│   ├── ActionExecutor.ts
│   ├── actions/         # 19 action types
│   │   ├── ControlActions.ts
│   │   ├── DataActions.ts
│   │   ├── ApiActions.ts
│   │   ├── StorageActions.ts
│   │   ├── IdpActions.ts
│   │   └── ...
│   └── connectors/
│       └── ConnectorExecutor.ts
│
├── utils/               # Utility functions (12 files)
│   ├── logger.ts        # Winston logging
│   ├── encryption.ts    # AES-256-GCM encryption
│   ├── helpers.ts       # Common utilities
│   ├── constants.ts     # Application constants
│   ├── validators.ts    # Data validators
│   └── ...
│
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared types
│
├── scripts/             # Maintenance scripts (5 files)
│   ├── seedSystemPrompts.ts
│   ├── seedAnalysisPrompts.ts
│   └── ...
│
└── server.ts            # Application entry point
```

**Total Lines of Code:** ~30,000+ (estimated)

---

## Layered Architecture

### Diagram

```
┌────────────────────────────────────────────────────┐
│            CLIENT (HTTP Requests)                  │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│              MIDDLEWARE LAYER                       │
│  • Authentication (JWT validation)                  │
│  • Authorization (role checks)                      │
│  • Activity logging                                 │
│  • Error handling                                   │
│  • Request validation                               │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│              ROUTES LAYER                           │
│  • Define endpoints                                 │
│  • Apply middleware                                 │
│  • Connect to controllers                           │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│              CONTROLLERS LAYER                      │
│  • Handle HTTP request/response                     │
│  • Extract & validate request data                  │
│  • Call service layer                               │
│  • Format & return responses                        │
│  • Log activities                                   │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│              SERVICES LAYER                         │
│  • Business logic                                   │
│  • Data transformations                             │
│  • External API calls                               │
│  • Database operations (via Prisma)                 │
│  • Complex computations                             │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER                      │
│  • Prisma ORM                                       │
│  • Direct pg driver (for DB Explorer)               │
│  • Connection pooling                               │
└────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                  │
└────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Can Call | Cannot Call |
|-------|---------------|----------|-------------|
| **Routes** | Endpoint definitions | Controllers, Middleware | Services, Database |
| **Controllers** | Request handling | Services, Logging | Database directly |
| **Services** | Business logic | Other services, Prisma | Controllers, Routes |
| **Middleware** | Cross-cutting | Services (if needed) | Controllers |
| **Data Access** | Database ops | - | - |

**Violations Observed:**
- ⚠️ Some controllers call Prisma directly (bypassing service layer)
- ⚠️ Some services have no corresponding controller (orphaned)
- ⚠️ `dbExplorer.service.ts` is too large (1,914 lines)

---

## Routing Patterns

### Main Router (`routes/index.ts`)

**Pattern:** Aggregator that mounts all sub-routers

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import analysisRoutes from './analysis.routes';
// ... 26 more imports

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/analysis', analysisRoutes);
router.use('/admin', adminRoutes);
router.use('/db-explorer', dbExplorerRoutes);
router.use('/processes', processRoutes);
router.use('/actions', actionRoutes);
router.use('/connectors', connectorRoutes);
router.use('/system-prompts', systemPromptRoutes);
router.use('/table-analysis', tableAnalysisRoutes);
// ... 19 more mounts

export default router;
```

### Sub-Router Pattern

**Structure:** Each domain has its own route file

**Example: `auth.routes.ts`**
```typescript
import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authenticate, authController.refreshToken);
router.get('/me', authenticate, authController.getMe);

export default router;
```

**Example: `dbExplorer.routes.ts` (complex)**
```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as dbExplorerController from '../controllers/dbExplorer.controller';
import * as dbTableOperations from '../controllers/dbTableOperations.controller';
import * as dbDataOperations from '../controllers/dbDataOperations.controller';
import * as dbIndexOperations from '../controllers/dbIndexOperations.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Schema and table browsing
router.get('/:connectorId/schemas', dbExplorerController.getSchemas);
router.get('/:connectorId/schemas/:schemaName/tables', dbExplorerController.getTables);
router.get('/:connectorId/schemas/:schemaName/views', dbExplorerController.getViews);
router.get('/:connectorId/schemas/:schemaName/functions', dbExplorerController.getFunctions);

// Table details
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/columns', dbExplorerController.getColumns);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/indexes', dbExplorerController.getIndexes);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/foreign-keys', dbExplorerController.getForeignKeys);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/triggers', dbExplorerController.getTriggers);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/constraints', dbExplorerController.getConstraints);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/dependencies', dbExplorerController.getTableDependencies);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/performance', dbExplorerController.getTablePerformance);
router.get('/:connectorId/schemas/:schemaName/tables/:tableName/ddl', dbExplorerController.getTableDDL);

// DDL Export
router.get('/:connectorId/schemas/:schemaName/views/:viewName/ddl', dbExplorerController.getViewDDL);
router.get('/:connectorId/schemas/:schemaName/functions/:functionName/ddl', dbExplorerController.getFunctionDDL);

// Drop operations
router.delete('/:connectorId/schemas/:schemaName/views/:viewName', dbExplorerController.dropView);
router.delete('/:connectorId/schemas/:schemaName/functions/:functionName', dbExplorerController.dropFunction);

// Column operations
router.post('/:connectorId/schemas/:schemaName/tables/:tableName/columns', dbExplorerController.addColumn);
router.put('/:connectorId/schemas/:schemaName/tables/:tableName/columns/:columnName', dbExplorerController.modifyColumn);
router.delete('/:connectorId/schemas/:schemaName/tables/:tableName/columns/:columnName', dbExplorerController.dropColumn);

// Query execution
router.post('/:connectorId/query', dbExplorerController.executeQuery);
router.post('/:connectorId/explain', dbExplorerController.explainQuery);
router.post('/:connectorId/execute-file', dbExplorerController.executeSQLFile);

// Query history
router.get('/queries/history', dbExplorerController.getQueryHistory);
router.get('/queries/favorites', dbExplorerController.getFavorites);
router.post('/queries/favorites', dbExplorerController.saveFavorite);

// Table operations
router.post('/:connectorId/tables/create', dbTableOperations.createTable);
router.post('/:connectorId/tables/drop', dbTableOperations.dropTable);
router.post('/:connectorId/tables/truncate', dbTableOperations.truncateTable);

// Data operations
router.post('/:connectorId/data/insert', dbDataOperations.insertRow);
router.post('/:connectorId/data/update', dbDataOperations.updateRows);
router.post('/:connectorId/data/delete', dbDataOperations.deleteRows);
router.post('/:connectorId/data/bulk-insert', dbDataOperations.bulkInsert);
router.post('/:connectorId/data/bulk-delete', dbDataOperations.bulkDelete);
router.post('/:connectorId/data/import', dbDataOperations.importData);

// Index operations
router.post('/:connectorId/indexes/create', dbIndexOperations.createIndex);
router.post('/:connectorId/indexes/drop', dbIndexOperations.dropIndex);

export default router;
```

**Observations:**
- ✅ Clean separation by domain
- ✅ Consistent middleware application
- ✅ RESTful URL structure
- ⚠️ Some routes have 50+ endpoints (dbExplorer)
- ⚠️ Missing API versioning (e.g., `/api/v1`)

---

## Controller Patterns

### Pattern 1: Class-Based Controller (Singleton)

**Used By:** `auth`, `user`, `analysis`, `upload`, `admin`, etc.

```typescript
// user.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import userService from '../services/user.service';
import loggingService from '../services/logging.service';

class UserController {
  /**
   * Get current user profile
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await userService.getUserWithRoles(req.user.id);
      res.json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { firstName, lastName, phone, bio } = req.body;
      
      const updatedUser = await userService.updateProfile(req.user.id, {
        firstName,
        lastName,
        phone,
        bio,
      });

      // Log activity
      await loggingService.logActivity({
        userId: req.user.id,
        actionType: 'user.update_profile',
        actionDescription: 'Updated user profile',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new UserController(); // Singleton instance
```

**Characteristics:**
- ✅ Class methods for organization
- ✅ Single instance exported
- ✅ Clear method documentation
- ✅ Consistent error handling
- ✅ Activity logging
- ⚠️ No input validation in controller (done in service)

---

### Pattern 2: Object Literal Controller

**Used By:** `process`, `action`, `connector`, `store`, `pages`, etc.

```typescript
// process.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { processService } from '../services/process.service';
import { ProcessExecutor } from '../execution-engine/ProcessExecutor';

const processExecutor = new ProcessExecutor();

export const processController = {
  /**
   * Get all processes
   */
  async getProcesses(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { category, isActive, isTemplate } = req.query;
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isTemplate !== undefined) filters.isTemplate = isTemplate === 'true';

      const processes = await processService.getProcesses(req.user.id, filters);
      res.json({ processes });
    } catch (error: any) {
      console.error('Error fetching processes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Create new process
   */
  async createProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const process = await processService.createProcess(req.user.id, req.body);
      res.status(201).json({ process });
    } catch (error: any) {
      console.error('Error creating process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Execute process
   */
  async executeProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { inputData } = req.body;

      const result = await processExecutor.execute(
        parseInt(id),
        req.user.id,
        inputData || {}
      );

      res.json({ execution: result });
    } catch (error: any) {
      console.error('Error executing process:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
```

**Characteristics:**
- ✅ Lightweight, no class overhead
- ✅ Easy to export individual functions
- ✅ Consistent with modern JavaScript
- ⚠️ No shared state (good or bad depending on use case)

---

### Pattern 3: Named Exports (Flat Functions)

**Used By:** `dbExplorer`, `dbTableOperations`, `dbDataOperations`, `dbIndexOperations`

```typescript
// dbExplorer.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import dbExplorerService from '../services/dbExplorer.service';

export const getSchemas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { connectorId } = req.params;
    const userId = req.user!.id;

    const schemas = await dbExplorerService.getSchemas(
      parseInt(connectorId),
      userId
    );

    res.json(schemas);
  } catch (error: any) {
    console.error('Get schemas error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTables = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { connectorId, schemaName } = req.params;
    const userId = req.user!.id;

    const tables = await dbExplorerService.getTables(
      parseInt(connectorId),
      userId,
      schemaName
    );

    res.json(tables);
  } catch (error: any) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getColumns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { connectorId, schemaName, tableName } = req.params;
    const userId = req.user!.id;

    const columns = await dbExplorerService.getColumns(
      parseInt(connectorId),
      userId,
      schemaName,
      tableName
    );

    res.json(columns);
  } catch (error: any) {
    console.error('Get columns error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ... 40+ more named exports
```

**Characteristics:**
- ✅ Maximum flexibility in routes
- ✅ Tree-shakeable exports
- ⚠️ No organization (file has 50+ functions)
- ⚠️ Repetitive error handling

---

### Controller Anti-Patterns Observed

1. **Direct Prisma Calls:**
```typescript
// ❌ BAD: Controller bypassing service layer
async getPages(req: Request, res: Response) {
  const pages = await prisma.dynamicPage.findMany({ /* ... */ });
  res.json({ pages });
}

// ✅ GOOD: Use service layer
async getPages(req: Request, res: Response) {
  const pages = await pageService.getPages(req.user.id);
  res.json({ pages });
}
```

2. **Inconsistent Error Handling:**
```typescript
// ❌ BAD: console.error + generic message
catch (error: any) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
}

// ✅ GOOD: Use logger + specific error
catch (error: any) {
  logger.error('Failed to fetch processes:', error);
  res.status(500).json({ error: 'Failed to retrieve processes' });
}
```

3. **Missing Auth Checks:**
```typescript
// ❌ BAD: Assumes req.user exists
async getMe(req: AuthenticatedRequest, res: Response) {
  const user = await userService.getUserWithRoles(req.user.id); // Can crash!
}

// ✅ GOOD: Always check
async getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = await userService.getUserWithRoles(req.user.id);
}
```

---

## Service Layer Patterns

### Service Architecture

**Services:** 23 files implementing business logic

**Key Services:**

| Service | Lines | Purpose | Complexity |
|---------|-------|---------|------------|
| `dbExplorer.service.ts` | **1,914** | Database IDE operations | **Very High** |
| `connector.service.ts` | ~300 | Connector CRUD + encryption | Medium |
| `process.service.ts` | ~250 | Process management | Medium |
| `action.service.ts` | ~200 | Action management | Medium |
| `tableAnalysis.service.ts` | ~350 | DB AI optimization | High |
| `aiAnalysis.service.ts` | ~200 | AI integration | High |
| `document.service.ts` | ~400 | Document processing workflow | High |
| `mulesoft.service.ts` | ~300 | MuleSoft API client | Medium |
| `logging.service.ts` | ~150 | Activity/API logging | Low |
| `auth.service.ts` | ~300 | Authentication logic | Medium |
| `user.service.ts` | ~200 | User management | Low |

### Pattern 1: Service Object

```typescript
// logging.service.ts
import prisma from '../config/database';
import logger from '../utils/logger';

interface ActivityLogData {
  userId?: number;
  jobId?: string;
  processId?: number;
  actionId?: number;
  logLevel?: string;
  actionType: string;
  actionDescription: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  status?: string;
}

const loggingService = {
  /**
   * Log user activity
   */
  async logActivity(data: ActivityLogData) {
    try {
      await prisma.activityLog.create({
        data: {
          ...data,
          logLevel: data.logLevel || 'info',
          status: data.status || 'success',
        },
      });
    } catch (error) {
      logger.error('Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break application
    }
  },

  /**
   * Log API call
   */
  async logApiCall(data: {
    userId?: number;
    jobId?: string;
    requestMethod: string;
    requestUrl: string;
    requestHeaders?: any;
    requestBody?: any;
    responseStatus?: number;
    responseBody?: any;
    responseTimeMs?: number;
    errorMessage?: string;
  }) {
    try {
      await prisma.apiLog.create({
        data,
      });
    } catch (error) {
      logger.error('Failed to log API call:', error);
    }
  },

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId: number, limit = 50) {
    return await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

export default loggingService;
```

### Pattern 2: Service Class

```typescript
// connector.service.ts
import prisma from '../config/database';
import logger from '../utils/logger';

class ConnectorService {
  /**
   * Get all connectors for user
   */
  async getConnectors(userId: number, connectorType?: string) {
    try {
      const where: any = { createdBy: userId };
      if (connectorType) where.connectorType = connectorType;

      const connectors = await prisma.connector.findMany({
        where,
        include: {
          creator: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: [{ connectorType: 'asc' }, { name: 'asc' }],
      });

      // Decrypt sensitive fields
      return connectors.map(conn => ({
        ...conn,
        config: this.decryptConfig(conn.config),
      }));
    } catch (error: any) {
      logger.error('Error fetching connectors:', error);
      throw new Error(`Failed to fetch connectors: ${error.message}`);
    }
  }

  /**
   * Create new connector
   */
  async createConnector(userId: number, data: CreateConnectorInput) {
    try {
      // Encrypt sensitive config
      const encryptedConfig = this.encryptConfig(data.config);

      const connector = await prisma.connector.create({
        data: {
          name: data.name,
          connectorType: data.connectorType,
          config: encryptedConfig,
          authType: data.authType,
          openApiSpec: data.openApiSpec,
          iconUrl: data.iconUrl,
          createdBy: userId,
        },
        include: { creator: { select: { id: true, email: true } } },
      });

      return {
        ...connector,
        config: data.config, // Return unencrypted for immediate use
      };
    } catch (error: any) {
      logger.error('Error creating connector:', error);
      throw new Error(`Failed to create connector: ${error.message}`);
    }
  }

  /**
   * Encrypt sensitive config fields
   */
  private encryptConfig(config: any): any {
    const { encryptConnectorConfig, isEncrypted } = require('../utils/encryption');
    if (config.password && !isEncrypted(config.password)) {
      return encryptConnectorConfig(config);
    }
    return config;
  }

  /**
   * Decrypt sensitive config fields
   */
  private decryptConfig(config: any): any {
    const { decryptConnectorConfig } = require('../utils/encryption');
    return decryptConnectorConfig(config);
  }
}

export default new ConnectorService();
```

### Service Best Practices Observed

**✅ Good:**
1. Clear method documentation
2. Single Responsibility Principle (mostly)
3. Error logging
4. Consistent return patterns

**⚠️ Issues:**
1. `dbExplorer.service.ts` is 1,914 lines (god object)
2. Some services have no tests
3. Some services call other services deeply (tight coupling)
4. Encryption/decryption mixed with business logic

---

## Middleware

### Available Middleware

| Middleware | File | Purpose | Apply To |
|------------|------|---------|----------|
| `authenticate` | `auth.ts` | JWT validation | Protected routes |
| `requireAdmin` | `admin.ts` | Admin role check | Admin routes |
| `roleCheck` | `roleCheck.ts` | Specific role check | Role-based routes |
| `activityLogger` | `activityLogger.ts` | Log all requests | All routes |
| `errorHandler` | `errorHandler.ts` | Global error handling | App-level |
| `validator` | `validator.ts` | Zod validation | Specific routes |

### Authentication Middleware

```typescript
// middleware/auth.ts
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
    };

    // Check session validity
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        token,
        expiresAt: { gte: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Admin Middleware

```typescript
// middleware/admin.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user has Admin role
    const userWithRoles = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const isAdmin = userWithRoles?.userRoles.some(
      ur => ur.role.name === 'Admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};
```

### Error Handler Middleware

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
```

---

## Authentication & Authorization

### Authentication Flow

```
1. User sends credentials (email + password)
   ↓
2. `auth.controller.login()`
   ↓
3. `auth.service.login()`
   → Validate email exists
   → Compare password hash (bcrypt)
   → Generate JWT token
   → Create session record
   ↓
4. Return token to client
   ↓
5. Client stores token (localStorage/memory)
   ↓
6. All subsequent requests include token in Authorization header
   ↓
7. `authenticate` middleware validates token on each request
```

### JWT Token Structure

```typescript
{
  userId: number,
  email: string,
  iat: number,      // Issued at
  exp: number,      // Expires at
}
```

**Token Expiration:** 24 hours (configurable)  
**Refresh Strategy:** Refresh token endpoint generates new token

### Authorization Levels

| Level | Middleware | Check | Example Routes |
|-------|-----------|-------|----------------|
| **Public** | None | No auth required | `/api/auth/login`, `/api/auth/register` |
| **Authenticated** | `authenticate` | Valid JWT | `/api/users/me`, `/api/analysis/*` |
| **Admin** | `authenticate` + `requireAdmin` | Admin role | `/api/admin/*`, `/api/users/*` |
| **Role-based** | `authenticate` + `roleCheck(role)` | Specific role | Custom per route |

### Permission Checking (Fine-Grained)

```typescript
// Example: Check specific permission
import { checkPermission } from '../utils/permissions';

async someController(req: AuthenticatedRequest, res: Response) {
  const hasPermission = await checkPermission(
    req.user!.id,
    'process.execute'
  );

  if (!hasPermission) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  // Proceed with operation
}
```

---

## Error Handling

### Error Handling Strategy

**Levels:**
1. **Try-Catch in Controllers** - Handle errors locally
2. **Service-Level Throws** - Services throw descriptive errors
3. **Global Error Handler** - Middleware catches unhandled errors

### Controller Error Pattern

```typescript
async controllerMethod(req: AuthenticatedRequest, res: Response) {
  try {
    // Call service
    const result = await someService.doSomething();
    res.json({ result });
  } catch (error: any) {
    logger.error('Operation failed:', error);
    res.status(500).json({
      error: error.message || 'Operation failed'
    });
  }
}
```

### Service Error Pattern

```typescript
async serviceMethod(param: string) {
  try {
    const result = await prisma.table.findUnique({ where: { param } });
    
    if (!result) {
      throw new Error(`Record not found: ${param}`);
    }
    
    return result;
  } catch (error: any) {
    logger.error('Service error:', error);
    throw new Error(`Failed to fetch record: ${error.message}`);
  }
}
```

### Error Response Format

**Standard:**
```json
{
  "error": "Descriptive error message"
}
```

**With Details (development only):**
```json
{
  "error": "Descriptive error message",
  "details": { /* Additional context */ },
  "stack": "Error stack trace"
}
```

---

## Validation Patterns

### Zod Validation

**Example: Request validation**

```typescript
import { z } from 'zod';

// Define schema
const createProcessSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  flowDefinition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
  category: z.string().optional(),
  triggerType: z.enum(['manual', 'ui_form', 'api', 'schedule']),
});

// Validate in controller
async createProcess(req: AuthenticatedRequest, res: Response) {
  try {
    const validated = createProcessSchema.parse(req.body);
    const process = await processService.createProcess(req.user!.id, validated);
    res.status(201).json({ process });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    throw error;
  }
}
```

### Validation Middleware (Unused Currently)

```typescript
// middleware/validator.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
```

**Usage (potential):**
```typescript
router.post('/processes',
  authenticate,
  validate(createProcessSchema),
  processController.createProcess
);
```

---

## API Endpoint Inventory

### Complete Route Listing

Due to length constraints, here's a categorized summary. See full endpoint documentation in [API_ENDPOINTS.md].

**Authentication (5 endpoints)**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

**Users (10 endpoints)**
- `GET /api/users/me` - Get profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `PUT /api/users/password` - Change password
- `GET /api/users/activity` - Activity logs
- ... (5 more admin endpoints)

**Document Processing (8 endpoints)**
- `POST /api/analysis/start` - Start processing
- `GET /api/analysis/history` - Get history
- `GET /api/analysis/:id` - Get analysis
- `DELETE /api/analysis/:id` - Delete analysis
- ... (4 more)

**Database Explorer (50+ endpoints)**
- Schema browsing (10)
- Table operations (15)
- Data operations (10)
- Query execution (5)
- DDL export (5)
- Column management (5)
- ... (more)

**Process Engine (15 endpoints)**
- Process CRUD
- Process execution
- Action CRUD
- Execution history

**Connectors (12 endpoints)**
- Connector CRUD
- Connection testing
- OpenAPI import

**Prompts & AI (10 endpoints)**
- System prompts
- User prompts
- AI analysis

**Admin (20+ endpoints)**
- User management
- Role management
- Permission management
- System settings
- Logs

**Total:** 150+ API endpoints

---

## Code Organization Best Practices

### What's Working Well ✅

1. **Clear separation of concerns** - Routes, controllers, services
2. **Consistent naming** - `*.controller.ts`, `*.service.ts`, `*.routes.ts`
3. **TypeScript everywhere** - Type safety
4. **Prisma ORM** - Type-safe database access
5. **Comprehensive logging** - Activity logs + API logs
6. **Middleware reuse** - `authenticate`, `requireAdmin`

### Areas for Improvement ⚠️

1. **Service consolidation** - `dbExplorer.service.ts` is too large (1,914 lines)
2. **Consistent controller pattern** - Mix of class, object, and flat exports
3. **API versioning** - No `/v1/` in routes
4. **Input validation** - Not consistently applied
5. **Error handling** - Mix of patterns
6. **Testing** - No visible test structure
7. **Documentation** - API docs incomplete

---

## Recommendations

### Short-Term (1-2 weeks)

1. **Split `dbExplorer.service.ts`:**
   - `schemaService.ts` - Schema browsing
   - `queryService.ts` - Query execution
   - `tableService.ts` - Table operations
   - `columnService.ts` - Column management
   - `connectionService.ts` - Connection pooling

2. **Standardize controller pattern:**
   - Adopt object literal pattern everywhere
   - Or adopt class pattern everywhere
   - Be consistent

3. **Add input validation:**
   - Use Zod schemas for all POST/PUT endpoints
   - Apply validation middleware

4. **Improve error handling:**
   - Custom error classes
   - Consistent error response format

### Medium-Term (1-2 months)

1. **API versioning:**
   - Prefix all routes with `/v1/`
   - Prepare for future versions

2. **Add tests:**
   - Unit tests for services
   - Integration tests for controllers
   - E2E tests for critical flows

3. **API documentation:**
   - Generate OpenAPI/Swagger docs
   - Interactive API explorer

4. **Caching layer:**
   - Redis for frequent queries
   - Connection pool optimization

### Long-Term (3-6 months)

1. **Microservices extraction:**
   - Extract DB Explorer as separate service
   - Extract Process Engine as separate service

2. **Event-driven architecture:**
   - Message queue for process execution
   - Pub/sub for notifications

3. **GraphQL layer:**
   - Alternative to REST for complex queries
   - Better for frontend flexibility

---

**Document Status:** ✅ Complete  
**Next:** See `FRONTEND_ARCHITECTURE.md` for client-side architecture

