# MuleSoft Endpoint Configuration Guide

## 📍 Where to Set the Endpoint

### Local Development

**File:** `backend/.env`

```env
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_USERNAME=
MULESOFT_API_PASSWORD=
MULESOFT_API_TIMEOUT=30000
```

**To Change:**
1. Edit `backend/.env`
2. Update `MULESOFT_API_BASE_URL` to your endpoint
3. Restart backend: `cd backend && npm run dev`

---

### Heroku Deployment

**Set via Heroku CLI:**

```bash
# Set the MuleSoft endpoint
heroku config:set MULESOFT_API_BASE_URL="https://your-mulesoft-api.com"

# Optional: Set auth credentials
heroku config:set MULESOFT_API_USERNAME="your-username"
heroku config:set MULESOFT_API_PASSWORD="your-password"

# Verify configuration
heroku config:get MULESOFT_API_BASE_URL
```

**Or via Heroku Dashboard:**
1. Go to your app in Heroku Dashboard
2. Settings → Config Vars → Reveal Config Vars
3. Add/Edit `MULESOFT_API_BASE_URL`

---

## 🔍 How It Works

### Configuration Flow

```
backend/.env (local) OR Heroku Config Vars (production)
    ↓
backend/src/config/env.ts
    mulesoftApiBaseUrl: process.env.MULESOFT_API_BASE_URL || ''
    ↓
backend/src/config/muleSoft.ts
    baseUrl: config.mulesoftApiBaseUrl
    ↓
backend/src/services/muleSoft.service.ts
    const fullUrl = `${muleSoftConfig.baseUrl}${endpoint}?job=${jobId}`
```

### Actual API Calls

The backend makes these calls:

1. **Process Document:**
   ```
   POST {MULESOFT_API_BASE_URL}/process/document?job={jobId}
   ```
   Example: `POST http://localhost:8081/process/document?job=job_1234`

2. **Analyze Data:**
   ```
   POST {MULESOFT_API_BASE_URL}/analyze?job={jobId}
   ```
   Example: `POST http://localhost:8081/analyze?job=job_1234`

---

## 📋 All MuleSoft Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MULESOFT_API_BASE_URL` | ✅ Yes | none | Base URL for MuleSoft API (e.g., `http://localhost:8081`) |
| `MULESOFT_API_USERNAME` | ⚠️ Optional | empty | Basic auth username (if MuleSoft requires auth) |
| `MULESOFT_API_PASSWORD` | ⚠️ Optional | empty | Basic auth password (if MuleSoft requires auth) |
| `MULESOFT_API_TIMEOUT` | ⚠️ Optional | 30000 | Request timeout in milliseconds |

---

## 🧪 Testing Different Endpoints

### Test Local Endpoint
```bash
# In backend/.env
MULESOFT_API_BASE_URL=http://localhost:8081

# Restart backend
cd backend && npm run dev
```

### Test Remote Endpoint
```bash
# In backend/.env
MULESOFT_API_BASE_URL=https://api.your-domain.com

# Restart backend
cd backend && npm run dev
```

### Test with Authentication
```bash
# In backend/.env
MULESOFT_API_BASE_URL=https://secure-api.example.com
MULESOFT_API_USERNAME=your-username
MULESOFT_API_PASSWORD=your-password

# Restart backend
cd backend && npm run dev
```

---

## ⚠️ Important Notes

### 1. **Restart Required**
After changing `.env` file, you MUST restart the backend:
```bash
# Kill current backend
lsof -ti:5001 | xargs kill -9

# Start fresh
cd backend && npm run dev
```

### 2. **No Trailing Slash**
Don't include trailing slash in base URL:
- ✅ `http://localhost:8081`
- ❌ `http://localhost:8081/`

### 3. **HTTPS in Production**
Use HTTPS for production deployments:
- ✅ `https://api.production.com`
- ⚠️ `http://api.production.com` (not secure)

### 4. **Heroku Environment**
Heroku config vars take precedence over `.env` file.
Always set MuleSoft endpoint via Heroku CLI or Dashboard.

---

## 🔧 Troubleshooting

### Backend Not Calling MuleSoft

**Check 1: Verify Environment Variable**
```bash
cd backend
grep MULESOFT_API_BASE_URL .env
```

**Check 2: Restart Backend**
```bash
lsof -ti:5001 | xargs kill -9
cd backend && npm run dev
```

**Check 3: Check Backend Logs**
Look for:
```
Making MuleSoft API request to /process/document with jobId: job_xxx
```

### Connection Refused Error

**Symptom:** `MuleSoft API Error: ECONNREFUSED`

**Solutions:**
1. Verify MuleSoft API is running:
   ```bash
   curl http://localhost:8081/health
   ```
2. Check endpoint URL is correct in `.env`
3. If using remote endpoint, check firewall/network access

### Authentication Errors

**Symptom:** `401 Unauthorized` or `403 Forbidden`

**Solutions:**
1. Set username/password in `.env`:
   ```env
   MULESOFT_API_USERNAME=your-username
   MULESOFT_API_PASSWORD=your-password
   ```
2. Restart backend after updating credentials

### Timeout Errors

**Symptom:** `MuleSoft API Error: timeout of 30000ms exceeded`

**Solutions:**
1. Increase timeout in `.env`:
   ```env
   MULESOFT_API_TIMEOUT=60000
   ```
2. Check MuleSoft API performance
3. Verify network connectivity

---

## 📚 Related Documentation

- `MULESOFT_SETUP.md` - Complete MuleSoft integration guide
- `API_FLOW_DIAGRAM.md` - Visual API flow diagram
- `HEROKU_DEPLOY.md` - Heroku deployment with environment variables
- `README.md` - Project overview

---

## 🎯 Quick Reference

### Local Development
```bash
# backend/.env
MULESOFT_API_BASE_URL=http://localhost:8081
```

### Heroku Production
```bash
heroku config:set MULESOFT_API_BASE_URL="https://your-api.com"
```

### Verify Configuration
```bash
# Local
grep MULESOFT backend/.env

# Heroku
heroku config:get MULESOFT_API_BASE_URL
```

### Restart Backend
```bash
lsof -ti:5001 | xargs kill -9 && cd backend && npm run dev
```

