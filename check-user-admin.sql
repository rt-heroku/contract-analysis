-- Check if your user has Admin role
-- Replace YOUR_EMAIL with your actual email address

SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    ur.created_at as role_assigned_date
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id  
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'YOUR_EMAIL'  -- CHANGE THIS TO YOUR EMAIL
ORDER BY r.name;

-- To see all admin users:
SELECT 
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    r.name as role
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name = 'admin';
