# System Architecture

## Overview

Document Analyzer is a full-stack web application built with a modern, scalable architecture designed for processing and analyzing documents using MuleSoft's IDP capabilities.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Frontend                          │  │
│  │  - TypeScript, Vite, Tailwind CSS                        │  │
│  │  - React Router, Context API                             │  │
│  │  - Axios for API calls                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Express.js API Server                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │Controllers │  │  Services  │  │ Middleware │        │  │
│  │  └────────────┘  └────────────┘  └────────────┘        │  │
│  │       │                │                │                 │  │
│  │       └────────────────┴────────────────┘                │  │
│  │                      │                                    │  │
│  │                      │ Prisma ORM                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                │                        │
                │                        │
                │                        └──────────────────────┐
                │                                               │
┌───────────────────────────┐              ┌──────────────────────────────┐
│     DATABASE LAYER        │              │   EXTERNAL SERVICES          │
│  ┌────────────────────┐  │              │  ┌────────────────────────┐ │
│  │  PostgreSQL        │  │              │  │   MuleSoft IDP API     │ │
│  │  - User data       │  │              │  │  - Document processing │ │
│  │  - Documents       │  │              │  │  - AI Analysis         │ │
│  │  - Analyses        │  │              │  └────────────────────────┘ │
│  │  - Permissions     │  │              └──────────────────────────────┘
│  │  - Logs            │  │
│  └────────────────────┘  │
└───────────────────────────┘
```

## Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 18+ |
| TypeScript | Type Safety | 5+ |
| Vite | Build Tool | 5+ |
| Tailwind CSS | Styling | 3+ |
| React Router | Navigation | 6+ |
| Axios | HTTP Client | 1+ |
| react-markdown | Markdown Rendering | Latest |
| @uiw/react-md-editor | Markdown Editor | Latest |
| react-dnd | Drag & Drop | Latest |
| html2pdf.js | PDF Generation | Latest |
| lucide-react | Icons | Latest |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime | 18+ |
| Express.js | Web Framework | 4+ |
| TypeScript | Type Safety | 5+ |
| Prisma | ORM | 5+ |
| PostgreSQL | Database | 14+ |
| JWT | Authentication | Latest |
| bcrypt | Password Hashing | Latest |
| Winston | Logging | Latest |
| Zod | Validation | Latest |
| Multer | File Upload | Latest |

## System Components

### 1. Frontend Application

#### Component Structure
```
components/
├── common/              # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Loading.tsx
│   ├── AlertDialog.tsx
│   ├── ConfirmDialog.tsx
│   ├── Modal.tsx
│   └── Badge.tsx
│
├── layout/              # Layout components
│   ├── MainLayout.tsx
│   ├── Sidebar.tsx
│   └── TopBar.tsx
│
└── features/            # Feature-specific components
    ├── ShareModal.tsx
    └── ...
```

#### State Management
- **React Context API** for global state (auth, app settings)
- **Local State** (useState) for component-specific state
- **Custom Hooks** for reusable logic

#### Key Contexts
- `AuthContext`: User authentication state
- `AppContext`: Application-wide settings

#### Custom Hooks
- `usePermissions`: Check user permissions
- `useAuth`: Access authentication state
- Various feature-specific hooks

### 2. Backend Application

#### Layered Architecture

**Controllers Layer**
- Handle HTTP requests
- Validate input
- Call service layer
- Return responses

**Services Layer**
- Business logic
- Database operations via Prisma
- External API calls (MuleSoft)
- Data transformation

**Middleware Layer**
- Authentication (`authenticate`)
- Authorization (`requireAdmin`, `requirePermission`)
- Logging
- Error handling

**Routes Layer**
- Define API endpoints
- Apply middleware
- Connect to controllers

#### Key Services
- `auth.service.ts`: Authentication logic
- `user.service.ts`: User management
- `document.service.ts`: Document processing
- `role.service.ts`: Role and permission management
- `menu.service.ts`: Menu configuration
- `logging.service.ts`: Activity and API logging

### 3. Database Layer

#### Prisma ORM
- Type-safe database queries
- Automatic migrations
- Schema management
- Query optimization

#### Database Schema
See [DATABASE.md](./DATABASE.md) for complete schema documentation.

**Key Tables:**
- `users` - User accounts
- `roles` - User roles
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mappings
- `menu_items` - Navigation menu
- `uploads` - Uploaded files
- `analysis_records` - Analysis metadata
- `contract_analysis` - IDP results
- `data_analysis` - Analysis results
- `prompts` - Analysis prompts
- `flows` - MuleSoft flows
- `activity_logs` - User activity tracking
- `api_logs` - API call logging
- `notifications` - User notifications
- `system_settings` - Configuration

### 4. External Services

#### MuleSoft IDP API
**Purpose**: Document processing and AI analysis

**Endpoints:**
- `POST /process/document?job={jobId}`: Extract information from documents
- `POST /analyze?job={jobId}`: Analyze extracted data with AI
- `GET /flows`: List available flows

**Integration Pattern:**
1. Frontend initiates request to backend
2. Backend validates user and input
3. Backend calls MuleSoft API
4. Backend logs API call
5. Backend stores results in database
6. Backend returns to frontend

## Data Flow

### Document Processing Flow

```
User Action
    │
    ├─> Upload Files
    │     │
    │     └─> Backend: Store in uploads table (base64)
    │           │
    │           └─> Return jobId
    │
    └─> Click "Process Documents"
          │
          ├─> Frontend: POST /analysis/process-contract
          │     │
          │     └─> Backend: Process Contract
          │           │
          │           ├─> Call MuleSoft POST /process/document?job={jobId}
          │           │     │
          │           │     └─> Log API call (api_logs)
          │           │
          │           ├─> Store results (contract_analysis)
          │           │
          │           └─> Update status (analysis_records)
          │
          └─> User reviews IDP extraction
                │
                └─> Click "Analyze"
                      │
                      └─> Frontend: POST /analysis/analyze
                            │
                            └─> Backend: Analyze Document
                                  │
                                  ├─> Call MuleSoft POST /analyze
                                  │     (with IDP results + prompt)
                                  │     │
                                  │     └─> Log API call (api_logs)
                                  │
                                  ├─> Store results (data_analysis)
                                  │
                                  ├─> Update status (analysis_records)
                                  │
                                  └─> Log activity (activity_logs)
