-- Add IDP Executions menu item
-- This script adds a new menu item for IDP Executions and assigns it to admin and user roles

-- Insert the IDP Executions menu item
INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active)
VALUES (NULL, 'IDP Executions', 'server', '/idp-executions', 5, TRUE)
ON CONFLICT DO NOTHING;

-- Assign to admin role
INSERT INTO "menu_permissions" (menu_item_id, role_id)
SELECT 
  (SELECT id FROM "menu_items" WHERE title = 'IDP Executions'),
  (SELECT id FROM "roles" WHERE name = 'admin')
WHERE NOT EXISTS (
  SELECT 1 FROM "menu_permissions" 
  WHERE menu_item_id = (SELECT id FROM "menu_items" WHERE title = 'IDP Executions')
  AND role_id = (SELECT id FROM "roles" WHERE name = 'admin')
);

-- Assign to user role
INSERT INTO "menu_permissions" (menu_item_id, role_id)
SELECT 
  (SELECT id FROM "menu_items" WHERE title = 'IDP Executions'),
  (SELECT id FROM "roles" WHERE name = 'user')
WHERE NOT EXISTS (
  SELECT 1 FROM "menu_permissions" 
  WHERE menu_item_id = (SELECT id FROM "menu_items" WHERE title = 'IDP Executions')
  AND role_id = (SELECT id FROM "roles" WHERE name = 'user')
);

-- Verify the menu was created
SELECT 
  mi.id,
  mi.title,
  mi.route,
  mi.icon,
  r.name as role_name
FROM "menu_items" mi
LEFT JOIN "menu_permissions" mp ON mi.id = mp.menu_item_id
LEFT JOIN "roles" r ON mp.role_id = r.id
WHERE mi.title = 'IDP Executions'
ORDER BY r.name;

