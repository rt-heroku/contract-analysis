-- Migration 002: Create Connector Tables (Optional - for Connector Architecture)
-- Description: Creates tables for connector-based architecture
-- Author: Document Classifier Package
-- Date: 2025-12-24

BEGIN;

-- Create connectors table
CREATE TABLE IF NOT EXISTS connectors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  display_name VARCHAR(200),
  description TEXT,
  connector_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_connector_creator FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_connectors_type ON connectors(connector_type);
CREATE INDEX idx_connectors_active ON connectors(is_active);

COMMENT ON TABLE connectors IS 'External system connectors (REST, Database, LLM, etc.)';
COMMENT ON COLUMN connectors.connector_type IS 'Type: rest, database, llm, s3, sftp, custom';
COMMENT ON COLUMN connectors.config IS 'JSON config: baseUrl, credentials, endpoints, etc.';

-- Create connector_actions table
CREATE TABLE IF NOT EXISTS connector_actions (
  id SERIAL PRIMARY KEY,
  connector_id INTEGER NOT NULL,
  operation VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  input_schema JSONB,
  output_schema JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_connector_action_connector FOREIGN KEY (connector_id) 
    REFERENCES connectors(id) ON DELETE CASCADE,
  CONSTRAINT uq_connector_operation UNIQUE (connector_id, operation)
);

CREATE INDEX idx_connector_actions_connector ON connector_actions(connector_id);
CREATE INDEX idx_connector_actions_operation ON connector_actions(operation);

COMMENT ON TABLE connector_actions IS 'Actions/operations available for each connector';
COMMENT ON COLUMN connector_actions.operation IS 'Action name: chat_completion, query, upload, etc.';
COMMENT ON COLUMN connector_actions.input_schema IS 'JSON Schema for input validation';
COMMENT ON COLUMN connector_actions.output_schema IS 'JSON Schema for output structure';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 002 completed successfully: Connector tables created';
END $$;


