# IDP Executions Feature

## Overview

The IDP Executions feature allows users to manage multiple MuleSoft IDP (Intelligent Document Processing) execution configurations. Users can create, edit, delete, and share IDP execution configurations with other users in the system.

## Key Features

✅ **Configuration Management**: Create and manage multiple IDP execution configurations
✅ **URL Parsing**: Automatically parse MuleSoft IDP URLs to extract configuration details
✅ **Credential Encryption**: Securely store authentication credentials using AES-256-CBC encryption
✅ **Sharing**: Share IDP executions with other users (view-only with masked credentials)
✅ **Integration**: Seamlessly integrate with document processing workflow
✅ **Role-Based Access**: Accessible to both admin and user roles

## Database Schema

### New Table: `idp_executions`

```sql
CREATE TABLE idp_executions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  protocol VARCHAR(10) NOT NULL,
  host VARCHAR(255) NOT NULL,
  base_path VARCHAR(255) NOT NULL,
  org_id VARCHAR(100) NOT NULL,
  action_id VARCHAR(100) NOT NULL,
  action_version VARCHAR(50) NOT NULL,
  auth_client_id TEXT NOT NULL,  -- Encrypted
  auth_client_secret TEXT NOT NULL,  -- Encrypted
  is_active BOOLEAN DEFAULT TRUE,
  shared_with JSON DEFAULT '[]',  -- Array of user IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_idp_executions_user_id ON idp_executions(user_id);
CREATE INDEX idx_idp_executions_is_active ON idp_executions(is_active);
```

## Backend Implementation

### 1. Encryption Utility (`backend/src/utils/encryption.ts`)

- **AES-256-CBC encryption** for sensitive credentials
- **URL parser** for MuleSoft IDP URLs
- **Secret masking** for shared executions
- Uses `ENCRYPTION_KEY` environment variable or derives from `JWT_SECRET`

### 2. Service Layer (`backend/src/services/idpExecution.service.ts`)

**Methods:**
- `create()` - Create new IDP execution with encrypted credentials
- `getUserExecutions()` - Get user's own executions (decrypted credentials)
- `getSharedExecutions()` - Get executions shared with user (masked credentials)
- `getById()` - Get single execution with appropriate credential handling
- `update()` - Update existing execution
- `delete()` - Soft delete execution
- `share()` - Share execution with users
- `unshare()` - Remove share access
- `getSharedUsers()` - Get list of users with access
- `getForProcessing()` - Get decrypted execution for MuleSoft API calls (owner only)

### 3. Controller Layer (`backend/src/controllers/idpExecution.controller.ts`)

**Endpoints:**
- `GET /api/idp-executions` - Get all user's and shared executions
- `GET /api/idp-executions/:id` - Get single execution
- `POST /api/idp-executions` - Create new execution
- `POST /api/idp-executions/parse-url` - Parse MuleSoft IDP URL
- `PUT /api/idp-executions/:id` - Update execution
- `DELETE /api/idp-executions/:id` - Delete execution
- `POST /api/idp-executions/:id/share` - Share with users
- `DELETE /api/idp-executions/:id/unshare/:userId` - Remove share
- `GET /api/idp-executions/:id/shared-users` - Get shared users list

### 4. Integration with Document Processing

**Modified Files:**
- `backend/src/services/muleSoft.service.ts`
  - Added `IdpExecutionConfig` interface
  - Updated `makeRequest()` to accept optional IDP config
  - Modified `processContractDocument()` to use IDP config
  - Builds MuleSoft request body with auth credentials and IDP request structure

- `backend/src/services/document.service.ts`
  - Added `idpExecutionId` parameter to `startProcessing()`
  - Modified `processContractOnly()` to fetch and use IDP config

- `backend/src/controllers/analysis.controller.ts`
  - Updated `startProcessing()` to accept `idpExecutionId` from request body

**Request Body Format (when using IDP Execution):**

```json
{
  "job_id": "job_1234567890",
  "auth_client_id": "<decrypted_value>",
  "auth_client_secret": "<decrypted_value>",
  "idp_http_request": {
    "host": "idp-rt.us-east-1.anypoint.mulesoft.com",
    "base_path": "/api/v1/organizations/",
    "executions_path": "actions/<action_id>/versions/<version>/executions",
    "protocol": "HTTPS"
  }
}
```

## Frontend Implementation

### 1. Main Page (`frontend/src/pages/IdpExecutions.tsx`)

**Features:**
- Two sections: "My IDP Executions" and "Shared with Me"
- Create/Edit modal with URL parser
- Credential masking for shared executions
- Share functionality with user search
- Delete confirmation dialogs
- Form validation
- Password visibility toggle

**UI Components:**
- Execution cards with configuration details
- URL parser input
- Form with all IDP configuration fields
- Search and share modal integration
- Alert dialogs for feedback

### 2. Updated Components

**ShareModal (`frontend/src/components/common/ShareModal.tsx`):**
- Made generic to support multiple resource types
- Added `resourceType` prop: `'analysis' | 'idp-execution'`
- Dynamic API endpoints based on resource type
- Backward compatible with legacy `analysisId` prop

**App.tsx:**
- Added route: `/idp-executions`
- Imported `IdpExecutions` component

### 3. Processing Integration (Future)

The Processing page will be updated to:
- Show IDP execution selector dropdown
- Allow users to choose from their own or shared IDP executions
- Pass `idpExecutionId` in the processing request

## URL Format

