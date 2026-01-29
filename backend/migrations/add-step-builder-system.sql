-- ==================== STEP BUILDER SYSTEM MIGRATION ====================
-- Creates tables for the lightweight workflow/step builder system
-- Separate from Process Designer for compatibility
-- Date: 2025-01-23

-- ==================== WORKFLOWS TABLE ====================

CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  timeout_seconds INTEGER NOT NULL DEFAULT 1800,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active ON workflows(is_active);

-- ==================== WORKFLOW STEPS TABLE ====================

CREATE TABLE IF NOT EXISTS workflow_steps (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  input_source VARCHAR(100),
  output_variable VARCHAR(100),
  page_component VARCHAR(100),
  requires_user_input BOOLEAN NOT NULL DEFAULT false,
  condition JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);

COMMENT ON COLUMN workflow_steps.step_type IS 'Preset step types: file_upload, idp_process, api_call, review, analyze, store';
COMMENT ON COLUMN workflow_steps.input_source IS 'Where step gets input: previous_step, user_input, variable';
COMMENT ON COLUMN workflow_steps.page_component IS 'React component for interactive steps: IdpReviewModal, ManualValidationModal';

-- ==================== WORKFLOW EXECUTIONS TABLE ====================

CREATE TABLE IF NOT EXISTS workflow_executions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  execution_id VARCHAR(100) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  current_step INTEGER,
  context JSONB NOT NULL,
  result JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_id ON workflow_executions(execution_id);

COMMENT ON COLUMN workflow_executions.status IS 'Execution status: pending, running, waiting_user, completed, failed, cancelled';
COMMENT ON COLUMN workflow_executions.context IS 'Shared data between steps, stores all step outputs';

-- ==================== STEP EXECUTIONS TABLE ====================

CREATE TABLE IF NOT EXISTS step_executions (
  id SERIAL PRIMARY KEY,
  workflow_execution_id INTEGER NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_executions_workflow_execution_id ON step_executions(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_step_executions_step_id ON step_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_step_executions_status ON step_executions(status);

COMMENT ON COLUMN step_executions.status IS 'Step status: pending, running, waiting_user, completed, failed, skipped';

-- ==================== PERMISSIONS ====================

-- Add workflow permissions if they don't exist
INSERT INTO permissions (name, description, category, created_at, updated_at)
VALUES 
  ('workflow.view', 'View workflows', 'workflows', NOW(), NOW()),
  ('workflow.create', 'Create workflows', 'workflows', NOW(), NOW()),
  ('workflow.edit', 'Edit workflows', 'workflows', NOW(), NOW()),
  ('workflow.delete', 'Delete workflows', 'workflows', NOW(), NOW()),
  ('workflow.execute', 'Execute workflows', 'workflows', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Assign workflow permissions to admin role
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.category = 'workflows'
ON CONFLICT DO NOTHING;

-- Assign workflow permissions to user role (all except delete)
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, NOW()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'user'
  AND p.category = 'workflows'
  AND p.name != 'workflow.delete'
ON CONFLICT DO NOTHING;

-- ==================== MENU ITEM ====================

-- Add Workflows menu item
INSERT INTO menu_items (parent_id, title, icon, route, is_external, order_index, is_active, created_at, updated_at)
VALUES 
  (NULL, 'Workflows', 'Workflow', '/workflows', false, 60, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign menu to admin and user roles
INSERT INTO menu_permissions (menu_item_id, role_id, created_at)
SELECT m.id, r.id, NOW()
FROM menu_items m
CROSS JOIN roles r
WHERE m.route = '/workflows'
  AND r.name IN ('admin', 'user')
ON CONFLICT DO NOTHING;

-- ==================== COMPLETION ====================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Step Builder System migration completed successfully';
  RAISE NOTICE 'Created tables: workflows, workflow_steps, workflow_executions, step_executions';
  RAISE NOTICE 'Added 5 workflow permissions';
  RAISE NOTICE 'Added Workflows menu item';
END $$;








