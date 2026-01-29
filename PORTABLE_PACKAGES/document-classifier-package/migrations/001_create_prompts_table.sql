-- Migration 001: Create Prompts Tables
-- Description: Creates tables for storing configurable classification prompts
-- Author: Document Classifier Package
-- Date: 2025-12-24

BEGIN;

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  category VARCHAR(100),
  flow_name VARCHAR(100),
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_prompt_creator FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_active ON prompts(is_active);
CREATE INDEX idx_prompts_default ON prompts(is_default);

COMMENT ON TABLE prompts IS 'Stores configurable prompt templates for LLM operations';
COMMENT ON COLUMN prompts.category IS 'Category of prompt (e.g., document_classifier, data_extraction)';
COMMENT ON COLUMN prompts.is_default IS 'Whether this is the default prompt for its category';

-- Create prompt_variables table
CREATE TABLE IF NOT EXISTS prompt_variables (
  id SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL,
  variable_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  is_flow_variable BOOLEAN DEFAULT false,
  default_value TEXT,
  variable_type VARCHAR(50) DEFAULT 'text',
  CONSTRAINT fk_prompt_variable_prompt FOREIGN KEY (prompt_id) 
    REFERENCES prompts(id) ON DELETE CASCADE
);

CREATE INDEX idx_prompt_variables_prompt ON prompt_variables(prompt_id);

COMMENT ON TABLE prompt_variables IS 'Defines variables used in prompt templates';
COMMENT ON COLUMN prompt_variables.is_flow_variable IS 'Whether variable comes from flow execution context';
COMMENT ON COLUMN prompt_variables.variable_type IS 'Data type: text, number, boolean, array, object';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 001 completed successfully: Prompts tables created';
END $$;


