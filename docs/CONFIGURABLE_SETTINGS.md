# Configurable Settings System

This document describes the configurable settings system that allows administrators to customize the application branding and configuration through the database.

## Overview

All system settings are now stored in the `system_settings` database table and can be managed by administrators through the Settings page (`/settings`). This includes:

- **Application Branding**: Logo and company name
- **MuleSoft API Configuration**: Base URL, credentials, timeout
- **Other Settings**: CORS, JWT, logging, etc.

## Features

### 1. Database-Driven Configuration

All settings are stored in the `system_settings` table with the following structure:

```sql
CREATE TABLE system_settings (
  id             SERIAL PRIMARY KEY,
  setting_key    VARCHAR(100) UNIQUE NOT NULL,
  setting_value  TEXT,
  description    TEXT,
  is_secret      BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);
```

### 2. Default Settings

The following settings are automatically seeded during `npm run seed`:

| Setting Key | Description | Is Secret |
|------------|-------------|-----------|
| `app_name` | Application name displayed in sidebar and header | No |
| `app_logo_url` | Application logo URL (can be uploaded by admin) | No |
| `default_signup_role` | Default role assigned to new user registrations (admin, user, or viewer) | No |
| `mulesoft_api_base_url` | MuleSoft API base URL | No |
| `mulesoft_api_username` | MuleSoft API username for basic authentication | Yes |
| `mulesoft_api_password` | MuleSoft API password for basic authentication | Yes |
| `mulesoft_api_timeout` | MuleSoft API timeout in milliseconds | No |
| `cors_origin` | CORS allowed origin | No |
| `jwt_secret` | JWT secret key for token signing | Yes |
| `jwt_expires_in` | JWT token expiration time | No |
| `log_level` | Logging level (debug, info, warn, error) | No |

### 3. Admin Settings Page

Administrators can access the Settings page at `/settings` to:

- **Upload Custom Logo**: Upload PNG, JPG, or SVG files (max 5MB)
- **Change App Name**: Customize the application name
- **Configure MuleSoft API**: Update base URL, credentials, and timeout
- **Manage Other Settings**: JWT, CORS, logging, etc.

#### Access Control

- Only users with the `admin` role can access the settings page
- Non-admin users are automatically redirected to the dashboard

### 4. API Endpoints

#### Public Settings (No Auth Required)
```http
GET /api/settings/public
```

Returns all non-secret settings for use in the frontend (logo, app name, etc.)

#### Get All Settings (Admin Only)
```http
GET /api/settings/all
```

Returns all settings including secrets (admin access required)

#### Update Setting (Admin Only)
```http
PUT /api/settings/:settingKey
Content-Type: application/json

{
  "settingValue": "new value"
}
```

#### Upload Logo (Admin Only)
```http
POST /api/settings/upload-logo
Content-Type: multipart/form-data

{
  "logo": <file>
}
```

Uploaded logos are stored in `/uploads/logos/` and served statically.

## Implementation Details

### Backend

#### 1. Settings Utilities (`backend/src/utils/getSettings.ts`)

```typescript
// Get a specific setting with caching
await getSetting('mulesoft_api_base_url', 'http://localhost:8081');

// Get all settings
const settings = await getAllSettings();

// Clear cache (after updating settings)
clearSettingsCache();
```

Settings are cached for 1 minute to reduce database queries.

#### 2. MuleSoft Configuration (`backend/src/config/muleSoft.ts`)

The MuleSoft configuration now reads from database settings:

```typescript
const config = await getMuleSoftConfig();
// Returns config with database values, falling back to env vars
```

#### 3. Settings Controller (`backend/src/controllers/settings.controller.ts`)

Handles all settings-related operations:
- Get public settings (no auth)
- Get all settings (admin only)
- Update settings (admin only)
- Upload logo (admin only)

### Frontend

#### 1. Settings Page (`frontend/src/pages/Settings.tsx`)

Full-featured settings management UI:
- Logo upload with preview
- Form inputs for all settings
- Secret fields (password type for sensitive data)
- Organized by category (App, MuleSoft, Advanced)
- Save button updates all settings

