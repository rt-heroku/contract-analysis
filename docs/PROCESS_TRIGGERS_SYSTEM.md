# Process Triggers System - Complete Guide

## Overview

The Process Trigger System allows processes to be initiated in multiple ways:

1. **UI Form** - User fills out a form with inputs, clicks submit
2. **Manual** - Direct execution from process designer or list
3. **API Call** - External systems trigger via REST API
4. **Schedule** - Cron-based automated execution
5. **Event** - Triggered by system events (file upload, webhook, etc.)

## 🎨 Beautiful Action Nodes (✅ COMPLETED)

### Features Implemented

**Visual Design:**
- ✅ Card-style nodes (280-320px width)
- ✅ Icon badges with custom colors
- ✅ Description text (2-line clamp)
- ✅ Category labels
- ✅ Type indicators (System/User/Connector)
- ✅ Professional shadows and hover states

**Connection Handles:**
- ✅ Top Handle (blue) - Input from previous actions
- ✅ Bottom Handle (green) - Output to next actions
- ✅ Left/Right Handles (yellow) - For branching logic

**Visual Feedback:**
- ✅ Selected state (blue border, scale 105%, larger shadow)
- ✅ Hover state (blue-300 border)
- ✅ Smooth transitions (200ms)

### How Nodes Look Now

```
┌─────────────────────────────────┐
│  🔷 REST API Call               │
│     api                          │
├─────────────────────────────────┤
│  Make HTTP requests to external │
│  APIs with full configuration   │
├─────────────────────────────────┤
│  [System]         Drag to connect│
└─────────────────────────────────┘
```

## 🚀 Trigger Types

### 1. UI Form Process (⏳ TO BE IMPLEMENTED)

**Use Case:** User needs to provide inputs before process starts

**Flow:**
1. User navigates to `/process/trigger/:id`
2. System displays form with input fields defined in `triggerConfig`
3. User fills form (text, file upload, dropdowns, etc.)
4. User clicks "Start Process"
5. Process executes with form data as input context

**Trigger Config Example:**
```json
{
  "triggerType": "ui_form",
  "triggerConfig": {
    "fields": [
      {
        "name": "contractFile",
        "label": "Upload Contract PDF",
        "type": "file",
        "accept": ".pdf",
        "required": true
      },
      {
        "name": "customerName",
        "label": "Customer Name",
        "type": "text",
        "placeholder": "Enter customer name",
        "required": true
      },
      {
        "name": "priority",
        "label": "Priority",
        "type": "select",
        "options": ["Low", "Medium", "High"],
        "default": "Medium"
      },
      {
        "name": "notes",
        "label": "Additional Notes",
        "type": "textarea",
        "rows": 4
      }
    ],
    "submitButtonText": "Process Contract",
    "successMessage": "Contract processing started!",
    "redirectAfterSubmit": "/executions"
  }
}
```

**Frontend Component:**
`/process/trigger/:id` → `ProcessTriggerForm.tsx`

---

### 2. Manual Trigger (✅ ALREADY WORKS)

**Use Case:** Admin/user triggers process directly

**How:** Click "Run" button in:
- Process Designer (top-right)
- Process List page
- Process Details page

**No Config Needed** - Works immediately

---

### 3. API Trigger (⏳ TO BE IMPLEMENTED)

**Use Case:** External system triggers process via REST API

**Endpoint:**
```
POST /api/processes/:id/trigger
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "executionContext": {
    "invoiceId": "INV-12345",
    "amount": 1500.00,
    "customer": {
      "name": "Acme Corp",
      "email": "billing@acme.com"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "exec-uuid-123",
  "status": "running",
  "startedAt": "2025-10-28T15:30:00Z"
}
```

**Trigger Config Example:**
```json
{
  "triggerType": "api",
  "triggerConfig": {
    "apiKey": "generated-api-key-xyz",
    "allowedIPs": ["192.168.1.100", "10.0.0.0/24"],
    "rateLimit": {
      "maxRequestsPerMinute": 60
    },
    "webhookUrl": "https://my-app.com/webhooks/process-complete"
  }
}
```

---

### 4. Schedule Trigger (⏳ TO BE IMPLEMENTED)

**Use Case:** Run process automatically on a schedule

**Trigger Config Example:**
```json
{
  "triggerType": "schedule",
  "triggerConfig": {
    "cronExpression": "0 2 * * *",
    "timezone": "America/New_York",
    "enabled": true,
    "executionContext": {
      "reportType": "daily",
      "recipients": ["admin@example.com"]
    }
  }
}
```

