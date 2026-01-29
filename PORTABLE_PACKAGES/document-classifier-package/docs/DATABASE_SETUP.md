# Database Setup Guide

Complete guide for setting up the database schema required by the Document Classifier package.

## Table of Contents

1. [Overview](#overview)
2. [Required Tables](#required-tables)
3. [Optional Tables](#optional-tables)
4. [Migration Files](#migration-files)
5. [Seed Data](#seed-data)
6. [Prisma Setup](#prisma-setup)

## Overview

The Document Classifier can work in two modes:

- **Standalone Mode** - No database required, uses built-in default prompts
- **Database Mode** - Stores configurable prompts and connector configurations

For production use, database mode is recommended for flexibility.

## Required Tables

### Prompts Table

Stores classification prompts that can be edited without code changes.

```sql
-- Table: prompts
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
```

### Prompt Variables Table

Stores variables used in prompt templates.

```sql
-- Table: prompt_variables
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
```

## Optional Tables

### Connectors Table (for Connector Architecture)

```sql
-- Table: connectors
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

COMMENT ON COLUMN connectors.connector_type IS 'Type of connector: rest, database, llm, custom, etc.';
COMMENT ON COLUMN connectors.config IS 'JSON configuration: baseUrl, credentials, endpoints, etc.';
```

### Connector Actions Table (for Connector Architecture)

```sql
-- Table: connector_actions
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

COMMENT ON COLUMN connector_actions.operation IS 'Action operation name: chat_completion, analyze_document, etc.';
COMMENT ON COLUMN connector_actions.input_schema IS 'JSON Schema for validating input data';
COMMENT ON COLUMN connector_actions.output_schema IS 'JSON Schema for output data structure';
```

## Migration Files

### Migration 001: Create Prompts Tables

```sql
-- migrations/001_create_prompts_table.sql

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

COMMIT;
```

### Migration 002: Create Connector Tables (Optional)

```sql
-- migrations/002_create_connector_tables.sql

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

COMMIT;
```

## Seed Data

### Default Classification Prompt

```sql
-- database/seeds/default-prompts.sql

INSERT INTO prompts (
  name,
  description,
  content,
  is_active,
  is_default,
  category,
  created_by
) VALUES (
  'Document Classification Prompt',
  'Default prompt for AI-powered document classification',
  'You are a document classification expert. Analyze the following text extracted from page {{page_number}} of a document and classify it.

DOCUMENT TYPES:
{{document_types}}

EXTRACTED TEXT:
{{extracted_text}}

Respond in JSON format:
{{response_format}}',
  true,
  true,
  'document_classifier',
  1
) ON CONFLICT DO NOTHING;

-- Insert prompt variables
INSERT INTO prompt_variables (
  prompt_id,
  variable_name,
  display_name,
  description,
  is_required,
  is_flow_variable,
  variable_type
) VALUES
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'page_number',
    'Page Number',
    'Current page number being classified',
    true,
    true,
    'number'
  ),
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'extracted_text',
    'Extracted Text',
    'Text extracted from the document page',
    true,
    true,
    'text'
  ),
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'document_types',
    'Document Types',
    'List of supported document types',
    true,
    false,
    'text'
  ),
  (
    (SELECT id FROM prompts WHERE category = 'document_classifier' AND is_default = true LIMIT 1),
    'response_format',
    'Response Format',
    'Expected JSON response format',
    true,
    false,
    'text'
  )
ON CONFLICT DO NOTHING;
```

### LLM Connector Seed (for Connector Architecture)

```sql
-- database/seeds/llm-connector.sql

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
INSERT INTO connector_actions (connector_id, operation, display_name, description, is_active) VALUES
  ((SELECT id FROM connectors WHERE name = 'document_classifier'), 'analyze_document', 'Analyze Document', 'Analyze PDF or image document', true),
  ((SELECT id FROM connectors WHERE name = 'document_classifier'), 'extract_text', 'Extract Text', 'OCR text extraction from image', true),
  ((SELECT id FROM connectors WHERE name = 'document_classifier'), 'classify_text', 'Classify Text', 'Classify extracted text', true)
ON CONFLICT (connector_id, operation) DO NOTHING;
```

## Prisma Setup

### Update schema.prisma

Add these models to your `prisma/schema.prisma`:

```prisma
model Prompt {
  id          Int       @id @default(autoincrement())
  name        String    @db.VarChar(200)
  description String?   @db.Text
  content     String    @db.Text
  isActive    Boolean   @default(true) @map("is_active")
  isDefault   Boolean   @default(false) @map("is_default")
  category    String?   @db.VarChar(100)
  flowName    String?   @map("flow_name") @db.VarChar(100)
  createdBy   Int       @map("created_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  creator   User             @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  variables PromptVariable[]

  @@index([category])
  @@index([isActive])
  @@map("prompts")
}

model PromptVariable {
  id             Int     @id @default(autoincrement())
  promptId       Int     @map("prompt_id")
  variableName   String  @map("variable_name") @db.VarChar(100)
  displayName    String  @map("display_name") @db.VarChar(200)
  description    String? @db.Text
  isRequired     Boolean @default(false) @map("is_required")
  isFlowVariable Boolean @default(false) @map("is_flow_variable")
  defaultValue   String? @map("default_value") @db.Text
  variableType   String  @default("text") @map("variable_type") @db.VarChar(50)

  prompt Prompt @relation(fields: [promptId], references: [id], onDelete: Cascade)

  @@index([promptId])
  @@map("prompt_variables")
}

model Connector {
  id             Int       @id @default(autoincrement())
  name           String    @unique @db.VarChar(200)
  displayName    String?   @map("display_name") @db.VarChar(200)
  description    String?   @db.Text
  connectorType  String    @map("connector_type") @db.VarChar(50)
  config         Json      @default("{}")
  isActive       Boolean   @default(true) @map("is_active")
  createdBy      Int       @map("created_by")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  creator User              @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  actions ConnectorAction[]

  @@index([connectorType])
  @@index([isActive])
  @@map("connectors")
}

model ConnectorAction {
  id           Int      @id @default(autoincrement())
  connectorId  Int      @map("connector_id")
  operation    String   @db.VarChar(100)
  displayName  String?  @map("display_name") @db.VarChar(200)
  description  String?  @db.Text
  inputSchema  Json?    @map("input_schema")
  outputSchema Json?    @map("output_schema")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  connector Connector @relation(fields: [connectorId], references: [id], onDelete: Cascade)

  @@unique([connectorId, operation])
  @@index([connectorId])
  @@index([operation])
  @@map("connector_actions")
}
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Migrations

```bash
# Using Prisma
npx prisma migrate dev --name add_document_classifier_tables

# Or manually
psql $DATABASE_URL -f migrations/001_create_prompts_table.sql
psql $DATABASE_URL -f migrations/002_create_connector_tables.sql
```

### Seed Database

```bash
psql $DATABASE_URL -f database/seeds/default-prompts.sql
psql $DATABASE_URL -f database/seeds/llm-connector.sql
```

## Verification

### Check Tables

```sql
-- List all tables
\dt

-- Check prompts
SELECT * FROM prompts WHERE category = 'document_classifier';

-- Check connectors
SELECT * FROM connectors WHERE connector_type = 'llm';

-- Check connector actions
SELECT ca.*, c.name as connector_name 
FROM connector_actions ca
JOIN connectors c ON ca.connector_id = c.id
WHERE c.name IN ('mulesoft_llm', 'document_classifier');
```

### Test Database Connection

```typescript
import prisma from './config/database';

async function testDb() {
  const prompt = await prisma.prompt.findFirst({
    where: { category: 'document_classifier' },
  });
  console.log('Found prompt:', prompt?.name);

  const connector = await prisma.connector.findFirst({
    where: { connectorType: 'llm' },
    include: { actions: true },
  });
  console.log('Found connector:', connector?.name);
  console.log('Actions:', connector?.actions.map(a => a.operation));
}

testDb();
```

## Updating Configuration

### Update LLM Connector Config

```sql
UPDATE connectors 
SET config = jsonb_set(
  config,
  '{baseUrl}',
  '"http://your-production-url:8081"'
)
WHERE name = 'mulesoft_llm';

UPDATE connectors 
SET config = jsonb_set(
  config,
  '{username}',
  '"your-username"'
)
WHERE name = 'mulesoft_llm';
```

### Update Classification Prompt

```sql
UPDATE prompts
SET content = 'Your new prompt template with {{variables}}'
WHERE category = 'document_classifier' 
AND is_default = true;
```

## Troubleshooting

### Issue: Foreign key constraint fails

**Solution:** Ensure users table exists and has at least one user (id=1)

```sql
-- Create admin user if needed
INSERT INTO users (id, email, password, first_name, last_name)
VALUES (1, 'admin@example.com', 'hashed_password', 'Admin', 'User')
ON CONFLICT (id) DO NOTHING;
```

### Issue: Prisma schema doesn't match database

**Solution:** Run introspection and regenerate

```bash
npx prisma db pull
npx prisma generate
```

---

**Database setup complete!** 🎉 Your classifier can now use configurable prompts and connectors.


