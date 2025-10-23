# Feature v2.1: Manual Validation Workflow for MuleSoft IDP

## 📋 Overview

This feature adds complete manual validation workflow support for MuleSoft IDP document processing, including status polling, manual review, and approval capabilities.

## ✅ Implementation Status

### Backend (100% Complete)
- ✅ Database schema updates
- ✅ MuleSoft service methods
- ✅ Backend controllers and routes
- ✅ Compiles successfully

### Frontend (95% Complete)
- ✅ Anypoint credentials dialog component
- ✅ IDP review page with PDF viewer
- ✅ Status polling functions
- ✅ Manual validation handlers
- ⚠️ **REMAINING**: Update IDPResponse.tsx render section to use new components (see "Remaining Work" below)

---

## 🗄️ Database Changes

### `contract_analysis` Table
**New Column:**
- `execution_id` (VARCHAR 100, NULLABLE) - Stores MuleSoft IDP execution ID
- Indexed for faster lookups

**Purpose**: Track MuleSoft execution IDs for status polling and manual validation.

**Migration**: Already applied via Prisma push.

### `idp_executions` Table
**New Columns:**
- `anypoint_username` (TEXT, NULLABLE, ENCRYPTED)
- `anypoint_password` (TEXT, NULLABLE, ENCRYPTED)

**Purpose**: Store optional Anypoint credentials for manual validation workflows.

**Security**: Both fields are encrypted using AES-256-CBC via the `encryption` utility.

---

## 🔧 Backend Implementation

### New API Endpoints

#### 1. **POST /api/idp-status/status**
**Purpose**: Poll MuleSoft IDP for current processing status

**Request Body**:
```json
{
  "executionId": "string",
  "jobId": "string",
  "idpExecutionId": number
}
```

**Response**:
```json
{
  "status": {
    "status": "PROCESSING | MANUAL_VALIDATION_REQUIRED | SUCCEEDED | FAILED",
    "documentStatus": "string",
    ...
  }
}
```

**MuleSoft Call**: `POST {mulesoftUrl}/process/status`

---

#### 2. **POST /api/idp-status/review**
**Purpose**: Request manual review data from MuleSoft IDP

**Request Body**:
```json
{
  "executionId": "string",
  "jobId": "string",
  "idpExecutionId": number,
  "anypointUsername": "string" (optional),
  "anypointPassword": "string" (optional),
  "saveCredentials": boolean (optional)
}
```

**Response**:
```json
{
  "review": {
    "results": [
      {
        "id": "string",
        "name": "string",
        "result": "string",
        "confidenceScore": number,
        "page": number
      }
    ],
    "queriesResults": [],
    "analyzersResults": [],
    "signaturesResults": []
  }
}
```

**Error Response** (if credentials needed):
```json
{
  "error": "Anypoint credentials are required",
  "needsCredentials": true
}
```

**MuleSoft Call**: `POST {mulesoftUrl}/process/review`

**Features**:
- Attempts to use stored credentials first
- Falls back to provided credentials
- Optionally saves credentials (encrypted) if `saveCredentials=true`

---

#### 3. **POST /api/idp-status/approve**
**Purpose**: Submit approved manual review changes to MuleSoft IDP

