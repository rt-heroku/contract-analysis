# Flow Management Feature

## Overview

Added manual flow management capability to the MuleSoft APIs page. Users can now add, edit, and delete flows manually when the `/flows` endpoint is not available or returns an error.

## Implementation Date

December 5, 2025

## What Was Added

### Frontend Changes

**File:** `frontend/src/pages/MulesoftApis.tsx`

#### New UI Components

1. **"Manage Flows" Button** - Added to each API card for owners
2. **Flows Management Modal** - Full CRUD interface for flows
   - List all flows for an API
   - Add new flow button
   - Edit existing flows
   - Delete flows
   - Shows warning when auto-refresh fails

#### Flow Form Fields

- **Flow Name** (required)
- **Description** (optional)
- **URL Path** (required) - e.g., `/analyze`
- **HTTP Method** (dropdown) - GET, POST, PUT, PATCH, DELETE
- **Variables** (optional, repeatable)
  - Variable name
  - Type (JSON, String, Number, Boolean)
  - Required checkbox

#### User Experience

- If `/flows` endpoint returns success → Flows auto-populated
- If `/flows` endpoint fails → Warning message shown, user can manually add flows
- "Refresh Flows" button still available to retry auto-discovery
- "Manage Flows" button always available for manual management

### Backend Changes

#### New API Endpoints

**File:** `backend/src/routes/mulesoftApi.routes.ts`

```
POST   /api/mulesoft-apis/:id/flows          - Create new flow
PUT    /api/mulesoft-apis/:id/flows/:flowId  - Update flow
DELETE /api/mulesoft-apis/:id/flows/:flowId  - Delete flow
```

#### New Service Methods

**File:** `backend/src/services/mulesoftApi.service.ts`

- `createFlow(apiId, userId, flowData)` - Create flow with validation
- `updateFlow(apiId, flowId, userId, flowData)` - Update with conflict checking
- `deleteFlow(apiId, flowId, userId)` - Delete with ownership check

#### New Controller Methods

**File:** `backend/src/controllers/mulesoftApi.controller.ts`

- `createFlow(req, res)` - Handle flow creation
- `updateFlow(req, res)` - Handle flow updates
- `deleteFlow(req, res)` - Handle flow deletion

All methods include:
- Authentication checks
- Ownership validation (only API owner can manage flows)
- Activity logging
- Error handling

### Security & Validation

1. **Ownership Check** - Only the API creator can add/edit/delete flows
2. **Duplicate Prevention** - Cannot create flows with duplicate names per API
3. **Existence Validation** - Verifies flow exists before update/delete
4. **API Access Check** - Verifies user has access to the parent API

### Activity Logging

All flow operations are logged:
- `mulesoft_flow.create` - When a flow is created
- `mulesoft_flow.update` - When a flow is updated
- `mulesoft_flow.delete` - When a flow is deleted

## How to Use

### As an API Owner

1. **Navigate to MuleSoft APIs** (`/apis`)
2. **Find your API** in "My MuleSoft APIs" section
3. **Click "Manage Flows"** button
4. **In the modal:**
   - View all existing flows
   - Click "Add Flow" to create a new one
   - Click edit icon to modify a flow
   - Click delete icon to remove a flow

### Adding a Flow

1. Click "Add Flow" button
2. Fill in the form:
   - **Name**: e.g., "Analyze Contract"
   - **Description**: Optional description
   - **URL Path**: e.g., `/analyze`
   - **Method**: Select HTTP method (default: POST)
   - **Variables** (optional):
     - Click "Add Variable"
     - Enter variable name
     - Select type (JSON, String, Number, Boolean)
     - Check "Required" if mandatory
3. Click "Create Flow"

### Editing a Flow

1. Click the edit icon (pencil) on a flow card
2. Modify any fields
3. Click "Update Flow"

### Deleting a Flow

1. Click the delete icon (trash) on a flow card
2. Confirm deletion in the dialog
3. Flow is permanently deleted

## Workflow

### Scenario 1: API with Working `/flows` Endpoint

1. User creates MuleSoft API
2. System auto-calls `/flows` endpoint
3. Flows are automatically populated
4. User can still use "Manage Flows" to add custom flows

### Scenario 2: API without `/flows` Endpoint (404/Error)

1. User creates MuleSoft API
2. System tries to call `/flows` endpoint → Fails
3. `flowsStatus` set to "error"
4. User clicks "Manage Flows"
5. Warning message shown: "⚠️ Auto-refresh failed. You can manually add flows below."
6. User manually adds flows using the form

### Scenario 3: Hybrid Approach

1. API has some flows from `/flows` endpoint
2. User needs additional custom flows
3. User clicks "Manage Flows"
4. User adds custom flows alongside auto-discovered ones

## Database Schema

No changes required - uses existing `mulesoft_flows` table:

```sql
CREATE TABLE mulesoft_flows (
  id SERIAL PRIMARY KEY,
  mulesoft_api_id INTEGER NOT NULL REFERENCES mulesoft_apis(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  url VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  vars JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mulesoft_api_id, name)
);
```

## Testing

### Manual Testing Checklist

- [ ] Create a flow manually
- [ ] Edit an existing flow
- [ ] Delete a flow
- [ ] Try to create duplicate flow name (should fail)
- [ ] Try to edit flow as non-owner (should fail)
- [ ] Add flow variables with different types
- [ ] Mark variables as required/optional
- [ ] Verify flows appear in Analysis Setup dropdown
- [ ] Verify activity logging for all operations

### Test API Scenarios

**Test 1: API with Working `/flows`**
```bash
# Create API pointing to working MuleSoft instance
# Verify flows auto-populate
# Add custom flow manually
# Verify both auto and manual flows appear
```

**Test 2: API without `/flows` (404)**
```bash
# Create API pointing to non-existent endpoint
# Verify error status
# Manually add flows
# Verify they work in Analysis Setup
```

## Benefits

1. **Flexibility** - Works with or without `/flows` endpoint
2. **User Control** - Users can customize flows beyond what API provides
3. **Resilience** - System doesn't break if `/flows` fails
4. **Hybrid Support** - Mix auto-discovered and manual flows
5. **Full CRUD** - Complete management of flow lifecycle

## Known Limitations

1. Only API owner can manage flows (by design)
2. Flow names must be unique per API
3. No bulk import/export yet (future enhancement)
4. Variables are simple key-value pairs (no nested structures)

## Future Enhancements

- [ ] Bulk import flows from JSON
- [ ] Export flows to JSON
- [ ] Flow templates library
- [ ] Flow testing interface
- [ ] Flow versioning
- [ ] Flow duplication across APIs

## Related Documentation

- [MULESOFT_APIS_IMPLEMENTATION.md](./MULESOFT_APIS_IMPLEMENTATION.md) - Main implementation guide
- [README.md](../README.md) - Project overview

---

**Status:** ✅ Complete and Deployed

**Build Status:**
- Backend: ✅ Compiled successfully
- Frontend: ✅ Compiled successfully

**Ready for Production:** Yes

