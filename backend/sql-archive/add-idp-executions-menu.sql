-- Add IDP Executions menu item
-- This script adds a new menu item for IDP Executions and assigns it to admin and user roles

-- Insert the IDP Executions menu item (with updated_at field)
INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, created_at, updated_at)
VALUES (NULL, 'IDP Executions', 'server', '/idp-executions', 5, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- If the menu item already exists but needs updating, update it
UPDATE "menu_items" 
SET 
  icon = 'server',
  route = '/idp-executions',
  order_index = 5,
  is_active = TRUE,
  updated_at = NOW()
WHERE title = 'IDP Executions'
  AND (icon != 'server' OR route != '/idp-executions' OR order_index != 5 OR is_active != TRUE);

-- Get the menu item ID
DO $$
DECLARE
  v_menu_id INTEGER;
  v_admin_role_id INTEGER;
  v_user_role_id INTEGER;
BEGIN
  -- Get menu item ID
  SELECT id INTO v_menu_id FROM "menu_items" WHERE title = 'IDP Executions';
  
  -- Get role IDs
  SELECT id INTO v_admin_role_id FROM "roles" WHERE name = 'admin';
  SELECT id INTO v_user_role_id FROM "roles" WHERE name = 'user';
  
  -- Assign to admin role if not exists
  IF v_menu_id IS NOT NULL AND v_admin_role_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (v_menu_id, v_admin_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;
  
  -- Assign to user role if not exists
  IF v_menu_id IS NOT NULL AND v_user_role_id IS NOT NULL THEN
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (v_menu_id, v_user_role_id, NOW())
    ON CONFLICT (menu_item_id, role_id) DO NOTHING;
  END IF;
END $$;

-- Verify the menu was created
SELECT 
  mi.id,
  mi.title,
  mi.route,
  mi.icon,
  mi.order_index,
  r.name as role_name
FROM "menu_items" mi
LEFT JOIN "menu_permissions" mp ON mi.id = mp.menu_item_id
LEFT JOIN "roles" r ON mp.role_id = r.id
WHERE mi.title = 'IDP Executions'
ORDER BY r.name;

