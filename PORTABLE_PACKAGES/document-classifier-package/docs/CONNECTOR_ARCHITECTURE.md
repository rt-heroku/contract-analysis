# Connector Architecture Migration Guide

This guide explains how to adapt the Document Classifier package to work with a **connector-based execution engine** architecture.

## Table of Contents

1. [Understanding the Connector Pattern](#understanding-the-connector-pattern)
2. [Architecture Comparison](#architecture-comparison)
3. [Migration Steps](#migration-steps)
4. [Creating the LLM Connector](#creating-the-llm-connector)
5. [Wrapping Services as Connector Actions](#wrapping-services-as-connector-actions)
6. [Database Setup](#database-setup)
7. [Testing](#testing)
8. [Complete Example](#complete-example)

## Understanding the Connector Pattern

### What is the Connector Pattern?

The connector pattern abstracts external integrations behind a unified interface. Instead of services calling APIs directly, they execute **connector actions** through a **connector executor**.

```
Traditional Architecture:
Service → API Client → External API

Connector Architecture:
Service → Connector Executor → Connector → External API
```

### Benefits

- ✅ **Centralized Configuration** - All connector configs in database
- ✅ **Runtime Flexibility** - Change APIs without code deployment
- ✅ **Reusability** - Same connector across multiple flows
- ✅ **Monitoring** - Track all external calls in one place
- ✅ **Security** - Credentials stored securely in database
- ✅ **Testing** - Easy to mock connectors for testing

## Architecture Comparison

### Current Architecture (Direct API Calls)

```typescript
// classifier.service.ts
export class ClassifierService {
  private async createClient(): Promise<AxiosInstance> {
    const config = await getMuleSoftConfig();
    return axios.create({
      baseURL: config.baseUrl,
      auth: { username: config.username, password: config.password }
    });
  }

  async classifyDocument(request: ClassificationRequest) {
    const client = await this.clientPromise;
    const response = await client.post('/v1/chat/completions', {
      model: 'claude-sonnet-4',
      messages: [{ role: 'user', content: prompt }]
    });
    return this.parseResponse(response.data);
  }
}
```

### Connector Architecture (Unified Execution)

```typescript
// classifier.service.ts (migrated)
export class ClassifierService {
  constructor(private connectorExecutor: ConnectorExecutor) {}

  async classifyDocument(request: ClassificationRequest) {
    const prompt = await this.buildPrompt(request);
    
    // Execute through connector instead of direct API call
    const response = await this.connectorExecutor.execute({
      connectorId: 1, // LLM Connector ID
      operation: 'chat_completion',
      inputData: {
        model: 'claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1
      }
    });
    
    return this.parseResponse(response.content);
  }
}
```

## Migration Steps

### Step 1: Copy Connector Executor Base

Copy the connector executor pattern from your existing project:

```typescript
// src/execution-engine/connectors/ConnectorExecutor.ts
export interface ConnectorExecutionContext {
  connectorId?: number;
  connector?: any;
  connectorAction: any;
  inputData: any;
  executionContext: any;
}

export class ConnectorExecutor {
  async execute(context: ConnectorExecutionContext): Promise<any> {
    const { connector, connectorAction, inputData } = context;
    
    switch (connector.connectorType) {
      case 'rest':
        return await this.executeRestAction(connector, connectorAction, inputData);
      case 'llm':
        return await this.executeLLMAction(connector, connectorAction, inputData);
      default:
        throw new Error(`Unsupported connector type: ${connector.connectorType}`);
    }
  }

  private async executeRestAction(connector: any, action: any, inputData: any) {
    // REST API execution logic
  }

  private async executeLLMAction(connector: any, action: any, inputData: any) {
    // LLM API execution logic (add this new type)
  }
}
```

### Step 2: Add LLM Connector Type

Extend your connector executor to support LLM operations:

```typescript
// src/execution-engine/connectors/ConnectorExecutor.ts

private async executeLLMAction(
  connector: any, 
  action: any, 
  inputData: any
): Promise<any> {
  const config = connector.config;
  
  // Build axios client
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout || 180000,
    headers: { 'Content-Type': 'application/json' }
  });

  // Add auth if configured
  if (config.username && config.password) {
    client.defaults.auth = {
      username: config.username,
      password: config.password
    };
  }

  // Execute based on operation
  switch (action.operation) {
    case 'chat_completion': {
      const endpoint = config.endpoints?.llmChatCompletions || '/v1/chat/completions';
      const response = await client.post(endpoint, {
        model: inputData.model || 'claude-sonnet-4',
        messages: inputData.messages,
        max_tokens: inputData.max_tokens || 500,
        temperature: inputData.temperature || 0.1,
        ...inputData.additionalParams
      });

      // Handle different response formats
      const data = response.data;
      const content = 
        data?.choices?.[0]?.message?.content ||
        data?.response ||
        data?.content ||
        data;

      return {
        success: true,
        operation: 'chat_completion',
        content,
        usage: data?.usage,
        model: data?.model
      };
    }

    case 'completion': {
      // Similar for text completion
      const response = await client.post('/v1/completions', inputData);
      return { success: true, ...response.data };
    }

    default:
      throw new Error(`Unsupported LLM operation: ${action.operation}`);
  }
}
```

### Step 3: Create Database Migrations

#### A. Connectors Table (if not exists)

```sql
-- migrations/001_create_connectors.sql

CREATE TABLE IF NOT EXISTS connectors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200),
  description TEXT,
  connector_type VARCHAR(50) NOT NULL, -- 'rest', 'database', 'llm', etc.
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
```

#### B. Connector Actions Table (if not exists)

```sql
-- migrations/002_create_connector_actions.sql

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
```

### Step 4: Seed LLM Connector Configuration

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
    "username": "admin",
    "password": "admin",
    "timeout": 180000,
    "endpoints": {
      "llmChatCompletions": "/v1/chat/completions",
      "completion": "/v1/completions"
    }
  }'::jsonb,
  true,
  1
) ON CONFLICT DO NOTHING;

-- Insert LLM Connector Actions
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
      "model": { "type": "string", "default": "claude-sonnet-4" },
      "messages": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "role": { "type": "string", "enum": ["system", "user", "assistant"] },
            "content": { "type": "string" }
          },
          "required": ["role", "content"]
        }
      },
      "max_tokens": { "type": "number", "default": 500 },
      "temperature": { "type": "number", "default": 0.1 }
    },
    "required": ["messages"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "content": { "type": "string" },
      "usage": { "type": "object" },
      "model": { "type": "string" }
    }
  }'::jsonb,
  true
) ON CONFLICT DO NOTHING;
```

### Step 5: Update Classifier Service

Now update the classifier service to use the connector:

```typescript
// services/classifier.service.ts

