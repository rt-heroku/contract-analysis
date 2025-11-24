# Technical Debt Documentation

**Last Updated:** January 23, 2025, 8:15 AM

## Overview

This document identifies code smells, anti-patterns, inconsistencies, and areas requiring attention across the codebase.

**Priority Levels:**
- 🔴 **Critical** - Impacts security, stability, or scalability
- 🟠 **High** - Impacts maintainability or performance
- 🟡 **Medium** - Impacts code quality or developer experience
- 🟢 **Low** - Nice-to-have improvements

---

## Critical Issues 🔴

### 1. God Service: `dbExplorer.service.ts` (1,914 lines)

**Problem:** Single service handles all database operations

**Impact:**
- Hard to maintain
- Difficult to test
- High coupling
- Memory footprint

**Recommendation:** Split into focused services:
```
dbExplorer.service.ts (1,914 lines)
  ↓
├── schemaService.ts (300 lines) - Schema browsing
├── tableService.ts (400 lines) - Table operations
├── queryService.ts (350 lines) - Query execution
├── columnService.ts (250 lines) - Column management
├── indexService.ts (200 lines) - Index operations
├── connectionService.ts (200 lines) - Connection pooling
└── exportService.ts (214 lines) - DDL export
```

**Priority:** 🔴 Critical  
**Effort:** 2-3 days  
**Risk:** Medium (requires careful refactoring)

---

### 2. Connection Pool Memory Leak

**Problem:** Connection pools never cleaned up

**Code:**
```typescript
// dbExplorer.service.ts
private pools: Map<string, Pool> = new Map();

async getPool(connectorId: number, userId: number): Promise<Pool> {
  const cacheKey = `${connectorId}-${userId}`;
  if (this.pools.has(cacheKey)) {
    return this.pools.get(cacheKey)!;
  }
  // Create new pool...
  this.pools.set(cacheKey, pool); // Never removed!
}
```

**Impact:**
- Memory grows indefinitely
- Connection exhaustion
- Database performance degradation

**Recommendation:**
```typescript
// Add pool cleanup
private poolLastUsed: Map<string, Date> = new Map();

// Cron job to cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, lastUsed] of this.poolLastUsed) {
    if (now - lastUsed.getTime() > 30 * 60 * 1000) { // 30 minutes
      this.closePool(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

**Priority:** 🔴 Critical  
**Effort:** 4 hours  
**Risk:** Low

---

### 3. Encryption Key in Environment Variable

**Problem:** Single encryption key stored in `.env`

**Code:**
```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
```

**Impact:**
- Single point of failure
- No key rotation
- Compromised key = all credentials exposed

**Recommendation:** Use key management service
```typescript
// Option 1: AWS KMS
import { KMS } from 'aws-sdk';
const kms = new KMS();
const encryptedKey = await kms.encrypt({ KeyId, Plaintext: data });

// Option 2: HashiCorp Vault
import Vault from 'node-vault';
const vault = Vault({ endpoint: '...' });
const secret = await vault.read('secret/data/encryption-key');
```

**Priority:** 🔴 Critical  
**Effort:** 1-2 weeks  
**Risk:** High (requires infrastructure changes)

---

### 4. Base64 File Storage in Database

**Problem:** Files stored as base64 in PostgreSQL

**Impact:**
- 33% size overhead
- Database bloat
- Slow queries
- Expensive backups

**Current Size Estimate:**
- 1,000 files × 1MB = 1GB raw
- 1GB × 1.33 = 1.33GB in database

**Recommendation:** Migrate to S3
```typescript
// Before: Store in DB
await prisma.upload.create({
  data: {
    fileContentBase64: base64String, // Large!
  },
});

// After: Store in S3
const s3Key = await s3.upload(fileBuffer);
await prisma.upload.create({
  data: {
    s3Key, // Just a string
    s3Bucket: 'uploads',
  },
});
```

**Priority:** 🔴 Critical (for scale)  
**Effort:** 1 week  
**Risk:** Medium (requires data migration)

---

### 5. No Log Retention Policy

**Problem:** `activity_logs` and `api_logs` grow indefinitely

**Impact:**
- Database growth
- Query performance degradation
- Expensive storage

**Example Growth:**
- 100 users × 100 actions/day = 10,000 logs/day
- 10,000 × 365 days = 3.65M logs/year

**Recommendation:** Implement partitioning + archival
```sql
-- Partition by month
CREATE TABLE activity_logs_2025_01 PARTITION OF activity_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Archive old partitions
COPY activity_logs_2024_01 TO 's3://archives/activity_logs_2024_01.csv';
DROP TABLE activity_logs_2024_01;
```

**Priority:** 🔴 Critical (for scale)  
**Effort:** 3-4 days  
**Risk:** Medium

---

## High Priority Issues 🟠

### 6. Inconsistent Controller Patterns

**Problem:** Three different controller patterns in use

**Patterns Found:**
1. Class-based with singleton: `UserController`, `AuthController`
2. Object literal: `processController`, `actionController`
3. Flat named exports: `dbExplorerController`

**Recommendation:** Standardize on object literal pattern
```typescript
// Preferred pattern
export const userController = {
  async getMe(req, res) { },
  async updateProfile(req, res) { },
};
```

**Priority:** 🟠 High  
**Effort:** 2-3 days  
**Risk:** Low

---

### 7. Missing Input Validation

**Problem:** Not all endpoints use Zod validation

**Example:**
```typescript
// ❌ No validation
async createProcess(req, res) {
  const process = await processService.create(req.body); // Unsafe!
}

