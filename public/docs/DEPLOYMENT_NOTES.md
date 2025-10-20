# Deployment Notes - V2

## Known Issues and Workarounds

### Issue 1: Menu Items Duplicating

**Problem**: The `init-database.sql` script's menu section doesn't have proper idempotency checks, causing menu items to duplicate on subsequent runs.

**Symptoms**:
- Menu items appear twice in the database
- Setup script reports "27 menu items" instead of "14"

**Workaround**:
Run the cleanup script after deployment:
```bash
export DATABASE_URL="your_database_url_here"
psql "$DATABASE_URL" -f backend/cleanup-duplicates.sql
```

**Permanent Fix (In Progress)**:
The menu section in `init-database.sql` needs to be replaced with proper `IF NOT EXISTS` checks. A fixed version exists in `init-database-fixed.sql` that can be used as reference.

### Issue 2: Users Not Created by SQL Script

**Problem**: The `init-database.sql` script's user creation section (using temporary bcrypt hashes) doesn't always create users successfully.

**Solution**: The `seedOnce.ts` script has been updated to use `upsert` instead of `update`, which creates users if they don't exist. This makes the deployment process more robust.

**Code Changes Made**:
```typescript
// backend/src/utils/seedOnce.ts
// Now uses prisma.user.upsert() instead of prisma.user.update()
const adminUser = await prisma.user.upsert({
  where: { email: 'admin@demo.com' },
  update: { passwordHash: adminPasswordHash },
  create: {
    email: 'admin@demo.com',
    passwordHash: adminPasswordHash,
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
  },
});
```

### Issue 3: Password Validation

**Problem**: The `seedOnce.ts` script's `isDatabaseSeeded()` function checked if password length > 10, but the temporary SQL hashes were 57 characters (invalid bcrypt), so it thought the database was seeded when it wasn't.

**Solution**: Updated validation to check for exactly 60 characters (valid bcrypt hash):
```typescript
// Valid bcrypt hash must be exactly 60 characters
const hasValidPassword = adminUser.passwordHash && adminUser.passwordHash.length === 60;
return Boolean(hasValidPassword);
```

## Fresh Deployment Checklist

1. **Drop and recreate database** (if testing locally):
   ```bash
   export DATABASE_URL="postgres://user:pass@host:5432/dbname"
   psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   ```

2. **Run setup script**:
   ```bash
   ./setup-new-deployment.sh
   ```

3. **Check for menu duplicates**:
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM menu_items;"
   # Should be 14, not 27
   ```

4. **If duplicates exist, clean up**:
   ```bash
   psql "$DATABASE_URL" -f backend/cleanup-duplicates.sql
   ```

5. **Verify user creation**:
   ```bash
   psql "$DATABASE_URL" -c "SELECT email, LENGTH(password_hash) as pwd_len FROM users;"
   # All should have pwd_len = 60
   ```

6. **Build and start**:
   ```bash
   npm run build
   npm start
   ```

7. **Test login**:
   - Navigate to http://localhost:5001
   - Login with: `admin@demo.com` / `Admin@123`

## Heroku Deployment

For Heroku deployments, the `heroku-postbuild` script in `package.json` handles:
1. Prisma generation
2. Database push
3. Initial data seeding
4. Building frontend and backend

**Important**: After first deployment, check for menu duplicates and run cleanup if needed:
```bash
heroku pg:psql -a your-app-name -f backend/cleanup-duplicates.sql
```

## Files Modified

- `backend/src/utils/seedOnce.ts` - Now uses upsert, creates users and profiles, validates properly
- `backend/cleanup-duplicates.sql` - Utility script to remove duplicate menu items
- `backend/diagnose-users.sql` - Utility script to check user/role status
- `fix-database.sh` - Quick fix script for local development

## Status

✅ **Working**: User creation via `seedOnce.ts` upsert  
✅ **Working**: Password validation  
✅ **Working**: Profile and role assignment  
⚠️  **Needs Fix**: Menu duplication in `init-database.sql`  
✅ **Workaround Available**: `cleanup-duplicates.sql` script

## Next Steps

1. Update `init-database.sql` menu section with proper `IF NOT EXISTS` checks
2. Test full fresh deployment flow
3. Update Heroku documentation with cleanup step
4. Consider moving all seeding logic to TypeScript for better error handling

---

*Last Updated: October 20, 2025*
*Document Analyzer V2 - Feature Branch*