import { ConnectorExecutor } from '../../../execution-engine/connectors/ConnectorExecutor';
import prisma from '../../../config/database';
import {
  ClassificationRequest,
  ClassificationResponse,
} from '../types/document-classifier.types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DOCUMENT_CLASSIFIER_CATEGORY = 'document_classifier';

export class ClassifierService {
  private connectorExecutor: ConnectorExecutor;
  private llmConnectorId: number | null = null;

  constructor() {
    this.connectorExecutor = new ConnectorExecutor();
  }

  /**
   * Load LLM connector ID from database
   */
  private async getLLMConnectorId(): Promise<number> {
    if (this.llmConnectorId) {
      return this.llmConnectorId;
    }

    const connector = await prisma.connector.findFirst({
      where: {
        connectorType: 'llm',
        isActive: true,
      },
    });

    if (!connector) {
      throw new Error('No active LLM connector found');
    }

    this.llmConnectorId = connector.id;
    return connector.id;
  }

  async classifyDocument(request: ClassificationRequest): Promise<ClassificationResponse> {
    const { extractedText, pageNumber, textLength } = request;

    if (textLength < 20) {
      return {
        documentType: textLength === 0 ? 'blank' : 'unknown',
        confidence: textLength === 0 ? 100 : 50,
        reasoning: textLength === 0 ? 'No text found on page' : 'Insufficient text for classification',
      };
    }

    try {
      const prompt = await this.buildPrompt(extractedText, pageNumber);
      const connectorId = await this.getLLMConnectorId();

      // Load connector and action
      const connector = await prisma.connector.findUnique({
        where: { id: connectorId },
      });

      const action = await prisma.connectorAction.findFirst({
        where: {
          connectorId,
          operation: 'chat_completion',
          isActive: true,
        },
      });

      if (!connector || !action) {
        throw new Error('LLM connector or action not found');
      }

      // Execute through connector
      const response = await this.connectorExecutor.execute({
        connector,
        connectorAction: action,
        inputData: {
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.1,
        },
        executionContext: {},
      });

      return this.parseResponse(response.content);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown classification error';
      console.error('Classification error:', message);
      return {
        documentType: 'unknown',
        confidence: 0,
        reasoning: `Classification failed: ${message}`,
      };
    }
  }

