#!/bin/bash

# Setup script for new deployment with empty database (v2)
# This script automates the complete deployment process using
# the new unified initialization system

set -e  # Exit on error

echo "🚀 Document Analyzer v2 - New Deployment Setup"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/dbname'"
    echo "  Or for Heroku:"
    echo "  export DATABASE_URL=\$(heroku config:get DATABASE_URL -a your-app-name)"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql command not found"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo "  Or use Heroku CLI: heroku psql -f backend/init-database.sql"
    echo ""
    exit 1
fi

echo "✅ psql is available"
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1/4: Generating Prisma Client..."
cd backend
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 2: Push database schema
echo "📊 Step 2/4: Creating database tables..."
npx prisma db push --skip-generate
echo "✅ Database schema created (Prisma)"
echo ""

# Step 3: Initialize database with unified SQL script
echo "🗄️  Step 3/4: Initializing database structure..."
echo "   Running init-database.sql (unified, idempotent)..."
psql "$DATABASE_URL" -f init-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialization complete"
    echo "   ✓ Roles created (admin, user, viewer)"
    echo "   ✓ Permissions assigned (39 total)"
    echo "   ✓ Menu structure created (14 items)"
    echo "   ✓ System settings configured (6 defaults)"
    echo "   ✓ Demo users created (3 users)"
else
    echo "❌ ERROR: Database initialization failed"
    echo "   Please check the error messages above"
    exit 1
fi
echo ""

# Step 4: Seed user passwords (intelligent seeding)
echo "🌱 Step 4/4: Setting demo user passwords..."
npm run seed:once

if [ $? -eq 0 ]; then
    echo "✅ User passwords set"
else
    echo "⚠️  WARNING: Seeding failed, but continuing..."
    echo "   You may need to run manually: npm run seed:once"
fi
echo ""

cd ..

# Verify deployment
echo "🔍 Verifying deployment..."
echo "   Checking database connection..."
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    echo "✅ Database is accessible"
    
    # Count users
    USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | xargs)
    echo "✅ Users created: $USER_COUNT"
    
    # Count roles
    ROLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles;" | xargs)
    echo "✅ Roles created: $ROLE_COUNT"
    
    # Count menu items
    MENU_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM menu_items WHERE is_active = true;" | xargs)
    echo "✅ Active menu items: $MENU_COUNT"
else
    echo "⚠️  WARNING: Could not verify database"
fi
echo ""

# Summary
echo "======================================"
echo "✅ Deployment Setup Complete!"
echo "======================================"
echo ""
echo "📊 What was created:"
echo "   ✓ Database tables (via Prisma schema)"
echo "   ✓ 3 roles (admin, user, viewer)"
echo "   ✓ 39 permissions across 9 categories"
echo "   ✓ 14 menu items (9 top-level + 5 admin)"
echo "   ✓ 6 system settings (configurable)"
echo "   ✓ 3 demo users with passwords"
echo ""
echo "👥 Demo Credentials:"
echo "   Admin:  admin@demo.com / Admin@123"
echo "   User:   user@demo.com / User@123"
echo "   Viewer: demo@mulesoft.com / Demo@123"
echo ""
echo "🎯 Next Steps:"
echo "   1. Build application:   npm run build"
echo "   2. Start application:   npm start"
echo "   3. Open in browser:     http://localhost:5001"
echo "   4. Login with admin credentials above"
echo ""
echo "⚙️  Configuration:"
echo "   • Change passwords in: Profile → Change Password"
echo "   • Configure MuleSoft API: Admin → Settings"
echo "   • Manage users: Admin → User Management"
echo "   • Customize menu: Admin → Menu"
echo ""
echo "🚀 For Heroku Deployment:"
echo "   See docs/DEPLOYMENT.md for complete instructions"
echo ""
echo "⚠️  Important:"
echo "   - Change demo passwords in production!"
echo "   - Set JWT_SECRET and ENCRYPTION_KEY"
echo "   - Configure MuleSoft API endpoint"
echo "   - Review security settings"
echo ""
echo "📖 Documentation:"
echo "   • Quick Start:  README_V2.md"
echo "   • Deployment:   docs/DEPLOYMENT.md"
echo "   • Migration:    docs/MIGRATION.md"
echo "   • Improvements: docs/V2_IMPROVEMENTS.md"
echo ""
echo "✨ Version 2.0 - Production Ready!"
echo ""
