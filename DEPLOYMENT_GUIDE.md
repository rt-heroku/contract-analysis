# Complete Deployment Guide

## 📋 Overview

This guide covers deploying the Document Analyzer application to a new environment with an empty PostgreSQL database. The application will automatically create the database structure.

---

## 🎯 Quick Answer

**Yes, the application will automatically create the database structure!**

When you provide a `DATABASE_URL` pointing to an empty PostgreSQL database, the deployment process will:
1. ✅ Generate Prisma Client
2. ✅ Push the schema to create all tables
3. ✅ Seed initial data (roles, users, menus, settings)
4. ✅ Set up the auto-share trigger (requires manual step)

---

## 🚀 Deployment Steps

### Prerequisites

- PostgreSQL database (empty or existing)
- Node.js 18+ installed (for Heroku: automatic)
- Git repository
- Heroku CLI (for Heroku deployment)

---

### Option 1: Heroku Deployment (Recommended)

#### Step 1: Create Heroku App

```bash
# Create new Heroku app
heroku create your-app-name

# Or use existing app
heroku git:remote -a your-existing-app
```

#### Step 2: Add PostgreSQL Database

```bash
# Add Heroku Postgres addon (creates DATABASE_URL automatically)
heroku addons:create heroku-postgresql:mini

# Or set custom DATABASE_URL
heroku config:set DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

#### Step 3: Set Environment Variables

```bash
# Required
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set PORT=5001

# Optional (can be configured later in admin panel)
heroku config:set MULESOFT_API_BASE_URL=http://localhost:8081
heroku config:set APP_NAME="Document Analyzer"
heroku config:set LOGO_URL="https://your-cdn.com/logo.png"
```

#### Step 4: Deploy Application

```bash
# Push to Heroku
git push heroku main

# The heroku-postbuild script will automatically:
# 1. Install dependencies
# 2. Generate Prisma Client (prisma generate)
# 3. Build backend TypeScript
# 4. Build frontend (Vite)
```

#### Step 5: Initialize Database

```bash
# Push schema to database (creates all tables)
heroku run "cd backend && npx prisma db push"

# Seed initial data (roles, users, menus, settings)
heroku run "cd backend && npm run seed"
```

#### Step 6: Install Auto-Share Trigger

```bash
# Get database URL
heroku config:get DATABASE_URL

# Run trigger installation
psql "$(heroku config:get DATABASE_URL)" -f backend/auto-share-analysis-trigger.sql
```

#### Step 7: Install Additional Setup (Optional but Recommended)

```bash
# Get database URL
DATABASE_URL=$(heroku config:get DATABASE_URL)

# Add viewer role and permissions
psql "$DATABASE_URL" -f backend/seed-permissions.sql

# Add additional menu items
psql "$DATABASE_URL" -f backend/add-documents-menu.sql
psql "$DATABASE_URL" -f backend/add-flows-menu.sql

# Add admin panel menus
psql "$DATABASE_URL" -f backend/add-admin-menus-fixed.sql
```

#### Step 8: Verify Deployment

```bash
# Open app in browser
heroku open

# Check logs
heroku logs --tail
```

---

### Option 2: Manual Server Deployment

#### Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/webapp.git
cd webapp
```

#### Step 2: Set Environment Variables

Create `.env` file in backend directory:

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=5001
NODE_ENV=production
MULESOFT_API_BASE_URL="http://localhost:8081"
```

#### Step 3: Install Dependencies

```bash
# Install all dependencies
npm run install:all
```

#### Step 4: Build Application

```bash
# Build backend and frontend
npm run build
```

#### Step 5: Initialize Database

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# Seed initial data
npm run seed
```

#### Step 6: Install SQL Scripts

```bash
# Run all setup scripts
psql "$DATABASE_URL" -f auto-share-analysis-trigger.sql
psql "$DATABASE_URL" -f seed-permissions.sql
psql "$DATABASE_URL" -f add-documents-menu.sql
psql "$DATABASE_URL" -f add-flows-menu.sql
psql "$DATABASE_URL" -f add-admin-menus-fixed.sql
```

#### Step 7: Start Application

```bash
# Start backend server
npm start

# Or use PM2 for production
pm2 start npm --name "doc-analyzer" -- start
```

---

### Option 3: Docker Deployment

#### Step 1: Build Docker Images

```bash
# Build images
docker-compose build
```

#### Step 2: Set Environment Variables

Edit `docker-compose.yml` or create `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@db:5432/document_processing
JWT_SECRET=your-secret-key
MULESOFT_API_BASE_URL=http://localhost:8081
```

#### Step 3: Start Containers

```bash
# Start all services
docker-compose up -d
```

#### Step 4: Initialize Database

```bash
# Run migrations inside container
docker-compose exec backend npx prisma db push
docker-compose exec backend npm run seed

# Install SQL scripts
docker-compose exec db psql -U postgres -d document_processing -f /app/auto-share-analysis-trigger.sql
```

