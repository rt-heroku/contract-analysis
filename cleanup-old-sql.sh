#!/bin/bash

# cleanup-old-sql.sh
# Archives old SQL migration files that have been consolidated into init-database.sql

set -e

echo "============================================"
echo "Archiving Old SQL Migration Files"
echo "============================================"
echo ""

# Create archive directory
ARCHIVE_DIR="backend/sql-archive"
mkdir -p "$ARCHIVE_DIR"

# List of files to archive
OLD_SQL_FILES=(
  "backend/seed-permissions.sql"
  "backend/add-viewer-role-and-sharing.sql"
  "backend/add-idp-executions-menu.sql"
  "backend/add-admin-menus-fixed.sql"
  "backend/add-admin-menus.sql"
  "backend/activate-admin-panel.sql"
  "backend/move-settings-to-admin.sql"
  "backend/add-show-demo-credentials-setting.sql"
  "backend/add-documents-menu.sql"
  "backend/fix-menu-structure.sql"
  "backend/add-flows-menu.sql"
  "backend/auto-share-analysis-trigger.sql"
)

# Archive each file
for file in "${OLD_SQL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📦 Archiving: $file"
    mv "$file" "$ARCHIVE_DIR/"
  else
    echo "⚠️  Not found: $file (already archived?)"
  fi
done

echo ""
echo "✅ Old SQL files archived to: $ARCHIVE_DIR"
echo ""
echo "Note: check-user-admin.sql kept as utility script"
echo ""
echo "============================================"
echo "Archive Complete!"
echo "============================================"

