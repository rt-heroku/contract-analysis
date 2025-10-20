-- ============================================
-- Cleanup Duplicate Menu Items
-- Keeps the first instance, deletes duplicates
-- ============================================

DO $$
DECLARE
  duplicate_count INT;
BEGIN
  -- Delete duplicate menu items, keeping only the first (lowest id)
  DELETE FROM "menu_items" a
  USING "menu_items" b
  WHERE a.id > b.id
    AND a.title = b.title
    AND (a.parent_id = b.parent_id OR (a.parent_id IS NULL AND b.parent_id IS NULL));
  
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE '✓ Removed % duplicate menu items', duplicate_count;
  
  -- Show remaining menu items
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining menu items:';
END $$;

SELECT 
  id,
  CASE 
    WHEN parent_id IS NULL THEN title 
    ELSE '  ├─ ' || title 
  END as menu_structure,
  route,
  order_index,
  is_active
FROM "menu_items"
ORDER BY COALESCE(parent_id, id), order_index;

