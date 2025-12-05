-- Fix existing contract analyses with null execution_id by using job_id as fallback
-- This fixes the "Missing execution ID" error when clicking Review

UPDATE contract_analysis
SET execution_id = job_id
WHERE execution_id IS NULL;

-- Verify the update
SELECT 
  id,
  job_id,
  execution_id,
  document_name,
  status,
  created_at
FROM contract_analysis
WHERE execution_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

