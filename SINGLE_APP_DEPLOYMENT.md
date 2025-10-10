# Single App Deployment & Local Development Guide

This guide shows you how to run everything locally with one command and deploy as a single application.

## 🚀 Quick Start - Local Development

### Option 1: Using npm Scripts (Simplest)

```bash
# First time setup (run once)
npm run setup

# Run both backend and frontend together
npm run dev
```

This will:
- Start backend on http://localhost:5000
- Start frontend on http://localhost:3000
- Both run concurrently in the same terminal

### Option 2: Using Docker (Recommended for consistency)

```bash
# Create .env file with your MuleSoft credentials
cp .env.example .env
# Edit .env with your settings

# Build and run everything
npm run docker:dev
```

This will:
- Start PostgreSQL database
- Run backend migrations and seed data
- Start backend API on http://localhost:5000
- Start frontend on http://localhost:3000

**Stop Docker:**
```bash
npm run docker:down
```

## 📦 Single App Deployment (Heroku)

Deploy backend and frontend as **one app** on Heroku:

### Step 1: Prepare for Single App

```bash
# In the root directory
cd backend

# Add postinstall script to build frontend
```

Update `backend/package.json` to add these scripts:

```json
{
  "scripts": {
    "postinstall": "cd ../frontend && npm install && npm run build",
    "heroku-postbuild": "cd ../frontend && npm run build"
  }
}
```

### Step 2: Update Backend Configuration

The backend is already configured to serve frontend static files in production (see `src/config/static.ts`).

Make sure `CORS_ORIGIN` in production allows your domain:

```bash
heroku config:set CORS_ORIGIN=https://your-app-name.herokuapp.com
```

### Step 3: Deploy to Heroku

```bash
# Create Heroku app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set MULESOFT_API_BASE_URL=https://your-mulesoft-api.com
heroku config:set MULESOFT_API_USERNAME=your-username
heroku config:set MULESOFT_API_PASSWORD=your-password

# Tell Heroku to use backend as root
# Create a Procfile in root
echo "web: cd backend && npm run prisma:migrate && npm start" > Procfile

# Deploy
git add .
git commit -m "Configure for single app deployment"
git push heroku main

# Run seed (first time only)
heroku run "cd backend && npm run seed"

# Open app
heroku open
```

### Step 4: Configure Frontend Build Path

Update `frontend/vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure this is set for production
  build: {
    outDir: 'dist',
  },
  // ... rest of config
});
```

## 🐳 Docker Production Deployment

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      MULESOFT_API_BASE_URL: ${MULESOFT_API_BASE_URL}
    ports:
      - "80:5000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

### Production Dockerfile

Create `Dockerfile.prod`:

```dockerfile
# Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy backend build
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 npm Scripts Reference

All available scripts from root directory:

```bash
# First-time setup
npm run setup              # Install all dependencies, setup database, seed data

# Development
npm run dev                # Run both backend and frontend concurrently
npm run dev:backend        # Run only backend
npm run dev:frontend       # Run only frontend

# Docker
npm run docker:dev         # Build and run everything in Docker (dev mode)
npm run docker:build       # Build Docker images
npm run docker:up          # Start Docker containers
npm run docker:down        # Stop Docker containers

# Building
npm run build              # Build both backend and frontend

# Production
npm start                  # Start backend (serves frontend static files)
```

## 🔧 Environment Variables

### For Docker Compose

Create `.env` in root:

```env
# MuleSoft API
MULESOFT_API_BASE_URL=https://your-api.com
MULESOFT_API_USERNAME=username
MULESOFT_API_PASSWORD=password

# Database (optional, defaults shown)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=document_processing

# Secrets (optional, auto-generated if not set)
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### For Heroku Single App

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=random-32-char-string
heroku config:set SESSION_SECRET=random-32-char-string
heroku config:set MULESOFT_API_BASE_URL=https://your-api.com
heroku config:set MULESOFT_API_USERNAME=username
heroku config:set MULESOFT_API_PASSWORD=password
heroku config:set CORS_ORIGIN=https://your-app.herokuapp.com
```

## 🎯 Choosing the Right Option

### Local Development

| Method | Pros | Cons | Use When |
|--------|------|------|----------|
| **npm run dev** | Simple, fast startup | Need to install PostgreSQL locally | Quick development, already have Postgres |
| **Docker** | Complete environment, consistent | Slower startup, uses more resources | Team collaboration, matches production |

### Deployment

| Method | Pros | Cons | Use When |
|--------|------|------|----------|
| **Single Heroku App** | Simple, one app to manage, cheaper | Less flexible scaling | Small-medium projects, cost-conscious |
| **Separate Apps** | Independent scaling, better for microservices | More complex, higher cost | Large projects, need independent scaling |
| **Docker** | Portable, any cloud provider | Need to manage infrastructure | AWS, GCP, DigitalOcean, or self-hosted |

## 🐛 Troubleshooting

### npm run dev doesn't work

```bash
# Install concurrently
npm install

# Or run separately
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

### Docker containers won't start

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Frontend can't reach backend

**Local Development:**
- Check frontend `.env` has `VITE_API_URL=http://localhost:5000`
- Check backend is running on port 5000

**Production (Single App):**
- Frontend should use relative URLs (`/api/...`)
- Update `frontend/src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
// In production, uses same domain
```

### Database connection fails

**Docker:**
```bash
# Wait for database to be ready
docker-compose up postgres
# Wait for healthy status, then:
docker-compose up backend frontend
```

**Heroku:**
```bash
# Check DATABASE_URL
heroku config:get DATABASE_URL

# Test connection
heroku run "cd backend && npx prisma migrate status"
```

## 📊 Performance Comparison

### Single App Deployment

**Pros:**
- ✅ Simpler setup
- ✅ Lower cost (1 dyno vs 2)
- ✅ No CORS issues
- ✅ Easier SSL/HTTPS
- ✅ One URL to manage

**Cons:**
- ❌ Backend and frontend scale together
- ❌ Frontend changes require backend restart
- ❌ Slightly larger deployment size

### Separate Apps

**Pros:**
- ✅ Independent scaling
- ✅ Deploy frontend without touching backend
- ✅ Can use CDN for frontend
- ✅ Better for microservices

**Cons:**
- ❌ More complex setup
- ❌ Higher cost
- ❌ CORS configuration needed
- ❌ Two URLs to manage

## 🎉 Quick Reference

**Local Development (one command):**
```bash
npm run dev
```

**Docker Development (one command):**
```bash
npm run docker:dev
```

**Deploy to Heroku (single app):**
```bash
heroku create
heroku addons:create heroku-postgresql:mini
heroku config:set JWT_SECRET=xxx
git push heroku main
```

**Access:**
- Local: http://localhost:3000
- Production: https://your-app.herokuapp.com

---

**Recommendation**: Use `npm run dev` for local development and deploy as a single Heroku app for simplicity!

