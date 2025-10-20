# Migration from Multiple SQL Files to Unified Initialization

## Overview

All individual SQL migration files have been consolidated into a single, idempotent initialization script: `backend/init-database.sql`.

## What Changed

### Before (v1)
- Multiple SQL files scattered across the project
- Had to run files in specific order
- Risk of missing a file during deployment
- No way to know if database was already initialized
- Seeding ran on every deployment

### After (v2)
- ✅ Single `init-database.sql` file
- ✅ Idempotent (safe to run multiple times)
- ✅ Clear structure with labeled sections
- ✅ Intelligent seeding (only runs once)
- ✅ Automatic password generation via `seedOnce.ts`

## Old Files (Removed)

The following SQL files have been consolidated into `init-database.sql`:

| Old File | Purpose | Status |
|----------|---------|--------|
| `seed-permissions.sql` | Create permissions | ✅ Merged |
| `add-viewer-role-and-sharing.sql` | Add viewer role | ✅ Merged |
| `add-idp-executions-menu.sql` | IDP Executions menu | ✅ Merged |
| `add-documents-menu.sql` | Documents menu | ✅ Merged |
| `add-flows-menu.sql` | Flows menu | ✅ Merged |
| `add-admin-menus.sql` | Admin submenu items | ✅ Merged |
| `add-admin-menus-fixed.sql` | Admin menu fixes | ✅ Merged |
| `activate-admin-panel.sql` | Enable Admin Panel | ✅ Merged |
| `move-settings-to-admin.sql` | Settings under Admin | ✅ Merged |
| `fix-menu-structure.sql` | Menu ordering fixes | ✅ Merged |
| `add-show-demo-credentials-setting.sql` | Demo credentials flag | ✅ Merged |
| `auto-share-analysis-trigger.sql` | Auto-share trigger | ⚠️ Commented out (optional) |
| `check-user-admin.sql` | Admin check query | ⚠️ Kept as utility |

## Migration Steps

### For Existing Deployments

If you have an existing deployment with data you want to keep:

**Option A: Keep Existing Data (Recommended)**
```bash
# No action needed!
# On next deployment, seedOnce.ts will detect existing users and skip
```

**Option B: Fresh Start (Clean Slate)**
```bash
# Reset database
heroku pg:reset DATABASE_URL --confirm your-app-name

# Re-initialize
heroku psql -f backend/init-database.sql

# Application will auto-seed passwords on next deployment
git push heroku main
```

### For New Deployments

```bash
# 1. Create app and database
heroku create your-app-name
heroku addons:create heroku-postgresql:mini

# 2. Set environment variables
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set ENCRYPTION_KEY=$(openssl rand -hex 32)

# 3. Deploy
git push heroku main

# 4. Initialize database
heroku psql -f backend/init-database.sql

# Done! Passwords are automatically set by heroku-postbuild
```

## New Deployment Flow

### 1. Heroku Build (`heroku-postbuild`)
```bash
npm install
cd backend
  npm install
  npm run prisma:generate    # Generate Prisma client
  npm run prisma:push        # Push schema to database
  npm run build             # Compile TypeScript
cd ../frontend
  npm install
  npm run build             # Build React app
cd ../backend
  npm run postdeploy        # Run seedOnce.ts
```

### 2. Database Initialization (Manual, First Time Only)
```bash
heroku psql -f backend/init-database.sql
```

Creates:
- Roles (admin, user, viewer)
- Permissions (39 permissions)
- Role-Permission assignments
- Menu structure (14 items)
- System settings (6 settings)
- Demo users (3 users with placeholder passwords)

### 3. Seed User Passwords (`seedOnce.ts`)
```bash
# Automatically called by heroku-postbuild
npm run postdeploy
```

Checks if database is seeded:
- ✅ If NOT seeded → Set real passwords for demo users
- ✅ If ALREADY seeded → Skip (preserves your custom data)

## Seeding Logic

### First Deployment
```typescript
// seedOnce.ts checks:
const adminUser = await prisma.user.findUnique({
  where: { email: 'admin@demo.com' },
});

if (!adminUser || !adminUser.passwordHash) {
  // NOT SEEDED - Set passwords
  await setUserPasswords();
  console.log('✓ Database seeded');
} else {
  // ALREADY SEEDED - Skip
  console.log('✓ Database already seeded - skipping');
}
```

### Subsequent Deployments
```bash
# heroku-postbuild runs seedOnce.ts
# Output:
✓ Database already seeded - skipping user password generation
  (This is expected for subsequent deployments)
```

## Benefits

