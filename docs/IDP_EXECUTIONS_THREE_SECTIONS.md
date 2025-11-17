# IDP Executions - Three-Section Implementation

## Overview

This document describes the implementation of the three-section IDP Executions page with proper permission handling, secret masking, and admin capabilities.

**Date:** November 17, 2025  
**Feature:** IDP Executions Three-Section View  
**Status:** ✅ Completed

---

## Problem Statement

The IDP Executions page was missing key functionality:

1. **Missing "All Other Executions" section** - Admins couldn't view all executions in the system
2. **Insufficient secret masking** - Shared executions weren't properly hiding sensitive credentials
3. **No admin edit capability** - Admins couldn't modify shared/other executions
4. **Missing readonly mode** - Non-admins could potentially edit shared executions

### User Requirements

- **Three sections needed:**
  1. My IDP Executions (user's own executions)
  2. Shared with Me (executions shared with the user)
  3. All Other Executions (all remaining executions - admin only)

- **Permission rules:**
  - **For shared executions:**
    - Admins: Can edit, but cannot see secrets (masked as `********`)
    - Non-admins: Read-only access
  - **For all other executions:**
    - Only admins can see this section
    - Admins can edit, but cannot see secrets (masked as `********`)

---

## Implementation

### Backend Changes

#### 1. Service Layer (`backend/src/services/idpExecution.service.ts`)

**Added new method:**

```typescript
async getAllOtherExecutions(userId: number)
```

- Returns all active executions that:
  - User doesn't own
  - Are NOT shared with the user
- Masks all secrets: `authClientSecret` = `'********'`, `authClientId` masked, `anypointUsername` = null, `anypointPassword` = null

**Updated method:**

```typescript
async update(id: number, userId: number, data: any, isAdmin: boolean = false)
```

- Now accepts `isAdmin` parameter
- Allows admins to update any execution (not just owned ones)
- Handles empty credential fields (keeps existing values)
- Returns masked credentials for admin edits on other users' executions

**Secret masking improvements:**

- Changed from `'***'` to `'********'` for consistency
- Added masking for `anypointUsername` and `anypointPassword`

#### 2. Controller Layer (`backend/src/controllers/idpExecution.controller.ts`)

**Updated `getAll` method:**

```typescript
async getAll(req: AuthenticatedRequest, res: Response)
```

- Checks if user is admin
- Fetches `myExecutions`, `sharedExecutions`, and (for admins) `allOtherExecutions`
- Returns different response structure based on admin status

**Updated `update` method:**

```typescript
async update(req: AuthenticatedRequest, res: Response)
```

- Passes `isAdmin` flag to service
- Enables admin updates on any execution

### Frontend Changes

#### 1. State Management (`frontend/src/pages/IdpExecutions.tsx`)

**Added state:**

```typescript
const [allOtherExecutions, setAllOtherExecutions] = useState<IdpExecution[]>([]);
```

**Updated `fetchExecutions`:**

- Now fetches and stores `allOtherExecutions` from API response

#### 2. ExecutionCard Component

**Updated signature:**

```typescript
const ExecutionCard = ({ 
  execution, 
  isShared, 
  isOther 
}: { 
  execution: IdpExecution; 
  isShared: boolean; 
  isOther?: boolean 
})
```

**New logic:**

- `isAdmin`: Checks if current user is admin
- `canEdit`: Determines if user can edit (owner OR admin for shared/other)
- `isReadOnly`: Determines if everything is readonly (shared AND not admin)

**Visual changes:**

- Added badges:
  - "Shared with me" (blue) for shared executions
  - "Admin View" (yellow) for all other executions
  - "Read Only" (gray) for non-admin viewing shared
- Credentials displayed with:
  - Gray background (`bg-gray-200`) for masked secrets
  - "(Masked)" label for shared/other executions
- Action buttons:
  - Owners: Edit, Share, Delete
  - Admins (non-owners): Edit only (with tooltip)
  - Non-admins: No actions

#### 3. Three Sections Display

**Section 1: My IDP Executions**

```typescript
<ExecutionCard execution={execution} isShared={false} isOther={false} />
```

**Section 2: Shared with Me**

```typescript
{sharedExecutions.length > 0 && (
  <div>
    <h2>Shared with Me</h2>
    <ExecutionCard execution={execution} isShared={true} isOther={false} />
  </div>
)}
```

**Section 3: All Other Executions (Admin Only)**

```typescript
{user?.roles?.includes('admin') && allOtherExecutions.length > 0 && (
  <div>
    <h2>All Other Executions <Badge variant="warning">Admin Only</Badge></h2>
    <ExecutionCard execution={execution} isShared={false} isOther={true} />
  </div>
)}
```

#### 4. Edit Form Updates

**Admin edit notice:**

When admins edit someone else's execution, a yellow banner displays:

```
🔑 Admin Edit Mode
You are editing another user's IDP execution. Secret values are hidden for security.
Leave credential fields empty to keep existing values, or provide new values to replace them.
```

**Form field changes:**

- **Client ID & Client Secret:**
  - Required only for owners (not required for admin edits)
  - Placeholder: "Leave empty to keep current value, or enter new value"
  - Helper text explains masking behavior

- **Anypoint Credentials:**
  - Same behavior as Client ID/Secret
  - Empty fields preserve existing values

**`handleEdit` logic:**

```typescript
const isSharedOrOther = fullExecution.authClientSecret === '********';

setFormData({
  // ... other fields
  authClientId: isSharedOrOther ? '' : fullExecution.authClientId,
  authClientSecret: isSharedOrOther ? '' : fullExecution.authClientSecret,
  // ...
});
```

---

## Security Features

### 1. Secret Masking

**Display masking:**
- `authClientId`: Partially masked (e.g., `abc***def`)
- `authClientSecret`: `'********'`
- `anypointUsername`: Not displayed
- `anypointPassword`: Not displayed

**Form masking:**
- Admins editing shared/other executions see empty fields
- Placeholders indicate they can replace values
- Empty submissions preserve existing values

### 2. Permission Enforcement

**Backend:**
- `getAll`: Only returns `allOtherExecutions` to admins
- `update`: Validates admin status before allowing cross-user updates
- `getById`: Returns masked credentials for non-owners

**Frontend:**
- Third section only rendered for admins
- Edit buttons only shown when user has permission
- Form fields properly disabled/readonly based on permissions

### 3. Credential Updates

**For owners:**
- Can see and update all credentials normally

**For admins editing others' executions:**
- Cannot see existing secret values
- Can provide new values to replace existing ones
- Empty fields = keep existing values
- This allows admins to fix broken credentials without seeing them

---

## User Experience Flow

### Non-Admin User

1. **Views own executions:**
   - Full access to edit, share, delete
   - Can see all credential values

2. **Views shared executions:**
   - Read-only badges displayed
   - Credentials masked with gray background
   - No action buttons available
   - "Owned by" information shown

### Admin User

1. **Views own executions:**
   - Same as non-admin for their own

2. **Views shared executions:**
   - Can see and edit
   - Credentials masked
   - Edit button available with tooltip

3. **Views all other executions:**
   - Third section appears with "Admin Only" badge
   - Can see all executions not owned or shared
   - "Admin View" badge on each card
   - Can edit but not see secrets

4. **Edits someone else's execution:**
   - Yellow "Admin Edit Mode" banner
   - Empty credential fields with helpful placeholders
   - Can replace credentials without seeing them
   - Success message on save

---

## API Changes

### GET `/idp-executions`

**Response for non-admin:**

```json
{
  "myExecutions": [...],
  "sharedExecutions": [...]
}
```

**Response for admin:**

```json
{
  "myExecutions": [...],
  "sharedExecutions": [...],
  "allOtherExecutions": [...]
}
```

### PUT `/idp-executions/:id`

**Behavior:**

- Accepts `isAdmin` context from request
- Empty credential fields preserve existing values
- Returns masked response for admin editing others

---

## Testing Checklist

### As Non-Admin User

- [ ] See "My IDP Executions" section
- [ ] See "Shared with Me" section (if any shared)
- [ ] Do NOT see "All Other Executions" section
- [ ] Can edit/delete own executions
- [ ] Cannot edit shared executions (no buttons)
- [ ] Shared executions show masked credentials
- [ ] Shared executions show "Read Only" badge

### As Admin User

- [ ] See all three sections
- [ ] "All Other Executions" has "Admin Only" badge
- [ ] Can edit own executions normally
- [ ] Can edit shared executions
- [ ] Can edit other executions
- [ ] Editing others shows yellow "Admin Edit Mode" banner
- [ ] Credential fields empty when editing others
- [ ] Placeholders indicate "keep or replace" behavior
- [ ] Can submit with empty fields (keeps existing)
- [ ] Can submit with new values (replaces)
- [ ] Other executions show "Admin View" badge
- [ ] Masked credentials have gray background

### General

- [ ] No console errors
- [ ] Proper activity logging for all operations
- [ ] Frontend build succeeds
- [ ] All secrets properly encrypted in database
- [ ] Secrets never exposed in API responses (except to owners)

---

## Files Modified

### Backend

1. `backend/src/services/idpExecution.service.ts`
   - Added `getAllOtherExecutions()` method
   - Updated `update()` to support admin edits
   - Updated secret masking to use `'********'`
   - Added logic to preserve empty credential fields

2. `backend/src/controllers/idpExecution.controller.ts`
   - Updated `getAll()` to return all three sections
   - Updated `update()` to pass admin status

### Frontend

1. `frontend/src/pages/IdpExecutions.tsx`
   - Added `allOtherExecutions` state
   - Updated `fetchExecutions()` to handle three sections
   - Updated `ExecutionCard` with `isOther` prop
   - Added permission logic (`canEdit`, `isReadOnly`)
   - Added visual badges and styling
   - Added third section rendering
   - Updated `handleEdit()` to detect masked executions
   - Added "Admin Edit Mode" banner
   - Updated form fields with dynamic placeholders
   - Made credential fields optional for admin edits

---

## Security Considerations

1. **Encryption at rest:** All credentials encrypted in database
2. **Never expose secrets:** Backend never returns decrypted secrets to non-owners
3. **Masked display:** Consistent `'********'` masking in UI
4. **Admin transparency:** Admins can fix credentials without seeing them
5. **Audit trail:** All updates logged with `loggingService`
6. **Role validation:** Admin status checked on every privileged operation

---

## Future Enhancements

1. **Bulk operations:** Allow admins to bulk update/deactivate executions
2. **Audit log view:** Show history of who edited what
3. **Credential rotation:** Schedule automatic rotation reminders
4. **Testing automation:** Validate credentials before saving
5. **Export functionality:** Allow admins to export configuration (without secrets)

---

## Rollback Plan

If issues are discovered:

1. **Frontend only:** Revert `frontend/src/pages/IdpExecutions.tsx`
2. **Backend only:** Revert service and controller changes
3. **Full rollback:** Revert all files in this document

No database migrations needed - changes are code-only.

---

## Conclusion

The IDP Executions page now properly implements three-section display with robust permission handling, secret masking, and admin capabilities. Admins can manage all executions while maintaining security, and non-admins have appropriate readonly access to shared resources.

All requirements met:
✅ Three sections (My, Shared, All Other)  
✅ Admin edit capability  
✅ Secret masking for shared/other  
✅ Non-admin readonly for shared  
✅ Proper badges and visual feedback  
✅ Security maintained throughout