// ✅ With validation
const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

async createProcess(req, res) {
  const validated = schema.parse(req.body);
  const process = await processService.create(validated);
}
```

**Recommendation:** Add validation middleware to all routes

**Priority:** 🟠 High  
**Effort:** 1 week  
**Risk:** Low

---

### 8. Direct Prisma Calls in Controllers

**Problem:** Some controllers bypass service layer

**Example:**
```typescript
// ❌ Controller calling Prisma directly
async getPages(req, res) {
  const pages = await prisma.dynamicPage.findMany({ /* ... */ });
  res.json({ pages });
}

// ✅ Use service layer
async getPages(req, res) {
  const pages = await pageService.getPages(req.user.id);
  res.json({ pages });
}
```

**Impact:** Tight coupling, hard to test

**Recommendation:** Enforce service layer usage

**Priority:** 🟠 High  
**Effort:** 3-4 days  
**Risk:** Low

---

### 9. No Caching Strategy

**Problem:** Every request hits database

**Example Queries:**
- Menu items (fetched on every page load)
- User permissions (fetched on every request)
- System settings (rarely change)

**Recommendation:** Implement Redis caching
```typescript
// Cache menu items
async getMenu(userId: number) {
  const cacheKey = `menu:${userId}`;
  let menu = await redis.get(cacheKey);
  
  if (!menu) {
    menu = await prisma.menuItem.findMany({ /* ... */ });
    await redis.set(cacheKey, JSON.stringify(menu), 'EX', 3600);
  }
  
  return JSON.parse(menu);
}
```

**Priority:** 🟠 High  
**Effort:** 1 week  
**Risk:** Medium

---

### 10. No API Versioning

**Problem:** Routes have no version prefix

**Current:** `/api/users`, `/api/processes`  
**Should be:** `/api/v1/users`, `/api/v1/processes`

**Impact:** Breaking changes affect all clients

**Recommendation:**
```typescript
// Main router
router.use('/v1', v1Routes);
router.use('/v2', v2Routes); // Future

// Redirect root to latest
router.use('/', v1Routes);
```

**Priority:** 🟠 High  
**Effort:** 2 hours  
**Risk:** Low

---

## Medium Priority Issues 🟡

### 11. No Test Coverage

**Problem:** No visible test files

**Impact:**
- Regression risk
- Fear of refactoring
- Hard to onboard new developers

**Recommendation:** Add tests
```
backend/src/
├── __tests__/
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── user.service.test.ts
│   │   └── ...
│   ├── controllers/
│   └── utils/
└── ...
```

**Priority:** 🟡 Medium  
**Effort:** 2-4 weeks  
**Risk:** None

---

### 12. Inconsistent Error Handling

**Problem:** Mix of `console.error` and `logger.error`

**Recommendation:** Use logger everywhere
```typescript
// ❌ Don't use console
console.error('Error:', error);

// ✅ Use logger
logger.error('Operation failed:', { error, context });
```

**Priority:** 🟡 Medium  
**Effort:** 1 day  
**Risk:** None

---

### 13. No TypeScript Strict Mode

**Problem:** `strict: false` in `tsconfig.json`

**Impact:** Type safety compromised

**Recommendation:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Priority:** 🟡 Medium  
**Effort:** 2-3 days  
**Risk:** Medium (will expose many issues)

---

### 14. Large Page Components (500+ lines)

**Problem:** Some pages are too large

**Examples:**
- `DatabaseExplorer.tsx` - 800+ lines
- `ProcessDesigner.tsx` - 600+ lines
- `PageBuilder.tsx` - 500+ lines

**Recommendation:** Split into smaller components
```
DatabaseExplorer.tsx (800 lines)
  ↓
