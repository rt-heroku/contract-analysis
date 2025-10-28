# Connector Actions Architecture

**Date:** October 28, 2025  
**Status:** 🚧 In Progress  
**Branch:** `feature/actions`

---

## Overview

The system now supports **three types of actions**:

1. **System Actions** - Built-in control flow and data operations (IF/THEN, FOR_EACH, WHILE, etc.)
2. **User-Defined Actions** - Custom actions created by users (REST API calls, Scripts)
3. **Connector Actions** - Operations tied to specific connectors (DB queries, File operations, API endpoints)

This architecture mirrors how n8n handles nodes - each connector type has predefined operations.

---

## Architecture Changes

### Database Schema Updates

#### Connector Model (Enhanced)
```prisma
model Connector {
  id            Int      @id
  name          String
  connectorType String   // 'rest', 'database', 's3', 'ftp', 'file'
  version       String   // NEW: Versioning support (e.g., "1.0.0")
  config        Json     // Connection details
  authType      String?  // Auth configuration
  openApiSpec   Json?    // NEW: OpenAPI/Swagger specification
  isActive      Boolean
  
  // Relations
  connectorActions ConnectorAction[]  // Operations for this connector
  actions          Action[]           // Actions using this connector
}
```

#### ConnectorAction Model (New)
```prisma
model ConnectorAction {
  id          Int      @id
  connectorId Int      // Parent connector
  operation   String   // e.g., "GET /users", "query", "read_file"
  operationId String?  // From OpenAPI spec
  displayName String   // Human-readable name
  description String?
  method      String?  // For REST: GET, POST, PUT, DELETE, PATCH
  path        String?  // For REST: /api/users/{id}
  parameters  Json     // Operation-specific parameters
  requestBody Json?    // Request body schema
  responses   Json?    // Expected responses
  isActive    Boolean
  
  connector Connector @relation(...)
}
```

#### Action Model (Enhanced)
```prisma
model Action {
  // ... existing fields
  actionType         String   // 'system', 'user_defined', 'connector'
  connectorId        Int?     // NEW: Link to connector
  connectorOperation String?  // NEW: Operation name
  executorType       String   // 'builtin', 'rest_api', 'script', 'connector'
  
  connector Connector? @relation(...)
}
```

---

## Connector Types & Predefined Actions

### 1. REST API Connector

**Operations** (auto-generated from OpenAPI):
- Each endpoint becomes a connector action
- Example: `GET /users`, `POST /users`, `GET /users/{id}`

**OpenAPI Import Flow**:
```typescript
POST /api/connectors/:id/import-openapi
Body: { openApiSpec: {...} }

// Creates connector actions for each operation:
// - operationId from spec
// - method + path
// - parameters (path, query, header, body)
// - request/response schemas
```

**Benefits**:
- Automatic action generation from API specs
- Type-safe parameters
- Built-in validation
- Documentation integration

---

### 2. Database Connector

**Predefined Operations**:
- `query` - Execute SELECT query
- `query_all` - Execute SELECT with pagination
- `execute` - Execute any SQL command
- `insert` - Insert record(s)
- `update` - Update record(s)
- `delete` - Delete record(s)
- `transaction` - Execute multiple queries in transaction

**Example Action Config**:
```json
{
  "operation": "query",
  "parameters": {
    "sql": "SELECT * FROM users WHERE id = $1",
    "values": ["{{input.userId}}"]
  }
}
```

---

### 3. File System Connector

**Predefined Operations**:
- `read` - Read file contents
- `write` - Write file contents
- `append` - Append to file
- `delete` - Delete file
- `exists` - Check file existence
- `list` - List directory contents
- `copy` - Copy file
- `move` - Move/rename file
- `mkdir` - Create directory
- `stat` - Get file stats

**Example Action Config**:
```json
{
  "operation": "read",
  "parameters": {
    "path": "{{input.filePath}}",
    "encoding": "utf8"
  }
}
```

---

### 4. S3 Connector

**Predefined Operations**:
- `upload` - Upload object
- `download` - Download object
- `delete` - Delete object
- `list` - List objects in bucket
- `exists` - Check object existence
- `copy` - Copy object
- `move` - Move object
- `get_url` - Get presigned URL

---

### 5. FTP/SFTP Connector

**Predefined Operations**:
- `upload` - Upload file
- `download` - Download file
- `list` - List directory
- `delete` - Delete file
- `mkdir` - Create directory
- `exists` - Check file existence

---

## Implementation Status

### ✅ Completed
1. Database schema updated with:
   - Connector versioning
   - OpenAPI spec storage
   - ConnectorAction model
   - Action-Connector linkage

2. Schema pushed to database successfully

### 🚧 In Progress
1. OpenAPI import service
2. Predefined connector actions service
3. Connector action executor
4. Frontend updates for connector actions

### 📋 To Do
1. Create `openapi-importer.service.ts`
2. Create `connector-actions.service.ts`
3. Update `connector.service.ts` for versioning
4. Update `ActionExecutor.ts` for connector actions
5. Create predefined action definitions for each connector type
6. Update frontend Actions page to show connector groups
7. Create connector action picker in Process Designer
8. Add OpenAPI import UI
9. Create connector version management UI
10. Testing and documentation

