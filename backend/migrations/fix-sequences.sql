-- ============================================
-- Fix All Sequences
-- ============================================
-- This migration ensures all sequences are synchronized with their tables
-- Prevents "duplicate key" errors when inserting new records
-- ============================================

-- Fix menu_items sequence
SELECT setval('menu_items_id_seq', COALESCE((SELECT MAX(id) FROM menu_items), 1));

-- Fix users sequence  
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));

-- Fix roles sequence
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));

-- Fix permissions sequence
SELECT setval('permissions_id_seq', COALESCE((SELECT MAX(id) FROM permissions), 1));

-- Fix uploads sequence
SELECT setval('uploads_id_seq', COALESCE((SELECT MAX(id) FROM uploads), 1));

-- Fix analysis_records sequence
SELECT setval('analysis_records_id_seq', COALESCE((SELECT MAX(id) FROM analysis_records), 1));

-- Fix prompts sequence
SELECT setval('prompts_id_seq', COALESCE((SELECT MAX(id) FROM prompts), 1));

-- Fix flows sequence
SELECT setval('flows_id_seq', COALESCE((SELECT MAX(id) FROM flows), 1));

-- Fix actions sequence
SELECT setval('actions_id_seq', COALESCE((SELECT MAX(id) FROM actions), 1));

-- Fix processes sequence
SELECT setval('processes_id_seq', COALESCE((SELECT MAX(id) FROM processes), 1));

-- Fix connectors sequence
SELECT setval('connectors_id_seq', COALESCE((SELECT MAX(id) FROM connectors), 1));

-- Fix stores sequence
SELECT setval('stores_id_seq', COALESCE((SELECT MAX(id) FROM stores), 1));

-- Fix idp_executions sequence
SELECT setval('idp_executions_id_seq', COALESCE((SELECT MAX(id) FROM idp_executions), 1));

-- Fix activity_logs sequence
SELECT setval('activity_logs_id_seq', COALESCE((SELECT MAX(id) FROM activity_logs), 1));

-- Fix api_logs sequence
SELECT setval('api_logs_id_seq', COALESCE((SELECT MAX(id) FROM api_logs), 1));

-- Fix notifications sequence
SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1));

-- Fix system_settings sequence
SELECT setval('system_settings_id_seq', COALESCE((SELECT MAX(id) FROM system_settings), 1));

-- Migration complete - all sequences synchronized