**Cron Examples:**
- `0 2 * * *` - Every day at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 1` - Every Monday at midnight
- `*/15 * * * *` - Every 15 minutes

**Implementation:** Use `node-cron` or BullMQ scheduler

---

### 5. Event Trigger (⏳ TO BE IMPLEMENTED)

**Use Case:** Trigger when specific system event occurs

**Event Types:**
- `file.uploaded` - When file is uploaded
- `webhook.received` - When external webhook arrives
- `analysis.completed` - When document analysis finishes
- `user.registered` - When new user registers

**Trigger Config Example:**
```json
{
  "triggerType": "event",
  "triggerConfig": {
    "eventType": "file.uploaded",
    "filters": {
      "fileType": ["pdf", "docx"],
      "minSize": 1024,
      "maxSize": 10485760
    },
    "conditions": [
      {
        "field": "metadata.category",
        "operator": "equals",
        "value": "contract"
      }
    ]
  }
}
```

---

## 📝 Implementation Checklist

### Phase 1: UI Form Trigger (Priority 1)

- [ ] Create `ProcessTriggerForm.tsx` page
- [ ] Create route `/process/trigger/:id`
- [ ] Add backend endpoint `GET /api/processes/:id/trigger-config`
- [ ] Add backend endpoint `POST /api/processes/:id/trigger`
- [ ] Support field types:
  - [ ] Text input
  - [ ] Textarea
  - [ ] File upload
  - [ ] Select dropdown
  - [ ] Multi-select
  - [ ] Checkbox
  - [ ] Radio buttons
  - [ ] Date picker
  - [ ] Number input
- [ ] Form validation (required fields, formats)
- [ ] File handling (base64 encoding)
- [ ] Success/error feedback
- [ ] Redirect after submission

### Phase 2: API Trigger (Priority 2)

- [ ] Add API key generation for processes
- [ ] Create `POST /api/processes/:id/trigger` endpoint
- [ ] Add API key authentication middleware
- [ ] IP whitelist validation
- [ ] Rate limiting (express-rate-limit)
- [ ] Webhook callback on completion
- [ ] API documentation page

### Phase 3: Schedule Trigger (Priority 3)

- [ ] Install `node-cron` or configure BullMQ scheduler
- [ ] Create cron job manager service
- [ ] Add schedule validation (cron syntax)
- [ ] Add schedule enable/disable toggle
- [ ] Show next execution time in UI
- [ ] Execution history for scheduled runs
- [ ] Email notifications on failure

### Phase 4: Event Trigger (Priority 4)

- [ ] Create event emitter system
- [ ] Define standard event types
- [ ] Event subscription service
- [ ] Event filtering and conditions
- [ ] Event queue (BullMQ)
- [ ] Event monitoring dashboard

---

## 🎯 Frontend Pages to Create

### 1. ProcessTriggerForm (`/process/trigger/:id`)

**Purpose:** Display form for UI-based processes

**Features:**
- Render dynamic form from `triggerConfig`
- File upload with drag-and-drop
- Form validation
- Progress indicator after submission
- Link to execution monitor

**Example UI:**
```
┌─────────────────────────────────────────┐
│  📄 Contract Analysis Process           │
│                                          │
│  Upload your contract and we'll extract │
│  key terms and analyze compliance.      │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Upload Contract PDF *            │  │
│  │  [📎 Drag & drop or click]       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  Customer Name *                        │
│  [________________________]             │
│                                          │
│  Priority                                │
│  ▼ Medium                                │
│                                          │
│  Additional Notes                        │
│  [________________________]             │
│  [________________________]             │
│                                          │
│  [ Start Processing ]                   │
└─────────────────────────────────────────┘
```

### 2. Update Processes List Page

**Add Column:** "Trigger Type"
- 🖱️ Manual
- 📋 UI Form
- 🔗 API
- ⏰ Schedule
- ⚡ Event

**Add Actions:**
- "Open Form" button for UI Form processes
- "View API" button for API processes
- "Edit Schedule" button for Schedule processes

---

## 🛠️ Backend Implementation Guide

### Update `process.service.ts`

```typescript
async createProcess(data: CreateProcessInput) {
  return await prisma.process.create({
    data: {
      name: data.name,
      description: data.description,
      flowDefinition: data.flowDefinition,
      triggerType: data.triggerType || 'manual',
      triggerConfig: data.triggerConfig || null,
      createdBy: data.userId,
    },
  });
}

