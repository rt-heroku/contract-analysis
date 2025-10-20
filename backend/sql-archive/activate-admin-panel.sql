-- Activate Admin Panel menu item
-- This was needed because Admin Panel was inactive, preventing its children 
-- (Logs, User Management, Settings) from appearing in the menu tree

UPDATE menu_items 
SET is_active = true 
WHERE id = 7 AND title = 'Admin Panel';

-- Verify the change
SELECT 
  mi.id,
  mi.title,
  mi.icon,
  mi.is_active,
  mi.parent_id,
  mi.order_index,
  STRING_AGG(r.name, ', ') as allowed_roles
FROM menu_items mi
LEFT JOIN menu_permissions mp ON mp.menu_item_id = mi.id
LEFT JOIN roles r ON r.id = mp.role_id
WHERE mi.id = 7
GROUP BY mi.id, mi.title, mi.icon, mi.is_active, mi.parent_id, mi.order_index;