```

### Authentication Flow

```
1. Login Request
   Frontend: POST /auth/login { email, password }
   Backend:
     - Verify credentials
     - Generate JWT token
     - Create session
     - Log activity
     - Return { token, user }

2. API Request
   Frontend: GET /api/resource
     Headers: { Authorization: Bearer {token} }
   Backend:
     - Verify JWT token
     - Attach user to request
     - Check permissions
     - Process request

3. Logout
   Frontend: POST /auth/logout
   Backend:
     - Invalidate session
     - Log activity
```

### Permission Check Flow

```
1. Frontend Check (UI visibility)
   usePermissions hook
     - Fetches user permissions from /roles/me/permissions
     - Provides hasPermission(name) function
     - Components conditionally render based on permissions

2. Backend Check (Enforce security)
   requirePermission middleware
     - Checks if user has required permission
     - Returns 403 if not authorized
     - Allows request to proceed if authorized
```

## Security Architecture

### Authentication
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt with salt
- **Session Management**: Database-backed sessions
- **Token Expiration**: Configurable expiration time

### Authorization
- **Role-Based Access Control (RBAC)**
- **Fine-Grained Permissions**: 39 permissions across 6 categories
- **Middleware Protection**: All routes protected
- **Frontend Checks**: UI visibility based on permissions
- **Backend Enforcement**: API endpoints check permissions

### Data Security
- **Encrypted Passwords**: bcrypt hashing
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: React automatic escaping
- **CORS Configuration**: Restricted origins
- **Environment Variables**: Sensitive data not in code

### API Security
- **Backend Proxy**: No direct frontend-to-MuleSoft calls
- **API Logging**: All external API calls logged
- **Rate Limiting**: Can be added via middleware
- **Input Validation**: Zod schemas

## Performance Optimization

### Frontend
- **Code Splitting**: Vite automatic code splitting
- **Lazy Loading**: React.lazy for routes
- **Memoization**: React.memo for expensive components
- **Debouncing**: Search inputs debounced
- **Pagination**: Large lists paginated

### Backend
- **Database Indexes**: Critical fields indexed
- **Query Optimization**: Select only needed fields
- **Connection Pooling**: Prisma connection pooling
- **Async Operations**: Non-blocking I/O
- **Caching**: Can be added for frequently accessed data

### Database
- **Indexes**: userId, createdAt, status, etc.
- **Soft Deletes**: isDeleted flag instead of DELETE
- **Pagination**: LIMIT and OFFSET for large datasets
- **JSON Fields**: For flexible data storage

## Scalability Considerations

### Horizontal Scaling
- Stateless API design (JWT)
- Session storage in database (not memory)
- File storage in database (can move to S3)

### Vertical Scaling
- Optimized database queries
- Efficient Prisma operations
- Connection pooling

### Future Enhancements
- Redis caching layer
- S3 for file storage
- CDN for static assets
- Load balancer for multiple instances
- Background job queue (Bull, BullMQ)
- WebSocket for real-time updates

## Deployment Architecture

### Heroku Deployment
```
Heroku App
├── Web Dyno (Express backend)
│   - Serves API
│   - Serves frontend static files
│
├── PostgreSQL Database
│   - Managed by Heroku
│   - Automatic backups
│
└── Environment Variables
    - Configuration
    - Secrets
```

### Build Process
1. `heroku-postbuild` script runs
2. Frontend builds to `frontend/dist`
3. Backend compiles TypeScript to JavaScript
4. Express serves frontend from `/dist`
5. API endpoints available at `/api/*`

## Monitoring & Logging

### Activity Logging
- **User Actions**: All significant user actions logged
- **Table**: `activity_logs`
- **Fields**: userId, actionType, actionDescription, ipAddress, userAgent

### API Logging
- **External Calls**: All MuleSoft API calls logged
- **Table**: `api_logs`
- **Fields**: requestMethod, requestUrl, requestBody, responseStatus, responseTime

### Error Logging
- **Winston Logger**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Console Output**: Development environment
- **File Output**: Can be configured for production

## Best Practices

### Code Organization
- Separation of concerns (controllers, services, routes)
- Single responsibility principle
- DRY (Don't Repeat Yourself)
- Type safety with TypeScript

### Error Handling
- Try-catch blocks for async operations
- Meaningful error messages
- Proper HTTP status codes
- User-friendly frontend error display

### Testing Strategy
- Manual testing for all features
- Test with different user roles
- Test edge cases
- Test error scenarios

### Documentation
- Code comments for complex logic
- API documentation
- Database schema documentation
- README files

---

For more details on specific components:
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Development Guide](./DEVELOPMENT.md)