async getTriggerConfig(processId: number, userId: number) {
  const process = await prisma.process.findFirst({
    where: {
      id: processId,
      OR: [
        { createdBy: userId },
        { isActive: true }, // Public processes
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      triggerType: true,
      triggerConfig: true,
    },
  });
  
  if (!process) {
    throw new Error('Process not found or access denied');
  }
  
  return process;
}
```

### Add `process.controller.ts` Endpoints

```typescript
// Get trigger configuration for form rendering
async getTriggerConfig(req: AuthenticatedRequest, res: Response) {
  const processId = parseInt(req.params.id);
  const config = await processService.getTriggerConfig(processId, req.user!.id);
  res.json({ config });
}

// Execute process via trigger (UI form, API, etc.)
async triggerProcess(req: AuthenticatedRequest, res: Response) {
  const processId = parseInt(req.params.id);
  const executionContext = req.body.executionContext || {};
  
  const execution = await processService.executeProcess(
    processId,
    req.user!.id,
    executionContext
  );
  
  res.json({
    success: true,
    executionId: execution.executionId,
    status: execution.status,
  });
}
```

### Add Routes

```typescript
// GET /api/processes/:id/trigger-config
router.get('/:id/trigger-config', authenticate, processController.getTriggerConfig);

// POST /api/processes/:id/trigger
router.post('/:id/trigger', authenticate, processController.triggerProcess);
```

---

## 💡 Example Use Cases

### Use Case 1: Contract Processing (UI Form)

**Process:** Upload PDF → Extract Data → Analyze → Generate Report

**Trigger Type:** `ui_form`

**Form Fields:**
- Contract PDF (file upload)
- Customer Name (text)
- Contract Type (select: NDA, Service Agreement, Purchase Order)
- Review Priority (radio: Low, Medium, High)

**User Flow:**
1. Navigate to "Process Contract" page
2. Upload PDF
3. Fill customer info
4. Click "Start Processing"
5. Redirect to execution monitor

---

### Use Case 2: Nightly Report Generation (Schedule)

**Process:** Query DB → Transform Data → Generate PDF → Email

**Trigger Type:** `schedule`

**Cron:** `0 2 * * *` (Every day at 2 AM)

**Execution Context:** `{ reportType: "daily", recipients: [...] }`

---

### Use Case 3: Webhook Processing (API)

**Process:** Receive Webhook → Validate → Transform → Store → Notify

**Trigger Type:** `api`

**External System:** Calls `POST /api/processes/123/trigger` with invoice data

---

### Use Case 4: Auto-Process Uploads (Event)

**Process:** Detect Upload → Classify → Route to Appropriate Flow

**Trigger Type:** `event`

**Event:** `file.uploaded`

**Filter:** Only PDFs in "contracts" folder

---

## 🔐 Security Considerations

### UI Form Triggers
- ✅ Require authentication
- ✅ Validate user permissions
- ✅ Sanitize file uploads
- ✅ Validate form data

### API Triggers
- ✅ Generate unique API keys per process
- ✅ IP whitelist validation
- ✅ Rate limiting (60 req/min default)
- ✅ Request signing (HMAC)
- ✅ Audit logging

### Schedule Triggers
- ✅ Admin-only configuration
- ✅ Execution history tracking
- ✅ Failure alerting

### Event Triggers
- ✅ Event source validation
- ✅ Condition evaluation
- ✅ Queue-based processing (prevent overload)

---

## 📊 Monitoring & Analytics

### Process Trigger Dashboard

**Metrics to Track:**
- Trigger invocations per type
- Success/failure rates
- Average execution time
- Queue depth (for scheduled/event triggers)
- API usage per key

**Alerts:**
- Failed scheduled executions
- API rate limit exceeded
- Event queue backlog
- Trigger configuration errors

---

## 🚀 Deployment Notes

### Database Migration

```bash
cd backend
npx prisma db push
```

### Environment Variables

```env
# For API triggers
PROCESS_API_KEY_SECRET=your-secret-for-generating-keys

# For scheduled triggers
ENABLE_CRON_SCHEDULER=true

# For event triggers
ENABLE_EVENT_TRIGGERS=true
EVENT_QUEUE_REDIS_URL=redis://localhost:6379
```

### Heroku Deployment

```bash
git push heroku feature/actions:main
heroku run "cd backend && npx prisma db push" --app contract-dev
```

---

## 📚 Summary

### ✅ Completed (Part 1)
- Beautiful action-style nodes in Process Designer
- Database schema for triggers
- Visual node design matching mockups

### ⏳ To Be Implemented (Part 2)
- ProcessTriggerForm page
- API trigger endpoints
- Schedule trigger system
- Event trigger system
- Process list UI updates

### 🎯 Priority Order
1. **UI Form Triggers** - Most user-facing, immediate value
2. **API Triggers** - Enable integration with external systems
3. **Schedule Triggers** - Automation capability
4. **Event Triggers** - Advanced automation

---

**Next Steps:** Implement ProcessTriggerForm page and API trigger endpoints in Part 2.

*Last Updated: October 28, 2025*  
*Version: 2.1*

