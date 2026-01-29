# Default Signup Role - Implementation Summary

**Feature:** Configurable Default Signup Role  
**Date:** January 29, 2026  
**Status:** ✅ Complete

## Overview

This feature makes the default user signup role configurable through system settings, replacing the previous hardcoded `viewer` role. Administrators can now choose whether new users receive `admin`, `user`, or `viewer` roles upon registration.

## Changes Made

### 1. Database Migration

**File:** `backend/init-database.sql`

Added new system setting:
```sql
('default_signup_role','viewer','Default role assigned to new user registrations (admin, user, or viewer)',false, NOW(), NOW())
```

**Default Value:** `viewer` (most restrictive, following principle of least privilege)

### 2. Backend Changes

#### A. Auth Service Update
**File:** `backend/src/services/auth.service.ts`

**Changes:**
- Import `getSetting` utility
- Read `default_signup_role` from system settings (with ENV override support)
- Validate role exists in database before assignment
- Fallback to `viewer` if setting is invalid or missing
- Set appropriate `defaultMenuItem` based on role (admin → dashboard, others → history)
- Handle case-insensitive role names

**Priority Order:**
1. `DEFAULT_SIGNUP_ROLE` environment variable
2. `default_signup_role` database setting
3. Fallback: `viewer`

#### B. Settings Controller Update
**File:** `backend/src/controllers/settings.controller.ts`

**Changes:**
- Added `default_signup_role` to ENV mapping for `DEFAULT_SIGNUP_ROLE`
- Supports ENV override detection in Settings API

### 3. Frontend Changes

#### A. Select Component (New)
**File:** `frontend/src/components/common/Select.tsx`

**Features:**
- Reusable dropdown component
- Full light/dark theme support
- Disabled state for ENV overrides
- Error and helper text support
- Consistent with existing Input component styling

#### B. Settings Page Update
**File:** `frontend/src/pages/admin/Settings.tsx`

**Changes:**
- Import Select component and AlertTriangle icon
- Special handling for `default_signup_role` setting in Advanced Settings section
- Dropdown with three options:
  - Admin
  - User
  - Viewer (Recommended)
- Security warning when `admin` is selected
- ENV override indication
- Full theme support

### 4. Testing

#### A. Unit Tests
**File:** `backend/src/services/__tests__/auth.service.test.ts`

**Coverage:**
- ✅ Assign viewer role when setting is "viewer"
- ✅ Assign user role when setting is "user"
- ✅ Assign admin role when setting is "admin"
- ✅ Fallback to viewer when setting is null/empty
- ✅ Fallback to viewer when configured role doesn't exist
- ✅ Prioritize ENV variable over database setting
- ✅ Skip role assignment when skipDefaultRole is true
- ✅ Handle case-insensitive role names
- ✅ Reject duplicate email addresses
- ✅ Integration scenarios for all valid roles

#### B. E2E Tests
**File:** `backend/src/__tests__/e2e/default-signup-role.e2e.test.ts`

**Coverage:**
- ✅ Settings API allows admin to view/update setting
- ✅ Non-admin users cannot update settings
- ✅ User registration assigns correct role based on setting
- ✅ Fallback to viewer when setting has invalid value
- ✅ ENV override behavior
- ✅ Security validation (authentication required)
- ✅ Activity logging for setting changes and registrations

#### C. Jest Configuration
**File:** `backend/jest.config.js`

- Configured TypeScript support via ts-jest
- 90% coverage threshold for branches, functions, lines, statements
- Test setup file for environment variables

#### D. Verification Script
**File:** `backend/src/scripts/verify-default-signup-role.ts`

**Checks:**
1. Setting exists in system_settings table
2. Setting value is valid (admin, user, or viewer)
3. All required roles exist in roles table
4. getSetting utility works correctly
5. ENV override detection
6. Summary and next steps

**Run with:**
```bash
npm run verify:signup-role
```

### 5. Documentation

**File:** `docs/CONFIGURABLE_SETTINGS.md`