---

## 📊 Database Structure

The deployment will create the following tables:

### Core Tables
- `users` - User accounts
- `roles` - User roles (admin, user, viewer)
- `user_roles` - Many-to-many relationship
- `user_profiles` - Extended user information
- `sessions` - Active user sessions

### Document Processing
- `uploads` - Uploaded files (PDF, Excel, CSV)
- `contract_analysis` - IDP processing results
- `data_analysis` - Final analysis results
- `analysis_records` - Complete analysis workflow

### System Management
- `menu_items` - Application menu structure
- `menu_permissions` - Role-based menu access
- `permissions` - Granular permissions
- `role_permissions` - Permission assignments
- `system_settings` - Configurable settings
- `activity_logs` - User activity tracking
- `api_logs` - API call logging
- `notifications` - In-app notifications

### Features
- `prompts` - AI prompt templates
- `prompt_variables` - Prompt variable definitions
- `flows` - MuleSoft flow configurations

---

## 🔑 Default Credentials

After seeding, these users will be available:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@demo.com | Admin@123 | Admin | Full access to all features |
| user@demo.com | User@123 | User | Standard user access |
| demo@mulesoft.com | Demo@123 | Viewer | Read-only access |

**⚠️ Important**: Change these passwords in production!

---

## 🔧 Post-Deployment Configuration

### 1. Update System Settings

Login as admin and go to Admin Panel → Settings:

- **Application Name**: Your company name
- **Logo URL**: Your logo URL
- **MuleSoft API URL**: Your MuleSoft endpoint
- **Show Demo Credentials**: Toggle for login page

### 2. Configure MuleSoft Integration

Set the MuleSoft API base URL:
- Via Admin Panel → Settings
- Or via environment variable: `MULESOFT_API_BASE_URL`

### 3. Create Additional Users

Admin Panel → User Management → Add User

### 4. Customize Menu

Admin Panel → Menu Management:
- Add/remove menu items
- Organize hierarchy
- Assign to roles

### 5. Set Up Prompts

Prompts page:
- Create prompt templates
- Define variables
- Link to MuleSoft flows

---

## 📝 SQL Scripts Included

These scripts are available for additional setup:

| Script | Purpose |
|--------|---------|
| `auto-share-analysis-trigger.sql` | Auto-share demo analysis with new users |
| `seed-permissions.sql` | Granular permission system (39 permissions) |
| `add-documents-menu.sql` | Add Documents Library menu |
| `add-flows-menu.sql` | Add Flows menu |
| `add-admin-menus-fixed.sql` | Add Roles & Menu management menus |
| `add-show-demo-credentials-setting.sql` | Toggle demo credentials on login |

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql "$DATABASE_URL"

# Check if Prisma can connect
cd backend && npx prisma db push --skip-generate
```

### Build Failures

```bash
# Clear caches
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf backend/dist frontend/dist

# Reinstall
npm run install:all
npm run build
```

### Missing Tables

```bash
# Force schema push
cd backend && npx prisma db push --force-reset
npm run seed
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
cd backend && npx prisma generate
```

---

## 🔄 Update Existing Deployment

To update an existing deployment:

```bash
# Pull latest changes
git pull origin main

# Heroku
git push heroku main
heroku run "cd backend && npx prisma db push"

# Manual
npm run build
cd backend && npx prisma db push
pm2 restart doc-analyzer
```

---

## 📱 Health Checks

### Backend Health

```bash
curl https://your-app.herokuapp.com/health
# Expected: { "status": "ok", "timestamp": "..." }
```

### Database Health

```bash
# Check active connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check table count
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
# Expected: 20+ tables
```

---

## 🎓 Additional Resources

- **API Documentation**: See `frontend/public/docs/API.md`
- **Architecture**: See `frontend/public/docs/ARCHITECTURE.md`
- **Cursor Rules**: See `.cursor/rules`
- **Trigger Documentation**: See `backend/AUTO-SHARE-README.md`

---

## 🆘 Support

If you encounter issues:

1. Check Heroku logs: `heroku logs --tail`
2. Check database: `heroku pg:info`
3. Verify environment variables: `heroku config`
4. Test locally first: `npm run dev`

---

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Environment variables set
- [ ] Application deployed
- [ ] Database schema pushed (`prisma db push`)
- [ ] Initial data seeded (`npm run seed`)
- [ ] Auto-share trigger installed
- [ ] Permissions seeded (optional)
- [ ] Additional menus added (optional)
- [ ] Default passwords changed
- [ ] System settings configured
- [ ] MuleSoft API URL set
- [ ] Health checks passing
- [ ] First login successful

---

## 🎉 You're Done!

Your Document Analyzer is now deployed and ready to use!

Login at: `https://your-app.herokuapp.com`  
Default admin: `admin@demo.com` / `Admin@123`