---

## API Endpoints

### Connector Management

```typescript
// Import OpenAPI spec
POST /api/connectors/:id/import-openapi
Body: { openApiSpec: object | url: string }
Response: { 
  connector: Connector, 
  actionsCreated: number,
  actions: ConnectorAction[]
}

// List connector actions
GET /api/connectors/:id/actions
Response: { actions: ConnectorAction[] }

// Get connector versions
GET /api/connectors/:id/versions
Response: { versions: Connector[] }

// Create new connector version
POST /api/connectors/:id/versions
Body: { version: string, changes: object }
Response: { connector: Connector }
```

### Connector Actions

```typescript
// List all connector actions
GET /api/connector-actions
Query: ?connectorId=1&operation=query
Response: { actions: ConnectorAction[] }

// Get connector action details
GET /api/connector-actions/:id
Response: { action: ConnectorAction }

// Create connector action (manual)
POST /api/connector-actions
Body: { connectorId, operation, displayName, ... }
Response: { action: ConnectorAction }

// Update connector action
PUT /api/connector-actions/:id
Body: { ... }
Response: { action: ConnectorAction }

// Delete connector action
DELETE /api/connector-actions/:id
Response: { success: boolean }
```

---

## Frontend Updates

### Actions Page Enhancement

**Current**: Flat list of all actions

**New Structure**:
```
Actions Library
├─ System Actions (11)
│  ├─ Control Flow (6)
│  │  ├─ IF_THEN_ELSE
│  │  ├─ FOR_EACH
│  │  ├─ WHILE
│  │  ├─ PARALLEL
│  │  ├─ VALIDATE
│  │  └─ MERGE
│  ├─ Data Processing (2)
│  │  ├─ TRANSFORM
│  │  └─ SCRIPT
│  └─ IDP (1)
│     └─ IDP_EXTRACT
│
├─ User Actions (n)
│  └─ [User-created actions]
│
└─ Connector Actions
   ├─ Document Processing API (REST v1.0.0)
   │  ├─ POST /extract/pdf
   │  ├─ POST /analyze
   │  └─ GET /status/{jobId}
   │
   ├─ Production Database (Database v1.0.0)
   │  ├─ Query
   │  ├─ Insert
   │  ├─ Update
   │  └─ Delete
   │
   └─ File Storage (File v1.0.0)
      ├─ Read File
      ├─ Write File
      ├─ List Directory
      └─ Delete File
```

### Process Designer Enhancement

**Action Palette**:
- Expandable tree view
- Drag connector actions onto canvas
- Visual indicators for connector type
- Version badges

**Node Configuration**:
- Auto-populate parameters from connector action
- Schema-based form validation
- Parameter interpolation support
- Response mapping

---

## Implementation Guide

### Step 1: Create OpenAPI Importer Service

```typescript
// backend/src/services/openapi-importer.service.ts

import { OpenAPIV3 } from 'openapi-types';

export class OpenAPIImporterService {
  async importSpec(connectorId: number, spec: OpenAPIV3.Document) {
    // 1. Validate OpenAPI spec
    // 2. Extract operations
    // 3. Create ConnectorAction for each operation
    // 4. Store spec in connector.openApiSpec
    // 5. Return created actions
  }
  
  private extractOperations(spec: OpenAPIV3.Document) {
    // Parse paths and methods
    // Extract operationId, parameters, requestBody, responses
  }
  
  private createConnectorAction(connectorId, operation) {
    // Create ConnectorAction record
  }
}
```

### Step 2: Create Predefined Actions Service

```typescript
// backend/src/services/predefined-connector-actions.service.ts

export class PredefinedConnectorActionsService {
  async initializeForConnector(connector: Connector) {
    const actions = this.getActionsForType(connector.connectorType);
    
    for (const actionDef of actions) {
      await this.createConnectorAction(connector.id, actionDef);
    }
  }
  
  private getActionsForType(connectorType: string) {
    switch (connectorType) {
      case 'database': return DATABASE_ACTIONS;
      case 'file': return FILE_ACTIONS;
      case 's3': return S3_ACTIONS;
      case 'ftp': return FTP_ACTIONS;
      default: return [];
    }
  }
}

const DATABASE_ACTIONS = [
  {
    operation: 'query',
    displayName: 'Execute Query',
    description: 'Run a SELECT query',
    parameters: {
      sql: { type: 'string', required: true },
      values: { type: 'array', required: false }
    }
  },
  // ... more actions
];
```

### Step 3: Update Connector Service

```typescript
// backend/src/services/connector.service.ts

class ConnectorService {
  async createConnector(data) {
    const connector = await prisma.connector.create({ data });
    
    // Initialize predefined actions
    await predefinedActionsService.initializeForConnector(connector);
    
    // If REST with OpenAPI spec, import it
    if (data.openApiSpec) {
      await openApiImporter.importSpec(connector.id, data.openApiSpec);
    }
    
    return connector;
  }
  
  async createVersion(connectorId, versionData) {
    // Clone connector with new version number
    // Clone connector actions
    // Mark previous version as archived
  }
}
```

