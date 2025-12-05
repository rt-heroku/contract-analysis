-- ============================================
-- Diagnose User Creation Issues
-- ============================================

\echo ''
\echo '============================================'
\echo 'USER DIAGNOSIS'
\echo '============================================'
\echo ''

-- Check if users table exists
\echo 'Checking if users table exists...'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    ) THEN '✓ Users table exists'
    ELSE '❌ Users table does NOT exist'
  END AS table_check;

\echo ''
\echo 'Current users in database:'
SELECT 
  id,
  email,
  first_name,
  last_name,
  LENGTH(password_hash) as password_hash_length,
  is_active,
  created_at
FROM "users"
ORDER BY id;

\echo ''
\echo 'User count by status:'
SELECT 
  is_active,
  COUNT(*) as count
FROM "users"
GROUP BY is_active;

\echo ''
\echo 'Checking password hashes:'
SELECT 
  email,
  CASE 
    WHEN password_hash IS NULL THEN '❌ NULL'
    WHEN LENGTH(password_hash) = 60 THEN '✓ Valid (60 chars)'
    ELSE '⚠️  Invalid length: ' || LENGTH(password_hash)::text
  END as password_status
FROM "users"
ORDER BY email;

\echo ''
\echo 'Checking user profiles:'
SELECT 
  u.email,
  CASE 
    WHEN up.id IS NOT NULL THEN '✓ Has profile'
    ELSE '❌ No profile'
  END as profile_status
FROM "users" u
LEFT JOIN "user_profiles" up ON u.id = up.user_id
ORDER BY u.email;

\echo ''
\echo 'Checking user roles:'
SELECT 
  u.email,
  STRING_AGG(r.name, ', ') as roles
FROM "users" u
LEFT JOIN "user_roles" ur ON u.id = ur.user_id
LEFT JOIN "roles" r ON ur.role_id = r.id
GROUP BY u.email
ORDER BY u.email;

\echo ''
\echo '============================================'

