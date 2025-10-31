-- Add Pages menu item
-- This allows users to access the Craft.js page builder system

DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  menu_id INT;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user' LIMIT 1;

  -- Add Pages menu item (after History, before Profile)
  IF NOT EXISTS (SELECT 1 FROM "menu_items" WHERE title = 'Pages' AND parent_id IS NULL) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
    VALUES (NULL, 'Pages', 'layout', '/pages', 7, TRUE, FALSE, NOW(), NOW());
    RAISE NOTICE 'Added Pages menu item';
  ELSE
    RAISE NOTICE 'Pages menu item already exists';
  END IF;
  
  -- Get Pages menu ID
  SELECT id INTO menu_id FROM "menu_items" WHERE title = 'Pages' AND parent_id IS NULL LIMIT 1;
  
  IF menu_id IS NOT NULL THEN
    -- Add permission for admin role
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
      RAISE NOTICE 'Added Pages permission for admin';
    END IF;
    
    -- Add permission for user role
    IF user_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_id, user_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
      RAISE NOTICE 'Added Pages permission for user';
    END IF;
    
    RAISE NOTICE 'Pages menu item added successfully!';
  ELSE
    RAISE NOTICE 'Could not find or create Pages menu item';
  END IF;
END $$;

