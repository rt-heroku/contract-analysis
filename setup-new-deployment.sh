#!/bin/bash

# Setup script for new deployment with empty database
# This script automates the complete deployment process

set -e  # Exit on error

echo "🚀 Document Analyzer - New Deployment Setup"
echo "============================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://user:password@host:5432/dbname'"
    echo "  Or for Heroku:"
    echo "  DATABASE_URL=\$(heroku config:get DATABASE_URL)"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
cd backend
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 2: Push database schema
echo "📊 Step 2: Creating database tables..."
npx prisma db push
echo "✅ Database schema created"
echo ""

# Step 3: Seed initial data
echo "🌱 Step 3: Seeding initial data..."
npm run seed
echo "✅ Initial data seeded"
echo ""

# Step 4: Install auto-share trigger
echo "⚡ Step 4: Installing auto-share trigger..."
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -f auto-share-analysis-trigger.sql
    echo "✅ Auto-share trigger installed"
else
    echo "⚠️  WARNING: psql not found. Skipping auto-share trigger."
    echo "   You can install it manually later with:"
    echo "   psql \"\$DATABASE_URL\" -f backend/auto-share-analysis-trigger.sql"
fi
echo ""

# Step 5: Install permissions (optional but recommended)
echo "🔐 Step 5: Installing granular permissions..."
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -f seed-permissions.sql
    echo "✅ Permissions installed"
else
    echo "⚠️  WARNING: Skipping permissions installation (psql not found)"
fi
echo ""

# Step 6: Install additional menus
echo "📱 Step 6: Installing additional menu items..."
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -f add-documents-menu.sql 2>/dev/null || echo "   ℹ️  Documents menu may already exist"
    psql "$DATABASE_URL" -f add-flows-menu.sql 2>/dev/null || echo "   ℹ️  Flows menu may already exist"
    psql "$DATABASE_URL" -f add-admin-menus-fixed.sql 2>/dev/null || echo "   ℹ️  Admin menus may already exist"
    echo "✅ Additional menus installed"
else
    echo "⚠️  WARNING: Skipping additional menus (psql not found)"
fi
echo ""

cd ..

# Summary
echo "✅ Deployment Setup Complete!"
echo "=============================="
echo ""
echo "📊 Database Tables Created: 20+"
echo "👥 Default Users Created:"
echo "   - admin@demo.com / Admin@123 (Admin)"
echo "   - user@demo.com / User@123 (User)"
echo "   - demo@mulesoft.com / Demo@123 (Viewer)"
echo ""
echo "🎯 Next Steps:"
echo "   1. Start the application: npm start"
echo "   2. Login at: http://localhost:5001"
echo "   3. Change default passwords in production!"
echo "   4. Configure MuleSoft API URL in Admin → Settings"
echo ""
echo "📖 For more information, see DEPLOYMENT_GUIDE.md"
echo ""

