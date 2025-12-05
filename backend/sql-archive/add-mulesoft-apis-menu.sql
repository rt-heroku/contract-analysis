-- Add MuleSoft APIs menu item to Admin section

-- Insert MuleSoft APIs menu item under Admin
INSERT INTO menu_items (parent_id, title, icon, route, order_index, is_active, updated_at)
SELECT
    id,
    'MuleSoft APIs',
    'GitBranch',
    '/apis',
    50,
    true,
    NOW()
FROM menu_items
WHERE title = 'Administration' AND parent_id IS NULL;

-- Grant permissions to Admin role for the new menu item
INSERT INTO menu_permissions (menu_item_id, role_id)
SELECT 
    mi.id, 
    r.id
FROM menu_items mi
CROSS JOIN roles r
WHERE mi.route = '/apis' 
  AND r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM menu_permissions mp 
    WHERE mp.menu_item_id = mi.id 
      AND mp.role_id = r.id
  );

-- Verify the menu item was created
SELECT 
    mi.id,
    mi.title,
    mi.icon,
    mi.route,
    mi.parent_id,
    parent.title as parent_title,
    mi.order_index,
    mi.is_active
FROM menu_items mi
LEFT JOIN menu_items parent ON mi.parent_id = parent.id
WHERE mi.route = '/apis';