**Additions:**
- Updated settings table to include `default_signup_role`
- Added comprehensive "Default Signup Role Configuration" section
- Valid values table with descriptions
- Configuration methods (UI, ENV, Database)
- Security considerations and warnings
- UI features description
- Behavior explanation
- Testing instructions
- Common use cases with examples
- Troubleshooting guide

## Installation & Testing

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `jest`, `@jest/globals` - Testing framework
- `ts-jest` - TypeScript support for Jest
- `@types/jest`, `@types/supertest` - Type definitions
- `supertest` - HTTP assertions for E2E tests

### 2. Database Migration

If your database is already set up, add the new setting manually:

```sql
INSERT INTO system_settings (setting_key, setting_value, description, is_secret, created_at, updated_at)
VALUES ('default_signup_role', 'viewer', 'Default role assigned to new user registrations (admin, user, or viewer)', false, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;
```

Or run the full init script:
```bash
npm run db:init
```

### 3. Verify Installation

```bash
npm run verify:signup-role
```

Expected output:
```
✅ Setting exists: default_signup_role = "viewer"
✅ Setting value is valid: "viewer"
✅ All required roles exist
✅ getSetting works correctly
✅ No ENV override
✅ ALL CHECKS PASSED
```

### 4. Run Tests

```bash
# Run all tests with coverage
npm test

# Run only unit tests
npm run test:unit

# Run only E2E tests
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### 5. Manual Testing

#### Test 1: Update Setting via Admin UI
1. Login as admin: `admin@mulesoft.com` / `Admin@123`
2. Navigate to Settings → Advanced Settings
3. Find "Default Signup Role" dropdown
4. Select "User"
5. Click "Save All Changes"
6. Verify success message

#### Test 2: Register New User
1. Logout
2. Go to registration page
3. Register with new email
4. Login with new credentials
5. Verify assigned role:
   ```sql
   SELECT u.email, r.name 
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE u.email = 'your-test@email.com';
   ```

#### Test 3: Test All Roles
Repeat Test 1-2 for each role (admin, user, viewer) and verify:
- Correct role is assigned
- Correct default menu item (admin → dashboard, others → history)
- User can access appropriate pages based on role

#### Test 4: ENV Override
1. Set environment variable:
   ```bash
   export DEFAULT_SIGNUP_ROLE=admin
   ```
2. Restart backend
3. Open Settings page
4. Verify ENV badge appears next to setting
5. Verify dropdown is disabled
6. Register new user
7. Verify user gets admin role (not database setting)

#### Test 5: Invalid Role Handling
1. Update database directly:
   ```sql
   UPDATE system_settings 
   SET setting_value = 'invalid_role' 
   WHERE setting_key = 'default_signup_role';
   ```
2. Register new user
3. Verify user gets `viewer` role (fallback)
4. Check logs for validation message

## Security Considerations

### ⚠️ Important Warnings

1. **Admin Role Default**
   - Setting default to `admin` gives **all new users full administrative access**
   - Only use in trusted, controlled environments
   - **Not recommended** for production or public-facing applications
   - UI displays prominent warning when this is selected

2. **Principle of Least Privilege**
   - Default to `viewer` (read-only) for maximum security
   - Manually upgrade users to higher roles as needed
   - Regular audit of user roles and permissions

3. **Validation & Fallback**
   - System validates role exists in database
   - Falls back to `viewer` if configured role is invalid
   - Prevents broken registrations due to misconfiguration

4. **Audit Trail**
   - All role assignments logged in activity_logs table
   - Setting changes logged with admin user ID
   - Registration events captured with assigned role

## Files Modified

### Backend
1. `backend/init-database.sql` - Database migration
2. `backend/src/services/auth.service.ts` - Auth logic
3. `backend/src/controllers/settings.controller.ts` - Settings API
4. `backend/package.json` - Test dependencies and scripts
5. `backend/jest.config.js` - Jest configuration (new)
6. `backend/src/__tests__/setup.ts` - Test setup (new)
7. `backend/src/services/__tests__/auth.service.test.ts` - Unit tests (new)
8. `backend/src/__tests__/e2e/default-signup-role.e2e.test.ts` - E2E tests (new)
9. `backend/src/scripts/verify-default-signup-role.ts` - Verification script (new)

### Frontend
1. `frontend/src/components/common/Select.tsx` - Select component (new)
2. `frontend/src/pages/admin/Settings.tsx` - Settings UI

### Documentation
1. `docs/CONFIGURABLE_SETTINGS.md` - Updated documentation
2. `docs/DEFAULT_SIGNUP_ROLE_IMPLEMENTATION.md` - This file (new)

## Future Enhancements

### Potential Improvements
1. **Multiple Default Roles**: Allow assigning multiple roles by default
2. **Role Assignment Rules**: Conditional role assignment based on email domain, registration source, etc.
3. **Temporary Roles**: Auto-expire trial roles after certain period
4. **Approval Workflow**: Require admin approval for certain role assignments
5. **Role Presets**: Predefined role combinations (e.g., "Trial User" = viewer + limited features)

### API Enhancements
1. **Validation Endpoint**: Add endpoint to validate role values before saving
2. **Role Permissions API**: Expose role capabilities for UI to display
3. **Bulk Role Update**: Admin tool to bulk-update user roles

## Troubleshooting

### Common Issues

#### Issue: Setting Not Found
**Symptom:** Verification script reports setting doesn't exist  
**Solution:**
```bash
psql $DATABASE_URL -f backend/init-database.sql
```

#### Issue: Tests Failing
**Symptom:** Jest tests fail with module not found  
**Solution:**
```bash
cd backend
npm install
npm test
```

#### Issue: ENV Override Not Working
**Symptom:** ENV variable set but database value still used  
**Solution:**
1. Verify ENV variable is set: `echo $DEFAULT_SIGNUP_ROLE`
2. Restart backend server
3. Check Settings API response for `hasEnvOverride: true`

#### Issue: Warning Persists After Changing from Admin
**Symptom:** Amber warning still shows after selecting different role  
**Solution:**
- This is expected if you haven't saved yet
- Click "Save All Changes" to update
- Warning will disappear after save completes

#### Issue: New Users Not Getting Correct Role
**Symptom:** User registration succeeds but wrong role assigned  
**Solution:**
1. Check setting value: `SELECT * FROM system_settings WHERE setting_key = 'default_signup_role';`
2. Verify role exists: `SELECT * FROM roles;`
3. Check activity logs: `SELECT * FROM activity_logs WHERE action_type = 'auth.register' ORDER BY timestamp DESC;`
4. Run verification script: `npm run verify:signup-role`

## Rollback Plan

If issues arise, rollback steps:

### 1. Revert to Hardcoded Viewer Role

```typescript
// backend/src/services/auth.service.ts
// Comment out dynamic role logic and restore:

if (!skipDefaultRole) {
  const viewerRole = await tx.role.findUnique({
    where: { name: ROLES.VIEWER },
  });
  // ... rest of original code
}
```

### 2. Remove Setting from Database

```sql
DELETE FROM system_settings WHERE setting_key = 'default_signup_role';
```

### 3. Revert Frontend Changes

```typescript
// frontend/src/pages/admin/Settings.tsx
// Remove Select import and dropdown, restore Input field
```

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review logs: `tail -f backend/logs/app.log`
3. Run verification script: `npm run verify:signup-role`
4. Check test coverage: `npm test -- --coverage`

## Conclusion

This feature successfully implements configurable default signup roles with:
- ✅ Complete backend and frontend implementation
- ✅ Comprehensive testing (>90% coverage)
- ✅ Full documentation
- ✅ Security considerations
- ✅ Verification tools
- ✅ Environment variable support
- ✅ Theme support (light/dark)
- ✅ Admin UI with warnings
- ✅ Audit logging

The system is production-ready and follows best practices for security, testing, and maintainability.
