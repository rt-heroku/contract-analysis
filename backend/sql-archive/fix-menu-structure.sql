-- Fix menu structure to match frontend expectations
-- This script updates existing menu items and adds missing ones

DO $$
DECLARE
    admin_role_id INT;
    user_role_id INT;
    menu_id INT;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE LOWER(name) = 'admin' LIMIT 1;
    SELECT id INTO user_role_id FROM roles WHERE LOWER(name) = 'user' LIMIT 1;
    
    RAISE NOTICE 'Admin role ID: %, User role ID: %', admin_role_id, user_role_id;
    
    -- Update Dashboard (already exists, just ensure it's correct)
    UPDATE menu_items SET 
        title = 'Dashboard',
        icon = 'home',
        route = '/dashboard',
        order_index = 1
    WHERE title IN ('Dashboard') AND parent_id IS NULL;
    
    -- Update/Create Processing
    UPDATE menu_items SET 
        title = 'Processing',
        icon = 'file-text',
        route = '/processing',
        order_index = 2
    WHERE title IN ('Document Processing', 'Processing') AND parent_id IS NULL;
    
    -- Add Prompts if it doesn't exist
    SELECT id INTO menu_id FROM menu_items WHERE title = 'Prompts' AND route = '/prompts' LIMIT 1;
    IF menu_id IS NULL THEN
        INSERT INTO menu_items (parent_id, title, icon, route, order_index, is_active, created_at, updated_at)
        VALUES (NULL, 'Prompts', 'file-text', '/prompts', 3, true, NOW(), NOW())
        RETURNING id INTO menu_id;
        
        -- Grant to both admin and user roles
        INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
        VALUES (menu_id, admin_role_id, NOW()), (menu_id, user_role_id, NOW());
        
        RAISE NOTICE 'Created Prompts menu item with ID: %', menu_id;
    ELSE
        UPDATE menu_items SET order_index = 3 WHERE id = menu_id;
        RAISE NOTICE 'Updated Prompts menu item ID: %', menu_id;
    END IF;
    
    -- Update Flows to order_index 4 (already exists from previous script)
    UPDATE menu_items SET 
        order_index = 4
    WHERE title = 'Flows' AND route = '/flows';
    RAISE NOTICE 'Updated Flows to order_index 4';
    
    -- Update History to order_index 5
    UPDATE menu_items SET 
        title = 'History',
        icon = 'history',
        route = '/history',
        order_index = 5
    WHERE title IN ('Analysis History', 'History') AND parent_id IS NULL;
    RAISE NOTICE 'Updated History to order_index 5';
    
    -- Update Profile to order_index 6
    UPDATE menu_items SET 
        order_index = 6
    WHERE title = 'Profile' AND route = '/profile';
    RAISE NOTICE 'Updated Profile to order_index 6';
    
    -- Update Settings to order_index 7
    UPDATE menu_items SET 
        order_index = 7
    WHERE title = 'Settings' AND route = '/settings';
    RAISE NOTICE 'Updated Settings to order_index 7';
    
    -- Deactivate old/unused menu items that don't match our structure
    UPDATE menu_items SET is_active = false 
    WHERE title IN ('Transaction History', 'Transactions', 'Admin Panel', 'User Management', 'System Logs')
    AND parent_id IS NULL;
    RAISE NOTICE 'Deactivated old menu items';
    
    RAISE NOTICE 'Menu structure fix complete!';
END $$;

-- Verify the final menu structure
SELECT 
    mi.id,
    mi.title,
    mi.icon,
    mi.route,
    mi.order_index,
    mi.is_active,
    STRING_AGG(r.name, ', ' ORDER BY r.name) as roles
FROM menu_items mi
LEFT JOIN menu_permissions mp ON mp.menu_item_id = mi.id
LEFT JOIN roles r ON r.id = mp.role_id
WHERE mi.is_active = true AND mi.parent_id IS NULL
GROUP BY mi.id, mi.title, mi.icon, mi.route, mi.order_index, mi.is_active
ORDER BY mi.order_index, mi.id;

