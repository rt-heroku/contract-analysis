-- Fix execution_id in contract_analysis by extracting from mulesoft_response
-- The 'id' field in the MuleSoft response is the actual execution ID we need

-- 1. Check which records need fixing
SELECT 
  id,
  job_id,
  execution_id,
  mulesoft_response->>'id' as response_id,
  document_name,
  status,
  CASE 
    WHEN execution_id IS NULL THEN 'NULL - needs fix'
    WHEN execution_id = job_id THEN 'Using jobId fallback - needs fix'
    WHEN execution_id = mulesoft_response->>'id' THEN 'Correct'
    ELSE 'Mismatch - needs fix'
  END as status_check
FROM contract_analysis
WHERE mulesoft_response IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 2. Fix records by extracting ID from mulesoft_response
UPDATE contract_analysis
SET execution_id = mulesoft_response->>'id'
WHERE mulesoft_response->>'id' IS NOT NULL
  AND (execution_id IS NULL OR execution_id != mulesoft_response->>'id');

-- 3. Verify the fix
SELECT 
  COUNT(*) as total_records,
  COUNT(execution_id) as with_execution_id,
  COUNT(*) - COUNT(execution_id) as missing_execution_id,
  COUNT(CASE WHEN execution_id = mulesoft_response->>'id' THEN 1 END) as correct_extraction
FROM contract_analysis
WHERE mulesoft_response IS NOT NULL;

-- 4. Show recently fixed records
SELECT 
  id,
  job_id,
  execution_id,
  mulesoft_response->>'id' as response_id,
  document_name,
  status,
  created_at
FROM contract_analysis
WHERE mulesoft_response IS NOT NULL
  AND execution_id = mulesoft_response->>'id'
ORDER BY created_at DESC
LIMIT 10;

