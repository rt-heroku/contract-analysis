-- Add menu items for Pages and Page Builder
-- Run this script in your PostgreSQL database

-- Insert Pages menu item
INSERT INTO menu_items (title, route, icon, parent_id, order_index, is_active, created_at, updated_at)
VALUES ('Pages', '/pages', 'FileText', NULL, 10, true, NOW(), NOW())
ON CONFLICT (title) DO NOTHING;

-- Insert Page Builder menu item
INSERT INTO menu_items (title, route, icon, parent_id, order_index, is_active, created_at, updated_at)
VALUES ('Page Builder', '/page-builder', 'Layout', NULL, 11, true, NOW(), NOW())
ON CONFLICT (title) DO NOTHING;

-- Grant permissions to admin role for pages
-- First, get the IDs we need
DO $$
DECLARE
    pages_menu_id INTEGER;
    builder_menu_id INTEGER;
    admin_role_id INTEGER;
    super_admin_role_id INTEGER;
BEGIN
    -- Get menu item IDs
    SELECT id INTO pages_menu_id FROM menu_items WHERE route = '/pages';
    SELECT id INTO builder_menu_id FROM menu_items WHERE route = '/page-builder';
    
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
    
    -- Grant permissions to admin
    IF pages_menu_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
        VALUES (pages_menu_id, admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
        
        INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
        VALUES (builder_menu_id, admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Grant permissions to super_admin
    IF pages_menu_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
        INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
        VALUES (pages_menu_id, super_admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
        
        INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
        VALUES (builder_menu_id, super_admin_role_id, NOW())
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Verify the menu items were added
SELECT 
    mi.id,
    mi.title,
    mi.route,
    mi.icon,
    mi.order_index,
    r.name as role_name
FROM menu_items mi
LEFT JOIN menu_permissions mp ON mi.id = mp.menu_item_id
LEFT JOIN roles r ON mp.role_id = r.id
WHERE mi.route IN ('/pages', '/page-builder')
ORDER BY mi.order_index, r.name;

