-- ============================================
-- Document Analyzer - Complete Database Initialization
-- ============================================
-- This script initializes a fresh database with all required
-- structure, roles, permissions, menus, settings, and demo users.
-- It's idempotent - safe to run multiple times.
-- ============================================

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- SECTION 1: Roles
-- ============================================

DO $$
BEGIN
  -- Admin Role
  IF NOT EXISTS (SELECT 1 FROM "roles" WHERE name = 'admin') THEN
    INSERT INTO "roles" (name, description, created_at, updated_at)
    VALUES (
      'admin',
      'Administrator with full access to all features',
      NOW(),
      NOW()
    );
    RAISE NOTICE '✓ Admin role created';
  ELSE
    RAISE NOTICE '• Admin role already exists';
  END IF;

  -- User Role
  IF NOT EXISTS (SELECT 1 FROM "roles" WHERE name = 'user') THEN
    INSERT INTO "roles" (name, description, created_at, updated_at)
    VALUES (
      'user',
      'Standard user with access to core features',
      NOW(),
      NOW()
    );
    RAISE NOTICE '✓ User role created';
  ELSE
    RAISE NOTICE '• User role already exists';
  END IF;

  -- Viewer Role
  IF NOT EXISTS (SELECT 1 FROM "roles" WHERE name = 'viewer') THEN
    INSERT INTO "roles" (name, description, created_at, updated_at)
    VALUES (
      'viewer',
      'Read-only access to view analysis history and documents',
      NOW(),
      NOW()
    );
    RAISE NOTICE '✓ Viewer role created';
  ELSE
    RAISE NOTICE '• Viewer role already exists';
  END IF;
END $$;

-- ============================================
-- SECTION 2: Permissions
-- ============================================

INSERT INTO "permissions" (name, description, category, created_at, updated_at) VALUES
-- Profile & Account
('profile.view', 'View own profile', 'Profile', NOW(), NOW()),
('profile.edit', 'Edit own profile', 'Profile', NOW(), NOW()),
('profile.change_password', 'Change own password', 'Profile', NOW(), NOW()),
('profile.request_permissions', 'Request permission upgrades', 'Profile', NOW(), NOW()),

-- Document Processing
('documents.upload', 'Upload documents', 'Documents', NOW(), NOW()),
('documents.download', 'Download documents', 'Documents', NOW(), NOW()),
('documents.delete', 'Delete documents', 'Documents', NOW(), NOW()),
('documents.process', 'Process documents with IDP', 'Documents', NOW(), NOW()),
('documents.analyze', 'Analyze processed documents', 'Documents', NOW(), NOW()),

-- Analysis & History
('analysis.view', 'View analysis results', 'Analysis', NOW(), NOW()),
('analysis.create', 'Create new analysis', 'Analysis', NOW(), NOW()),
('analysis.delete', 'Delete analysis records', 'Analysis', NOW(), NOW()),
('analysis.share', 'Share analysis with other users', 'Analysis', NOW(), NOW()),
('analysis.rerun', 'Re-run analysis', 'Analysis', NOW(), NOW()),

-- Prompts
('prompts.view', 'View prompts', 'Prompts', NOW(), NOW()),
('prompts.create', 'Create new prompts', 'Prompts', NOW(), NOW()),
('prompts.edit', 'Edit prompts', 'Prompts', NOW(), NOW()),
('prompts.delete', 'Delete prompts', 'Prompts', NOW(), NOW()),
('prompts.set_default', 'Set default prompt', 'Prompts', NOW(), NOW()),

-- Flows
('flows.view', 'View flows', 'Flows', NOW(), NOW()),
('flows.create', 'Create new flows', 'Flows', NOW(), NOW()),
('flows.edit', 'Edit flows', 'Flows', NOW(), NOW()),
('flows.delete', 'Delete flows', 'Flows', NOW(), NOW()),

-- IDP Executions
('idp.view', 'View IDP executions', 'IDP', NOW(), NOW()),
('idp.create', 'Create IDP executions', 'IDP', NOW(), NOW()),
('idp.edit', 'Edit IDP executions', 'IDP', NOW(), NOW()),
('idp.delete', 'Delete IDP executions', 'IDP', NOW(), NOW()),
('idp.share', 'Share IDP executions', 'IDP', NOW(), NOW()),