#### 2. Dynamic Sidebar (`frontend/src/components/layout/Sidebar.tsx`)

The sidebar now:
- Fetches `app_name` and `app_logo_url` from `/api/settings/public`
- Displays custom logo if available
- Falls back to default icon and name if not configured

#### 3. Top Bar Layout (`frontend/src/components/layout/TopBar.tsx`)

Fixed layout to push user menu and notifications to the far right using `ml-auto`.

## Usage Guide

### For Administrators

1. **Login as Admin**
   - Use credentials: `admin@demo.com` / `Admin@123`

2. **Navigate to Settings**
   - Click "Settings" in the sidebar or user menu

3. **Upload Custom Logo**
   - Click "Choose File" under Application Logo
   - Select your logo file (PNG, JPG, or SVG)
   - Click "Upload Logo"
   - Logo appears immediately in the sidebar

4. **Change App Name**
   - Edit the "App Name" field
   - Click "Save All Changes"
   - Name updates in the sidebar

5. **Configure MuleSoft API**
   - Update Base URL, Username, Password, or Timeout
   - Click "Save All Changes"
   - Changes take effect immediately (cached for 1 minute)

### For Developers

#### Adding New Settings

1. Add to seed file (`backend/src/utils/seedSettings.ts`):

```typescript
{
  settingKey: 'my_new_setting',
  settingValue: 'default_value',
  description: 'Description of setting',
  isSecret: false,
}
```

2. Run seed: `npm run seed --prefix backend`

3. Access in backend:
```typescript
const value = await getSetting('my_new_setting', 'default');
```

4. Access in frontend (if public):
```typescript
const response = await api.get('/settings/public');
const value = response.data.settings.my_new_setting;
```

## File Structure

```
backend/
  src/
    config/
      muleSoft.ts               # MuleSoft config (reads from DB)
    controllers/
      settings.controller.ts     # Settings management
    routes/
      settings.routes.ts         # Settings API routes
    services/
      muleSoft.service.ts       # Uses DB config
    utils/
      getSettings.ts            # Settings utility with caching
      seedSettings.ts           # Default settings seeder
  uploads/
    logos/                      # Uploaded logo files

frontend/
  src/
    components/
      layout/
        Sidebar.tsx             # Dynamic logo/name
        TopBar.tsx              # Fixed layout
    pages/
      Settings.tsx              # Admin settings page
```

## Benefits

✅ **No Code Changes**: Update branding without redeploying  
✅ **Admin Control**: Non-technical admins can customize the app  
✅ **Centralized Configuration**: All settings in one place  
✅ **Environment Flexibility**: Different settings per environment  
✅ **Security**: Secret settings are marked and protected  
✅ **Performance**: 1-minute caching reduces database load  
✅ **Fallback Safety**: Falls back to environment variables if DB unavailable

## Default Signup Role Configuration

### Overview

The `default_signup_role` setting controls which role is automatically assigned to new users when they register. This feature provides flexibility in managing user permissions based on your organization's security policies.

### Valid Values

| Value | Description | Default Menu Item | Recommended For |
|-------|-------------|-------------------|-----------------|
| `viewer` | Read-only access (Recommended) | History | Public-facing applications, trial users |
| `user` | Standard user access | History | Internal applications, verified users |
| `admin` | Administrator access ⚠️ | Dashboard | Trusted environments only |

### Configuration

#### Via Admin UI

1. Navigate to **Settings** → **Advanced Settings**
2. Locate **Default Signup Role** dropdown
3. Select desired role from dropdown:
   - **Viewer (Recommended)** - Most restrictive, follows principle of least privilege
   - **User** - Standard permissions for regular users
   - **Admin** - Full administrative access
4. Click **Save All Changes**

#### Via Environment Variable

Set the `DEFAULT_SIGNUP_ROLE` environment variable to override the database setting:

```bash
DEFAULT_SIGNUP_ROLE=viewer
```

Priority order: **ENV Variable** > **Database Setting** > **Default (viewer)**

#### Via Database

Directly update the setting in the database:

