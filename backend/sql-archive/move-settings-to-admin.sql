-- Move Settings menu item under Admin menu
-- This makes Settings an admin-only submenu

-- Get the Admin menu item ID
DO $$
DECLARE
  admin_menu_id INTEGER;
  settings_menu_id INTEGER;
BEGIN
  -- Find Admin menu (could be named 'Admin' or 'Admin Panel')
  SELECT id INTO admin_menu_id FROM menu_items WHERE title IN ('Admin', 'Admin Panel') AND parent_id IS NULL;
  
  -- Find Settings menu
  SELECT id INTO settings_menu_id FROM menu_items WHERE title = 'Settings' AND parent_id IS NULL;
  
  IF admin_menu_id IS NULL THEN
    RAISE EXCEPTION 'Admin menu not found';
  END IF;
  
  IF settings_menu_id IS NULL THEN
    RAISE EXCEPTION 'Settings menu not found';
  END IF;
  
  -- Update Settings to be a child of Admin
  UPDATE menu_items 
  SET 
    parent_id = admin_menu_id,
    order_index = 3  -- After Logs (1) and User Management (2)
  WHERE id = settings_menu_id;
  
  -- Make sure Admin role has permission for Settings
  INSERT INTO menu_permissions (menu_item_id, role_id)
  SELECT settings_menu_id, id 
  FROM roles 
  WHERE name = 'admin'
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  
  -- Remove Settings permission from regular user role (make it admin-only)
  DELETE FROM menu_permissions mp
  USING roles r
  WHERE mp.role_id = r.id 
    AND r.name = 'user'
    AND mp.menu_item_id = settings_menu_id;
  
  RAISE NOTICE 'Settings menu successfully moved under Admin menu';
END $$;

-- Verify the changes
SELECT 
  mi.id,
  mi.title,
  mi.route,
  mi.order_index,
  parent.title as parent_menu,
  STRING_AGG(r.name, ', ') as allowed_roles
FROM menu_items mi
LEFT JOIN menu_items parent ON parent.id = mi.parent_id
LEFT JOIN menu_permissions mp ON mp.menu_item_id = mi.id
LEFT JOIN roles r ON r.id = mp.role_id
WHERE mi.title = 'Settings'
GROUP BY mi.id, mi.title, mi.route, mi.order_index, parent.title;

