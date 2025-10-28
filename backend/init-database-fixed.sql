-- ============================================
-- MENU STRUCTURE - Fixed Version
-- This is a replacement for the menu section in init-database.sql
-- Properly checks for existence before inserting
-- ============================================

DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
  admin_panel_id INT;
  beta_features_id INT;
  menu_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user';
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer';

  -- Dashboard
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Dashboard' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Dashboard', 'home', '/dashboard', 1, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Dashboard' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- Processing
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Processing' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Processing', 'file-text', '/processing', 2, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Processing' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- Documents
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Documents' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Documents', 'folder', '/documents', 3, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Documents' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- Prompts
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Prompts' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Prompts', 'message-square', '/prompts', 4, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Prompts' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- Flows
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Flows' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Flows', 'git-branch', '/flows', 5, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Flows' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- IDP Executions
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'IDP Executions' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'IDP Executions', 'server', '/idp-executions', 6, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'IDP Executions' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- History
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'History' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'History', 'history', '/history', 7, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'History' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- Profile
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Profile' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Profile', 'user', '/profile', 8, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Profile' AND parent_id IS NULL LIMIT 1;
  IF menu_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW()), (menu_id, viewer_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;

  -- Beta Features (parent menu)
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Beta Features' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Beta Features', 'zap', NULL, 9, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO beta_features_id FROM "menu_items" WHERE title = 'Beta Features' AND parent_id IS NULL LIMIT 1;
  IF beta_features_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (beta_features_id, admin_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;

    -- Beta Features > Processes
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Processes' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Processes', 'git-branch', '/processes', 1, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Processes' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Beta Features > Actions
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Actions' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Actions', 'zap', '/actions', 2, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Actions' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Beta Features > Executions
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Executions' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Executions', 'activity', '/executions', 3, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Executions' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;
  END IF;

  -- Admin Panel (parent menu)
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Admin Panel' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Admin Panel', 'shield', NULL, 10, TRUE, FALSE, NOW(), NOW());
  END IF;
  SELECT id INTO admin_panel_id FROM "menu_items" WHERE title = 'Admin Panel' AND parent_id IS NULL LIMIT 1;
  IF admin_panel_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (admin_panel_id, admin_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;

    -- Admin > Logs
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Logs' AND parent_id = admin_panel_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (admin_panel_id, 'Logs', 'file-text', '/admin/logs', 1, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Logs' AND parent_id = admin_panel_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Admin > User Management
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'User Management' AND parent_id = admin_panel_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (admin_panel_id, 'User Management', 'users', '/admin/users', 2, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'User Management' AND parent_id = admin_panel_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Admin > Roles
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Roles' AND parent_id = admin_panel_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (admin_panel_id, 'Roles', 'shield', '/admin/roles', 3, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Roles' AND parent_id = admin_panel_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Admin > Menu
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Menu' AND parent_id = admin_panel_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (admin_panel_id, 'Menu', 'menu', '/admin/menu', 4, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Menu' AND parent_id = admin_panel_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Admin > Settings
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Settings' AND parent_id = admin_panel_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (admin_panel_id, 'Settings', 'settings', '/admin/settings', 5, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Settings' AND parent_id = admin_panel_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE '✓ Menu structure created/verified';
END $$;

