-- Seed permissions and assign them to roles
-- This script creates a comprehensive permission system

-- Insert permissions
INSERT INTO "permissions" (name, description, category, created_at, updated_at) VALUES
-- Profile & Account
('profile.view', 'View own profile', 'Profile', NOW(), NOW()),
('profile.edit', 'Edit own profile', 'Profile', NOW(), NOW()),
('profile.change_password', 'Change own password', 'Profile', NOW(), NOW()),
('profile.request_permissions', 'Request permission upgrades', 'Profile', NOW(), NOW()),

-- Document Processing
('documents.upload', 'Upload documents', 'Documents', NOW(), NOW()),
('documents.download', 'Download documents', 'Documents', NOW(), NOW()),
('documents.delete', 'Delete documents', 'Documents', NOW(), NOW()),
('documents.process', 'Process documents with IDP', 'Documents', NOW(), NOW()),
('documents.analyze', 'Analyze processed documents', 'Documents', NOW(), NOW()),

-- Analysis & History
('analysis.view', 'View analysis results', 'Analysis', NOW(), NOW()),
('analysis.create', 'Create new analysis', 'Analysis', NOW(), NOW()),
('analysis.delete', 'Delete analysis records', 'Analysis', NOW(), NOW()),
('analysis.share', 'Share analysis with other users', 'Analysis', NOW(), NOW()),
('analysis.rerun', 'Re-run analysis', 'Analysis', NOW(), NOW()),

-- Prompts
('prompts.view', 'View prompts', 'Prompts', NOW(), NOW()),
('prompts.create', 'Create new prompts', 'Prompts', NOW(), NOW()),
('prompts.edit', 'Edit prompts', 'Prompts', NOW(), NOW()),
('prompts.delete', 'Delete prompts', 'Prompts', NOW(), NOW()),
('prompts.set_default', 'Set default prompt', 'Prompts', NOW(), NOW()),

-- Flows
('flows.view', 'View flows', 'Flows', NOW(), NOW()),
('flows.create', 'Create new flows', 'Flows', NOW(), NOW()),
('flows.edit', 'Edit flows', 'Flows', NOW(), NOW()),
('flows.delete', 'Delete flows', 'Flows', NOW(), NOW()),

-- Admin - User Management
('admin.users.view', 'View all users', 'Admin', NOW(), NOW()),
('admin.users.create', 'Create new users', 'Admin', NOW(), NOW()),
('admin.users.edit', 'Edit user accounts', 'Admin', NOW(), NOW()),
('admin.users.delete', 'Delete user accounts', 'Admin', NOW(), NOW()),

-- Admin - Role Management
('admin.roles.view', 'View all roles', 'Admin', NOW(), NOW()),
('admin.roles.create', 'Create new roles', 'Admin', NOW(), NOW()),
('admin.roles.edit', 'Edit roles and permissions', 'Admin', NOW(), NOW()),
('admin.roles.delete', 'Delete roles', 'Admin', NOW(), NOW()),

-- Admin - Menu Management
('admin.menu.view', 'View menu configuration', 'Admin', NOW(), NOW()),
('admin.menu.create', 'Create menu items', 'Admin', NOW(), NOW()),
('admin.menu.edit', 'Edit menu items', 'Admin', NOW(), NOW()),
('admin.menu.delete', 'Delete menu items', 'Admin', NOW(), NOW()),
('admin.menu.assign', 'Assign menu items to roles', 'Admin', NOW(), NOW()),

-- Admin - System
('admin.logs.view', 'View system logs', 'Admin', NOW(), NOW()),
('admin.settings.view', 'View system settings', 'Admin', NOW(), NOW()),
('admin.settings.edit', 'Edit system settings', 'Admin', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Get role IDs
DO $$
DECLARE
  admin_role_id INT;
  user_role_id INT;
  viewer_role_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM "roles" WHERE name = 'admin';
  SELECT id INTO user_role_id FROM "roles" WHERE name = 'user';
  SELECT id INTO viewer_role_id FROM "roles" WHERE name = 'viewer';

  -- Admin gets ALL permissions
  INSERT INTO "role_permissions" (role_id, permission_id, created_at)
  SELECT admin_role_id, id, NOW()
  FROM "permissions"
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- User permissions
  INSERT INTO "role_permissions" (role_id, permission_id, created_at)
  SELECT user_role_id, id, NOW()
  FROM "permissions"
  WHERE name IN (
    'profile.view',
    'profile.edit',
    'profile.change_password',
    'documents.upload',
    'documents.download',
    'documents.delete',
    'documents.process',
    'documents.analyze',
    'analysis.view',
    'analysis.create',
    'analysis.share',
    'analysis.rerun',
    'prompts.view',
    'prompts.create',
    'prompts.edit',
    'prompts.delete',
    'flows.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Viewer permissions (read-only + profile edit + change password)
  INSERT INTO "role_permissions" (role_id, permission_id, created_at)
  SELECT viewer_role_id, id, NOW()
  FROM "permissions"
  WHERE name IN (
    'profile.view',
    'profile.edit',
    'profile.change_password',
    'profile.request_permissions',
    'documents.download',
    'analysis.view',
    'prompts.view'
  )
  ON CONFLICT (role_id, permission_id) DO NOTHING;

END $$;

-- Display summary
SELECT 
  r.name as role,
  COUNT(rp.id) as permission_count,
  STRING_AGG(p.name, ', ') as permissions
FROM "roles" r
LEFT JOIN "role_permissions" rp ON r.id = rp.role_id
LEFT JOIN "permissions" p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;

