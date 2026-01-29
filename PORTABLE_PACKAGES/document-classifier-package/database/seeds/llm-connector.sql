-- Seed Data: LLM and Document Classifier Connectors
-- Description: Inserts connector configurations for LLM API and Document Classifier
-- Date: 2025-12-24

BEGIN;

-- Insert LLM Connector
INSERT INTO connectors (
  name,
  display_name,
  description,
  connector_type,
  config,
  is_active,
  created_by
) VALUES (
  'mulesoft_llm',
  'MuleSoft LLM Inference API',
  'Claude and other LLM models via MuleSoft',
  'llm',
  '{
    "baseUrl": "http://localhost:8081",
    "username": "",
    "password": "",
    "timeout": 180000,
    "endpoints": {
      "llmChatCompletions": "/v1/chat/completions",
      "completion": "/v1/completions"
    }
  }'::jsonb,
  true,
  1
) ON CONFLICT (name) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = NOW();

-- Insert Chat Completion Action
INSERT INTO connector_actions (
  connector_id,
  operation,
  display_name,
  description,
  input_schema,
  output_schema,
  is_active
) VALUES (
  (SELECT id FROM connectors WHERE name = 'mulesoft_llm'),
  'chat_completion',
  'Chat Completion',
  'Generate chat completion using LLM',
  '{
    "type": "object",
    "properties": {
      "model": {
        "type": "string",
        "default": "claude-sonnet-4",
        "description": "LLM model to use"
      },
      "messages": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "role": {
              "type": "string",
              "enum": ["system", "user", "assistant"]
            },
            "content": {
              "type": "string"
            }
          },
          "required": ["role", "content"]
        }
      },
      "max_tokens": {
        "type": "number",
        "default": 500
      },
      "temperature": {
        "type": "number",
        "default": 0.1,
        "minimum": 0,
        "maximum": 2
      }
    },
    "required": ["messages"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean"
      },
      "content": {
        "type": "string"
      },
      "usage": {
        "type": "object"
      },
      "model": {
        "type": "string"
      }
    }
  }'::jsonb,
  true
) ON CONFLICT (connector_id, operation) DO UPDATE SET
  input_schema = EXCLUDED.input_schema,
  output_schema = EXCLUDED.output_schema,
  updated_at = NOW();

-- Insert Text Completion Action
INSERT INTO connector_actions (
  connector_id,
  operation,
  display_name,
  description,
  input_schema,
  output_schema,
  is_active
) VALUES (
  (SELECT id FROM connectors WHERE name = 'mulesoft_llm'),
  'completion',
  'Text Completion',
  'Generate text completion using LLM',
  '{
    "type": "object",
    "properties": {
      "model": {
        "type": "string",
        "default": "claude-sonnet-4"
      },
      "prompt": {
        "type": "string"
      },
      "max_tokens": {
        "type": "number",
        "default": 500
      },
      "temperature": {
        "type": "number",
        "default": 0.1
      }
    },
    "required": ["prompt"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean"
      },
      "content": {
        "type": "string"
      }
    }
  }'::jsonb,
  true
) ON CONFLICT (connector_id, operation) DO UPDATE SET
  input_schema = EXCLUDED.input_schema,
  output_schema = EXCLUDED.output_schema,
  updated_at = NOW();

-- Insert Document Classifier Connector
INSERT INTO connectors (
  name,
  display_name,
  description,
  connector_type,
  config,
  is_active,
  created_by
) VALUES (
  'document_classifier',
  'Document Classifier',
  'OCR and AI-powered document classification',
  'custom',
  '{}'::jsonb,
  true,
  1
) ON CONFLICT (name) DO NOTHING;

-- Insert Document Classifier Actions
INSERT INTO connector_actions (connector_id, operation, display_name, description, input_schema, output_schema, is_active) VALUES
  (
    (SELECT id FROM connectors WHERE name = 'document_classifier'),
    'analyze_document',
    'Analyze Document',
    'Analyze PDF or image document with OCR and AI classification',
    '{
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "Path to document file"
        },
        "language": {
          "type": "string",
          "default": "eng",
          "description": "OCR language code"
        },
        "useAI": {
          "type": "boolean",
          "default": true,
          "description": "Whether to use AI classification"
        },
        "includeMetadata": {
          "type": "boolean",
          "default": true,
          "description": "Include detailed metadata in response"
        }
      },
      "required": ["filePath"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "success": {
          "type": "boolean"
        },
        "totalPages": {
          "type": "number"
        },
        "pages": {
          "type": "array"
        },
        "summary": {
          "type": "object"
        }
      }
    }'::jsonb,
    true
  ),
  (
    (SELECT id FROM connectors WHERE name = 'document_classifier'),
    'extract_text',
    'Extract Text',
    'OCR text extraction from image',
    '{
      "type": "object",
      "properties": {
        "imagePath": {
          "type": "string"
        },
        "language": {
          "type": "string",
          "default": "eng"
        }
      },
      "required": ["imagePath"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        },
        "confidence": {
          "type": "number"
        }
      }
    }'::jsonb,
    true
  ),
  (
    (SELECT id FROM connectors WHERE name = 'document_classifier'),
    'classify_text',
    'Classify Text',
    'Classify extracted text using AI',
    '{
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        },
        "pageNumber": {
          "type": "number",
          "default": 1
        }
      },
      "required": ["text"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "documentType": {
          "type": "string"
        },
        "confidence": {
          "type": "number"
        },
        "reasoning": {
          "type": "string"
        }
      }
    }'::jsonb,
    true
  )
ON CONFLICT (connector_id, operation) DO UPDATE SET
  input_schema = EXCLUDED.input_schema,
  output_schema = EXCLUDED.output_schema,
  updated_at = NOW();

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'LLM and Document Classifier connectors seeded successfully';
END $$;


