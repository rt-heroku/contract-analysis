# Proxy Configuration Guide

## Overview

The application uses a proxy setup to ensure all API calls go through a single port, which is essential for:
- **Local Development**: Avoiding CORS issues between frontend (port 3000) and backend (port 5001)
- **Production Deployment**: Serving everything from a single origin on Heroku

## Development Setup

### How It Works

```
Browser → http://localhost:3000/api/* 
         ↓ (Vite Proxy)
         → http://localhost:5001/api/*
```

All API calls in the browser go to `localhost:3000`, and Vite's dev server automatically forwards `/api/*` requests to the backend at `localhost:5001`.

### Configuration

**File: `frontend/vite.config.ts`**
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

**File: `frontend/src/lib/api.ts`**
```typescript
// Uses relative path /api which the proxy forwards to backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  ...
});
```

### What This Means

1. **Frontend makes calls to**: `/api/auth/login`, `/api/upload`, etc. (relative URLs)
2. **Vite proxy forwards to**: `http://localhost:5001/api/auth/login`, etc.
3. **No CORS issues**: Everything appears to come from the same origin (`localhost:3000`)

## Production Setup (Heroku)

### How It Works

```
Browser → https://yourapp.herokuapp.com/
         ↓
         → Express Server (serves frontend static files)
         
Browser → https://yourapp.herokuapp.com/api/*
         ↓
         → Express Server (handles API routes)
```

In production, the Express backend serves both the frontend static files AND handles API routes.

### Configuration

**File: `backend/src/server.ts`**
```typescript
// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}
```

**Heroku Environment Variables**:
```bash
NODE_ENV=production
PORT=<Heroku assigns this>
DATABASE_URL=<your postgres URL>
# VITE_API_URL is NOT set (uses relative paths)
```

### Build Process

1. **Frontend Build**: 
   ```bash
   cd frontend && npm run build
   # Creates: frontend/dist/
   ```

2. **Backend serves `frontend/dist/`**:
   - Static files: `index.html`, JS, CSS, images
   - API routes: `/api/*`

## Environment Variables

### Development

**Frontend** (`frontend/.env`):
```bash
# Leave empty - Vite proxy handles routing
VITE_API_URL=
```

**Backend** (`backend/.env`):
```bash
PORT=5001
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=<your database>
```

### Production (Heroku)

```bash
NODE_ENV=production
PORT=<Heroku sets this>
DATABASE_URL=<your postgres URL>
# No VITE_API_URL needed
```

## Starting the Application

### Development (Both Servers)

```bash
# From root directory
npm run dev

# This starts:
# - Frontend dev server on port 3000 (with proxy)
# - Backend API server on port 5001
```

### Development (Separate)

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Production (Single Server)

```bash
# Build frontend
cd frontend && npm run build

# Start backend (serves frontend + API)
cd backend && npm start

# Everything runs on one port (process.env.PORT or 5001)
```

## Troubleshooting

### Issue: "ERR_CONNECTION_REFUSED to localhost:5001"

**Cause**: Backend server is not running or Vite proxy is not configured.

**Solution**:
1. Ensure backend is running on port 5001
2. Check `vite.config.ts` proxy configuration
3. Restart frontend dev server

### Issue: "CORS policy" errors

**Cause**: Making direct calls to backend instead of using proxy.

**Solution**:
1. Ensure `frontend/src/lib/api.ts` uses relative paths (`/api`)
2. Don't set `VITE_API_URL` in development
3. Check that Vite proxy is configured correctly

### Issue: "Cannot GET /api/..." in production

**Cause**: Backend not configured to handle API routes or serve static files.

**Solution**:
1. Ensure `backend/src/server.ts` has static file serving
2. Check that frontend is built (`frontend/dist/` exists)
3. Verify API routes are registered before static file middleware

### Issue: Static assets (images, CSS) not loading

**Cause**: Incorrect paths or missing files.

**Solution**:
1. Use relative paths in frontend: `/images/logo.png` not `http://localhost:3000/images/logo.png`
2. Ensure files are in `frontend/public/` directory
3. Check that build process copies public files to `dist/`

## Testing the Proxy

### In Development

1. Open browser to `http://localhost:3000`
2. Open DevTools → Network tab
3. Perform an action that calls the API (e.g., login)
4. Verify:
   - Request URL shows `http://localhost:3000/api/auth/login`
   - Response comes back successfully (status 200)

### In Production (Local Test)

```bash
# Build frontend
cd frontend && npm run build

# Set production environment
export NODE_ENV=production
export PORT=3000

# Start backend
cd ../backend && npm start

# Open http://localhost:3000 in browser
# All calls should go to localhost:3000 for both static files and API
```

## Summary

| Environment | Frontend Port | Backend Port | Browser Calls | How It Works |
|-------------|---------------|--------------|---------------|--------------|
| **Development** | 3000 | 5001 | `localhost:3000/api/*` | Vite proxy forwards to 5001 |
| **Production** | N/A | Dynamic (Heroku) | `<domain>/api/*` | Backend serves both static + API |

**Key Points**:
- ✅ Development: Use Vite proxy to forward API calls
- ✅ Production: Backend serves everything on one port
- ✅ No CORS issues in either environment
- ✅ Works seamlessly on Heroku

---

**Last Updated**: October 10, 2025  
**Status**: ✅ Configured and Tested