**Request Body**:
```json
{
  "executionId": "string",
  "jobId": "string",
  "idpExecutionId": number,
  "approvedData": {
    "results": [
      {
        "id": "string",
        "name": "string",
        "result": "string",
        "confidenceScore": number,
        "page": number
      }
    ],
    "queriesResults": [],
    "analyzersResults": [],
    "signaturesResults": []
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**MuleSoft Call**: `PATCH {mulesoftUrl}/process/approve`

**Features**:
- Updates `contract_analysis` status to "SUCCEEDED"
- Stores approved data in `mulesoftResponse`
- Logs approval activity

---

### MuleSoft Service Methods

#### `getProcessingStatus(executionId, idpConfig, jobId)`
- Polls MuleSoft for current document processing status
- Timeout: 5 minutes (300,000ms)
- Returns current status and updated document data

#### `requestReview(executionId, idpConfig, jobId, anypointUsername?, anypointPassword?)`
- Requests manual review data
- Sends Anypoint credentials if provided
- Returns fields that need manual review with confidence scores

#### `approveReview(executionId, idpConfig, jobId, approvedData)`
- Submits approved review data
- Updates document status in MuleSoft
- Returns updated document state

---

## 🎨 Frontend Implementation

### New Components

#### 1. **AnypointCredentialsDialog**
**Location**: `frontend/src/components/modals/AnypointCredentialsDialog.tsx`

**Purpose**: Modal dialog to collect Anypoint credentials when needed for manual validation.

**Features**:
- Username/password inputs
- "Save credentials" checkbox with security warning
- Styled warning message about not storing admin credentials
- Form validation

**Usage**:
```tsx
<AnypointCredentialsDialog
  isOpen={showCredentialsDialog}
  onClose={() => setShowCredentialsDialog(false)}
  onSubmit={handleCredentialsSubmit}
/>
```

---

#### 2. **IDPReview Page**
**Location**: `frontend/src/pages/IDPReview.tsx`

**Purpose**: Split-view page for reviewing and approving manual validation changes.

**Features**:
- **Left Panel**: PDF viewer showing the original document
- **Right Panel**: Scrollable list of editable text areas for each field
- Confidence score badges (green 80%+, yellow 60-79%, red <60%)
- Page numbers for each field
- "Approve Changes" button (enabled only when changes are made)
- Navigation back to IDPResponse after approval

**Workflow**:
1. User modifies one or more fields
2. "Approve" button becomes enabled
3. On submit, builds `approved_data` in correct format
4. Calls `/api/idp-status/approve`
5. Redirects to `/idp-response/:id?approved=true`

---

### Updated Pages

#### IDPResponse.tsx
**Status**: ⚠️ **Needs Final UI Integration**

**New State Variables**:
```tsx
const [analysisRecord, setAnalysisRecord] = useState<any>(null);
const [idpExecutionId, setIdpExecutionId] = useState<number | null>(null);
const [isCheckingStatus, setIsCheckingStatus] = useState(false);
const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
const [alertDialog, setAlertDialog] = useState({...});
```

**New Functions**:
- `checkProcessingStatus()` - Polls /process/status endpoint
- `handleManualValidationClick()` - Initiates manual validation flow
- `handleCredentialsSubmit()` - Submits credentials and navigates to review

**TODO - Add to Render Section**:
```tsx
{/* Status Banner for Manual Validation */}
{contractAnalysis && contractAnalysis.status === 'MANUAL_VALIDATION_REQUIRED' && (
  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-semibold text-amber-900 mb-1">Manual Validation Required</h3>
        <p className="text-sm text-amber-700">
          This document requires manual review and approval before proceeding to analysis.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={checkProcessingStatus}
          disabled={isCheckingStatus}
          title="Refresh status"
        >
          <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          size="sm"
          onClick={handleManualValidationClick}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Review & Approve
        </Button>
      </div>
    </div>
  </div>
)}

{/* Update "Continue to Analysis" button */}
<Button
  onClick={handleAnalyze}
  disabled={analyzing || contractAnalysis?.status !== 'SUCCEEDED'}
  title={contractAnalysis?.status !== 'SUCCEEDED' ? 'Processing must be completed successfully before analyzing' : ''}
>
  ...
</Button>

{/* Add dialogs at end */}
<AnypointCredentialsDialog
  isOpen={showCredentialsDialog}
  onClose={() => setShowCredentialsDialog(false)}
  onSubmit={handleCredentialsSubmit}
/>

<AlertDialog
  isOpen={alertDialog.isOpen}
  onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
  title={alertDialog.title}
  message={alertDialog.message}
  type={alertDialog.type}
