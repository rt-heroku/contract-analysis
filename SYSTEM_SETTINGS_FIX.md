# System Settings Empty Issue - Resolution

## Problem
The System Settings page appears empty even though the backend API and frontend components are correctly implemented.

## Root Cause
The `system_settings` table in the database is empty. The settings data needs to be initialized from the `init-database.sql` script.

## Solution

### Option 1: Run the Database Initialization Script (Fresh Install)
```bash
cd backend
psql -d your_database_name -U your_username -f init-database.sql
```

### Option 2: Insert Settings Manually (If Database Already Exists)
```sql
INSERT INTO system_settings (setting_key, setting_value, description, is_secret, created_at) VALUES
  ('app_logo_url', '/images/logos/MuleSoft-RGB-icon.png', 'Application logo URL (can be uploaded by admin)', false, NOW()),
  ('app_name', 'Document Analyzer', 'Application name displayed in header', false, NOW()),
  ('cors_origin', 'http://localhost:3000', 'CORS allowed origin', false, NOW()),
  ('jwt_expires_in', '7d', 'JWT token expiration time', false, NOW()),
  ('jwt_secret', 'wAK6rM4Qg9dBhsr89X0GANUOSsZQpEIz0OPEQptS/rI=', 'JWT secret key for token signing', true, NOW()),
  ('log_level', 'info', 'Logging level (debug, info, warn, error)', false, NOW()),
  ('mulesoft_api_base_url', 'https://idp-process-contracts-w4i20p.y8riuw.usa-e2.cloudhub.io', 'MuleSoft API base URL', false, NOW()),
  ('mulesoft_api_password', '', 'MuleSoft API password for basic authentication', true, NOW()),
  ('mulesoft_api_timeout', '180000', 'MuleSoft API timeout in milliseconds', false, NOW()),
  ('mulesoft_api_username', '', 'MuleSoft API username for basic authentication', true, NOW())
ON CONFLICT (setting_key) DO NOTHING;
```

### Option 3: Use Heroku/Production (If Deployed)
If the app is deployed to Heroku, run:
```bash
heroku run psql $DATABASE_URL -a your-app-name <<EOF
INSERT INTO system_settings (setting_key, setting_value, description, is_secret, created_at) VALUES
  ('app_logo_url', '/images/logos/MuleSoft-RGB-icon.png', 'Application logo URL (can be uploaded by admin)', false, NOW()),
  ('app_name', 'Document Analyzer', 'Application name displayed in header', false, NOW()),
  ('cors_origin', 'http://localhost:3000', 'CORS allowed origin', false, NOW()),
  ('jwt_expires_in', '7d', 'JWT token expiration time', false, NOW()),
  ('jwt_secret', 'wAK6rM4Qg9dBhsr89X0GANUOSsZQpEIz0OPEQptS/rI=', 'JWT secret key for token signing', true, NOW()),
  ('log_level', 'info', 'Logging level (debug, info, warn, error)', false, NOW()),
  ('mulesoft_api_base_url', 'https://idp-process-contracts-w4i20p.y8riuw.usa-e2.cloudhub.io', 'MuleSoft API base URL', false, NOW()),
  ('mulesoft_api_password', '', 'MuleSoft API password for basic authentication', true, NOW()),
  ('mulesoft_api_timeout', '180000', 'MuleSoft API timeout in milliseconds', false, NOW()),
  ('mulesoft_api_username', '', 'MuleSoft API username for basic authentication', true, NOW())
ON CONFLICT (setting_key) DO NOTHING;
EOF
```

## Verification

After running one of the above solutions, verify the settings are loaded:

### Backend Verification
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/settings/all
```

### Database Verification
```sql
SELECT * FROM system_settings ORDER BY setting_key;
```

Expected output should show 10 settings:
- app_logo_url
- app_name
- cors_origin
- jwt_expires_in
- jwt_secret
- log_level
- mulesoft_api_base_url
- mulesoft_api_password
- mulesoft_api_timeout
- mulesoft_api_username

## Frontend Display

Once the settings are loaded, the System Settings page will display:

**Application Settings Section:**
- Application Logo (with upload capability)
- App Name

**MuleSoft API Configuration Section:**
- Base URL
- Username (secret)
- Password (secret)
- Timeout

**Advanced Settings Section:**
- JWT settings
- CORS origin
- Log level

## Environment Variable Overrides

Settings can be overridden by environment variables:
- `MULESOFT_API_BASE_URL` → `mulesoft_api_base_url`
- `MULESOFT_API_USERNAME` → `mulesoft_api_username`
- `MULESOFT_API_PASSWORD` → `mulesoft_api_password`
- `MULESOFT_API_TIMEOUT` → `mulesoft_api_timeout`

When overridden, the UI will show a green "ENV" badge and the field will be read-only.

## Files Involved

- **Backend Controller**: `backend/src/controllers/settings.controller.ts`
- **Backend Routes**: `backend/src/routes/settings.routes.ts`
- **Frontend Page**: `frontend/src/pages/admin/Settings.tsx`
- **Database Init**: `backend/init-database.sql` (line 349-360)

## Status
- ✅ Backend API working correctly
- ✅ Frontend UI working correctly
- ⚠️ Database table needs to be seeded with initial data

