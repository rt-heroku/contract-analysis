# Remaining Features Implementation Plan

## 1. Stores Tab on Connectors Page ⭐️ HIGH PRIORITY

### Overview
Add a dedicated "Stores" tab to each connector's detail view, showing all store instances for that connector.

### Implementation
**Location**: `frontend/src/pages/Connectors.tsx`

**Changes Needed**:
1. Add a "Stores" tab (after Details, Specification, Actions tabs)
2. Fetch stores for the specific connector
3. Display store list with name, type, created date
4. Add "Create Store" button
5. Add Edit/Delete actions for each store

**UI Components**:
```tsx
<Tabs>
  <Tab>Details</Tab>
  <Tab>Specification</Tab> {/* REST only */}
  <Tab>Actions</Tab>
  <Tab>Stores</Tab> {/* DB, File, S3, Redis */}
</Tabs>
```

**Store List**:
- Name
- Type (from connector)
- Created date
- Status (active/inactive)
- Actions (Edit, Delete)

**Create Store Modal**:
- Name (required)
- Description (optional)
- Configuration (JSON editor for store-specific settings)

### API Endpoints (Already exist)
- `GET /api/stores?connectorId=<id>` - List stores for connector
- `POST /api/stores` - Create new store
- `PUT /api/stores/:id` - Update store
- `DELETE /api/stores/:id` - Delete store

---

## 2. Database Schema/User Creation for Stores ⭐️ HIGH PRIORITY

### Overview
When a Database store is created, automatically create a PostgreSQL schema and restricted user for security isolation.

### Implementation
**Location**: `backend/src/services/store.service.ts`

**Logic Flow**:
1. User creates a Database store via UI
2. Backend generates unique schema name: `store_<storeId>`
3. Execute SQL to create schema
4. Create PostgreSQL user with limited permissions:
   ```sql
   CREATE SCHEMA store_<id>;
   CREATE USER store_user_<id> WITH PASSWORD '<generated>';
   GRANT USAGE ON SCHEMA store_<id> TO store_user_<id>;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA store_<id> TO store_user_<id>;
   ALTER DEFAULT PRIVILEGES IN SCHEMA store_<id> 
     GRANT ALL ON TABLES TO store_user_<id>;
   ```
5. Store connection string in encrypted form in store config
6. Use store-specific user for all queries in that store

### Security Benefits
- Each store has its own isolated schema
- Store user cannot access other schemas
- Even if store credentials leak, damage is limited to that store
- Prevents cross-store data access in scripts

### File Store Implementation
For file stores, create a directory:
```
/tmp/stores/store_<id>/
```

### S3 Store Implementation
Use a prefix or bucket:
```
Prefix: stores/<storeId>/
or
Bucket: <main-bucket>/stores/<storeId>
```

### Redis Store Implementation
Use database number or key prefix:
```
Database: <storeId % 16>
Key Prefix: store:<storeId>:
```

---

## 3. Icon Upload Capability ⭐️ MEDIUM PRIORITY

### Overview
Allow users to upload custom icons for connectors and actions for better visual identification.

### Implementation

**Backend Changes**:

**File**: `backend/src/routes/upload.routes.ts` (NEW)
```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: './uploads/icons/',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/upload/icon', authenticate, upload.single('icon'), async (req, res) => {
  try {
    const iconUrl = `/uploads/icons/${req.file!.filename}`;
    res.json({ iconUrl });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
```

**Frontend Changes**:

**Component**: `frontend/src/components/common/IconUploader.tsx` (NEW)
```tsx
interface IconUploaderProps {
  currentIcon?: string;
  onUpload: (iconUrl: string) => void;
}

export const IconUploader: React.FC<IconUploaderProps> = ({ currentIcon, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentIcon);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('icon', file);

    try {
      const response = await api.post('/upload/icon', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(response.data.iconUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {preview && <img src={preview} alt="Icon" className="w-16 h-16" />}
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
    </div>
  );
};
```

**Integration Points**:
1. Connector create/edit form - Add IconUploader component
2. Action creator form - Add IconUploader component
3. Display custom icons in:
   - Actions page
   - Process Designer nodes
   - Connector list

**Storage**:
- Local filesystem: `./uploads/icons/`
- Or S3 for production: Use AWS SDK to upload to S3 bucket
- Store URL in database `iconUrl` field (already exists)

---

## 4. Start Node Trigger Configuration ⭐️ HIGH PRIORITY

### Overview
Allow users to configure how a process is triggered directly from the Start node.

### Trigger Types
1. **Manual** - Executed via API call or UI button
2. **Scheduled** - Cron expression (e.g., "0 9 * * *" for daily at 9 AM)
3. **Event** - Webhook/event listener
4. **Message Queue** - Redis pub/sub channel
5. **API Endpoint** - Direct REST API call

### Implementation

**Start Node Data Structure**:
```typescript
{
  type: 'start',
  data: {
    triggerType: 'schedule' | 'event' | 'api' | 'manual' | 'message',
    triggerConfig: {
      // For schedule
      cron?: string,
      timezone?: string,
      
      // For event
      eventName?: string,
      eventSource?: string,
      
      // For API
      method?: 'GET' | 'POST' | 'PUT',
      path?: string,
      
      // For message
      channel?: string,
      connectorId?: string,
    },
    onAddNext: () => void,
  }
}
```

