# User Management CLI

## Overview

The User Management CLI provides command-line tools for managing users, resetting passwords, and handling administrative tasks without requiring access to the web interface.

## Features

- ✅ **CREATE** users with automatic role assignment
- ✅ **DELETE** users with safety checks
- ✅ **RESET** passwords with optional temporary password mode
- ✅ **First User** automatically becomes an admin
- ✅ **Safety Checks** - Cannot delete the last admin user
- ✅ **Heroku Compatible** - Works both locally and on Heroku

## Installation

The CLI script is included in the project and requires no additional installation.

## Usage

### Local Development

```bash
cd webapp/backend
npm run users -- <ACTION> <EMAIL> [PASSWORD]
```

### Heroku Deployment

```bash
# Using the shell wrapper
heroku run bash users.sh <ACTION> <EMAIL> [PASSWORD] --app your-app-name

# Or directly
heroku run npm run users -- <ACTION> <EMAIL> [PASSWORD] --app your-app-name
```

## Commands

### CREATE - Create a New User

Creates a new user with the specified email and optional password.

**Syntax:**
```bash
npm run users -- CREATE email@example.com [password]
```

**Examples:**
```bash
# Create user with password
npm run users -- CREATE admin@demo.com MySecurePassword123

# Create user without password (will be prompted to set password on first login)
npm run users -- CREATE user@demo.com

# On Heroku
heroku run bash users.sh CREATE admin@demo.com SecurePass123 --app contract-dev
```

**Behavior:**
- If this is the **first user**, they automatically receive the **admin** role
- Subsequent users receive the default **user** role
- If no password is provided, user must set password on next login
- Email must be unique
- Email validation is performed

**Output:**
```
✅ User created successfully: admin@demo.com (ID: 1)
👑 First user - Admin role assigned
```

### DELETE - Delete a User

Deletes an existing user from the system.

**Syntax:**
```bash
npm run users -- DELETE email@example.com
```

**Examples:**
```bash
# Delete a user
npm run users -- DELETE user@demo.com

# On Heroku
heroku run bash users.sh DELETE user@demo.com --app contract-dev
```

**Safety Checks:**
- ❌ Cannot delete the last admin user
- ⚠️  All user data and related records are permanently deleted (cascade delete)

**Output:**
```
✅ User deleted successfully: user@demo.com
```

### RESET - Reset User Password

Resets a user's password. Can provide a new password or leave empty for temporary password mode.

**Syntax:**
```bash
npm run users -- RESET email@example.com [newPassword]
```

**Examples:**
```bash
# Reset with new password
npm run users -- RESET admin@demo.com NewPassword123

# Reset without password (user will be prompted on next login)
npm run users -- RESET admin@demo.com

# On Heroku
heroku run bash users.sh RESET admin@demo.com NewPass456 --app contract-dev
```

**Output:**
```
✅ Password reset successfully for: admin@demo.com
⚠️  No password provided - user will be prompted to set password on next login
```

## Use Cases

### Scenario 1: Lost Admin Password

If you've lost access to an admin account:

```bash
# Reset admin password on Heroku
heroku run bash users.sh RESET admin@yourcompany.com NewSecurePassword --app contract-dev
```

### Scenario 2: First Time Deployment

When deploying to a new environment where encryption keys may not be set:

```bash
# Create first admin user
heroku run bash users.sh CREATE admin@yourcompany.com TempPassword123 --app contract-dev

# Then login and change password through the web interface
```

### Scenario 3: Bulk User Creation

Create multiple users programmatically:

```bash
# Create users from a list
for email in user1@example.com user2@example.com user3@example.com; do
  npm run users -- CREATE $email
done
```

### Scenario 4: Emergency Admin Access

If all admins are locked out:

```bash
# Create a new admin by deleting and recreating the first user
heroku run bash users.sh CREATE emergency@admin.com EmergencyPass --app contract-dev
```

## Error Messages

### Common Errors

```
❌ Error: User with email user@demo.com already exists
```
**Solution:** Use a different email or delete the existing user first.

```
❌ Error: Invalid email format: notanemail
```
**Solution:** Provide a valid email address.

```
❌ Error: Cannot delete the last admin user
```
**Solution:** Create another admin user before deleting this one.

```
❌ Error: User with email user@demo.com not found
```
**Solution:** Check the email spelling or create the user first.