### Step 4: Update Action Executor

```typescript
// backend/src/execution-engine/ActionExecutor.ts

async execute(action: Action, inputData: any, context: any) {
  if (action.executorType === 'connector') {
    return await this.executeConnectorAction(action, inputData, context);
  }
  // ... existing logic
}

async executeConnectorAction(action, inputData, context) {
  const connector = await this.loadConnector(action.connectorId);
  
  switch (connector.connectorType) {
    case 'database':
      return await this.executeDatabaseAction(connector, action, inputData);
    case 'file':
      return await this.executeFileAction(connector, action, inputData);
    case 'rest':
      return await this.executeRestAction(connector, action, inputData);
    // ... more types
  }
}
```

---

## Benefits of This Architecture

### 1. **Reusability**
- Define connector once, use operations many times
- Share connectors across processes
- Version control for connectors

### 2. **Type Safety**
- OpenAPI provides schemas
- Automatic validation
- Better error messages

### 3. **Discoverability**
- Browse available operations per connector
- Auto-generated documentation
- Visual organization in UI

### 4. **Maintainability**
- Update connector, all actions update
- Version management
- Backward compatibility

### 5. **Scalability**
- Add new connector types easily
- Community-contributed connectors
- Connector marketplace potential

---

## Example Usage

### Creating a REST Connector with OpenAPI

```typescript
// 1. Create connector
POST /api/connectors
{
  "name": "Document Processing API",
  "connectorType": "rest",
  "version": "1.0.0",
  "config": {
    "baseUrl": "https://api.example.com",
    "timeout": 30000
  },
  "authType": "bearer",
  "openApiSpec": { /* OpenAPI spec */ }
}

// 2. Auto-generated actions:
// - POST /extract/pdf (Extract PDF)
// - POST /extract/docx (Extract DOCX)
// - POST /analyze (Analyze Document)
// - GET /status/{jobId} (Check Status)

// 3. Use in process:
{
  "nodeId": "node-1",
  "actionType": "connector",
  "connectorId": 5,
  "operation": "POST /extract/pdf",
  "config": {
    "file": "{{input.pdfFile}}",
    "options": { "extractImages": true }
  }
}
```

### Creating a Database Connector

```typescript
// 1. Create connector
POST /api/connectors
{
  "name": "Production Database",
  "connectorType": "database",
  "version": "1.0.0",
  "config": {
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "username": "user",
    "password": "pass"
  }
}

// 2. Auto-created actions:
// - Query
// - Query All
// - Insert
// - Update
// - Delete
// - Execute
// - Transaction

// 3. Use in process:
{
  "nodeId": "node-2",
  "actionType": "connector",
  "connectorId": 6,
  "operation": "query",
  "config": {
    "sql": "SELECT * FROM users WHERE email = $1",
    "values": ["{{input.email}}"]
  }
}
```

---

## Migration Path

### Phase 1: ✅ Schema & Architecture (Complete)
- Database schema updated
- Models defined
- Relations established

### Phase 2: 🚧 Core Services (In Progress)
- OpenAPI importer
- Predefined actions
- Connector executor

### Phase 3: 📋 Frontend (Planned)
- Actions page redesign
- Connector action picker
- OpenAPI import UI

### Phase 4: 📋 Advanced Features (Future)
- Connector marketplace
- Community contributions
- Analytics per connector
- Cost tracking

---

## Next Steps

1. **Implement OpenAPI Importer**
   - Parse OpenAPI v3 specs
   - Extract operations and schemas
   - Create connector actions

2. **Define Predefined Actions**
   - Database operations
   - File operations
   - S3 operations
   - FTP operations

3. **Update Executors**
   - Connector action executor
   - Database query executor
   - File operation executor

4. **Frontend Updates**
   - Grouped action list
   - Connector picker
   - OpenAPI import form

5. **Testing**
   - Unit tests for each connector type
   - Integration tests
   - E2E process tests

---

## Questions & Decisions

### Q: Should we support multiple versions of the same connector simultaneously?
**A:** Yes - users can choose which version to use in their processes. Old processes continue to work with old versions.

### Q: How do we handle breaking changes in connectors?
**A:** Version management. When updating a connector:
1. Create new version
2. Mark old version as deprecated
3. Allow gradual migration
4. Eventually archive old versions

### Q: Can users modify predefined connector actions?
**A:** No, but they can:
1. Create user-defined actions that wrap connector actions
2. Request new operations be added to connector type
3. Create custom connectors with their own operations

### Q: How do we handle authentication for connector actions?
**A:** Authentication is defined at connector level. All actions inherit the connector's auth configuration.

---

## Summary

The Connector Actions architecture provides a clean, scalable way to organize and execute operations across different service types. By treating connectors as first-class citizens with their own operations, we create a more intuitive and maintainable system that mirrors successful patterns from n8n and similar platforms.

**Key Innovations:**
- Three-tier action hierarchy (System, User, Connector)
- OpenAPI auto-generation
- Versioned connectors
- Type-safe operations
- Grouped UI presentation

This architecture positions the system for future growth, including connector marketplaces, community contributions, and advanced analytics.