```sql
UPDATE system_settings 
SET setting_value = 'user' 
WHERE setting_key = 'default_signup_role';
```

### Security Considerations

⚠️ **Important Security Notes:**

1. **Principle of Least Privilege**: Default to `viewer` role for maximum security
2. **Admin Role Warning**: Setting default to `admin` means **all new users will have full administrative access**
   - Only use in trusted, controlled environments
   - Not recommended for production or public-facing applications
3. **Validation**: The system validates that the configured role exists in the database
   - Falls back to `viewer` if configured role is invalid or missing
4. **Audit Trail**: All role assignments are logged in the activity log

### UI Features

The Settings page provides:

- **Dropdown Selection**: Choose from valid roles (admin, user, viewer)
- **Visual Warning**: Amber warning message when `admin` is selected
- **ENV Override Indicator**: Shows when environment variable is overriding database setting
- **Description**: Inline help text explaining the setting
- **Theme Support**: Full light and dark theme support

### Behavior

When a new user registers:

1. System checks for `DEFAULT_SIGNUP_ROLE` environment variable
2. If not set, reads from `system_settings` table
3. Falls back to `viewer` if setting is missing or invalid
4. Validates that role exists in `roles` table
5. If role doesn't exist, defaults to `viewer`
6. Assigns role to user via `user_roles` table
7. Sets appropriate `defaultMenuItem` based on role:
   - `admin` → Dashboard
   - `user` or `viewer` → History

### Testing

Comprehensive tests are available in:

- **Unit Tests**: `backend/src/services/__tests__/auth.service.test.ts`
- **E2E Tests**: `backend/src/__tests__/e2e/default-signup-role.e2e.test.ts`

Run tests with:

```bash
cd backend
npm test
npm run test:e2e  # E2E tests only
```

### Common Use Cases

#### Scenario 1: Public SaaS Application
```
default_signup_role = viewer
```
New users get read-only access, admin manually upgrades paid customers.

#### Scenario 2: Internal Enterprise Tool
```
default_signup_role = user
```
All employees get standard access upon registration.

#### Scenario 3: Trusted Development Environment
```
default_signup_role = admin
```
All team members get full access (not recommended for production).

### Troubleshooting

**Issue**: New users not getting expected role

1. Check current setting:
   ```sql
   SELECT * FROM system_settings WHERE setting_key = 'default_signup_role';
   ```

2. Verify role exists:
   ```sql
   SELECT * FROM roles WHERE name = 'user';  -- Replace with your role
   ```

3. Check environment variable:
   ```bash
   echo $DEFAULT_SIGNUP_ROLE
   ```

4. Check activity logs:
   ```sql
   SELECT * FROM activity_logs 
   WHERE action_type = 'auth.register' 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```

**Issue**: Setting not updating in UI

- Settings are cached for 60 seconds
- Restart backend or wait for cache expiration
- Check browser console for errors

**Issue**: Warning message when selecting admin

- This is expected behavior as a security reminder
- Only proceed if you understand the security implications

## Migration Notes

### From Environment Variables to Database

The system now reads from database settings first, then falls back to environment variables. This means:

1. **Existing deployments**: Continue to work with env vars as fallback
2. **New deployments**: Run `npm run seed` to populate default settings
3. **Heroku**: Settings can be updated via Settings page instead of config vars
4. **Docker**: Can override defaults by seeding with custom values

### Environment Variables Still Used

These env vars are still required for initial connection:

- `DATABASE_URL` - Database connection string
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)

All other settings are now in the database.

## Troubleshooting

### Logo Not Displaying

1. Check file was uploaded successfully
2. Verify `/uploads/logos/` directory exists
3. Check logo URL in database: `SELECT * FROM system_settings WHERE setting_key = 'app_logo_url';`
4. Ensure backend is serving static files from `/uploads`

### Settings Not Taking Effect

1. Wait 1 minute for cache to expire, or
2. Restart the backend server to clear cache
3. Check database values: `SELECT * FROM system_settings;`

### Admin Access Denied

1. Verify user has admin role:
   ```sql
   SELECT u.email, r.name 
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id;
   ```

2. Ensure logged in as admin user

