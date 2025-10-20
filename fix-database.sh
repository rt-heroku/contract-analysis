#!/bin/bash

# Quick fix script for database issues

echo "🔧 Database Fix Script"
echo "======================"
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "Please set it first:"
    echo "  export DATABASE_URL='your-database-url'"
    exit 1
fi

echo "1️⃣  Cleaning up duplicate menu items..."
psql "$DATABASE_URL" -f backend/cleanup-duplicates.sql

echo ""
echo "2️⃣  Diagnosing user creation..."
psql "$DATABASE_URL" -f backend/diagnose-users.sql

echo ""
echo "✅ Diagnosis complete!"
echo ""
echo "If users are missing, manually create them:"
echo "  psql \$DATABASE_URL -c \"INSERT INTO users (email, password_hash, first_name, last_name, is_active, created_at, updated_at) VALUES ('admin@demo.com', '\\\$2b\\\$10\\\$AAAAAAAAAAAAAAAAAAAAAO4pZx8mz5K5K5K5K5K5K5K5K5K5K5', 'Admin', 'User', true, NOW(), NOW());\""
echo ""
