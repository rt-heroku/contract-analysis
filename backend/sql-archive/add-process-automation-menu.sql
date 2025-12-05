-- Add permissions for process automation
INSERT INTO "permissions" (name, description, category, created_at, updated_at)
VALUES
  ('processes.view', 'View processes', 'Processes', NOW(), NOW()),
  ('processes.create', 'Create processes', 'Processes', NOW(), NOW()),
  ('processes.edit', 'Edit processes', 'Processes', NOW(), NOW()),
  ('processes.delete', 'Delete processes', 'Processes', NOW(), NOW()),
  ('processes.execute', 'Execute processes', 'Processes', NOW(), NOW()),
  ('actions.view', 'View actions', 'Actions', NOW(), NOW()),
  ('actions.create', 'Create actions', 'Actions', NOW(), NOW()),
  ('actions.edit', 'Edit actions', 'Actions', NOW(), NOW()),
  ('executions.view', 'View executions', 'Executions', NOW(), NOW()),
  ('executions.retry', 'Retry failed executions', 'Executions', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Add Process Automation parent menu item (after IDP Executions, order 8)
INSERT INTO "menu_items" (parent_id, title, icon, route, is_external, order_index, is_active, created_at, updated_at)
VALUES
  (NULL, 'Process Automation', 'Workflow', NULL, false, 8, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the parent menu ID
DO $$
DECLARE
  parent_menu_id INT;
BEGIN
  SELECT id INTO parent_menu_id FROM "menu_items" WHERE title = 'Process Automation' LIMIT 1;
  
  -- Add child menu items
  INSERT INTO "menu_items" (parent_id, title, icon, route, is_external, order_index, is_active, created_at, updated_at)
  VALUES
    (parent_menu_id, 'Processes', 'GitBranch', '/processes', false, 1, true, NOW(), NOW()),
    (parent_menu_id, 'Actions', 'Zap', '/actions', false, 2, true, NOW(), NOW()),
    (parent_menu_id, 'Executions', 'Activity', '/executions', false, 3, true, NOW(), NOW())
  ON CONFLICT DO NOTHING;
END $$;

-- Grant permissions to admin role
INSERT INTO "role_permissions" (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM "roles" r, "permissions" p
WHERE r.name = 'admin'
  AND p.name IN (
    'processes.view', 'processes.create', 'processes.edit', 'processes.delete', 'processes.execute',
    'actions.view', 'actions.create', 'actions.edit',
    'executions.view', 'executions.retry'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant view permissions to user role
INSERT INTO "role_permissions" (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM "roles" r, "permissions" p
WHERE r.name = 'user'
  AND p.name IN (
    'processes.view', 'processes.create', 'processes.execute',
    'actions.view',
    'executions.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant view-only permissions to viewer role
INSERT INTO "role_permissions" (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM "roles" r, "permissions" p
WHERE r.name = 'viewer'
  AND p.name IN ('processes.view', 'actions.view', 'executions.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant menu permissions to all roles
DO $$
DECLARE
  parent_menu_id INT;
  processes_menu_id INT;
  actions_menu_id INT;
  executions_menu_id INT;
BEGIN
  SELECT id INTO parent_menu_id FROM "menu_items" WHERE title = 'Process Automation' LIMIT 1;
  SELECT id INTO processes_menu_id FROM "menu_items" WHERE title = 'Processes' AND parent_id = parent_menu_id LIMIT 1;
  SELECT id INTO actions_menu_id FROM "menu_items" WHERE title = 'Actions' AND parent_id = parent_menu_id LIMIT 1;
  SELECT id INTO executions_menu_id FROM "menu_items" WHERE title = 'Executions' AND parent_id = parent_menu_id LIMIT 1;
  
  -- Grant to admin, user, and viewer roles
  INSERT INTO "menu_permissions" (menu_item_id, role_id, created_at)
  SELECT m.id, r.id, NOW()
  FROM (VALUES (parent_menu_id), (processes_menu_id), (actions_menu_id), (executions_menu_id)) AS m(id)
  CROSS JOIN "roles" r
  WHERE r.name IN ('admin', 'user', 'viewer')
  ON CONFLICT (menu_item_id, role_id) DO NOTHING;
END $$;