-- Admin - User Management
('admin.users.view', 'View all users', 'Admin', NOW(), NOW()),
('admin.users.create', 'Create new users', 'Admin', NOW(), NOW()),
('admin.users.edit', 'Edit user accounts', 'Admin', NOW(), NOW()),
('admin.users.delete', 'Delete user accounts', 'Admin', NOW(), NOW()),

-- Admin - Role Management
('admin.roles.view', 'View all roles', 'Admin', NOW(), NOW()),
('admin.roles.create', 'Create new roles', 'Admin', NOW(), NOW()),
('admin.roles.edit', 'Edit roles and permissions', 'Admin', NOW(), NOW()),
('admin.roles.delete', 'Delete roles', 'Admin', NOW(), NOW()),

-- Admin - Menu Management
('admin.menu.view', 'View menu configuration', 'Admin', NOW(), NOW()),
('admin.menu.create', 'Create menu items', 'Admin', NOW(), NOW()),
('admin.menu.edit', 'Edit menu items', 'Admin', NOW(), NOW()),
('admin.menu.delete', 'Delete menu items', 'Admin', NOW(), NOW()),
('admin.menu.assign', 'Assign menu items to roles', 'Admin', NOW(), NOW()),

-- Admin - System
('admin.logs.view', 'View system logs', 'Admin', NOW(), NOW()),
('admin.settings.view', 'View system settings', 'Admin', NOW(), NOW()),
('admin.settings.edit', 'Edit system settings', 'Admin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user';
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer';

  -- Admin gets ALL permissions
  INSERT INTO "role_permissions" (role_id, permission_id, created_at)
  SELECT admin_role_id, id, NOW()
  FROM "permissions"
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  RAISE NOTICE '✓ Admin permissions assigned';

  -- User permissions
  INSERT INTO "role_permissions" (role_id, permission_id, created_at)
  SELECT user_role_id, id, NOW()
  FROM "permissions"
  WHERE name IN (
    'profile.view', 'profile.edit', 'profile.change_password',
    'documents.upload', 'documents.download', 'documents.delete', 'documents.process', 'documents.analyze',
    'analysis.view', 'analysis.create', 'analysis.share', 'analysis.rerun',
    'prompts.view', 'prompts.create', 'prompts.edit', 'prompts.delete',
    'flows.view',
    'idp.view', 'idp.create', 'idp.edit', 'idp.delete', 'idp.share'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  RAISE NOTICE '✓ User permissions assigned';

  -- Viewer permissions (read-only + profile edit + change password)
  INSERT INTO "role_permissions" (role_id, permission_id, created_at)
  SELECT viewer_role_id, id, NOW()
  FROM "permissions"
  WHERE name IN (
    'profile.view', 'profile.edit', 'profile.change_password', 'profile.request_permissions',
    'documents.download',
    'analysis.view',
    'prompts.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  RAISE NOTICE '✓ Viewer permissions assigned';
END $$;

-- ============================================
-- SECTION 3: Menu Structure
-- ============================================

DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
  admin_panel_id INT;
  menu_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user';
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer';

  -- Dashboard
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Dashboard', 'home', '/dashboard', 1, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Dashboard' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Processing
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Processing', 'file-text', '/processing', 2, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Processing' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Documents
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Documents', 'folder', '/documents', 3, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Documents' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Prompts
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Prompts', 'message-square', '/prompts', 4, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Prompts' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Flows
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Flows', 'git-branch', '/flows', 5, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Flows' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- IDP Executions
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'IDP Executions', 'server', '/idp-executions', 6, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'IDP Executions' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- History
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'History', 'history', '/history', 7, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'History' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Profile
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Profile', 'user', '/profile', 8, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Profile' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Admin Panel (parent menu)
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (NULL, 'Admin Panel', 'shield', NULL, 9, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO admin_panel_id FROM "menu_items" WHERE title = 'Admin Panel' AND parent_id IS NULL;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (admin_panel_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Admin > Logs
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (admin_panel_id, 'Logs', 'file-text', '/admin/logs', 1, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Logs' AND parent_id = admin_panel_id;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Admin > User Management
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (admin_panel_id, 'User Management', 'users', '/admin/users', 2, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'User Management' AND parent_id = admin_panel_id;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Admin > Roles
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (admin_panel_id, 'Roles', 'shield', '/admin/roles', 3, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Roles' AND parent_id = admin_panel_id;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Admin > Menu
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (admin_panel_id, 'Menu', 'menu', '/admin/menu', 4, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Menu' AND parent_id = admin_panel_id;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  -- Admin > Settings
  INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
  VALUES (admin_panel_id, 'Settings', 'settings', '/admin/settings', 5, TRUE, FALSE, NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Settings' AND parent_id = admin_panel_id;
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  VALUES (menu_id, admin_role_id, NOW())
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;

  RAISE NOTICE '✓ Menu structure created';
END $$;

-- ============================================
-- SECTION 4: System Settings
-- ============================================

INSERT INTO "system_settings" (setting_key, setting_value, description, is_secret, created_at, updated_at) VALUES
('app_name', 'Document Analyzer', 'Application name displayed in header', FALSE, NOW(), NOW()),
('app_logo_url', '/images/mulesoft-logo.svg', 'URL to application logo', FALSE, NOW(), NOW()),
('powered_by_text', 'Powered by MuleSoft', 'Footer attribution text', FALSE, NOW(), NOW()),
('mulesoft_api_base_url', 'http://localhost:8081', 'MuleSoft API base URL', FALSE, NOW(), NOW()),
('mulesoft_api_timeout', '30000', 'MuleSoft API timeout in milliseconds', FALSE, NOW(), NOW()),
('show_demo_credentials', 'true', 'Display demo credentials on login page (true/false)', FALSE, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

RAISE NOTICE '✓ System settings created';

-- ============================================
-- SECTION 5: Demo Users
-- ============================================

DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
  admin_user_id INT;
  regular_user_id INT;
  viewer_user_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user';
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer';

  -- Admin User (admin@demo.com / Admin@123)
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'admin@demo.com') THEN
    INSERT INTO "users" (email, password_hash, first_name, last_name, is_active, created_at, updated_at)
    VALUES (
      'admin@demo.com',
      '$2b$10$AAAAAAAAAAAAAAAAAAAAAO4pZx8mz5K5K5K5K5K5K5K5K5K5K5', -- Temporary - will be updated by seedOnce.ts
      'Admin',
      'User',
      TRUE,
      NOW(),
      NOW()
    )
    RETURNING id INTO admin_user_id;
    
    INSERT INTO "user_profiles" (user_id, created_at, updated_at)
    VALUES (admin_user_id, NOW(), NOW());
    
    INSERT INTO "user_roles" (user_id, role_id, assigned_at)
    VALUES (admin_user_id, admin_role_id, NOW());
    
    RAISE NOTICE '✓ Admin user created (admin@demo.com)';
  ELSE
    RAISE NOTICE '• Admin user already exists';
  END IF;

  -- Regular User (user@demo.com / User@123)
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'user@demo.com') THEN
    INSERT INTO "users" (email, password_hash, first_name, last_name, is_active, created_at, updated_at)
    VALUES (
      'user@demo.com',
      '$2b$10$AAAAAAAAAAAAAAAAAAAAAO4pZx8mz5K5K5K5K5K5K5K5K5K5K5', -- Temporary - will be updated by seedOnce.ts
      'Regular',
      'User',
      TRUE,
      NOW(),
      NOW()
    )
    RETURNING id INTO regular_user_id;
    
    INSERT INTO "user_profiles" (user_id, created_at, updated_at)
    VALUES (regular_user_id, NOW(), NOW());
    
    INSERT INTO "user_roles" (user_id, role_id, assigned_at)
    VALUES (regular_user_id, user_role_id, NOW());
    
    RAISE NOTICE '✓ Regular user created (user@demo.com)';
  ELSE
    RAISE NOTICE '• Regular user already exists';
  END IF;

  -- Viewer User (demo@mulesoft.com / Demo@123)
  IF NOT EXISTS (SELECT 1 FROM "users" WHERE email = 'demo@mulesoft.com') THEN
    INSERT INTO "users" (email, password_hash, first_name, last_name, default_menu_item, is_active, created_at, updated_at)
    VALUES (
      'demo@mulesoft.com',
      '$2b$10$AAAAAAAAAAAAAAAAAAAAAO4pZx8mz5K5K5K5K5K5K5K5K5K5K5', -- Temporary - will be updated by seedOnce.ts
      'Demo',
      'Viewer',
      'history',
      TRUE,
      NOW(),
      NOW()
    )
    RETURNING id INTO viewer_user_id;
    
    INSERT INTO "user_profiles" (user_id, created_at, updated_at)
    VALUES (viewer_user_id, NOW(), NOW());
    
    INSERT INTO "user_roles" (user_id, role_id, assigned_at)
    VALUES (viewer_user_id, viewer_role_id, NOW());
    
    RAISE NOTICE '✓ Viewer user created (demo@mulesoft.com)';
  ELSE
    RAISE NOTICE '• Viewer user already exists';
  END IF;
END $$;

-- ============================================
-- SECTION 6: Database Triggers
-- ============================================

-- Auto-share analysis trigger (optional - only if needed)
-- This trigger automatically shares a specific analysis with all new users
-- Uncomment if you want to use this feature

/*
CREATE OR REPLACE FUNCTION auto_share_analysis_with_new_user()
RETURNS TRIGGER AS $$
DECLARE
    target_analysis_id INT := 60; -- Change this to your demo analysis ID
    current_shared_with JSONB;
    new_shared_with JSONB;
BEGIN
    SELECT shared_with INTO current_shared_with
    FROM analysis_records
    WHERE id = target_analysis_id AND is_deleted = false;
    
    IF current_shared_with IS NOT NULL THEN
        IF NOT (current_shared_with @> to_jsonb(NEW.id)) THEN
            new_shared_with := current_shared_with || to_jsonb(NEW.id);
            
            UPDATE analysis_records
            SET shared_with = new_shared_with,
                updated_at = NOW()
            WHERE id = target_analysis_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_share_analysis ON users;

CREATE TRIGGER trigger_auto_share_analysis
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_share_analysis_with_new_user();

RAISE NOTICE '✓ Auto-share trigger created (analysis ID: 60)';
*/

-- ============================================
-- Summary Report
-- ============================================

\echo ''
\echo '============================================'
\echo 'Database Initialization Complete!'
\echo '============================================'
\echo ''
\echo 'Roles Created:'
SELECT name, description FROM "roles" ORDER BY name;

\echo ''
\echo 'Permissions Count by Role:'
SELECT 
  r.name as role,
  COUNT(rp.id) as permissions
FROM "roles" r
LEFT JOIN "role_permissions" rp ON r.id = rp.role_id
GROUP BY r.name
ORDER BY r.name;

\echo ''
\echo 'Menu Items Created:'
SELECT 
  CASE WHEN parent_id IS NULL THEN title ELSE '  ├─ ' || title END as menu_structure,
  route,
  order_index
FROM "menu_items"
WHERE is_active = TRUE
ORDER BY COALESCE(parent_id, id), order_index;

\echo ''
\echo 'Demo Users:'
SELECT 
  email,
  first_name || ' ' || last_name as name,
  STRING_AGG(r.name, ', ') as roles
FROM "users" u
LEFT JOIN "user_roles" ur ON u.id = ur.user_id
LEFT JOIN "roles" r ON ur.role_id = r.id
WHERE u.email LIKE '%@demo.com' OR u.email LIKE '%@mulesoft.com'
GROUP BY u.email, u.first_name, u.last_name
ORDER BY u.email;

\echo ''
\echo 'System Settings:'
SELECT setting_key, setting_value FROM "system_settings" WHERE is_secret = FALSE ORDER BY setting_key;

\echo ''
\echo '============================================'
\echo 'Next Steps:'
\echo '1. Run seed script to set user passwords'
\echo '2. Login with demo credentials:'
\echo '   - Admin: admin@demo.com / Admin@123'
\echo '   - User:  user@demo.com / User@123'
\echo '   - Viewer: demo@mulesoft.com / Demo@123'
\echo '============================================'

