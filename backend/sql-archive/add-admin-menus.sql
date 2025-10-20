-- Add Role Management and Menu Management to Admin submenu

-- Get the Admin menu item ID
DO $$
DECLARE
  admin_menu_id INT;
  role_mgmt_id INT;
  menu_mgmt_id INT;
  admin_role_id INT;
BEGIN
  -- Get Admin menu ID
  SELECT id INTO admin_menu_id FROM "menu_items" WHERE title = 'Admin' AND parent_id IS NULL;
  
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
  
  IF admin_menu_id IS NOT NULL THEN
    -- Add Role Management menu item
    INSERT INTO "menu_items" (parent_id, title, icon, route, is_external, order_index, is_active, created_at, updated_at)
    VALUES (admin_menu_id, 'Roles', 'Shield', '/admin/roles', FALSE, 1, TRUE, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO role_mgmt_id;
    
    -- If it already exists, get its ID
    IF role_mgmt_id IS NULL THEN
      SELECT id INTO role_mgmt_id FROM "menu_items" WHERE title = 'Roles' AND parent_id = admin_menu_id;
    END IF;
    
    -- Add Menu Management menu item
    INSERT INTO "menu_items" (parent_id, title, icon, route, is_external, order_index, is_active, created_at, updated_at)
    VALUES (admin_menu_id, 'Menu', 'Menu', '/admin/menu', FALSE, 2, TRUE, NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO menu_mgmt_id;
    
    -- If it already exists, get its ID
    IF menu_mgmt_id IS NULL THEN
      SELECT id INTO menu_mgmt_id FROM "menu_items" WHERE title = 'Menu' AND parent_id = admin_menu_id;
    END IF;
    
    -- Assign to admin role
    IF role_mgmt_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (role_mgmt_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
      
      RAISE NOTICE 'Role Management menu added and assigned to admin role';
    END IF;
    
    IF menu_mgmt_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (menu_mgmt_id, admin_role_id, NOW())
      ON CONFLICT (menu_item_id, role_id) DO NOTHING;
      
      RAISE NOTICE 'Menu Management menu added and assigned to admin role';
    END IF;
  ELSE
    RAISE NOTICE 'Admin menu not found. Please run the initial menu setup first.';
  END IF;
END $$;

-- Display updated admin menu structure
SELECT 
  m.id,
  COALESCE(p.title || ' > ', '') || m.title as menu_path,
  m.route,
  m.order_index,
  STRING_AGG(r.name, ', ') as assigned_roles
FROM "menu_items" m
LEFT JOIN "menu_items" p ON m.parent_id = p.id
LEFT JOIN "menu_permissions" mp ON m.id = mp.menu_item_id
LEFT JOIN "roles" r ON mp.role_id = r.id
WHERE p.title = 'Admin' OR (m.title = 'Admin' AND m.parent_id IS NULL)
GROUP BY m.id, p.title, m.title, m.route, m.order_index
ORDER BY p.title NULLS FIRST, m.order_index, m.title;

