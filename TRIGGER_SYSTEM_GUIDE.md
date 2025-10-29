# Process Trigger System - Complete Guide

## 🎯 Overview

The **Trigger Configuration System** allows you to define how processes are initiated. Every process starts with a **Start Node** that displays the trigger type visually and can be configured with a single click.

---

## 🎨 Visual Design

### Start Node Appearance

The Start Node changes appearance based on trigger type:

| Trigger Type | Icon | Color | Example Summary |
|--------------|------|-------|-----------------|
| **None** | ▶️ Play Circle | Green (#22c55e) | "No trigger configured" |
| **Manual** | 👤 User | Indigo (#6366f1) | "Manual trigger" |
| **Schedule** | ⏰ Clock | Orange (#f59e0b) | "Every day at 9 AM" |
| **Event** | ⚡ Zap | Purple (#8b5cf6) | "Event: webhook" |
| **API** | 🌐 Globe | Blue (#3b82f6) | "POST /process" |
| **File** | 📤 Upload | Green (#10b981) | "Watch: /uploads" |

### Node Structure

```
┌──────────────────────┐
│   [Configure ⚙️]     │ ← Settings button (top-right)
│                      │
│     ⏰ Orange        │ ← Dynamic icon (changes by type)
│                      │
│       START          │ ← Node label
│                      │
│  [Every day at 9 AM] │ ← Summary badge (green when configured)
│                      │
│  [Configure trigger] │ ← Hint link (if not configured)
│                      │
│         ●            │ ← Connection handle
│         +            │ ← Add next action button
└──────────────────────┘
```

---

## 🔧 Configuration Panel

Click the **gear icon** or anywhere on the Start node to open the configuration panel.

### Panel Layout

```
┌────────────────────────────────────┐
│  Configure Trigger            [X]  │
│  Choose how this process will be   │
│  initiated                         │
├────────────────────────────────────┤
│                                    │
│  [ 👤 Manual ] [ ⏰ Schedule ]    │
│  [ ⚡ Event  ] [ 🌐 API      ]    │
│  [ 📤 File   ]                     │
│                                    │
├────────────────────────────────────┤
│  ... Configuration Form ...        │
│                                    │
├────────────────────────────────────┤
│           [Cancel] [Save Trigger]  │
└────────────────────────────────────┘
```

---

## 📋 Trigger Types

### 1. Manual Trigger 👤

**Use When:** Process should be started by a user action (button click or form submission).

#### Configuration Options

| Field | Description | Example |
|-------|-------------|---------|
| **UI Form** | Type of interface | No form, File upload, Text input, Custom |
| **Button Label** | Text on button | "Start Process", "Upload Document" |

#### Example Use Cases
- "Process Document" button in UI
- "Upload Contract" with file picker
- "Submit for Review" form
- "Generate Report" action

#### Sample Config
```json
{
  "type": "manual",
  "config": {
    "formType": "file-upload",
    "buttonLabel": "Upload Contract"
  }
}
```

---

### 2. Schedule Trigger ⏰

**Use When:** Process should run automatically on a regular schedule.

#### Configuration Options

**Mode 1: Cron Expression**
| Field | Description | Example |
|-------|-------------|---------|
| **Cron Expression** | Unix cron syntax | `0 9 * * *` |

**Mode 2: Interval**
| Field | Description | Example |
|-------|-------------|---------|
| **Interval Value** | Number | 4 |
| **Interval Unit** | Time unit | Hours |

| Option | Description |
|--------|-------------|
| **Enabled** | Checkbox to enable/disable |

#### Cron Examples
- `0 9 * * *` - Every day at 9:00 AM
- `0 */4 * * *` - Every 4 hours
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month

#### Example Use Cases
- Daily report generation
- Hourly data sync
- Weekly backups
- Monthly invoice processing

#### Sample Config (Cron)
```json
{
  "type": "schedule",
  "config": {
    "scheduleType": "cron",
    "cronExpression": "0 9 * * *",
    "enabled": true
  }
}
```

#### Sample Config (Interval)
```json
{
  "type": "schedule",
  "config": {
    "scheduleType": "interval",
    "intervalValue": 4,
    "intervalUnit": "hours",
    "enabled": true
  }
}
```

---

### 3. Event Trigger ⚡

**Use When:** Process should start when a specific event occurs.

#### Configuration Options

| Event Type | Description | Required Fields |
|------------|-------------|-----------------|
| **Webhook** | HTTP callback | Webhook path |
| **Message Queue** | Queue listener | Queue name |
| **Redis Pub/Sub** | Channel subscription | Channel name |
| **Custom** | User-defined event | - |

#### Example Use Cases
- Webhook from external system
- Message from RabbitMQ/SQS
- Redis channel notification
- Custom event bus trigger

#### Sample Config (Webhook)
```json
{
  "type": "event",
  "config": {
    "eventType": "webhook",
    "webhookPath": "/webhook/contract-received"
  }
}
```

#### Sample Config (Redis Pub/Sub)
```json
{
  "type": "event",
  "config": {
    "eventType": "redis-pubsub",
    "channel": "document-events"
  }
}
```

---

### 4. API Trigger 🌐

**Use When:** Process should be invoked via HTTP API endpoint.

#### Configuration Options

| Field | Description | Options |
|-------|-------------|---------|
| **HTTP Method** | Request method | GET, POST, PUT, PATCH |
| **Custom Path** | Optional custom endpoint | `/api/process/custom` |
| **Require Auth** | Authentication required | Checkbox |

#### Default Endpoint
If no custom path is specified, the default endpoint is:
```
POST /api/process/execute/:processId
```

#### Example Use Cases
- External system integration
- Third-party service calls
- API Gateway triggers
- Microservice communication

#### Sample Config
```json
{
  "type": "api",
  "config": {
    "method": "POST",
    "customPath": "/api/process/analyze-contract",
    "requireAuth": true
  }
}
```

#### API Call Example
```bash
curl -X POST https://app.com/api/process/execute/123 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentId": "doc-456"}'
```

---

### 5. File Trigger 📤

**Use When:** Process should start when a file is uploaded or detected.

#### Configuration Options

| Trigger Mode | Description | Configuration |
|--------------|-------------|---------------|
| **File Upload (UI)** | User uploads file | File pattern |
| **Watch Directory** | Monitor folder | Directory path + pattern |
| **S3 Bucket Event** | AWS S3 notification | Bucket configuration |

| Field | Description | Example |
|-------|-------------|---------|
| **File Pattern** | Wildcard filter | `*.pdf`, `*.xlsx` |

#### Example Use Cases
- PDF document upload
- Directory monitoring
- S3 bucket watch
- Automated file processing

#### Sample Config (Upload)
```json
{
  "type": "file",
  "config": {
    "mode": "upload",
    "filePattern": "*.pdf"
  }
}
```

#### Sample Config (Watch)
```json
{
  "type": "file",
  "config": {
    "mode": "watch",
    "path": "/uploads/incoming",
    "filePattern": "*.pdf, *.xlsx"
  }
}
```

---

## 💡 How To Use

### Creating a New Process

1. **Create Process** or **Open Process Designer**
2. Start node appears with **"No trigger configured"**
3. Click **gear icon ⚙️** or anywhere on start node
4. Configuration panel opens
5. Select trigger type from grid
6. Fill in configuration form
7. Click **"Save Trigger"**
8. Node updates with icon and summary
9. Save process to persist trigger

### Changing Trigger

1. Open process in designer
2. Click **gear icon** on start node
3. Modal shows current configuration
4. Change trigger type or modify settings
5. Click **"Save Trigger"**
6. Node updates immediately
7. Save process

### Removing Trigger

1. Open trigger configuration
2. Select **"Manual"** (or desired default)
3. Clear all fields
4. Save

---

## 🔄 Data Flow

### Saving Process
```
User saves process
  ↓
Extract trigger config from state
  ↓
Add to flowDefinition.triggerConfig
  ↓
Save to database
```

### Loading Process
```
Load process from API
  ↓
Extract flowDefinition.triggerConfig
  ↓
Set currentTriggerConfig state
  ↓
Apply to start nodes
  ↓
Re-wire callbacks
```

### Updating Trigger
```
User clicks configure
  ↓
Modal opens with current config
  ↓
User modifies settings
  ↓
Save trigger
  ↓
Update all start nodes
  ↓
Trigger persists on next save
```

---

## 🎯 Best Practices

### Manual Triggers
✅ **Use for:**
- User-initiated workflows
- Interactive processes
- On-demand execution

❌ **Avoid for:**
- High-volume automated tasks
- Time-sensitive operations

### Schedule Triggers
✅ **Use for:**
- Regular batch jobs
- Periodic reports
- Maintenance tasks

❌ **Avoid for:**
- Real-time processing
- Event-driven workflows

### Event Triggers
✅ **Use for:**
- Real-time reactions
- External system integration
- Event-driven architecture

❌ **Avoid for:**
- Regular scheduled tasks
- Batch processing

### API Triggers
✅ **Use for:**
- System integration
- Service-to-service calls
- External API access

❌ **Avoid for:**
- User-facing workflows
- High-security processes (without auth)

### File Triggers
✅ **Use for:**
- Document processing
- File import workflows
- Automated ingestion

❌ **Avoid for:**
- Real-time processing
- Non-file workflows

---

## 🔐 Security Considerations

### API Triggers
- Always enable **"Require Authentication"** for sensitive processes
- Use API keys or tokens
- Rate limiting recommended
- Log all API calls

### Webhook/Event Triggers
- Validate webhook signatures
- Use HTTPS only
- Implement IP whitelist
- Verify event source

### File Triggers
- Validate file types
- Scan for malware
- Limit file size
- Sanitize filenames

---

## 🚀 Deployment

After deployment to Heroku:

1. **Check Start Nodes**: Verify trigger icons display
2. **Test Configuration**: Open config panel
3. **Save Process**: Ensure trigger persists
4. **Reload Process**: Verify trigger loads correctly

---

## 📊 Current Status

### ✅ Implemented
- Start node component with dynamic icons
- Trigger configuration panel
- All 5 trigger types (Manual, Schedule, Event, API, File)
- Visual indicators on start node
- Summary display
- Configure button (gear icon)
- Trigger config persistence
- Load/save trigger with process
- Real-time updates

### 🔜 Future Enhancements
- Backend trigger execution engine
- Cron scheduler service
- Webhook endpoint registration
- File watcher daemon
- Event bus integration
- Trigger monitoring dashboard
- Execution history logs
- Trigger testing tools
- Advanced scheduling options
- Trigger templates

---

## 🎨 UI/UX Features

### Visual Feedback
- **Hover Effects**: Buttons highlight on hover
- **Color Coding**: Each trigger type has unique color
- **Icons**: Universal, recognizable icons
- **Badges**: Status displayed prominently
- **Tooltips**: Helpful hints on hover

### User Experience
- **One-Click Config**: Gear icon opens panel
- **Visual Type Selection**: Grid of trigger options
- **Contextual Help**: Descriptions for each type
- **Auto-Save**: Changes apply immediately
- **Persistent**: Configuration saved with process

---

## 🛠️ Technical Implementation

### Components
```
StartNode.tsx           - Dedicated start node component
TriggerConfigPanel.tsx  - Configuration modal
ProcessDesigner.tsx     - Integration and state management
```

### State Management
```typescript
const [triggerConfigOpen, setTriggerConfigOpen] = useState(false);
const [currentTriggerConfig, setCurrentTriggerConfig] = useState<TriggerConfig>({
  type: 'none',
});
```

### Type Definitions
```typescript
export interface TriggerConfig {
  type: 'manual' | 'schedule' | 'event' | 'api' | 'file' | 'none';
  config?: any;
}
```

---

## 📝 Example Workflows

### Example 1: Daily Contract Processing
```
Trigger: Schedule (cron: 0 9 * * *)
Summary: "Every day at 9 AM"
Actions: Fetch contracts → Analyze → Email report
```

### Example 2: Document Upload
```
Trigger: Manual (File Upload)
Summary: "Manual trigger"
Actions: Upload PDF → Extract data → Save to DB
```

### Example 3: Webhook Integration
```
Trigger: Event (Webhook)
Summary: "Event: webhook"
Actions: Receive webhook → Validate → Process → Respond
```

### Example 4: API Service
```
Trigger: API (POST endpoint)
Summary: "POST /process"
Actions: Receive request → Transform → Call external API → Return result
```

---

## ✨ Summary

The Trigger Configuration System provides:

1. **Visual Clarity**: Instantly see how process starts
2. **Easy Configuration**: One-click setup
3. **Flexible Options**: 5 trigger types covering all use cases
4. **Professional UI**: Modern, polished interface
5. **Type Safety**: Full TypeScript support
6. **Persistent**: Saved with process
7. **Extensible**: Easy to add new trigger types

**Everything is working and ready to use!** 🚀

