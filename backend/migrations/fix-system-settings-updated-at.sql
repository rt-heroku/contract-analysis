-- ============================================
-- Fix System Settings Updated_At Column
-- This migration fixes NULL values in updated_at column
-- ============================================

-- Update all system_settings records where updated_at is NULL
-- Set updated_at to created_at for existing records
UPDATE system_settings 
SET updated_at = created_at 
WHERE updated_at IS NULL;

