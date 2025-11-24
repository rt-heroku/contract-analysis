-- Add Database Explorer menu item
-- This script adds the Database Explorer to the menu system

-- First, check if the menu item already exists
DO $$
DECLARE
  admin_role_id INT;
  viewer_role_id INT;
  editor_role_id INT;
  db_menu_id INT;
BEGIN
  -- Get role IDs
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';
  SELECT id INTO editor_role_id FROM roles WHERE name = 'editor';

  -- Check if Database Explorer menu already exists
  SELECT id INTO db_menu_id FROM menu_items WHERE route = '/db';

  -- If not exists, create it
  IF db_menu_id IS NULL THEN
    INSERT INTO menu_items (
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
      'Database',
      '/db',
      false,
      50,  -- Order after other main menu items
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO db_menu_id;

    RAISE NOTICE 'Created Database Explorer menu item with ID: %', db_menu_id;
  ELSE
    RAISE NOTICE 'Database Explorer menu item already exists with ID: %', db_menu_id;
  END IF;

  -- Grant permission to admin role
  IF NOT EXISTS (
    SELECT 1 FROM menu_permissions
    WHERE menu_item_id = db_menu_id AND role_id = admin_role_id
  ) THEN
    INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
    VALUES (db_menu_id, admin_role_id, NOW());
    RAISE NOTICE 'Granted Database Explorer access to admin role';
  END IF;

  -- Optionally grant to editor role (uncomment if needed)
  -- IF NOT EXISTS (
  --   SELECT 1 FROM menu_permissions
  --   WHERE menu_item_id = db_menu_id AND role_id = editor_role_id
  -- ) THEN
  --   INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
  --   VALUES (db_menu_id, editor_role_id, NOW());
  --   RAISE NOTICE 'Granted Database Explorer access to editor role';
  -- END IF;

END $$;

-- Verify the menu item was added
SELECT 
  mi.id,
  mi.title,
  mi.icon,
  mi.route,
  mi.is_active,
  mi.order_index,
  ARRAY_AGG(r.name) as allowed_roles
FROM menu_items mi
LEFT JOIN menu_permissions mp ON mi.id = mp.menu_item_id
LEFT JOIN roles r ON mp.role_id = r.id
WHERE mi.route = '/db'
GROUP BY mi.id, mi.title, mi.icon, mi.route, mi.is_active, mi.order_index;

