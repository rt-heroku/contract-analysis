# System Architecture Overview

**Last Updated:** January 23, 2025, 6:30 AM

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Evolution](#system-evolution)
3. [High-Level Architecture](#high-level-architecture)
4. [Technology Stack](#technology-stack)
5. [System Layers & Modules](#system-layers--modules)
6. [Key Technical Decisions](#key-technical-decisions)
7. [Deployment Model](#deployment-model)
8. [System Boundaries & Integrations](#system-boundaries--integrations)

---

## Executive Summary

This is a **multi-purpose automation and data platform** built on Node.js/TypeScript that has evolved from a document analyzer into a comprehensive system featuring:

- **Document Processing & AI Analysis** (via MuleSoft IDP)
- **Database Explorer & Management IDE** (PostgreSQL-focused, DBeaver-like capabilities)
- **Process/Workflow Engine** (visual flow builder with action execution)
- **Dynamic Page Builder** (Craft.js-based human-in-the-loop UIs)
- **Connector System** (unified access to databases, APIs, file systems)
- **Store Layer** (logical data repositories with schemas)
- **Role-Based Access Control** (granular permissions system)

**Current State:** The system is at an architectural inflection point where it has outgrown its original single-purpose design and is transitioning toward a more modular, connector-driven architecture.

**Maturity:**
- Authentication/Authorization: **Production**
- Document Processing: **Production**
- Database Explorer: **Production** (95-97% feature complete)
- Process Engine: **Beta** (core runtime exists, UI in development)
- Page Builder: **Beta** (functional but needs refinement)
- Connector/Store Architecture: **Alpha** (models defined, partial implementation)

---

## System Evolution

### Phase 1: Document Analyzer (Q1-Q2 2024)
**Purpose:** Process PDF contracts and Excel data files via MuleSoft IDP  
**Core Features:** File upload, IDP integration, results display  
**Stack:** React + Express + PostgreSQL + MuleSoft IDP

### Phase 2: Database Explorer (Q3-Q4 2024)
**Purpose:** Professional database IDE for PostgreSQL  
**Core Features:** Schema browsing, SQL query execution, DDL export, data import/export, AI optimization  
**Stack:** Added pg driver, Monaco Editor, React Flow diagrams

### Phase 3: Process & Connector Architecture (Q4 2024 - Present)
**Purpose:** Generic automation platform with reusable connectors  
**Core Features:** Visual process builder, connector abstraction, action system, dynamic page generation  
**Stack:** Added Craft.js, OpenAPI integration, encryption layer

**Current Challenge:** The system has grown organically, and there's tension between:
- Legacy single-database assumptions vs. multi-connector reality
- Tightly-coupled services vs. modular connector/store architecture
- Direct API calls vs. unified action execution layer
- Static routes vs. dynamic process-driven UIs

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                           │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  React 18 + TypeScript + Vite + Tailwind CSS                 │    │
│   │  - React Router 6 (page routing)                             │    │
│   │  - React Context API (global state)                           │    │
│   │  - Monaco Editor (SQL/code editing)                           │    │
│   │  - React Flow (process visualization)                         │    │
│   │  - Craft.js (dynamic page builder)                            │    │
│   │  - react-markdown (report rendering)                          │    │
│   └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP/REST API
┌────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API LAYER                               │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  Express.js 4 + TypeScript                                   │    │
│   │  ┌────────────┬───────────┬─────────────┬──────────────┐    │    │
│   │  │ Routes     │Controllers│ Middleware  │ Validators   │    │    │
│   │  │ (REST)     │ (Request  │ (Auth,      │ (Zod)        │    │    │
│   │  │            │  Handlers)│  Logging)   │              │    │    │
│   │  └────────────┴───────────┴─────────────┴──────────────┘    │    │
│   └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌────────────────────────────────────────────────────────────────────────┐
│                         SERVICE/BUSINESS LOGIC LAYER                    │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  Core Services                                               │    │
│   │  - auth.service (authentication/sessions)                    │    │
│   │  - user.service (user management)                             │    │
│   │  - document.service (IDP workflow)                            │    │
│   │  - dbExplorer.service (database operations) ★ LARGE          │    │
│   │  - connector.service (connector CRUD)                         │    │
│   │  - process.service (process execution)                        │    │
│   │  - action.service (action execution)                          │    │
│   │  - systemPrompt.service (AI prompts)                          │    │
│   │  - tableAnalysis.service (DB AI optimization)                 │    │
│   │  - logging.service (activity/API logs)                        │    │
│   │  - idpExecution.service (MuleSoft IDP config)                 │    │
│   └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA ACCESS LAYER                                │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  Prisma ORM (Type-safe database client)                      │    │
│   │  - Schema management (schema.prisma)                          │    │
│   │  - Migration system                                            │    │
│   │  - Query builder with relationships                            │    │
│   │  - Connection pooling                                          │    │
│   └──────────────────────────────────────────────────────────────┘    │
│   ┌──────────────────────────────────────────────────────────────┐    │
│   │  Database Connection Pool (pg driver)                         │    │
│   │  - Direct PostgreSQL connections (for DB Explorer)            │    │
│   │  - Connection caching per user+connector                       │    │
│   │  - SSL support, timeout handling                              │    │
│   └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE LAYER                               │
│   ┌─────────────────────────────────────────────────────────┐         │
│   │  PostgreSQL 14+ (Primary Database)                        │         │
│   │  - Application data (users, roles, sessions)              │         │
│   │  - Document processing results                             │         │
│   │  - Process definitions & executions                         │         │
│   │  - Connector & store configurations                         │         │
│   │  - Activity & API logs                                       │         │
│   │  - Query history & favorites                                 │         │
│   │  - Dynamic page configurations                               │         │
│   │  Total: 35+ tables, 839 lines of schema                    │         │
│   └─────────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                               │
│   ┌─────────────────────┐  ┌────────────────────┐  ┌────────────────┐│
│   │  MuleSoft IDP API   │  │  External          │  │  Connected     ││
│   │  - Document OCR     │  │  Databases         │  │  Databases     ││
│   │  - AI Analysis      │  │  (via connectors)  │  │  (multi-tenant)││
│   │  - Data extraction  │  │  - PostgreSQL      │  │                ││
│   └─────────────────────┘  │  - MySQL           │  └────────────────┘│
│                             │  - Other RDBMS     │                     │
│                             └────────────────────┘                     │
│   ┌─────────────────────┐  ┌────────────────────┐  ┌────────────────┐│
│   │  AI Services        │  │  File Systems      │  │  REST APIs     ││
│   │  (via connectors)   │  │  - S3              │  │  (OpenAPI)     ││
│   │  - Claude           │  │  - FTP             │  │                ││
│   │  - GPT              │  │  - Local FS        │  │                ││
│   └─────────────────────┘  └────────────────────┘  └────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **React** | 18.3.1 | UI Framework | Production |
| **TypeScript** | 5.6.2 | Type Safety | Production |
| **Vite** | 5.4.2 | Build Tool & Dev Server | Production |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS | Production |
| **React Router** | 6.28.0 | Client-side routing | Production |
| **Axios** | 1.7.7 | HTTP client | Production |
| **Monaco Editor** | @monaco-editor/react 4.6.0 | Code/SQL editing | Production |
| **React Flow** | 11.11.4 | Process flow visualization | Beta |
| **Craft.js** | @craftjs/core 0.2.8 | Drag-and-drop page builder | Beta |
| **react-markdown** | 9.0.1 | Markdown rendering | Production |
| **remark-gfm** | 4.0.0 | GitHub-flavored markdown | Production |
| **lucide-react** | Latest | Icon library | Production |
| **html2pdf.js** | 0.10.2 | PDF generation | Production |

### Backend Technologies

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Node.js** | 18+ | Runtime environment | Production |
| **Express.js** | 4.21.1 | Web framework | Production |
| **TypeScript** | 5.3.3 | Type safety | Production |
| **Prisma** | 6.0.1 | ORM & migrations | Production |
| **PostgreSQL** | 14+ | Primary database | Production |
| **pg** | 8.13.1 | Direct PostgreSQL driver | Production |
| **JWT** | jsonwebtoken 9.0.2 | Authentication tokens | Production |
| **bcrypt** | 5.1.1 | Password hashing | Production |
| **Winston** | 3.14.2 | Structured logging | Production |
| **Zod** | 3.23.8 | Schema validation | Production |
| **Multer** | 1.4.5-lts.1 | File upload handling | Production |
| **axios** | 1.7.7 | External API calls | Production |

### Database Schema Stats
- **35 tables** (models)
- **839 lines** of Prisma schema
- **Multiple many-to-many** relationships
- **Comprehensive indexing** for performance
- **Soft delete** patterns for audit trails
- **JSON fields** for flexible metadata

---

## System Layers & Modules

### 1. Authentication & Authorization Layer
**Purpose:** Secure user access and permission management  
**Components:**
- JWT-based session management
- Password hashing (bcrypt)
- Role-Based Access Control (RBAC)
- Menu permissions
- Fine-grained permissions system

**Key Files:**
- `backend/src/services/auth.service.ts` - Authentication logic
- `backend/src/middleware/auth.ts` - JWT validation
- `backend/src/middleware/admin.ts` - Admin checks
- `backend/src/middleware/permission.ts` - Permission checks

**Database Tables:**
- `users`, `user_profiles`, `roles`, `user_roles`
- `permissions`, `role_permissions`
- `menu_items`, `menu_permissions`
- `sessions` (token storage with expiration)

### 2. Document Processing Layer
**Purpose:** PDF contract analysis via MuleSoft IDP  
**Components:**
- File upload (base64 storage)
- MuleSoft IDP integration
- Contract term extraction
- Data analysis and comparison
- PDF/Excel export

**Key Files:**
- `backend/src/services/document.service.ts`
- `backend/src/services/mulesoft.service.ts`
- `backend/src/services/idpExecution.service.ts`

**Database Tables:**
- `uploads`, `contract_analysis`, `data_analysis`, `analysis_records`
- `idp_executions` (encrypted credentials)

### 3. Database Explorer Layer ★ MAJOR SUBSYSTEM
**Purpose:** Professional database IDE for PostgreSQL  
**Components:**
- Schema browsing (tables, views, functions, sequences)
- SQL query execution with Monaco editor
- Query history & favorites
- Data CRUD operations
- Import/Export (CSV, JSON, SQL, Excel)
- DDL export for all objects
- ERD visualization
- AI-powered database optimization
- Column management (add/modify/delete)
- Index management

**Key Files:**
- `backend/src/services/dbExplorer.service.ts` ★ **1,914 lines** (largest service)
- `backend/src/services/tableAnalysis.service.ts` (AI analysis)
- `backend/src/services/aiAnalysis.service.ts` (AI integration)
- `backend/src/services/systemPrompt.service.ts` (AI prompts)
- `frontend/src/pages/DatabaseExplorer.tsx` (main UI)
- `frontend/src/components/db-explorer/*` (10+ components)

**Database Tables:**
- `connectors` (database connections with encrypted credentials)
- `db_queries` (query history)
- `db_connections` (active sessions)
- `db_analysis_results` (AI optimization results)
- `system_prompts` (AI prompt templates)

**Features:**
- ✅ 97% feature complete (44 features)
- ✅ Context menus for all objects
- ✅ Multi-row selection
- ✅ Bulk operations
- ✅ Transaction support
- ✅ SQL file execution
- ✅ Data import wizard (CSV/JSON)
- ✅ AI optimization recommendations

### 4. Connector Layer
**Purpose:** Unified access to external data sources  
**Components:**
- Database connectors (PostgreSQL, MySQL, etc.)
- REST API connectors (OpenAPI-based)
- File system connectors (S3, FTP, local)
- Redis connectors
- AI service connectors (Claude, GPT)

**Key Features:**
- **Encryption:** All sensitive credentials encrypted at rest
- **Auto-detection:** Environment variable discovery
- **Connection pooling:** Per user+connector caching
- **Testing:** Connection validation before save
- **Sharing:** User-based access control

**Key Files:**
- `backend/src/services/connector.service.ts`
- `backend/src/services/auto-connector.service.ts`
- `backend/src/utils/encryption.ts` (AES-256-GCM)

**Database Tables:**
- `connectors` (configurations with encrypted config JSON)
- `connector_actions` (available operations per connector)

### 5. Process Engine Layer
**Purpose:** Visual workflow automation  
**Components:**
- Process definition (ReactFlow-based)
- Action execution engine
- Variable passing between steps
- Error handling & retries
- Execution tracking & logging

**Key Files:**
- `backend/src/services/process.service.ts`
- `backend/src/services/action.service.ts`
- `frontend/src/pages/ProcessBuilder.tsx` (UI)

**Database Tables:**
- `processes` (comprehensive process definitions)
- `actions` (reusable action definitions)
- `process_executions` (runtime instances)
- `action_executions` (step-level execution tracking)

**Current State:** 
- ✅ Data models defined
- ✅ Basic execution engine exists
- ⚠️ UI incomplete
- ⚠️ Limited action library
- ⚠️ No visual debugger yet

### 6. Store Layer
**Purpose:** Logical data repositories with schemas  
**Components:**
- Store abstraction over connectors
- Schema definitions
- Data validation
- Caching strategies

**Database Tables:**
- `stores` (store configurations)

**Current State:**
- ✅ Data model defined
- ⚠️ Limited implementation
- ⚠️ No store service yet

### 7. Dynamic Page Builder Layer
**Purpose:** Human-in-the-loop UI generation  
**Components:**
- Craft.js-based drag-and-drop builder
- Form components
- Process integration
- Store integration

**Key Files:**
- `frontend/src/pages/PageBuilder.tsx`
- `frontend/src/components/builder/*`

**Database Tables:**
- `dynamic_pages` (Craft.js configurations)

**Current State:**
- ✅ Data model defined
- ⚠️ Beta implementation
- ⚠️ Needs more components

### 8. Logging & Monitoring Layer
**Purpose:** Comprehensive audit trail and observability  
**Components:**
- Activity logging (all user actions)
- API logging (external calls with timing)
- Error tracking
- Performance metrics

**Key Files:**
- `backend/src/services/logging.service.ts`
- `backend/src/utils/logger.ts` (Winston)

**Database Tables:**
- `activity_logs` (user actions, 10+ indexes)
- `api_logs` (external API calls with full request/response)

### 9. AI Integration Layer
**Purpose:** AI-powered features across the system  
**Components:**
- System prompts (versioned, templated)
- Connector-based AI access
- Query generation
- Database optimization
- Document analysis

**Key Files:**
- `backend/src/services/systemPrompt.service.ts`
- `backend/src/services/aiAnalysis.service.ts`

**Database Tables:**
- `system_prompts` (feature-specific prompts)
- `prompts` (user prompts for flows)
- `prompt_variables` (parameterized prompts)

---

## Key Technical Decisions

### 1. Why Node.js?
**Rationale:**
- Asynchronous I/O ideal for API integrations
- Strong ecosystem for REST APIs
- TypeScript for type safety
- Fast iteration with hot reloading
- Single language (JavaScript/TypeScript) for full stack

**Trade-offs:**
- Single-threaded (use worker threads for CPU-intensive tasks)
- Memory management requires attention
- Callback/promise complexity (mitigated by async/await)

### 2. Why PostgreSQL?
**Rationale:**
- Mature, reliable, open-source
- Excellent JSON support (JSONB)
- Strong ACID guarantees
- Rich ecosystem (pgAdmin, extensions)
- Prisma ORM has excellent PostgreSQL support
- Advanced features (CTEs, window functions, full-text search)

**Trade-offs:**
- Vertical scaling preferred over horizontal
- Complex replication setup
- Requires tuning for optimal performance

### 3. Why Prisma ORM?
**Rationale:**
- Type-safe database access
- Automatic migrations
- Great developer experience
- Clear schema definition
- Excellent TypeScript integration

**Trade-offs:**
- Less flexibility than raw SQL
- Generated client can be large
- Some advanced PostgreSQL features require raw queries
- Migration conflicts in team environments

### 4. Why Monorepo (frontend + backend)?
**Rationale:**
- Shared TypeScript types
- Easier version control
- Simpler deployment
- Faster iterations

**Trade-offs:**
- Larger repository size
- Coupling between frontend/backend changes
- Requires careful git management

### 5. Why React Context API (not Redux/MobX)?
**Rationale:**
- Built-in, no additional dependencies
- Sufficient for current complexity
- Easier to understand and maintain
- Lower bundle size

**Trade-offs:**
- Not ideal for very large state trees
- No built-in dev tools
- Manual optimization required

### 6. Why JWT (not session cookies)?
**Rationale:**
- Stateless authentication
- Mobile-friendly
- Easier horizontal scaling
- Standard approach for SPAs

**Trade-offs:**
- Cannot revoke tokens easily (mitigated by short expiration + refresh tokens)
- Token size larger than session IDs
- Must store sensitive data server-side

### 7. Why Base64 for File Storage?
**Rationale:**
- Simple implementation
- No external file storage needed
- Database backups include files
- Easy sharing/replication

**Trade-offs:**
- 33% size overhead
- Database bloat
- Not suitable for very large files
- Slower than file system access

**Recommendation:** Migrate to S3/object storage for production scale

### 8. Why Encryption at Rest?
**Rationale:**
- Security compliance (especially for database credentials)
- Protection against database breaches
- User trust

**Implementation:**
- AES-256-GCM encryption
- Key stored in environment variable
- Decrypt only when needed

### 9. Why Monaco Editor?
**Rationale:**
- Same editor as VS Code
- Excellent SQL syntax highlighting
- Autocomplete support
- Widely trusted

**Trade-offs:**
- Large bundle size (~3MB)
- Complex to configure

---

## Deployment Model

### Current Deployment
**Type:** Monolithic, single-server deployment

**Architecture:**
```
┌─────────────────────────────────────┐
│      Single Server/VM/Container     │
│  ┌───────────────────────────────┐ │
│  │  Frontend (Vite build)        │ │
│  │  - Static files served by      │ │
│  │    Express.js or Nginx         │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Backend (Node.js/Express)    │ │
│  │  - Port 5000                   │ │
│  │  - All services in-process    │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│   PostgreSQL Database (external)    │
│   - Primary data store              │
│   - Connection pooling via Prisma   │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│    External Services                │
│    - MuleSoft IDP API               │
│    - Connected databases (via       │
│      connectors)                    │
└─────────────────────────────────────┘
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Token signing key
- `ENCRYPTION_KEY` - AES encryption key (32 bytes hex)
- `PORT` - Backend server port (default 5000)
- `NODE_ENV` - development|production
- Various API keys (MuleSoft, AI services, etc.)

**Build Process:**
1. Frontend: `npm run build` → `dist/` folder
2. Backend: `npm run build` → `dist/` folder (TypeScript compilation)
3. Prisma: `npx prisma generate` → Prisma client
4. Migrations: `npx prisma migrate deploy`

**Startup:**
1. Load environment variables
2. Initialize Prisma client
3. Run auto-connector detection
4. Start Express server
5. Serve frontend static files

### Scalability Considerations

**Current Bottlenecks:**
1. **Single-threaded Node.js** - CPU-intensive operations block
2. **In-memory caches** - Not shared across instances
3. **Connection pools** - Isolated per process
4. **No load balancing** - Single point of failure

**Scaling Path:**
1. **Horizontal Scaling:**
   - Multi-instance deployment behind load balancer
   - Move sessions to Redis/external store
   - Centralize connection pools
   
2. **Microservices:**
   - Extract DB Explorer as separate service
   - Extract Process Engine as separate service
   - API gateway for routing

3. **Database:**
   - Read replicas for heavy queries
   - Connection pooling service (PgBouncer)
   - Partitioning for large tables (logs, executions)

---

## System Boundaries & Integrations

### Internal Boundaries

**Clear Boundaries:**
- ✅ Authentication layer is well-isolated
- ✅ Logging service is pure utility
- ✅ Encryption module is standalone

**Blurred Boundaries:**
- ⚠️ `dbExplorer.service.ts` is 1,914 lines (god object)
- ⚠️ Direct Prisma calls throughout controllers (bypassing service layer)
- ⚠️ Connector/Store abstraction incomplete
- ⚠️ Process engine mixed with action execution

### External Integrations

**Type 1: MuleSoft IDP (Production)**
- Purpose: Document OCR & AI analysis
- Auth: Client ID/Secret (OAuth2)
- Storage: Encrypted credentials in `idp_executions` table
- Logging: Full request/response in `api_logs`
- Retry: None (immediate failure)

**Type 2: Connected Databases (Production)**
- Purpose: Multi-database access via Database Explorer
- Auth: Username/password (encrypted)
- Storage: `connectors` table
- Pooling: Per-user connection pools
- Testing: Pre-save connection validation

**Type 3: AI Services (Beta)**
- Purpose: Query generation, optimization, analysis
- Auth: API keys (via connectors)
- Storage: `connectors` table + `system_prompts`
- Current: Partially implemented

**Type 4: File Storage (Planned)**
- Purpose: S3, FTP access
- Auth: Keys/credentials via connectors
- Storage: `connectors` + `stores`
- Current: Data models exist, no implementation

---

## Critical Observations

### Strengths 💪
1. **Comprehensive RBAC** - Well-thought-out permission system
2. **Excellent logging** - Activity logs + API logs with full context
3. **Type safety** - TypeScript + Prisma provides strong guarantees
4. **Database Explorer** - Production-ready, feature-rich, 97% complete
5. **Encryption** - Proper AES-256-GCM for sensitive data
6. **Flexible schema** - JSON fields allow evolution without migrations

### Weaknesses ⚠️
1. **Monolithic services** - `dbExplorer.service.ts` is too large
2. **Incomplete abstractions** - Connector/Store layer partially implemented
3. **Mixed concerns** - Business logic in controllers
4. **No caching strategy** - Every request hits database
5. **Base64 file storage** - Not scalable for large files
6. **Limited tests** - No visible test suite
7. **Process engine incomplete** - UI and execution need work

### Immediate Risks 🚨
1. **Database growth** - Logs, files stored in DB will cause bloat
2. **Connection pool exhaustion** - Many users × many connectors
3. **Memory leaks** - Connection pools not properly cleaned up
4. **Security** - Encryption key stored in environment (single point of failure)
5. **Scalability** - Cannot horizontally scale without refactoring

---

## Recommended Next Steps

### Phase 1: Stabilization (1-2 weeks)
1. Add comprehensive logging to identify bottlenecks
2. Implement connection pool cleanup
3. Add health check endpoints
4. Set up monitoring (CPU, memory, DB connections)
5. Extract `dbExplorer.service` into smaller, focused services

### Phase 2: Architecture Refinement (2-4 weeks)
1. Complete Connector/Store abstraction
2. Implement caching layer (Redis)
3. Move file storage to S3/object storage
4. Create unified action execution layer
5. Add metadata system (schema discovery, lineage)

### Phase 3: Scale Preparation (4-8 weeks)
1. Implement horizontal scaling
2. Move sessions to external store
3. Set up load balancing
4. Add read replicas for database
5. Implement rate limiting

---

**Document Status:** ✅ Complete  
**Next:** See `DATA_MODEL.md` for database schema details