```
❌ Error: Invalid action: REMOVE
```
**Solution:** Use CREATE, DELETE, or RESET (case-insensitive).

## Why This Exists

### The Problem

During initial deployment or database seeding, there's a timing issue where:
1. Database is seeded with users
2. But `ENCRYPTION_KEY` and `JWT_SECRET` might not be set yet
3. This causes password hashes to be created with one key
4. But authentication attempts use a different key
5. Result: **Passwords never match** even when correct

### The Solution

The CLI provides a reliable way to:
- ✅ Create users after all environment variables are properly configured
- ✅ Reset passwords if encryption keys change
- ✅ Access the system even when web interface is inaccessible
- ✅ Automate user management in deployment scripts

## Security Considerations

### Password Storage
- Passwords are hashed using bcrypt with 10 salt rounds
- Never store passwords in plain text
- Use strong passwords (minimum 8 characters recommended)

### Temporary Passwords
- When no password is provided, a special flag is set
- User must set their own password on next login
- More secure than sharing generated passwords

### Script Access
- The CLI script requires database access
- Should only be run by system administrators
- On Heroku, requires appropriate app permissions

## Technical Details

### Database Operations
- Uses Prisma ORM for all database operations
- Transactions ensure data consistency
- Cascade deletes handle related records

### Role Assignment
```typescript
// First user detection
const userCount = await prisma.user.count();
const isFirstUser = userCount === 0;

if (isFirstUser) {
  // Assign admin role
} else {
  // Assign default user role
}
```

### Password Hashing
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
```

## Troubleshooting

### Script Won't Execute

**Problem:** Permission denied
```bash
./users.sh: Permission denied
```

**Solution:** Make the script executable
```bash
chmod +x backend/users.sh
```

### Database Connection Error

**Problem:** Can't connect to database
```
❌ Error: Can't reach database server
```

**Solution:** Check DATABASE_URL environment variable
```bash
# Verify database connection
echo $DATABASE_URL

# On Heroku
heroku config:get DATABASE_URL --app contract-dev
```

### Heroku Timeout

**Problem:** Command times out on Heroku
```
Timeout awaiting process
```

**Solution:** Increase timeout or run in one-off dyno
```bash
heroku run:detached bash users.sh CREATE admin@demo.com password --app contract-dev
```

## Integration with First-Time Setup

This CLI works in conjunction with the **First-Time Setup** UI:

1. **Web UI (Preferred):** If no admin exists, users are automatically redirected to `/first-time-setup`
2. **CLI (Backup):** Use this CLI if:
   - Web interface is not accessible
   - Automating deployment
   - Need to fix encryption key issues
   - Emergency admin access required

## Example Deployment Script

```bash
#!/bin/bash
# deploy.sh - Automated deployment with user setup

echo "Deploying to Heroku..."
git push heroku feature/actions:main

echo "Running database migrations..."
heroku run npm run prisma:migrate --app contract-dev

echo "Creating first admin user..."
heroku run bash users.sh CREATE admin@yourcompany.com AdminPassword123 --app contract-dev

echo "Deployment complete!"
echo "Login at: https://contract-dev.herokuapp.com/login"
echo "Email: admin@yourcompany.com"
echo "Password: AdminPassword123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password immediately after first login!"
```

## Best Practices

1. **Always Create Strong Passwords**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Avoid dictionary words

2. **Use Temporary Password Mode for Shared Accounts**
   ```bash
   npm run users -- CREATE shared@company.com
   # User will set their own password on first login
   ```

3. **Keep Admin Count Low**
   - Only create admin accounts when necessary
   - Regular users can be upgraded to admin through the web interface

4. **Document Admin Accounts**
   - Keep a secure record of admin email addresses
   - Never commit passwords to version control

5. **Test in Staging First**
   ```bash
   # Test on staging
   heroku run bash users.sh CREATE test@admin.com TestPass --app contract-staging
   
   # Then production
   heroku run bash users.sh CREATE admin@company.com SecurePass --app contract-production
   ```

## See Also

- [Dynamic Secrets Configuration](./DYNAMIC_SECRETS.md)
- [First-Time Setup Guide](./FIRST_TIME_SETUP.md)
- [Authentication & Authorization](./AUTH_SYSTEM.md)
- [Deployment Guide](./DEPLOYMENT.md)

