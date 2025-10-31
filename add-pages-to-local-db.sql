-- Add Pages menu item to local database
-- This adds Pages under the existing Beta Features menu

DO $$
DECLARE
  admin_role_id INT;
  beta_features_id INT;
  pages_id INT;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin' LIMIT 1;
  
  -- Get Beta Features ID
  SELECT id INTO beta_features_id FROM "menu_items" WHERE title = 'Beta Features' AND parent_id IS NULL LIMIT 1;
  
  IF beta_features_id IS NOT NULL THEN
    RAISE NOTICE 'Found Beta Features with ID: %', beta_features_id;
    
    -- Check if Pages already exists
    SELECT id INTO pages_id FROM "menu_items" WHERE title = 'Pages' AND parent_id = beta_features_id LIMIT 1;
    
    IF pages_id IS NULL THEN
      -- Add Pages under Beta Features
      INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, is_external, created_at, updated_at)
      VALUES (beta_features_id, 'Pages', 'layout', '/pages', 6, TRUE, FALSE, NOW(), NOW())
      RETURNING id INTO pages_id;
      RAISE NOTICE 'Added Pages menu item with ID: %', pages_id;
      
      -- Add permission for admin role
      IF admin_role_id IS NOT NULL AND pages_id IS NOT NULL THEN
        INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
        VALUES (pages_id, admin_role_id, NOW())
        ON CONFLICT (menu_item_id, role_id) DO NOTHING;
        RAISE NOTICE 'Added Pages permission for admin';
      END IF;
      
      RAISE NOTICE 'Pages successfully added to Beta Features!';
    ELSE
      RAISE NOTICE 'Pages already exists with ID: %', pages_id;
    END IF;
  ELSE
    RAISE NOTICE 'Beta Features menu not found!';
  END IF;
END $$;