MuleSoft IDP URL format:
```
{protocol}://{host}{base_path}{org_id}/actions/{action_id}/versions/{action_version}/executions
```

Example:
```
https://idp-rt.us-east-1.anypoint.mulesoft.com/api/v1/organizations/eb16587a-02cf-43f4-aa5f-c6a924fb3635/actions/1665e50a-9f68-43d0-a533-49bfc24d920b/versions/1.3.0/executions
```

## Security

1. **Encryption**: All credentials are encrypted at rest using AES-256-CBC
2. **Access Control**: 
   - Users can only edit/delete their own executions
   - Shared executions show masked credentials
   - Only owners can use executions for processing
3. **Sharing**: 
   - Explicit sharing model
   - Credentials are masked for shared users
   - Owner can revoke access at any time

## Menu and Permissions

**Menu Item:**
- Title: "IDP Executions"
- Icon: "server"
- Route: "/idp-executions"
- Order: 5
- Assigned to: `admin` and `user` roles

**SQL Script:** `backend/add-idp-executions-menu.sql`

## Environment Variables

**Optional:**
- `ENCRYPTION_KEY` - 32-byte hex string for AES-256 encryption
  - If not provided, derived from `JWT_SECRET`
  - Example: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Deployment Steps

1. **Push database schema:**
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:push
   ```

2. **Add menu item:**
   ```bash
   psql $DATABASE_URL -f backend/add-idp-executions-menu.sql
   ```

3. **Set encryption key (optional):**
   ```bash
   # Generate key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Set on Heroku
   heroku config:set ENCRYPTION_KEY=<generated_key>
   ```

4. **Build and deploy:**
   ```bash
   npm run build
   git push heroku main
   ```

## API Examples

### Create IDP Execution

```bash
POST /api/idp-executions
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Production IDP",
  "description": "Main production IDP configuration",
  "protocol": "HTTPS",
  "host": "idp-rt.us-east-1.anypoint.mulesoft.com",
  "basePath": "/api/v1/organizations/",
  "orgId": "eb16587a-02cf-43f4-aa5f-c6a924fb3635",
  "actionId": "1665e50a-9f68-43d0-a533-49bfc24d920b",
  "actionVersion": "1.3.0",
  "authClientId": "your-client-id",
  "authClientSecret": "your-client-secret"
}
```

### Parse URL

```bash
POST /api/idp-executions/parse-url
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://idp-rt.us-east-1.anypoint.mulesoft.com/api/v1/organizations/eb16587a-02cf-43f4-aa5f-c6a924fb3635/actions/1665e50a-9f68-43d0-a533-49bfc24d920b/versions/1.3.0/executions"
}
```

### Share Execution

```bash
POST /api/idp-executions/123/share
Content-Type: application/json
Authorization: Bearer <token>

{
  "userIds": [45, 67]
}
```

### Process Document with IDP Execution

```bash
POST /api/analysis/start-processing
Content-Type: application/json
Authorization: Bearer <token>

{
  "contractUploadId": 456,
  "dataUploadId": 789,
  "idpExecutionId": 123,
  "prompt": {
    "id": 1,
    "name": "Contract Analysis"
  },
  "variables": {}
}
```

## Testing Checklist

- [ ] Create IDP execution
- [ ] Parse URL auto-fills fields
- [ ] Edit existing execution
- [ ] Delete execution (with confirmation)
- [ ] Share execution with another user
- [ ] View shared execution (credentials masked)
- [ ] Unshare execution
- [ ] Use IDP execution in processing workflow
- [ ] Verify credentials are encrypted in database
- [ ] Verify only owner can process with execution
- [ ] Test with both admin and user roles

## Future Enhancements

1. **Processing Page Integration**:
   - Add IDP execution selector to Processing page
   - Default to first available execution
   - Show execution details on selection

2. **Audit Logging**:
   - Track when executions are used
   - Log share/unshare activities
   - Monitor failed authentication attempts

3. **Validation**:
   - Test connection before saving
   - Validate credentials
   - Health check endpoint

4. **Bulk Operations**:
   - Import/export configurations
   - Bulk share with multiple users
   - Clone existing configurations

## Files Changed/Created

### Backend
- ✅ `backend/prisma/schema.prisma` (updated)
- ✅ `backend/src/utils/encryption.ts` (new)
- ✅ `backend/src/services/idpExecution.service.ts` (new)
- ✅ `backend/src/controllers/idpExecution.controller.ts` (new)
- ✅ `backend/src/routes/idpExecution.routes.ts` (new)
- ✅ `backend/src/routes/index.ts` (updated)
- ✅ `backend/src/services/muleSoft.service.ts` (updated)
- ✅ `backend/src/services/document.service.ts` (updated)
- ✅ `backend/src/controllers/analysis.controller.ts` (updated)
- ✅ `backend/add-idp-executions-menu.sql` (new)

### Frontend
- ✅ `frontend/src/pages/IdpExecutions.tsx` (new)
- ✅ `frontend/src/components/common/ShareModal.tsx` (updated)
- ✅ `frontend/src/App.tsx` (updated)

### Documentation
- ✅ `IDP_EXECUTIONS_FEATURE.md` (this file)

## Support

For issues or questions:
1. Check database schema is up to date
2. Verify menu item was added
3. Check browser console for errors
4. Review server logs for encryption/decryption errors
5. Confirm `ENCRYPTION_KEY` or `JWT_SECRET` is set

---

**Version**: 1.0.0
**Date**: 2025-10-17
**Author**: AI Assistant with Rodrigo Torres

