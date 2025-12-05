-- Add comprehensive process properties
-- Migration for Process table enhancements

-- Add new columns to processes table
ALTER TABLE processes 
  ADD COLUMN IF NOT EXISTS process_key VARCHAR(200),
  ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS concurrency_config JSONB,
  ADD COLUMN IF NOT EXISTS error_handling_strategy VARCHAR(20) DEFAULT 'stop',
  ADD COLUMN IF NOT EXISTS input_parameters JSONB,
  ADD COLUMN IF NOT EXISTS environment_variables JSONB,
  ADD COLUMN IF NOT EXISTS global_constants JSONB,
  ADD COLUMN IF NOT EXISTS output_variables JSONB,
  ADD COLUMN IF NOT EXISTS permissions JSONB,
  ADD COLUMN IF NOT EXISTS data_classification VARCHAR(20),
  ADD COLUMN IF NOT EXISTS compliance_tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS notification_config JSONB,
  ADD COLUMN IF NOT EXISTS logging_config JSONB,
  ADD COLUMN IF NOT EXISTS metrics_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS performance_sla JSONB,
  ADD COLUMN IF NOT EXISTS documentation TEXT,
  ADD COLUMN IF NOT EXISTS changelog TEXT,
  ADD COLUMN IF NOT EXISTS related_processes JSONB,
  ADD COLUMN IF NOT EXISTS reference_urls JSONB,
  ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'dev',
  ADD COLUMN IF NOT EXISTS deployment_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_modified_by INTEGER REFERENCES users(id);

-- Set default for timeout_seconds if NULL
UPDATE processes SET timeout_seconds = 1800 WHERE timeout_seconds IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_processes_last_modified_by ON processes(last_modified_by);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_priority ON processes(priority);
CREATE INDEX IF NOT EXISTS idx_processes_environment ON processes(environment);

-- Update existing processes to have default values
UPDATE processes 
SET status = 'active' 
WHERE is_active = true AND status IS NULL;

UPDATE processes 
SET status = 'archived' 
WHERE is_active = false AND status IS NULL;

COMMENT ON COLUMN processes.process_key IS 'Unique technical identifier for the process';
COMMENT ON COLUMN processes.version IS 'Process version (e.g., v1.0, v1.1)';
COMMENT ON COLUMN processes.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN processes.status IS 'Process lifecycle status: draft, published, active, deprecated, archived';
COMMENT ON COLUMN processes.priority IS 'Execution priority: high, medium, low';
COMMENT ON COLUMN processes.concurrency_config IS 'Configuration for concurrent execution limits and queue behavior';
COMMENT ON COLUMN processes.error_handling_strategy IS 'Error handling strategy: continue, stop, custom';
COMMENT ON COLUMN processes.input_parameters IS 'Array of input parameter definitions';
COMMENT ON COLUMN processes.environment_variables IS 'Environment-specific variables';
COMMENT ON COLUMN processes.global_constants IS 'Global constants accessible throughout the process';
COMMENT ON COLUMN processes.output_variables IS 'Array of output variable definitions';
COMMENT ON COLUMN processes.permissions IS 'Access control: who can view, edit, execute, delete';
COMMENT ON COLUMN processes.data_classification IS 'Data sensitivity: public, internal, confidential, restricted';
COMMENT ON COLUMN processes.compliance_tags IS 'Compliance requirements: GDPR, HIPAA, SOC2, etc.';
COMMENT ON COLUMN processes.notification_config IS 'Notification settings for process events';
COMMENT ON COLUMN processes.logging_config IS 'Logging configuration: enabled, log level';
COMMENT ON COLUMN processes.metrics_enabled IS 'Whether to collect performance metrics';
COMMENT ON COLUMN processes.performance_sla IS 'Performance SLA: expected duration, alert thresholds';
COMMENT ON COLUMN processes.documentation IS 'Process documentation (Markdown format)';
COMMENT ON COLUMN processes.changelog IS 'Version history and changes';
COMMENT ON COLUMN processes.related_processes IS 'Array of related process references';
COMMENT ON COLUMN processes.reference_urls IS 'Array of external documentation URLs';
COMMENT ON COLUMN processes.environment IS 'Deployment environment: dev, staging, production';
COMMENT ON COLUMN processes.deployment_status IS 'Current deployment status';
COMMENT ON COLUMN processes.last_modified_by IS 'User ID of last modifier';

