# Store-Connector Architecture Analysis

**Date:** November 17, 2025  
**Issue:** Store creation failing due to missing UI fields  
**Status:** 🔧 FIXING

---

## Problem Identified

### Backend Requirements (from controller line 52):
```typescript
if (!connectorId || !name || !storeType || !dataType) {
  return res.status(400).json({ 
    error: 'Missing required fields: connectorId, name, storeType, dataType' 
  });
}
```

### Current UI Form Collects:
- ✅ `name` 
- ✅ `storeType`
- ✅ `isDefault`
- ✅ `config` (based on storeType)

### Missing from UI:
- ❌ **`connectorId`** - REQUIRED FK to Connector
- ❌ **`dataType`** - REQUIRED field (jsonb, text, blob)

---

## Architecture Understanding

### Connector (Connection)
- Represents a **CONNECTION** to an external system
- Contains authentication and connection details
- Examples:
  - PostgreSQL Database Connection (host, port, username, password)
  - S3 Account Connection (access keys, region)
  - REST API Connection (base URL, auth token)
  - Redis Connection (URL, credentials)

### Store (Data Access Point)
- Represents a **SPECIFIC OBJECT/LOCATION** within a connector
- Tied to a connector via `connectorId` FK
- Contains object-specific configuration
- Examples:
  - **Database Connector** → Store = specific table/schema/view
  - **S3 Connector** → Store = specific bucket/folder
  - **REST Connector** → Store = specific endpoint
  - **File Connector** → Store = specific folder/directory

### Relationship:
```
Connector (1) -----> (Many) Stores
  |                       |
  |                       |- Store 1 (e.g., "customers" table)
  |                       |- Store 2 (e.g., "orders" table)
  |- Connection Config    |- Store 3 (e.g., "products" view)
  |- Auth details
  |- Base URL/Host
```

---

## Database Schema

### Connector Model
```prisma
model Connector {
  id            Int      @id
  name          String   // e.g., "Production Database"
  connectorType String   // 'rest', 'database', 's3', 'ftp', 'file', 'redis'
  version       String
  config        Json     // Connection details (host, port, credentials)
  authType      String?  // 'basic', 'bearer', 'oauth2', 'api_key'
  openApiSpec   Json?    // For REST connectors
  iconUrl       String?
  isActive      Boolean
  isAutoCreated Boolean
  createdBy     Int
  sharedWith    Json
  
  stores        Store[]  // One-to-many relationship
}
```

### Store Model
```prisma
model Store {
  id          Int      @id
  connectorId Int      // FK to Connector (REQUIRED)
  name        String   // e.g., "customers_table", "invoices_bucket"
  storeType   String   // 'database', 's3', 'ftp', 'local_file', 'redis'
  dataType    String   // 'jsonb', 'text', 'blob' (REQUIRED, default: 'jsonb')
  config      Json     // Store-specific config (table name, folder path, etc.)
  isDefault   Boolean
  isActive    Boolean
  createdBy   Int
  
  connector   Connector @relation(...)
  creator     User      @relation(...)
}
```

---

## Current Code Issues

### 1. Stores.tsx (Frontend)
**File:** `frontend/src/pages/Stores.tsx`

**Issue:** Form doesn't collect `connectorId` or `dataType`

**Lines 30-54:** Form state missing these fields
```typescript
const [formData, setFormData] = useState({
  name: '',
  storeType: 'database',
  isDefault: false,
  config: { /* ... */ },
  // MISSING: connectorId
  // MISSING: dataType
});
```

**Lines 376-406:** Form UI missing connector selector and dataType selector

### 2. Store Interface
**Line 10-22:** Interface missing connector relationship
```typescript
interface Store {
  id: number;
  name: string;
  storeType: string;
  isDefault: boolean;
  isActive: boolean;
  config: any;
  createdAt: string;
  creator: { firstName: string; lastName: string; };
  // MISSING: connector: { id, name, connectorType }
  // MISSING: connectorId: number;
  // MISSING: dataType: string;
}
```

---

## Required Changes

### ✅ Phase 1: Fix Store Creation Form

#### 1.1 Update Store Interface
Add missing fields to TypeScript interface:
```typescript
interface Store {
  id: number;
  connectorId: number;  // ADD
  name: string;
  storeType: string;
  dataType: string;     // ADD
  isDefault: boolean;
  isActive: boolean;
  config: any;
  createdAt: string;
  creator: { firstName: string; lastName: string; };
  connector: {          // ADD
    id: number;
    name: string;
    connectorType: string;
  };
}
```

#### 1.2 Update Form State
Add connectorId and dataType to formData:
```typescript
const [formData, setFormData] = useState({
  connectorId: 0,       // ADD
  name: '',
  storeType: 'database',
  dataType: 'jsonb',    // ADD
  isDefault: false,
  config: { /* ... */ },
});
```