### Developer Experience
- ✅ **Simpler:** One file instead of 13
- ✅ **Faster:** No need to run multiple scripts
- ✅ **Safer:** Idempotent operations (ON CONFLICT DO NOTHING)
- ✅ **Clearer:** Organized sections with comments

### Production Deployment
- ✅ **Reliable:** No risk of missing a migration
- ✅ **Repeatable:** Same result every time
- ✅ **Incremental:** Only seeds once, preserves data
- ✅ **Automatic:** Passwords set via heroku-postbuild

### Maintenance
- ✅ **Documented:** Clear sections and comments
- ✅ **Auditable:** Single source of truth
- ✅ **Verifiable:** Summary report at the end
- ✅ **Extensible:** Easy to add new sections

## Database Schema

### Roles
- `admin` → 39 permissions (full access)
- `user` → 17 permissions (standard features)
- `viewer` → 7 permissions (read-only + profile edit)

### Permissions (39 total)
- **Profile:** view, edit, change_password, request_permissions
- **Documents:** upload, download, delete, process, analyze
- **Analysis:** view, create, delete, share, rerun
- **Prompts:** view, create, edit, delete, set_default
- **Flows:** view, create, edit, delete
- **IDP:** view, create, edit, delete, share
- **Admin - Users:** view, create, edit, delete
- **Admin - Roles:** view, create, edit, delete
- **Admin - Menu:** view, create, edit, delete, assign
- **Admin - System:** logs.view, settings.view, settings.edit

### Menu Structure (14 items)
```
Dashboard
Processing
Documents
Prompts
Flows
IDP Executions
History
Profile
Admin Panel
  ├─ Logs
  ├─ User Management
  ├─ Roles
  ├─ Menu
  └─ Settings
```

### System Settings (6)
- `app_name` → Application title
- `app_logo_url` → Logo path
- `powered_by_text` → Footer text
- `mulesoft_api_base_url` → MuleSoft endpoint
- `mulesoft_api_timeout` → API timeout (ms)
- `show_demo_credentials` → Show demo logins flag

### Demo Users (3)
| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@demo.com | Admin@123 | admin | Full access |
| user@demo.com | User@123 | user | Standard features |
| demo@mulesoft.com | Demo@123 | viewer | Read-only |

## Rollback Plan

If you need to revert to the old system:

```bash
# Checkout previous branch
git checkout main

# Reset database
heroku pg:reset DATABASE_URL --confirm your-app-name

# Run old migration files (in order)
heroku psql -f backend/seed-permissions.sql
heroku psql -f backend/add-viewer-role-and-sharing.sql
# ... etc

# Deploy old version
git push heroku main
```

## Testing

### Verify Initialization
```bash
# Run locally
psql $DATABASE_URL -f backend/init-database.sql

# Check output for:
✓ Admin role created
✓ User role created
✓ Viewer role created
✓ Admin permissions assigned
✓ User permissions assigned
✓ Viewer permissions assigned
✓ Menu structure created
✓ System settings created
✓ Admin user created
✓ Regular user created
✓ Viewer user created
```

### Verify Seeding
```bash
# Run seed script
cd backend && npm run seed:once

# First run:
✅ Database seeding completed successfully!
   Demo Credentials:
   - Admin:  admin@demo.com / Admin@123
   - User:   user@demo.com / User@123
   - Viewer: demo@mulesoft.com / Demo@123

# Second run:
✓ Database already seeded - skipping user password generation
  (This is expected for subsequent deployments)
```

### Verify Login
1. Open app: `heroku open`
2. Try logging in with each demo user
3. Verify role-based access

## FAQ

**Q: Do I need to run `init-database.sql` on every deployment?**  
A: No! Only on first deployment or after a database reset.

**Q: Will my custom users/data be deleted?**  
A: No! The script uses `ON CONFLICT DO NOTHING` and `seedOnce.ts` checks for existing data.

**Q: What happens if I run `init-database.sql` multiple times?**  
A: Nothing! It's idempotent - safe to run multiple times.

**Q: Can I customize the demo users?**  
A: Yes! Edit `init-database.sql` or create users via the Admin panel.

**Q: How do I change demo user passwords?**  
A: Login as admin, go to Admin > User Management, select user, change password.

**Q: Can I disable demo credentials on the login page?**  
A: Yes! Set `SHOW_DEMO_CREDENTIALS=false` or change it in Admin > Settings.

**Q: What if I want to add a new menu item?**  
A: Edit `init-database.sql` and run it again (it won't duplicate existing items).

---

**Migration completed in v2 branch** 🎉

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

