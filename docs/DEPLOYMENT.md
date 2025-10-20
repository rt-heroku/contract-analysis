# Document Analyzer - Deployment Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Heroku Deployment](#heroku-deployment)
- [Local Development](#local-development)
- [Database Initialization](#database-initialization)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### One-Click Heroku Deployment

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

2. **Add PostgreSQL Database**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(openssl rand -hex 32)
   heroku config:set ENCRYPTION_KEY=$(openssl rand -hex 32)
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Initialize Database** (First deployment only)
   ```bash
   heroku psql -f backend/init-database.sql
   ```

6. **Open Your App**
   ```bash
   heroku open
   ```

That's it! The app will:
- ✅ Install all dependencies
- ✅ Generate Prisma client
- ✅ Push database schema
- ✅ Build backend and frontend
- ✅ Set demo user passwords (only on first deployment)
- ✅ Start the server

---

## Heroku Deployment (Detailed)

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git repository initialized
- Heroku account

### Step 1: Create Heroku App
```bash
# Create app
heroku create your-app-name

# Or use an existing app
heroku git:remote -a your-app-name
```

### Step 2: Add PostgreSQL Database
```bash
# Add PostgreSQL addon (choose plan based on needs)
heroku addons:create heroku-postgresql:mini

# Verify database was created
heroku config:get DATABASE_URL
```

### Step 3: Configure Environment Variables

#### Required Variables
```bash
# JWT Secret (generate a secure random string)
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Encryption Key for IDP credentials (generate a secure random string)
heroku config:set ENCRYPTION_KEY=$(openssl rand -hex 32)

# Node environment
heroku config:set NODE_ENV=production

# Log level (optional)
heroku config:set LOG_LEVEL=info
```

#### Optional Variables (Override Database Settings)
```bash
# MuleSoft API Configuration
heroku config:set MULESOFT_API_BASE_URL=http://your-mulesoft-api:8081

# Application Branding
heroku config:set APP_NAME="Your Company Document Analyzer"
heroku config:set APP_LOGO_URL="/images/your-logo.svg"
heroku config:set POWERED_BY_TEXT="Powered by Your Company"

# Feature Flags
heroku config:set SHOW_DEMO_CREDENTIALS=true
```

**Note:** Environment variables override database settings. If not set, values from the `system_settings` table will be used.

### Step 4: Deploy Application
```bash
# Deploy to Heroku
git push heroku main

# Or deploy from a different branch
git push heroku your-branch:main
```

### Step 5: Initialize Database (First Deployment Only)

The `init-database.sql` script creates all necessary structure:
- ✅ Roles (admin, user, viewer)
- ✅ Permissions (39 permissions across all modules)
- ✅ Menu structure (9 top-level + 5 admin submenus)
- ✅ System settings (6 default settings)
- ✅ Demo users (3 users with placeholder passwords)

```bash
# Run initialization script
heroku psql -f backend/init-database.sql
```

**Important:** The `heroku-postbuild` script automatically runs `seed:once` which:
- ✅ Checks if database is already seeded
- ✅ Sets real passwords for demo users (only on first run)
- ✅ Skips on subsequent deployments

### Step 6: Verify Deployment
```bash
# Check logs
heroku logs --tail

# Open app in browser
heroku open

# Check database
heroku psql
```

### Step 7: Login with Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@demo.com | Admin@123 |
| **User** | user@demo.com | User@123 |
| **Viewer** | demo@mulesoft.com | Demo@123 |

---

## Local Development

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd webapp
```

### Step 2: Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

### Step 3: Setup Environment Variables

Create `backend/.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/document_analyzer?schema=public"

# JWT
JWT_SECRET="your-jwt-secret-key-here"

# Encryption (for IDP credentials)
ENCRYPTION_KEY="your-encryption-key-here"

# Server
PORT=5001
NODE_ENV=development
LOG_LEVEL=debug

# MuleSoft API
MULESOFT_API_BASE_URL=http://localhost:8081

# Application
APP_NAME="Document Analyzer"
```

### Step 4: Setup Database
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Initialize database structure
psql $DATABASE_URL -f init-database.sql

# Seed demo user passwords
npm run seed:once
```

### Step 5: Start Development Server
```bash
# From root directory
npm run dev

# Or start backend and frontend separately
npm run dev:backend  # Backend on http://localhost:5001
npm run dev:frontend # Frontend on http://localhost:3000
```

The frontend Vite server will proxy API requests to the backend:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001/api`
- Proxied through Vite in development

---

## Database Initialization

### What Does `init-database.sql` Do?

The initialization script is **idempotent** (safe to run multiple times) and creates:

1. **Roles** (3 roles)
   - `admin` - Full access
   - `user` - Standard access
   - `viewer` - Read-only access

2. **Permissions** (39 permissions)
   - Profile management (4)
   - Document operations (5)
   - Analysis operations (5)
   - Prompts (5)
   - Flows (4)
   - IDP Executions (5)
   - Admin - Users (4)
   - Admin - Roles (4)
   - Admin - Menu (5)
   - Admin - System (3)

3. **Role-Permission Assignments**
   - Admin: All 39 permissions
   - User: 17 permissions
   - Viewer: 7 permissions

4. **Menu Structure** (14 menu items)
   - Dashboard, Processing, Documents, Prompts, Flows, IDP Executions, History, Profile
   - Admin Panel (parent)
     - Logs, User Management, Roles, Menu, Settings

5. **System Settings** (6 settings)
   - Application name and branding
   - MuleSoft API configuration
   - Feature flags

6. **Demo Users** (3 users with placeholder passwords)
   - Passwords are set by `seedOnce.ts` after deployment

### When to Run Initialization

**First Deployment:**
```bash
# After heroku-postbuild completes
heroku psql -f backend/init-database.sql
```

**Subsequent Deployments:**
- ❌ Do NOT run `init-database.sql` again
- ✅ The `seed:once` script checks if database is seeded
- ✅ Skips password generation on subsequent runs
- ✅ This preserves your custom users, roles, and settings

**Fresh Database (Clean Slate):**
```bash
# Reset database
heroku pg:reset DATABASE_URL --confirm your-app-name

# Re-initialize
heroku psql -f backend/init-database.sql
```

---

## Environment Variables

### Priority Order

Environment variables override database settings:

1. **Environment Variables** (highest priority)
   - Set via `heroku config:set` or `.env` file
   - Takes precedence over database

2. **Database Settings** (medium priority)
   - Stored in `system_settings` table
   - Configurable via Admin > Settings page

3. **Default Values** (lowest priority)
   - Hardcoded fallbacks in code

### Available Variables

| Variable | Description | Default | Override DB? |
|----------|-------------|---------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | - | N/A |
| `JWT_SECRET` | Secret for JWT token signing | - | N/A |
| `ENCRYPTION_KEY` | Key for encrypting IDP credentials | - | N/A |
| `PORT` | Server port | 5001 | N/A |
| `NODE_ENV` | Environment (development/production) | development | N/A |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info | N/A |
| `MULESOFT_API_BASE_URL` | MuleSoft API endpoint | http://localhost:8081 | ✅ Yes |
| `MULESOFT_API_TIMEOUT` | API timeout (ms) | 30000 | ✅ Yes |
| `APP_NAME` | Application name | Document Analyzer | ✅ Yes |
| `APP_LOGO_URL` | Logo URL | /images/mulesoft-logo.svg | ✅ Yes |
| `POWERED_BY_TEXT` | Footer text | Powered by MuleSoft | ✅ Yes |
| `SHOW_DEMO_CREDENTIALS` | Show demo logins on login page | true | ✅ Yes |

**Settings marked ✅ Yes** can be overridden by environment variables. When set via ENV, they become read-only in the Admin > Settings page and display a green "ENV" badge.

---

## Troubleshooting

### Build Warnings

#### Vite CJS Node API Deprecated
**Warning:**
```
The CJS build of Vite's Node API is deprecated.
```

**Fix:** ✅ Already fixed in `frontend/package.json`:
```json
{
  "type": "module"
}
```

#### Chunk Size Warning
**Warning:**
```
(!) Some chunks are larger than 500 kB after minification.
```

**Solution Options:**

1. **Accept the warning** (recommended for now)
   - The bundle is large due to React, Markdown, PDF, and DnD libraries
   - Heroku deployment works fine

2. **Code splitting** (future improvement)
   ```typescript
   // Use dynamic imports for large modules
   const ReactMarkdown = lazy(() => import('react-markdown'));
   const MDEditor = lazy(() => import('@uiw/react-md-editor'));
   ```

3. **Suppress warning**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       chunkSizeWarningLimit: 1000,
     },
   });
   ```

### Database Issues

#### "Relation does not exist"
**Problem:** Tables not created

**Fix:**
```bash
# Push schema
cd backend && npm run prisma:push

# Initialize database
psql $DATABASE_URL -f init-database.sql
```

#### "User already exists" during seeding
**Problem:** Running seed script multiple times

**Fix:** This is expected! The `seedOnce.ts` script checks if users exist and skips:
```
✓ Database already seeded - skipping user password generation
  (This is expected for subsequent deployments)
```

#### "Invalid password hash"
**Problem:** Placeholder passwords not updated

**Fix:**
```bash
# Run seed script to set real passwords
cd backend && npm run seed:once
```

### Deployment Issues

#### "Application Error" on Heroku
**Check logs:**
```bash
heroku logs --tail --app your-app-name
```

**Common causes:**
1. Missing environment variables (JWT_SECRET, DATABASE_URL)
2. Database not initialized
3. Build failed

#### Backend not starting
**Check:**
1. `DATABASE_URL` is set
2. Database is initialized
3. Prisma client is generated

```bash
heroku run bash
cd backend
npm run prisma:generate
npm run seed:once
```

### Connection Issues

#### Frontend can't reach backend
**Local Development:**
- Check `frontend/vite.config.ts` proxy configuration
- Backend should be running on port 5001

**Production:**
- Backend and frontend are served from the same origin
- No CORS issues

#### MuleSoft API not responding
**Check:**
1. `MULESOFT_API_BASE_URL` is correct
2. MuleSoft service is running
3. Network connectivity

```bash
# Test from Heroku
heroku run bash
curl $MULESOFT_API_BASE_URL/health
```

---

## Maintenance

### Backing Up Database
```bash
# Create backup
heroku pg:backups:capture --app your-app-name

# Download backup
heroku pg:backups:download --app your-app-name
```

### Viewing Logs
```bash
# Real-time logs
heroku logs --tail --app your-app-name

# Recent logs
heroku logs --num 500 --app your-app-name

# Filter by source
heroku logs --source app --tail
```

### Database Console
```bash
# Open psql
heroku psql --app your-app-name

# Run queries
heroku psql -c "SELECT * FROM users WHERE email LIKE '%@demo.com';" --app your-app-name
```

### Scaling
```bash
# Check current dynos
heroku ps --app your-app-name

# Scale up
heroku ps:scale web=2 --app your-app-name

# Scale down
heroku ps:scale web=1 --app your-app-name
```

---

## Security Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (at least 32 random bytes)
- [ ] Set strong `ENCRYPTION_KEY` (at least 32 random bytes)
- [ ] Change demo user passwords or delete demo users
- [ ] Set `SHOW_DEMO_CREDENTIALS=false` to hide demo logins
- [ ] Review and update `CORS_ORIGIN` if needed
- [ ] Enable HTTPS (Heroku provides this automatically)
- [ ] Review user permissions and roles
- [ ] Set up database backups
- [ ] Monitor application logs
- [ ] Configure error tracking (Sentry, Rollbar, etc.)

---

## Additional Resources

- [Heroku PostgreSQL](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Heroku Node.js](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-heroku)
- [MuleSoft Documentation](https://docs.mulesoft.com/)

---

## Support

For issues and questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review application logs: `heroku logs --tail`
3. Check database status: `heroku pg:info`
4. Contact: rodrigo.torres@salesforce.com