  // ... rest of methods remain the same (buildPrompt, parseResponse, etc.)
}
```

### Step 6: Update Document Analyzer Service (Optional)

The document analyzer service can remain mostly unchanged since it uses the classifier service. However, you might want to pass the connector executor:

```typescript
// services/document-analyzer.service.ts

import { ConnectorExecutor } from '../../../execution-engine/connectors/ConnectorExecutor';
import { ClassifierService } from './classifier.service';
import { OCRService } from './ocr.service';

export class DocumentAnalyzerService {
  private classifier: ClassifierService;

  constructor(connectorExecutor?: ConnectorExecutor) {
    this.classifier = new ClassifierService();
    // If you want to inject connector executor, modify ClassifierService constructor
  }

  // ... rest remains the same
}
```

## Creating the LLM Connector

### Full Connector Example

Create a dedicated connector file:

```typescript
// src/packages/document-classifier/connectors/LLMConnector.ts

import axios, { AxiosInstance } from 'axios';
import { ConnectorExecutor } from '../../../execution-engine/connectors/ConnectorExecutor';

export interface LLMConnectorConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  apiKey?: string;
  timeout?: number;
  endpoints?: {
    llmChatCompletions?: string;
    completion?: string;
  };
}

export class LLMConnector {
  private client: AxiosInstance;
  private config: LLMConnectorConfig;

  constructor(config: LLMConnectorConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    const axiosConfig: any = {
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 180000,
      headers: { 'Content-Type': 'application/json' },
    };

    // Auth via basic auth
    if (this.config.username && this.config.password) {
      axiosConfig.auth = {
        username: this.config.username,
        password: this.config.password,
      };
    }

    // Auth via API key (OpenAI style)
    if (this.config.apiKey) {
      axiosConfig.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return axios.create(axiosConfig);
  }

  async chatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }): Promise<any> {
    const endpoint = this.config.endpoints?.llmChatCompletions || '/v1/chat/completions';
    
    const response = await this.client.post(endpoint, {
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens || 500,
      temperature: params.temperature || 0.1,
    });

    // Handle different response formats
    const data = response.data;
    return {
      content: data?.choices?.[0]?.message?.content || data?.response || data?.content,
      usage: data?.usage,
      model: data?.model,
    };
  }

  async completion(params: {
    model: string;
    prompt: string;
    max_tokens?: number;
    temperature?: number;
  }): Promise<any> {
    const endpoint = this.config.endpoints?.completion || '/v1/completions';
    
    const response = await this.client.post(endpoint, {
      model: params.model,
      prompt: params.prompt,
      max_tokens: params.max_tokens || 500,
      temperature: params.temperature || 0.1,
    });

    return {
      content: response.data?.choices?.[0]?.text || response.data?.response,
      usage: response.data?.usage,
      model: response.data?.model,
    };
  }
}
```

## Wrapping Services as Connector Actions

### Create Connector Wrapper

```typescript
// src/packages/document-classifier/connectors/DocumentClassifierConnector.ts

