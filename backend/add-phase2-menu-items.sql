-- Add Phase 2 menu items (Connectors, Stores, and update Beta Features structure)
-- Run this after init-database-fixed.sql

DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
  beta_features_id INT;
  menu_id INT;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user' LIMIT 1;
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer' LIMIT 1;

  -- Get Beta Features parent menu ID
  SELECT id INTO beta_features_id FROM "menu_items" WHERE title = 'Beta Features' AND parent_id IS NULL LIMIT 1;

  IF beta_features_id IS NOT NULL THEN
    -- Add Connectors under Beta Features
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Connectors' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Connectors', 'plug', '/connectors', 4, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Connectors' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;

    -- Add Stores under Beta Features
    IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Stores' AND parent_id = beta_features_id) THEN
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Stores', 'database', '/stores', 5, TRUE, FALSE, NOW(), NOW());
    END IF;
    SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Stores' AND parent_id = beta_features_id LIMIT 1;
    IF menu_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE 'Phase 2 menu items added successfully!';
END $$;

