-- Add Documents menu item to the sidebar
-- This script adds the Documents Library to the main navigation

-- First, check if the Documents menu already exists
DO $$
DECLARE
  documents_menu_id INT;
BEGIN
  -- Add Documents menu item (right after Processing, before Prompts)
  IF NOT EXISTS (
    SELECT 1 FROM "menu_items" WHERE route = '/documents'
  ) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, created_at, updated_at)
    VALUES (
      NULL,                 -- parent_id (top-level menu)
      'Documents',          -- title
      'folder',            -- icon (lucide-react icon name)
      '/documents',        -- route
      3,                   -- order_index (after Dashboard=1, Processing=2)
      true,                -- is_active
      NOW(),               -- created_at
      NOW()                -- updated_at
    )
    RETURNING id INTO documents_menu_id;
    
    RAISE NOTICE 'Documents menu item added with ID: %', documents_menu_id;
    
    -- Add permissions for admin role (role_id = 1)
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (documents_menu_id, 1, NOW());
    
    -- Add permissions for user role (role_id = 2)
    INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
    VALUES (documents_menu_id, 2, NOW());
    
    RAISE NOTICE 'Documents menu permissions added for admin and user roles';
  ELSE
    RAISE NOTICE 'Documents menu item already exists';
    
    -- Get the existing menu item ID
    SELECT id INTO documents_menu_id FROM "menu_items" WHERE route = '/documents';
    
    -- Check and add missing permissions
    IF NOT EXISTS (SELECT 1 FROM "menu_permissions" WHERE menu_item_id = documents_menu_id AND role_id = 1) THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (documents_menu_id, 1, NOW());
      RAISE NOTICE 'Added missing admin permission for Documents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM "menu_permissions" WHERE menu_item_id = documents_menu_id AND role_id = 2) THEN
      INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
      VALUES (documents_menu_id, 2, NOW());
      RAISE NOTICE 'Added missing user permission for Documents';
    END IF;
  END IF;

  -- Update order of other menu items to make room
  -- Shift Prompts, Flows, History, etc. down by 1
  UPDATE "menu_items"
  SET order_index = order_index + 1, updated_at = NOW()
  WHERE order_index >= 3 AND route != '/documents';
  
  RAISE NOTICE 'Menu order updated successfully';
END $$;

-- Verify the menu structure
SELECT 
  id,
  title,
  route,
  icon,
  order_index,
  parent_id,
  is_active
FROM "menu_items"
WHERE parent_id IS NULL
ORDER BY order_index;