/>
```

---

#### IdpExecutions.tsx (IDP Executions Management)
**Status**: ✅ **Complete - Updated**

**New Form Fields**:
```tsx
{/* Optional Anypoint Credentials Section */}
<div className="col-span-2 pt-4 border-t border-gray-200">
  <h3 className="text-sm font-semibold text-gray-900 mb-2">
    Anypoint Credentials (Optional)
  </h3>
  <p className="text-xs text-gray-600 mb-4">
    Credentials are encrypted, but if you don't want to save them, you will have to type them on each request to IDP that requires manual validation.
  </p>
</div>

<div>
  <label>Anypoint Username</label>
  <input type="text" ... />
</div>

<div>
  <label>Anypoint Password</label>
  <input type="password" ... />
  <p className="text-xs text-gray-500 mt-1">
    Password will be masked in the display
  </p>
</div>
```

---

### Routing

#### App.tsx
**New Route**:
```tsx
<Route path="/idp-review/:analysisRecordId" element={<MainLayout><IDPReview /></MainLayout>} />
```

---

## 🔄 User Workflow

### Complete Flow

```
1. User uploads & processes document
   ↓
2. MuleSoft IDP processes document
   ↓
3. Status = "MANUAL_VALIDATION_REQUIRED"
   ↓
4. IDPResponse page displays amber banner with:
   - Refresh button (polls /process/status)
   - "Review & Approve" button
   ↓
5. User clicks "Review & Approve"
   ↓
6. System calls /process/review
   ↓
7a. If credentials needed → Show credentials dialog
7b. If credentials stored → Skip to review page
   ↓
8. User enters credentials (if needed)
   - Option to save credentials (encrypted)
   - Security warning displayed
   ↓
9. Navigate to /idp-review/:id
   - Left: PDF viewer
   - Right: Editable fields
   ↓
10. User modifies fields
    ↓
11. User clicks "Approve Changes"
    ↓
12. System calls /process/approve
    ↓
13. Redirect to /idp-response/:id?approved=true
    - Status refreshed automatically
    - Status = "SUCCEEDED"
    ↓