import { ClassifierService } from '../services/classifier.service';
import { DocumentAnalyzerService } from '../services/document-analyzer.service';
import { OCRService } from '../services/ocr.service';

/**
 * Connector wrapper for Document Classifier
 * Exposes services as connector actions
 */
export class DocumentClassifierConnector {
  private classifier: ClassifierService;
  private analyzer: DocumentAnalyzerService;

  constructor() {
    this.classifier = new ClassifierService();
    this.analyzer = new DocumentAnalyzerService();
  }

  /**
   * Connector Action: analyze_document
   */
  async analyzeDocument(inputData: {
    filePath: string;
    language?: string;
    useAI?: boolean;
    includeMetadata?: boolean;
  }): Promise<any> {
    return await this.analyzer.analyzeDocument(inputData.filePath, {
      language: inputData.language || 'eng',
      useAI: inputData.useAI !== false,
      includeMetadata: inputData.includeMetadata !== false,
    });
  }

  /**
   * Connector Action: extract_text
   */
  async extractText(inputData: {
    imagePath: string;
    language?: string;
  }): Promise<any> {
    return await OCRService.extractText(inputData.imagePath, inputData.language || 'eng');
  }

  /**
   * Connector Action: classify_text
   */
  async classifyText(inputData: {
    text: string;
    pageNumber?: number;
  }): Promise<any> {
    return await this.classifier.classifyDocument({
      extractedText: inputData.text,
      pageNumber: inputData.pageNumber || 1,
      textLength: inputData.text.length,
    });
  }
}
```

### Register Connector Actions in Database

```sql
-- Seed document classifier connector
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
) ON CONFLICT DO NOTHING;

-- Register actions
INSERT INTO connector_actions (connector_id, operation, display_name, description, is_active) VALUES
  ((SELECT id FROM connectors WHERE name = 'document_classifier'), 'analyze_document', 'Analyze Document', 'Analyze PDF or image document', true),
  ((SELECT id FROM connectors WHERE name = 'document_classifier'), 'extract_text', 'Extract Text', 'OCR text extraction from image', true),
  ((SELECT id FROM connectors WHERE name = 'document_classifier'), 'classify_text', 'Classify Text', 'Classify extracted text', true)
ON CONFLICT DO NOTHING;
```

## Testing

### Test Connector Execution

```typescript
import { ConnectorExecutor } from './execution-engine/connectors/ConnectorExecutor';
import prisma from './config/database';

async function testClassifier() {
  const executor = new ConnectorExecutor();

  // Load connector
  const connector = await prisma.connector.findFirst({
    where: { name: 'document_classifier' },
  });

  const action = await prisma.connectorAction.findFirst({
    where: {
      connectorId: connector!.id,
      operation: 'classify_text',
    },
  });

  // Execute
  const result = await executor.execute({
    connector,
    connectorAction: action,
    inputData: {
      text: 'Invoice #12345\nDate: 2025-01-15\nTotal: $500.00',
      pageNumber: 1,
    },
    executionContext: {},
  });

  console.log('Classification result:', result);
}

testClassifier();
```

## Complete Example

See [examples/connector-integration/](../examples/connector-integration/) for complete working examples.

## Benefits of Connector Architecture

After migration, you get:

✅ **Centralized Config** - Change LLM endpoint in database, no code deploy  
✅ **Multiple Providers** - Support OpenAI, Anthropic, MuleSoft in parallel  
✅ **A/B Testing** - Route 50% to Claude, 50% to GPT-4  
✅ **Monitoring** - Track all LLM calls, costs, latency  
✅ **Failover** - Automatic fallback to backup LLM provider  
✅ **Security** - Credentials encrypted in database  
✅ **Testing** - Mock connectors easily  

## Next Steps

- 📖 Review [Configuration Guide](./CONFIGURATION.md) for connector configuration
- 🧪 Check [examples/connector-integration/](../examples/connector-integration/) for code samples
- 📚 Read [API Reference](./API_REFERENCE.md) for connector action schemas

---

**Connector migration complete!** 🎉 Your document classifier now uses the connector architecture.


