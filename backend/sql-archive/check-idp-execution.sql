-- Check if contract analyses have idpExecutionId set
SELECT 
  ca.id,
  ca.job_id,
  ca.execution_id,
  ca.idp_execution_id,
  ca.document_name,
  ca.status,
  ca.created_at,
  ie.id as idp_exec_exists,
  ie.anypoint_username IS NOT NULL as has_username,
  ie.anypoint_password IS NOT NULL as has_password
FROM contract_analysis ca
LEFT JOIN idp_execution ie ON ca.idp_execution_id = ie.id
ORDER BY ca.created_at DESC
LIMIT 10;