14. "Continue to Analysis" button enabled
```

---

## 🔐 Security Considerations

### Encryption
- **Algorithm**: AES-256-CBC
- **Key Source**: `ENCRYPTION_KEY` env var or derived from `JWT_SECRET`
- **Fields Encrypted**:
  - `idp_executions.authClientId`
  - `idp_executions.authClientSecret`
  - `idp_executions.anypointUsername`
  - `idp_executions.anypointPassword`

### Best Practices
- ✅ All API calls require authentication
- ✅ Credentials stored with explicit user consent
- ✅ Warning displayed about admin credentials
- ✅ Passwords masked in UI
- ✅ Activity logging for all operations
- ✅ Credentials never sent to frontend unencrypted

---

## 📊 Activity Logging

All operations are logged to `activity_logs` table:

| Action | Type | Description |
|--------|------|-------------|
| Status Check | `processing.contract_processing` | "Checked IDP status for execution {id}: {status}" |
| Review Request | `processing.contract_processing` | "Requested manual review for execution {id}" |
| Review Approval | `processing.contract_processing` | "Approved manual review for execution {id}" |

---

## 🧪 Testing

### Manual Testing Checklist

#### Backend
- [ ] POST /api/idp-status/status returns current status
- [ ] POST /api/idp-status/review with no credentials → 400 error
- [ ] POST /api/idp-status/review with credentials → review data
- [ ] POST /api/idp-status/review with saveCredentials=true → saves to DB
- [ ] POST /api/idp-status/approve updates contract_analysis
- [ ] All operations log activities
- [ ] Encryption/decryption works for credentials

#### Frontend
- [ ] Credentials dialog appears when needed
- [ ] Credentials dialog saves option works
- [ ] Security warning displays correctly
- [ ] IDPReview page loads PDF
- [ ] IDPReview page displays all fields
- [ ] Confidence scores color-coded correctly
- [ ] Approve button disabled until changes made
- [ ] Approval redirects back to IDPResponse
- [ ] Status banner appears for MANUAL_VALIDATION_REQUIRED
- [ ] Refresh button polls status
- [ ] "Continue to Analysis" disabled until SUCCEEDED

#### Integration
- [ ] Full workflow from upload to approval
- [ ] Status polling updates UI
- [ ] Approved data sent in correct format
- [ ] MuleSoft endpoints called with correct payloads

---

## 🐛 Known Issues & Limitations

1. **Frontend Integration**: The IDPResponse.tsx render section needs the UI elements added (see TODO above). Functions are implemented but not yet used.

2. **executionId Extraction**: Currently extracted as `response.data.id || response.data.executionId || response.data.execution_id`. May need adjustment based on actual MuleSoft response format.

3. **Prisma Schema**: The `executionId` field in `contract_analysis` is not yet indexed by Prisma (added manually). Prisma regeneration needed after schema update.

---

## 📦 Files Modified/Created

### Backend
- ✅ `backend/prisma/schema.prisma` - Added execution_id, anypoint credentials
- ✅ `backend/src/services/muleSoft.service.ts` - Added 3 new methods
- ✅ `backend/src/controllers/idpStatus.controller.ts` - **NEW FILE**
- ✅ `backend/src/routes/idpStatus.routes.ts` - **NEW FILE**
- ✅ `backend/src/routes/index.ts` - Added idpStatus routes
- ✅ `backend/src/utils/encryption.ts` - Used for credentials

### Frontend
- ✅ `frontend/src/components/modals/AnypointCredentialsDialog.tsx` - **NEW FILE**
- ✅ `frontend/src/pages/IDPReview.tsx` - **NEW FILE**
- ⚠️ `frontend/src/pages/IDPResponse.tsx` - **PARTIALLY UPDATED** (needs UI render)
- ✅ `frontend/src/pages/IdpExecutions.tsx` - Added anypoint credentials fields
- ✅ `frontend/src/App.tsx` - Added IDPReview route

---

## 🚀 Deployment Instructions

### Environment Variables
No new environment variables required. Uses existing:
- `ENCRYPTION_KEY` (optional, falls back to JWT_SECRET)
- `MULESOFT_API_URL` (existing)

### Database Migration
```bash
cd backend
npx prisma db push
npx prisma generate
```

### Build
```bash
# Root
npm run build

# Or separately
cd backend && npm run build
cd frontend && npm run build
```

### Heroku Deployment
```bash
git push heroku feature/v2.1:main
```

---

## 🔮 Future Enhancements

1. **Auto-refresh**: Implement automatic status polling every 5 seconds when `MANUAL_VALIDATION_REQUIRED`
2. **Bulk Edit**: Allow editing multiple fields at once in review page
3. **Field History**: Show original vs. modified values
4. **Confidence Threshold**: Auto-flag fields below certain confidence score
5. **Role-based Review**: Assign reviews to specific users/roles
6. **Review Comments**: Add comment field for each reviewed field
7. **Audit Trail**: Track who reviewed and approved each field

---

## 📚 Related Documentation

- [MuleSoft IDP API Documentation](https://docs.mulesoft.com/idp)
- [Encryption Utilities](/backend/src/utils/encryption.ts)
- [Activity Logging](/backend/src/services/logging.service.ts)
- [Database Schema](/backend/prisma/schema.prisma)

---

## 📞 Support

For questions or issues:
- **Created by**: Rodrigo Torres (rodrigo.torres@salesforce.com)
- **Feature Branch**: `feature/v2.1`
- **Base Branch**: `main`

---

**Last Updated**: October 22, 2025
**Version**: v2.1
**Status**: 95% Complete (Frontend UI integration remaining)