**UI Components**:

**Properties Panel** (Right side of Process Designer):
```tsx
<PropertiesPanel>
  {selectedNode?.type === 'start' && (
    <div>
      <h3>Trigger Configuration</h3>
      
      <Select 
        value={triggerType} 
        onChange={setTriggerType}
        options={[
          { value: 'manual', label: '👤 Manual', icon: '👤' },
          { value: 'schedule', label: '⏰ Scheduled', icon: '⏰' },
          { value: 'event', label: '⚡ Event', icon: '⚡' },
          { value: 'api', label: '🌐 API', icon: '🌐' },
          { value: 'message', label: '📨 Message Queue', icon: '📨' },
        ]}
      />
      
      {triggerType === 'schedule' && (
        <CronInput value={cron} onChange={setCron} />
      )}
      
      {triggerType === 'event' && (
        <>
          <Input label="Event Name" value={eventName} onChange={setEventName} />
          <Input label="Event Source" value={eventSource} onChange={setEventSource} />
        </>
      )}
      
      {triggerType === 'api' && (
        <>
          <Select label="Method" options={['GET', 'POST', 'PUT']} />
          <Input label="Path" value={path} onChange={setPath} />
        </>
      )}
      
      {triggerType === 'message' && (
        <>
          <Select label="Redis Connector" options={redisConnectors} />
          <Input label="Channel" value={channel} onChange={setChannel} />
        </>
      )}
      
      <Button onClick={handleSaveTrigger}>Save Trigger</Button>
    </div>
  )}
</PropertiesPanel>
```

**Visual Indicator on Start Node**:
```tsx
<div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
  {triggerType === 'schedule' && <span title="Scheduled">⏰</span>}
  {triggerType === 'event' && <span title="Event">⚡</span>}
  {triggerType === 'api' && <span title="API">🌐</span>}
  {triggerType === 'manual' && <span title="Manual">👤</span>}
  {triggerType === 'message' && <span title="Message">📨</span>}
</div>

<div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
  {getSummaryText(triggerConfig)} 
  {/* e.g., "Every day at 9 AM" or "When order.created event" */}
</div>
```

**Backend Changes**:
- Update process model to store trigger configuration
- Create trigger scheduler service (using node-cron or BullMQ)
- Register triggers when process is activated
- Unregister triggers when process is deactivated

---

## 5. Trigger Properties Panel ⭐️ HIGH PRIORITY

### Overview
Right-side sliding panel that shows properties of the selected node.

### Implementation

**Component**: `frontend/src/components/process-designer/PropertiesPanel.tsx` (NEW)

```tsx
interface PropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onClose,
  onSave
}) => {
  if (!selectedNode) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Properties</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedNode.type === 'start' && (
          <StartNodeProperties node={selectedNode} onSave={onSave} />
        )}

        {selectedNode.type === 'actionNode' && (
          <ActionNodeProperties node={selectedNode} onSave={onSave} />
        )}
      </div>
    </div>
  );
};
```

**Integration into ProcessDesigner**:
```tsx
const [selectedNodeForProperties, setSelectedNodeForProperties] = useState<Node | null>(null);

// In ReactFlow
<ReactFlow
  onNodeClick={(_, node) => setSelectedNodeForProperties(node)}
  // ...
>

{selectedNodeForProperties && (
  <PropertiesPanel
    selectedNode={selectedNodeForProperties}
    onClose={() => setSelectedNodeForProperties(null)}
    onSave={handleSaveNodeProperties}
  />
)}
```

---

## Implementation Priority

1. **✅ DONE** - Process Designer improvements (single start, positioning, grid, plus buttons, search modal)
2. **🔴 CRITICAL** - Stores Tab (needed for testing store functionality)
3. **🔴 CRITICAL** - Database schema/user creation (security & isolation)
4. **🟡 IMPORTANT** - Trigger Configuration (Start node properties)
5. **🟡 IMPORTANT** - Properties Panel (UI for trigger config)
6. **🟢 NICE-TO-HAVE** - Icon Upload (visual polish)

## Testing Strategy

### Stores Testing
1. Create a Database connector
2. Create multiple stores for it
3. Verify each store has its own schema
4. Verify store users can only access their schema
5. Test CRUD operations within a store

### Trigger Testing
1. Create process with scheduled trigger
2. Verify cron job is registered
3. Wait for trigger time
4. Verify process executes automatically
5. Check execution logs

### Properties Panel Testing
1. Click on Start node
2. Verify properties panel opens
3. Configure trigger
4. Save and verify configuration persists
5. Verify visual indicator updates on node

## Next Steps
1. Implement Stores Tab UI
2. Add database schema creation logic
3. Build trigger configuration UI
4. Create properties panel
5. Add icon upload (if time permits)
6. Comprehensive testing
7. Documentation update
8. Deployment

## Notes
- All features should follow existing code patterns
- Maintain type safety with TypeScript
- Add proper error handling
- Include loading states in UI
- Add success/error notifications
- Write clear commit messages
- Update docs as features complete