#### 1.3 Add Connector Selector to Form UI
Fetch connectors and add dropdown:
```typescript
const [connectors, setConnectors] = useState<Connector[]>([]);

// Fetch connectors on mount
useEffect(() => {
  fetchConnectors();
}, []);

// In form:
<select
  value={formData.connectorId}
  onChange={(e) => setFormData({ ...formData, connectorId: parseInt(e.target.value) })}
  required
>
  <option value="">Select a Connector</option>
  {connectors.map(conn => (
    <option key={conn.id} value={conn.id}>
      {conn.name} ({conn.connectorType})
    </option>
  ))}
</select>
```

#### 1.4 Add Data Type Selector to Form UI
```typescript
<select
  value={formData.dataType}
  onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
  required
>
  <option value="jsonb">JSONB (Structured Data)</option>
  <option value="text">Text (Unstructured)</option>
  <option value="blob">Blob (Binary/Files)</option>
</select>
```

#### 1.5 Update handleSubmit
Pass connectorId and dataType to API:
```typescript
const response = await api.post('/stores', {
  connectorId: formData.connectorId,
  name: formData.name,
  storeType: formData.storeType,
  dataType: formData.dataType,
  config: formData.config,
  isDefault: formData.isDefault,
});
```

### ✅ Phase 2: Add Stores Tab to Connectors Page

#### 2.1 Add Stores Tab
**File:** `frontend/src/pages/Connectors.tsx`

Add a new tab to display stores for the selected connector:
```typescript
<Tabs>
  <Tab>Details</Tab>
  <Tab>Specification</Tab>  // For REST only
  <Tab>Actions</Tab>
  <Tab>Stores</Tab>         // NEW
</Tabs>
```

#### 2.2 Fetch Stores for Connector
```typescript
const [connectorStores, setConnectorStores] = useState<Store[]>([]);

const fetchConnectorStores = async (connectorId: number) => {
  const response = await api.get(`/stores?connectorId=${connectorId}`);
  setConnectorStores(response.data.stores);
};
```

#### 2.3 Create Store from Connector Context
When creating a store from the Connectors page:
- Pre-populate connectorId from current connector
- Pre-populate storeType from connector.connectorType
- Show simplified form (connector already selected)

### ✅ Phase 3: Update Store Display

#### 3.1 Show Connector Info in Store List
Display which connector each store belongs to:
```tsx
<div>
  <p>{store.name}</p>
  <p className="text-sm text-gray-500">
    Connector: {store.connector.name} ({store.connector.connectorType})
  </p>
  <p className="text-sm text-gray-500">
    Data Type: {store.dataType}
  </p>
</div>
```

---

## Future Enhancements

### Auto-Generate Stores
When a connector is created/validated:
1. Introspect the connection
2. Discover available objects:
   - **Database**: List all tables, views, procedures
   - **S3**: List buckets
   - **REST**: Parse OpenAPI spec for endpoints
3. Auto-create Store entries for each discovered object
4. Allow user to enable/disable specific stores

### Store Configuration Examples

#### Database Store (Table)
```json
{
  "connectorId": 1,
  "name": "customers_table",
  "storeType": "database",
  "dataType": "jsonb",
  "config": {
    "schema": "public",
    "table": "customers",
    "primaryKey": "id"
  }
}
```

#### S3 Store (Bucket/Folder)
```json
{
  "connectorId": 2,
  "name": "invoices_bucket",
  "storeType": "s3",
  "dataType": "blob",
  "config": {
    "bucket": "company-invoices",
    "prefix": "2024/",
    "region": "us-east-1"
  }
}
```

#### REST Store (Endpoint)
```json
{
  "connectorId": 3,
  "name": "users_endpoint",
  "storeType": "rest",
  "dataType": "jsonb",
  "config": {
    "path": "/api/v1/users",
    "method": "GET",
    "operationId": "listUsers"
  }
}
```

---

## Testing Checklist

- [ ] Create a Database connector
- [ ] Create a store linked to that connector
- [ ] Verify store shows in Stores page with connector info
- [ ] Verify store shows in Stores tab of Connector detail
- [ ] Edit store configuration
- [ ] Delete store
- [ ] Create stores for different store types (database, s3, file, redis)
- [ ] Test dataType options (jsonb, text, blob)
- [ ] Verify validation errors if connectorId or dataType missing

---

## Summary

The Store functionality exists and is properly implemented in the backend, but the **frontend UI was never completed**. The form is missing:

1. **Connector Selector** - To link store to a connector
2. **Data Type Selector** - To specify how data is stored (jsonb/text/blob)

This is a UI-only issue. The database schema, API, and services are all correctly implemented and ready to use.

