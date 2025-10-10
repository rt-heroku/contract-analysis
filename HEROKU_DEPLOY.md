# Heroku Deployment Guide

## ✅ Build Issues Fixed

### Problem 1: Recursive Build Script
**File**: `backend/package.json`
- **Before**: `"build": "npm run build"` ❌ (infinite loop)
- **After**: `"build": "tsc"` ✅ (compiles TypeScript)

### Problem 2: Missing Dependencies
**File**: `package.json` (root)
- **Added**: `heroku-postbuild` script
- Installs dependencies in subdirectories before building

## 🚀 Deploy to Heroku

### Step 1: Set Environment Variables

```bash
heroku config:set DATABASE_URL="your-postgresql-database-url"
heroku config:set JWT_SECRET="your-super-secret-jwt-key"
heroku config:set JWT_EXPIRATION="4h"
heroku config:set JWT_REFRESH_EXPIRATION="7d"
heroku config:set SESSION_SECRET="your-session-secret"
heroku config:set CORS_ORIGIN="https://your-heroku-app.herokuapp.com"
heroku config:set MULESOFT_API_BASE_URL="https://your-mulesoft-api.com"
heroku config:set NODE_ENV="production"
heroku config:set PORT="5001"
```

### Step 2: Commit and Deploy

```bash
# Add the fixed files
git add package.json backend/package.json

# Commit the changes
git commit -m "Fix Heroku build: correct backend build script and add heroku-postbuild"

# Push to Heroku
git push heroku main
```

### Step 3: Initialize Database (First Deploy Only)

```bash
# Run Prisma migrations
heroku run "cd backend && npx prisma migrate deploy"

# Or use db push for demo
heroku run "cd backend && npx prisma db push"

# Seed the database
heroku run "cd backend && npm run seed"
```

## 📋 Heroku Build Process

When you push to Heroku, it will:

1. **Detect Node.js** app
2. **Install root dependencies**: `npm install`
3. **Run heroku-postbuild**:
   - Install backend dependencies
   - Generate Prisma client
   - Build backend (TypeScript → JavaScript)
   - Install frontend dependencies
   - Build frontend (React → optimized static files)
4. **Start the app**: `npm start` (runs backend server on port from $PORT)

## 🔍 Verify Deployment

### Check Logs
```bash
heroku logs --tail
```

### Check App Status
```bash
heroku ps
```

### Open App
```bash
heroku open
```

### Test API
```bash
curl https://your-app.herokuapp.com/health
```

## 🐛 Troubleshooting

### Build Fails

**Check logs**:
```bash
heroku logs --tail | grep "ERROR"
```

**Common issues**:
- Missing environment variables → Set with `heroku config:set`
- Database connection issues → Check DATABASE_URL
- Prisma client not generated → Ensure heroku-postbuild runs prisma:generate

### App Crashes

**Check logs**:
```bash
heroku logs --tail
```

**Common issues**:
- Port binding → Use `process.env.PORT` (already configured in server.ts)
- Database connection → Verify DATABASE_URL
- Missing .env variables → Set all required config vars

### Database Issues

**Reset database** (⚠️ deletes all data):
```bash
heroku pg:reset DATABASE_URL
heroku run "cd backend && npx prisma db push"
heroku run "cd backend && npm run seed"
```

**Check database connection**:
```bash
heroku pg:info
```

## 📦 What Gets Deployed

### Backend
- Compiled JavaScript in `backend/dist/`
- Node modules in `backend/node_modules/`
- Prisma client generated

### Frontend
- Optimized static files in `frontend/dist/`
- Served by Express from backend

### Single App Structure
The backend serves both:
- API endpoints: `/api/*`
- Frontend static files: `/*`

## 🔐 Security Checklist

- [ ] All environment variables set in Heroku (not in code)
- [ ] JWT_SECRET is strong and unique
- [ ] SESSION_SECRET is strong and unique
- [ ] DATABASE_URL uses SSL (Heroku Postgres does by default)
- [ ] CORS_ORIGIN set to your actual domain
- [ ] NODE_ENV set to "production"
- [ ] MULESOFT_API credentials secured

## 🎯 Post-Deployment

1. **Test the app**: Visit your Heroku URL
2. **Create admin user**: Use the register endpoint or seed script
3. **Test file upload**: Upload sample contract + data files
4. **Test MuleSoft integration**: Verify API calls work
5. **Monitor logs**: Keep an eye on `heroku logs --tail`

## 📊 Scaling (Optional)

### Upgrade Dyno
```bash
heroku ps:scale web=1:standard-1x
```

### Add Database Connection Pooling
```bash
heroku addons:create pgbouncer
```

### Enable Metrics
```bash
heroku labs:enable "runtime-heroku-metrics"
```

---

**Last Updated**: October 10, 2025  
**Status**: ✅ Ready for Deployment

