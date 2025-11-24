-- Add Beta Features menu and all sub-items
-- This script adds the Beta Features menu that was missing from the database

DO $$
DECLARE
  admin_role_id INT;
  beta_features_id INT;
  menu_id INT;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;

  -- Add Beta Features (parent menu)
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Beta Features' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Beta Features', 'zap', NULL, 10, TRUE, FALSE, NOW(), NOW());
    RAISE NOTICE 'Added Beta Features parent menu';
  END IF;
  
  -- Get Beta Features ID
  SELECT id INTO beta_features_id FROM "menu_items" WHERE title = 'Beta Features' AND parent_id IS NULL LIMIT 1;
  
  IF beta_features_id IS NOT NULL THEN
    -- Add permission for admin role to see Beta Features
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (beta_features_id, admin_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    RAISE NOTICE 'Added Beta Features permission for admin';

    -- Add Processes submenu
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Processes' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Processes', 'git-branch', '/processes', 1, TRUE, FALSE, NOW(), NOW());
      RAISE NOTICE 'Added Processes submenu';
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Processes' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Add Actions submenu
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Actions' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Actions', 'zap', '/actions', 2, TRUE, FALSE, NOW(), NOW());
      RAISE NOTICE 'Added Actions submenu';
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Actions' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Add Executions submenu
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Executions' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Executions', 'activity', '/executions', 3, TRUE, FALSE, NOW(), NOW());
      RAISE NOTICE 'Added Executions submenu';
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Executions' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Add Connectors submenu
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Connectors' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Connectors', 'plug', '/connectors', 4, TRUE, FALSE, NOW(), NOW());
      RAISE NOTICE 'Added Connectors submenu';
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Connectors' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Add Stores submenu
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Stores' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Stores', 'database', '/stores', 5, TRUE, FALSE, NOW(), NOW());
      RAISE NOTICE 'Added Stores submenu';
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Stores' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Beta Features menu and all submenus added successfully!';
  ELSE
    RAISE NOTICE 'Could not find or create Beta Features parent menu';
  END IF;
END $$;
