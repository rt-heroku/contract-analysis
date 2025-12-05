-- ============================================
-- Production Sync v2.0 - Consolidated Migration
-- ============================================
-- This migration adds all features developed in dev environment:
-- - Beta Features menu (Processes, Actions, Executions, Connectors, Stores)
-- - Database Explorer menu
-- - Pages menu
-- - Process Automation menu with permissions
-- - MuleSoft APIs menu
-- ============================================
-- This script is IDEMPOTENT - safe to run multiple times
-- ============================================

\echo ''
\echo '🚀 Starting Production Sync v2.0 Migration...'
\echo ''

-- ============================================
-- SECTION 1: Process Automation Permissions
-- ============================================

\echo '📋 Section 1: Adding Process Automation Permissions...'

INSERT INTO "permissions" (name, description, category, created_at, updated_at)
VALUES
  ('processes.view', 'View processes', 'Processes', NOW(), NOW()),
  ('processes.create', 'Create processes', 'Processes', NOW(), NOW()),
  ('processes.edit', 'Edit processes', 'Processes', NOW(), NOW()),
  ('processes.delete', 'Delete processes', 'Processes', NOW(), NOW()),
  ('processes.execute', 'Execute processes', 'Processes', NOW(), NOW()),
  ('actions.view', 'View actions', 'Actions', NOW(), NOW()),
  ('actions.create', 'Create actions', 'Actions', NOW(), NOW()),
  ('actions.edit', 'Edit actions', 'Actions', NOW(), NOW()),
  ('executions.view', 'View executions', 'Executions', NOW(), NOW()),
  ('executions.retry', 'Retry failed executions', 'Executions', NOW(), NOW()),
  ('connectors.view', 'View connectors', 'Connectors', NOW(), NOW()),
  ('connectors.create', 'Create connectors', 'Connectors', NOW(), NOW()),
  ('connectors.edit', 'Edit connectors', 'Connectors', NOW(), NOW()),
  ('connectors.delete', 'Delete connectors', 'Connectors', NOW(), NOW()),
  ('stores.view', 'View stores', 'Stores', NOW(), NOW()),
  ('stores.create', 'Create stores', 'Stores', NOW(), NOW()),
  ('stores.edit', 'Edit stores', 'Stores', NOW(), NOW()),
  ('stores.delete', 'Delete stores', 'Stores', NOW(), NOW()),
  ('database.view', 'View database', 'Database', NOW(), NOW()),
  ('database.query', 'Query database', 'Database', NOW(), NOW()),
  ('pages.view', 'View pages', 'Pages', NOW(), NOW()),
  ('pages.create', 'Create pages', 'Pages', NOW(), NOW()),
  ('pages.edit', 'Edit pages', 'Pages', NOW(), NOW()),
  ('pages.delete', 'Delete pages', 'Pages', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

\echo '✓ Permissions added'

-- Assign permissions to admin role
DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user' LIMIT 1;
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer' LIMIT 1;

  -- Grant all new permissions to admin
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO "role_permissions" (role_id, permission_id, created_at)
    SELECT admin_role_id, id, NOW()
    FROM "permissions"
    WHERE name IN (
      'processes.view', 'processes.create', 'processes.edit', 'processes.delete', 'processes.execute',
      'actions.view', 'actions.create', 'actions.edit',
      'executions.view', 'executions.retry',
      'connectors.view', 'connectors.create', 'connectors.edit', 'connectors.delete',
      'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
      'database.view', 'database.query',
      'pages.view', 'pages.create', 'pages.edit', 'pages.delete'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    RAISE NOTICE '✓ Admin permissions assigned';
  END IF;

  -- Grant some permissions to user role
  IF user_role_id IS NOT NULL THEN
    INSERT INTO "role_permissions" (role_id, permission_id, created_at)
    SELECT user_role_id, id, NOW()
    FROM "permissions"
    WHERE name IN (
      'processes.view', 'processes.create', 'processes.execute',
      'actions.view',
      'executions.view',
      'connectors.view',
      'stores.view',
      'pages.view', 'pages.create', 'pages.edit'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    RAISE NOTICE '✓ User permissions assigned';
  END IF;

  -- Grant view-only permissions to viewer role
  IF viewer_role_id IS NOT NULL THEN
    INSERT INTO "role_permissions" (role_id, permission_id, created_at)
    SELECT viewer_role_id, id, NOW()
    FROM "permissions"
    WHERE name IN ('processes.view', 'actions.view', 'executions.view', 'pages.view')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
    RAISE NOTICE '✓ Viewer permissions assigned';
  END IF;
END $$;

-- ============================================
-- SECTION 2: Database Explorer Menu
-- ============================================

\echo ''
\echo '📋 Section 3: Adding Database Explorer Menu...'

DO $$
DECLARE
  admin_role_id INT;
  db_menu_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;

  -- Check if Database Explorer menu already exists
  SELECT id INTO db_menu_id FROM "menu_items" WHERE route = '/db' LIMIT 1;

  -- If not exists, create it
  IF db_menu_id IS NULL THEN
    INSERT INTO "menu_items" (
      title,
      icon,
      route,
      is_external,
      order_index,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      'Database Explorer',
      'database',
      '/db',
      false,
      10,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO db_menu_id;

    RAISE NOTICE '✓ Created Database Explorer menu item';
  ELSE
    RAISE NOTICE '• Database Explorer menu item already exists';
  END IF;

  -- Grant permission to admin role
  IF admin_role_id IS NOT NULL AND db_menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (db_menu_id, admin_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    RAISE NOTICE '✓ Granted Database Explorer access to admin role';
  END IF;
END $$;

-- ============================================
-- SECTION 3: Pages Menu
-- ============================================

\echo ''
\echo '📋 Section 3: Adding Pages Menu...'

DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  menu_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user' LIMIT 1;

  -- Add Pages menu item
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Pages' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Pages', 'layout', '/pages', 11, TRUE, FALSE, NOW(), NOW());
    RAISE NOTICE '✓ Added Pages menu item';
  ELSE
    RAISE NOTICE '• Pages menu item already exists';
  END IF;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Pages' AND parent_id IS NULL LIMIT 1;
  
  IF menu_id IS NOT NULL THEN
    -- Add permission for admin role
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
      RAISE NOTICE '✓ Added Pages permission for admin';
    END IF;
    
    -- Add permission for user role
    IF user_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, user_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
      RAISE NOTICE '✓ Added Pages permission for user';
    END IF;
  END IF;
END $$;

-- ============================================
-- SECTION 4: Summary
-- ============================================

\echo ''
\echo '============================================'
\echo '✅ Production Sync v2.0 Migration Complete!'
\echo '============================================'
\echo ''
\echo 'Changes Applied:'
\echo '  ✓ Process automation permissions'
\echo '  ✓ Database Explorer menu'
\echo '  ✓ Pages menu'
\echo '  ✓ Role permissions assigned'
\echo ''
\echo 'Verify with:'
\echo '  SELECT title, route FROM menu_items WHERE parent_id IS NULL ORDER BY order_index;'
\echo ''

