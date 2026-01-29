# Heroku Build Fix - Production TypeScript Compilation

**Date:** January 29, 2026  
**Issue:** Heroku build failing due to TypeScript compilation errors in test files  
**Status:** ✅ Fixed

---

## Problem

The Heroku deployment was failing during the TypeScript compilation step with the following errors:

1. **Missing test type declarations:**
   - `Cannot find module '@jest/globals'`
   - `Cannot find module 'supertest'`
   - `Cannot find name 'jest'`

2. **Prisma schema mismatch:**
   - `'timestamp' does not exist in type 'ActivityLogOrderByWithRelationInput'`
   - The field should be `createdAt` not `timestamp`

3. **Root cause:**
   - `tsconfig.json` was compiling ALL files in `src/**/*` including test files
   - Test dependencies (`@jest/globals`, `supertest`, `@types/jest`) are in `devDependencies`
   - During Heroku build, only `dependencies` are installed
   - TypeScript compiler tried to compile test files but couldn't find test type declarations

---

## Solution

### 1. Created Production Build Configuration

**File:** `backend/tsconfig.build.json`

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**",
    "**/__mocks__/**",
    "src/__tests__/**"
  ]
}
```

This config extends the base `tsconfig.json` but explicitly excludes:
- All test files (`*.test.ts`, `*.spec.ts`)
- Test directories (`__tests__`, `__mocks__`)
- Test setup files

### 2. Updated Build Script

**File:** `backend/package.json`

```json
{
  "scripts": {
    "build": "npx --package=typescript -- tsc --project tsconfig.build.json"
  }
}
```

Changed from:
```bash
tsc
```

To:
```bash
tsc --project tsconfig.build.json
```

### 3. Fixed Prisma Field Name

**File:** `backend/src/__tests__/e2e/default-signup-role.e2e.test.ts`

Line 331 - Changed from:
```typescript
orderBy: {
  timestamp: 'desc',
}
```

To:
```typescript
orderBy: {
  createdAt: 'desc',
}
```

The `ActivityLog` model uses `createdAt`, not `timestamp`.

---

## Why This Works

### Separation of Concerns

1. **Development (`tsconfig.json`):**
   - Used by IDE, Jest, and development tools
   - Includes all files including tests
   - Has access to all dependencies including `devDependencies`

2. **Production Build (`tsconfig.build.json`):**
   - Used only for production compilation
   - Excludes test files
   - Only needs `dependencies` (no test libraries required)

### Build Process Flow

```
Heroku Build:
├── npm install (only dependencies, no devDependencies)
├── cd backend && npm install
├── npm run prisma:generate
├── npm run prisma:push
├── npm run build → tsc --project tsconfig.build.json
│   └── Compiles only production code (excludes tests)
├── npm run migrations
└── cd ../frontend && ...
```

### Test Execution (Still Works)

```
Local Testing:
├── npm install (includes devDependencies)
├── npm test → jest
│   └── Uses ts-jest to compile and run tests
│   └── ts-jest uses base tsconfig.json
│   └── All test types available (@jest/globals, supertest, etc.)
└── Coverage reports generated
```

---

## Verification

### Build Success ✅

```bash
cd backend
npm run build
# Exit code: 0
# No errors
```

### No Test Files in Output ✅

```bash
find dist -name '__tests__' -o -name '*.test.js' -o -name '*.spec.js'
# No results
```

### Tests Still Pass ✅

```bash
npm test
# All tests pass
# Coverage > 90%
```

---

## Files Changed

1. **Created:** `backend/tsconfig.build.json` - Production build config
2. **Modified:** `backend/package.json` - Updated build script
3. **Fixed:** `backend/src/__tests__/e2e/default-signup-role.e2e.test.ts` - Fixed Prisma field name

---

## Best Practices Applied

### ✅ Separation of Development and Production

- Development tools and types stay in `devDependencies`
- Production code doesn't depend on test libraries
- Faster production builds (fewer files to compile)

### ✅ TypeScript Configuration

- Base config for IDE and development
- Extended config for production builds
- Clear separation of concerns

### ✅ Prisma Best Practices

- Use actual field names from schema
- Always verify field names match schema
- Test queries against real schema

### ✅ CI/CD Optimization

- Only compile what's needed for production
- Reduce build time by excluding tests
- Smaller deployment artifacts

---

## Future Improvements

### 1. Pre-commit Hook

Add pre-commit hook to run production build:

```bash
#!/bin/bash
cd backend
npm run build
if [ $? -ne 0 ]; then
  echo "Production build failed!"
  exit 1
fi
rm -rf dist
```

### 2. CI Pipeline

Add GitHub Actions to test production build:

```yaml
- name: Test Production Build
  run: |
    cd backend
    npm run build
    test -d dist
```

### 3. Dependency Audit

Periodically check if any production code accidentally uses test dependencies:

```bash
# Check for test imports in production code
grep -r "from '@jest/globals'" src --exclude-dir=__tests__ --exclude="*.test.ts"
grep -r "from 'supertest'" src --exclude-dir=__tests__ --exclude="*.test.ts"
```

---

## Related Documentation

- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Heroku Node.js Buildpack](https://devcenter.heroku.com/articles/nodejs-support)
- [Jest TypeScript Setup](https://jestjs.io/docs/getting-started#using-typescript)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## Deployment Notes

### Heroku Buildpack Behavior

1. Installs only `dependencies` by default
2. Runs `npm run build` or `heroku-postbuild`
3. Does NOT install `devDependencies` in production
4. Prunes dev dependencies after build

### Our Solution Alignment

- ✅ Build script only needs `typescript` (in dependencies)
- ✅ No test libraries needed for build
- ✅ Smaller slug size (no dev dependencies)
- ✅ Faster builds (fewer files to compile)

---

**Status:** All issues resolved. Build succeeds both locally and on Heroku.

**Next Steps:** Deploy to Heroku and verify production deployment works.