├── DatabaseExplorer.tsx (200 lines) - Main layout
├── SchemaTreePanel.tsx (150 lines)
├── QueryEditorPanel.tsx (150 lines)
├── ResultsPanel.tsx (150 lines)
└── DetailsPanel.tsx (150 lines)
```

**Priority:** 🟡 Medium  
**Effort:** 2-3 days  
**Risk:** Low

---

### 15. No Component Documentation

**Problem:** No Storybook or component docs

**Recommendation:** Add Storybook
```bash
npx storybook init
```

**Priority:** 🟡 Medium  
**Effort:** 1 week  
**Risk:** None

---

## Low Priority Issues 🟢

### 16. Mixed Naming Conventions

**Problem:** Some files use kebab-case, others PascalCase

**Examples:**
- `db-explorer/` (kebab-case)
- `ProcessDesigner.tsx` (PascalCase)

**Recommendation:** Standardize on PascalCase for components

**Priority:** 🟢 Low  
**Effort:** 1 hour  
**Risk:** None

---

### 17. No ESLint/Prettier

**Problem:** No code formatting enforcement

**Recommendation:** Add ESLint + Prettier
```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

**Priority:** 🟢 Low  
**Effort:** 2 hours  
**Risk:** None

---

### 18. No Git Hooks

**Problem:** No pre-commit checks

**Recommendation:** Add Husky + lint-staged
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "git add"],
    "*.tsx": ["eslint --fix", "git add"]
  }
}
```

**Priority:** 🟢 Low  
**Effort:** 1 hour  
**Risk:** None

---

## Anti-Patterns

### Pattern 1: Unused Imports

**Found in:** Multiple files

```typescript
// ❌ Unused
import { X } from 'lucide-react'; // Never used

// ✅ Cleaned
// (removed)
```

**Fix:** Run ESLint with `no-unused-vars` rule

---

### Pattern 2: Any Types

**Found in:** Throughout codebase

```typescript
// ❌ Too generic
const handleData = (data: any) => { };

// ✅ Specific type
interface DataType {
  id: number;
  name: string;
}
const handleData = (data: DataType) => { };
```

**Fix:** Enable `noImplicitAny` in TypeScript

---

### Pattern 3: Inline Styles

**Found in:** Some components

```typescript
// ❌ Inline styles
<div style={{ marginTop: '20px', padding: '10px' }}>

// ✅ Tailwind classes
<div className="mt-5 p-2.5">
```

**Fix:** Use Tailwind consistently

---

## Performance Concerns

### 1. N+1 Query Problem

**Location:** User list with roles

```typescript
// ❌ N+1 queries
const users = await prisma.user.findMany();
for (const user of users) {
  user.roles = await prisma.userRole.findMany({ where: { userId: user.id } });
}

// ✅ Use include
const users = await prisma.user.findMany({
  include: {
    userRoles: {
      include: { role: true }
    }
  }
});
```

---

### 2. Unindexed Queries

**Location:** Activity logs

```sql
-- ❌ Full table scan
SELECT * FROM activity_logs WHERE user_id = 123 ORDER BY created_at DESC;

-- ✅ Add index
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
```

---

### 3. Large JSON Fields

**Location:** Process execution context

**Problem:** Storing large JSON objects in `execution_context`

**Recommendation:** Store in separate table or S3

---

## Security Concerns

### 1. No Rate Limiting on Login

**Problem:** Brute force attacks possible

**Recommendation:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
});

router.post('/login', loginLimiter, authController.login);
```

---

### 2. SQL Injection Risk (Database Explorer)

**Problem:** User SQL queries executed directly

**Current Mitigation:** ✅ Using parameterized queries  
**Additional:** Add query whitelist/blacklist

---

### 3. No CSRF Protection

**Problem:** No CSRF tokens

**Recommendation:** Add `csurf` middleware

---

## Scalability Limitations

### 1. Single-threaded Node.js

**Problem:** CPU-intensive operations block

**Recommendation:** Use worker threads or microservices

---

### 2. In-memory Session Storage

**Problem:** Sessions stored in application memory

**Recommendation:** Use Redis for session storage

---

### 3. No Horizontal Scaling

**Problem:** Cannot run multiple instances

**Recommendation:** Implement stateless architecture

---

## Summary of Priorities

| Priority | Count | Estimated Effort |
|----------|-------|------------------|
| 🔴 Critical | 5 issues | 3-5 weeks |
| 🟠 High | 5 issues | 2-3 weeks |
| 🟡 Medium | 5 issues | 1-2 weeks |
| 🟢 Low | 3 issues | 1-2 days |

**Total:** 18 identified issues, 7-12 weeks to address all

---

**Document Status:** ✅ Complete  
**Next:** See `DEPENDENCY_GRAPH.md` for module relationships

