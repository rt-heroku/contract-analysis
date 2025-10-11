-- Add Flows menu item for Admins
-- This script adds the Flows menu item and grants permission to the Admin role

-- First, get the admin role ID (assuming it's named 'Admin')
DO $$
DECLARE
    admin_role_id INT;
    flows_menu_id INT;
BEGIN
    -- Get the admin role ID
    SELECT id INTO admin_role_id FROM roles WHERE LOWER(name) = 'admin' LIMIT 1;
    
    IF admin_role_id IS NULL THEN
        RAISE NOTICE 'Admin role not found, creating it...';
        INSERT INTO roles (name, description, created_at, updated_at)
        VALUES ('Admin', 'Administrator role with full access', NOW(), NOW())
        RETURNING id INTO admin_role_id;
    END IF;
    
    RAISE NOTICE 'Admin role ID: %', admin_role_id;
    
    -- Check if Flows menu item already exists
    SELECT id INTO flows_menu_id FROM menu_items WHERE title = 'Flows' AND route = '/flows' LIMIT 1;
    
    IF flows_menu_id IS NULL THEN
        -- Insert Flows menu item
        INSERT INTO menu_items (parent_id, title, icon, route, order_index, is_active, created_at, updated_at)
        VALUES (NULL, 'Flows', 'git-branch', '/flows', 4, true, NOW(), NOW())
        RETURNING id INTO flows_menu_id;
        
        RAISE NOTICE 'Created Flows menu item with ID: %', flows_menu_id;
    ELSE
        RAISE NOTICE 'Flows menu item already exists with ID: %', flows_menu_id;
    END IF;
    
    -- Check if permission already exists
    IF NOT EXISTS (
        SELECT 1 FROM menu_permissions 
        WHERE menu_item_id = flows_menu_id AND role_id = admin_role_id
    ) THEN
        -- Grant permission to Admin role
        INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
        VALUES (flows_menu_id, admin_role_id, NOW());
        
        RAISE NOTICE 'Granted Flows menu permission to Admin role';
    ELSE
        RAISE NOTICE 'Admin already has permission for Flows menu';
    END IF;
    
    RAISE NOTICE 'Flows menu setup complete!';
END $$;

-- Verify the insertion
SELECT 
    mi.id,
    mi.title,
    mi.icon,
    mi.route,
    mi.order_index,
    mi.is_active,
    r.name as role_name
FROM menu_items mi
LEFT JOIN menu_permissions mp ON mp.menu_item_id = mi.id
LEFT JOIN roles r ON r.id = mp.role_id
WHERE mi.title = 'Flows'
ORDER BY mi.id, r.name;

