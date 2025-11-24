# Integrations Documentation

**Last Updated:** January 23, 2025, 8:00 AM

## Overview

This document catalogs all external integrations, third-party services, libraries, and APIs used throughout the system.

---

## External APIs

### 1. MuleSoft IDP API

**Purpose:** Intelligent Document Processing (OCR, data extraction, AI analysis)

**Authentication:** OAuth2 Client Credentials

**Endpoints:**
- `POST /process/document` - Process PDF contract
- `POST /analyze` - Analyze extracted data

**Configuration:**
```typescript
{
  protocol: 'https',
  host: 'api.mulesoft.com',
  basePath: '/idp/v1',
  orgId: '...',
  actionId: '...',
  actionVersion: '...',
  authClientId: '...' // Encrypted
  authClientSecret: '...' // Encrypted
}
```

**Request Flow:**
```
1. Get OAuth token
   POST /oauth/token
   Body: { grant_type: 'client_credentials', client_id, client_secret }

2. Process document
   POST /process/document
   Headers: { Authorization: 'Bearer {token}' }
   Body: { document: base64, jobId, metadata }

3. Analyze data
   POST /analyze
   Headers: { Authorization: 'Bearer {token}' }
   Body: { idpResponse, dataFile, jobId }
```

**Error Handling:**
- Retry on 5xx errors (up to 3 times)
- Log full request/response to `api_logs`
- Store error in `analysis_records`

**Files:**
- `backend/src/services/mulesoft.service.ts`
- `backend/src/services/idpExecution.service.ts`
- `backend/src/config/muleSoft.ts`

---

### 2. AI Services (Claude, GPT)

**Purpose:** Query generation, database optimization, content analysis

**Authentication:** API Key (via connectors)

**Providers:**
- Anthropic Claude (preferred)
- OpenAI GPT-4

**Use Cases:**
1. SQL query generation (Query AI)
2. Database performance analysis
3. Process optimization recommendations
4. Documentation generation

**Configuration:**
```typescript
{
  connectorType: 'rest',
  name: 'Claude API',
  config: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '...' // Encrypted
    model: 'claude-3-opus-20240229'
  }
}
```

**System Prompts:**
- Stored in `system_prompts` table
- Versioned and templated
- Feature-specific (query_ai, performance_analysis, etc.)

**Files:**
- `backend/src/services/aiAnalysis.service.ts`
- `backend/src/services/systemPrompt.service.ts`
- `backend/src/controllers/tableAnalysis.controller.ts`

---

### 3. Connected Databases (via Connectors)

**Purpose:** Multi-database access for Database Explorer

**Supported:**
- PostgreSQL (primary)
- MySQL (planned)
- SQL Server (planned)
- Oracle (planned)

**Authentication:** Username/Password (encrypted)

**Connection Pooling:**
- One pool per user+connector
- Max connections configurable
- Idle timeout: 30s
- Connection timeout: 5s

**Files:**
- `backend/src/services/dbExplorer.service.ts`
- `backend/src/services/connector.service.ts`

---

## Third-Party Libraries

### Backend Libraries

| Library | Version | Purpose | License |
|---------|---------|---------|---------|
| **Express.js** | 4.21.1 | Web framework | MIT |
| **Prisma** | 6.0.1 | ORM & migrations | Apache-2.0 |
| **pg** | 8.13.1 | PostgreSQL driver | MIT |
| **jsonwebtoken** | 9.0.2 | JWT auth | MIT |
| **bcrypt** | 5.1.1 | Password hashing | MIT |
| **Winston** | 3.14.2 | Logging | MIT |
| **Zod** | 3.23.8 | Validation | MIT |
| **Multer** | 1.4.5 | File upload | MIT |
| **axios** | 1.7.7 | HTTP client | MIT |
| **uuid** | 11.0.4 | UUID generation | MIT |
| **dotenv** | 16.4.5 | Env vars | BSD-2-Clause |
| **cors** | 2.8.5 | CORS | MIT |
| **helmet** | 8.0.0 | Security headers | MIT |
| **express-rate-limit** | 7.5.0 | Rate limiting | MIT |

### Frontend Libraries

