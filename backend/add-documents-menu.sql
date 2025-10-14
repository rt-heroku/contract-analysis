-- Add Documents menu item to the sidebar
-- This script adds the Documents Library to the main navigation

-- First, check if the Documents menu already exists
DO $$
BEGIN
  -- Add Documents menu item (right after Processing, before Prompts)
  IF NOT EXISTS (
    SELECT 1 FROM "menu_items" WHERE route = '/documents'
  ) THEN
    INSERT INTO "menu_items" (parent_id, title, icon, route, order_index, is_active, created_at, updated_at)
    VALUES (
      NULL,                 -- parent_id (top-level menu)
      'Documents',          -- title
      'Folder',            -- icon (lucide-react icon name)
      '/documents',        -- route
      3,                   -- order_index (after Dashboard=1, Processing=2)
      true,                -- is_active
      NOW(),               -- created_at
      NOW()                -- updated_at
    );
    
    RAISE NOTICE 'Documents menu item added successfully';
  ELSE
    RAISE NOTICE 'Documents menu item already exists';
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