| Library | Version | Purpose | License |
|---------|---------|---------|---------|
| **React** | 18.3.1 | UI framework | MIT |
| **React Router** | 6.28.0 | Routing | MIT |
| **Tailwind CSS** | 3.4.1 | Styling | MIT |
| **Vite** | 5.4.2 | Build tool | MIT |
| **axios** | 1.7.7 | HTTP client | MIT |
| **@monaco-editor/react** | 4.6.0 | Code editor | MIT |
| **React Flow** | 11.11.4 | Flow diagrams | MIT |
| **@craftjs/core** | 0.2.8 | Page builder | MIT |
| **react-markdown** | 9.0.1 | Markdown | MIT |
| **remark-gfm** | 4.0.0 | GFM support | MIT |
| **lucide-react** | Latest | Icons | ISC |
| **html2pdf.js** | 0.10.2 | PDF export | MIT |
| **zustand** | (planned) | State mgmt | MIT |

---

## Authentication Mechanisms

### Per Integration

| Integration | Method | Credential Storage | Rotation |
|-------------|--------|-------------------|----------|
| MuleSoft IDP | OAuth2 Client Credentials | `idp_executions` (encrypted) | Manual |
| AI Services | API Key | `connectors` (encrypted) | Manual |
| Databases | Username/Password | `connectors` (encrypted) | Manual |
| Internal JWT | JWT | `sessions` table | Auto (24h) |

---

## Security Considerations

### API Keys & Secrets

**Storage:**
- ✅ AES-256-GCM encryption
- ✅ Stored in database
- ✅ Never returned in API responses
- ⚠️ No key rotation
- ⚠️ No secret scanning in code

**Access:**
- ✅ Decrypted only when needed
- ✅ User-based access control
- ⚠️ No audit log for credential access

### Network Security

**Implemented:**
- ✅ HTTPS for external APIs
- ✅ Helmet for security headers
- ✅ CORS configuration
- ⚠️ No IP whitelisting
- ⚠️ No WAF

**Rate Limiting:**
- ✅ Express rate limit middleware
- ⚠️ Not applied to all endpoints
- ⚠️ No per-user limits

---

## External Dependencies

### Production Dependencies (Backend)

```json
{
  "@prisma/client": "^6.0.1",
  "axios": "^1.7.7",
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.21.1",
  "express-rate-limit": "^7.5.0",
  "helmet": "^8.0.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "pg": "^8.13.1",
  "uuid": "^11.0.4",
  "winston": "^3.14.2",
  "zod": "^3.23.8"
}
```

### Production Dependencies (Frontend)

```json
{
  "@craftjs/core": "^0.2.8",
  "@monaco-editor/react": "^4.6.0",
  "axios": "^1.7.7",
  "html2pdf.js": "^0.10.2",
  "lucide-react": "^0.462.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-markdown": "^9.0.1",
  "react-router-dom": "^6.28.0",
  "reactflow": "^11.11.4",
  "remark-gfm": "^4.0.0"
}
```

---

## API Usage Monitoring

### Logging

**API Logs Table:**
```sql
CREATE TABLE api_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  job_id VARCHAR(100),
  request_method VARCHAR(10),
  request_url TEXT,
  request_headers JSON,
  request_body JSON,
  response_status INT,
  response_body JSON,
  response_time_ms INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Logged Information:**
- Full request (method, URL, headers, body)
- Full response (status, body, timing)
- User context
- Job/process correlation
- Errors with stack traces

**Retention:** No automatic cleanup (grows indefinitely)

---

## Service Status Monitoring

### Current State

**Monitoring:** ⚠️ None implemented

**Needed:**
1. Health check endpoints
2. Service availability dashboard
3. Alert system
4. SLA tracking
5. Performance metrics

---

## Recommendations

### Short-Term (1-2 weeks)

1. **Health Checks:**
   ```typescript
   GET /api/health
   {
     status: 'healthy',
     services: {
       database: 'up',
       mulesoft: 'up',
       ai: 'up'
     }
   }
   ```

2. **Rate Limiting:**
   - Apply to all endpoints
   - Per-user limits
   - Graceful degradation

3. **Secret Scanning:**
   - Git pre-commit hooks
   - CI/CD scanning
   - Dependency audits

### Medium-Term (1-2 months)

1. **Service Mesh:**
   - Centralized auth
   - Circuit breakers
   - Retry policies

2. **API Gateway:**
   - Single entry point
   - Request/response transformation
   - Caching

3. **Monitoring:**
   - Prometheus/Grafana
   - Alert manager
   - SLO tracking

### Long-Term (3-6 months)

1. **API Versioning:**
   - `/v1/`, `/v2/` endpoints
   - Backward compatibility

2. **GraphQL Layer:**
   - Alternative to REST
   - Better for complex queries

3. **WebSocket Support:**
   - Real-time updates
   - Process execution status

---

**Document Status:** ✅ Complete  
**Next:** See `TECHNICAL_DEBT.md` for issues and improvements

