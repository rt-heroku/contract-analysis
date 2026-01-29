# Configuration Guide

Complete configuration options for the Document Classifier package.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Configuration File](#configuration-file)
3. [Database Configuration](#database-configuration)
4. [LLM API Configuration](#llm-api-configuration)
5. [OCR Configuration](#ocr-configuration)
6. [Performance Tuning](#performance-tuning)

## Environment Variables

### Basic Configuration

```bash
# LLM API Endpoint
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_USERNAME=admin
MULESOFT_API_PASSWORD=your-password
MULESOFT_API_TIMEOUT=180000

# Database (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Node.js
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096
```

### Advanced Configuration

```bash
# Tesseract OCR
TESSDATA_PREFIX=/custom/path/to/tessdata
TESSERACT_LOGGING=1

# PDF Processing
PDF_SCALE=2.0
PDF_MAX_PAGES=100

# Classification
CLASSIFICATION_BATCH_SIZE=5
CLASSIFICATION_MIN_TEXT_LENGTH=20
DEFAULT_LLM_MODEL=claude-sonnet-4-20250514

# Cache
ENABLE_CACHE=true
CACHE_TTL=3600
```

## Configuration File

### Create config/document-classifier.ts

```typescript
export interface DocumentClassifierConfig {
  llm: {
    baseUrl: string;
    username?: string;
    password?: string;
    apiKey?: string;
    timeout: number;
    model: string;
    endpoints: {
      chatCompletion: string;
      completion: string;
    };
  };
  ocr: {
    language: string;
    batchSize: number;
    qualitySettings: {
      fast: number;
      balanced: number;
      accurate: number;
    };
  };
  pdf: {
    scale: number;
    maxPages: number;
    extractTextFirst: boolean;
  };
  classification: {
    batchSize: number;
    minTextLength: number;
    minConfidenceThreshold: number;
    useCache: boolean;
  };
  performance: {
    maxConcurrent: number;
    memoryLimit: number;
    tempDir: string;
  };
}

export const defaultConfig: DocumentClassifierConfig = {
  llm: {
    baseUrl: process.env.MULESOFT_API_BASE_URL || 'http://localhost:8081',
    username: process.env.MULESOFT_API_USERNAME,
    password: process.env.MULESOFT_API_PASSWORD,
    apiKey: process.env.LLM_API_KEY,
    timeout: parseInt(process.env.MULESOFT_API_TIMEOUT || '180000', 10),
    model: process.env.DEFAULT_LLM_MODEL || 'claude-sonnet-4-20250514',
    endpoints: {
      chatCompletion: '/v1/chat/completions',
      completion: '/v1/completions',
    },
  },
  ocr: {
    language: 'eng',
    batchSize: 10,
    qualitySettings: {
      fast: 1.0,
      balanced: 2.0,
      accurate: 3.0,
    },
  },
  pdf: {
    scale: parseFloat(process.env.PDF_SCALE || '2.0'),
    maxPages: parseInt(process.env.PDF_MAX_PAGES || '100', 10),
    extractTextFirst: true,
  },
  classification: {
    batchSize: parseInt(process.env.CLASSIFICATION_BATCH_SIZE || '5', 10),
    minTextLength: parseInt(process.env.CLASSIFICATION_MIN_TEXT_LENGTH || '20', 10),
    minConfidenceThreshold: 70,
    useCache: process.env.ENABLE_CACHE === 'true',
  },
  performance: {
    maxConcurrent: 5,
    memoryLimit: 4096,
    tempDir: process.env.TEMP_DIR || '/tmp/uploads',
  },
};

export function getConfig(): DocumentClassifierConfig {
  return defaultConfig;
}
```

### Usage

```typescript
import { getConfig } from './config/document-classifier';

const config = getConfig();

const result = await DocumentClassifier.analyze(filePath, {
  language: config.ocr.language,
  useAI: true,
  includeMetadata: true,
});
```

## Database Configuration

### Using Prisma

```typescript
// config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
```

### Environment-Specific Databases

```bash
# .env.development
DATABASE_URL=postgresql://dev:dev@localhost:5432/classifier_dev

# .env.production
DATABASE_URL=postgresql://prod:prod@prod-db:5432/classifier_prod

# .env.test
DATABASE_URL=postgresql://test:test@localhost:5432/classifier_test
```

### Connection Pooling

```typescript
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Custom connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000,
});

export default pool;
```

## LLM API Configuration

### MuleSoft LLM Inference API

```typescript
// config/muleSoft.ts
export interface MuleSoftConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
  endpoints: {
    processDocument: string;
    analyzeData: string;
    llmChatCompletions: string;
  };
}

export async function getMuleSoftConfig(): Promise<MuleSoftConfig> {
  // Priority: Environment > Database > Defaults
  const baseUrl = 
    process.env.MULESOFT_API_BASE_URL ||
    await getFromDatabase('mulesoft_api_base_url') ||
    'http://localhost:8081';

  return {
    baseUrl,
    username: process.env.MULESOFT_API_USERNAME || '',
    password: process.env.MULESOFT_API_PASSWORD || '',
    timeout: parseInt(process.env.MULESOFT_API_TIMEOUT || '180000', 10),
    endpoints: {
      processDocument: '/process/document',
      analyzeData: '/analyze',
      llmChatCompletions: '/v1/chat/completions',
    },
  };
}
```

### OpenAI-Compatible APIs

```typescript
// For OpenAI
OPENAI_API_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-key-here

// For Anthropic (via proxy)
ANTHROPIC_API_BASE_URL=https://api.anthropic.com/v1
ANTHROPIC_API_KEY=your-key-here

// For Local LLM (Ollama, LM Studio)
LOCAL_LLM_BASE_URL=http://localhost:11434/v1
```

### Multiple Providers

```typescript
export interface LLMProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  models: string[];
  priority: number;
}

const providers: LLMProviderConfig[] = [
  {
    name: 'mulesoft',
    baseUrl: 'http://mulesoft:8081',
    username: 'admin',
    password: 'admin',
    models: ['claude-sonnet-4', 'gpt-4'],
    priority: 1,
  },
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    models: ['gpt-4', 'gpt-3.5-turbo'],
    priority: 2,
  },
  {
    name: 'local',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama2', 'mistral'],
    priority: 3,
  },
];

export async function getLLMProvider(): Promise<LLMProviderConfig> {
  // Try providers in priority order
  for (const provider of providers.sort((a, b) => a.priority - b.priority)) {
    try {
      // Test connection
      await axios.get(`${provider.baseUrl}/health`);
      return provider;
    } catch {
      continue;
    }
  }
  
  throw new Error('No LLM provider available');
}
```

## OCR Configuration

### Language Configuration

```typescript
// Single language
const result = await DocumentClassifier.analyze(filePath, {
  language: 'eng', // English
});

// Multiple languages
const result = await DocumentClassifier.analyze(filePath, {
  language: 'eng+spa+fra', // English + Spanish + French
});

// Language codes
const languages = {
  eng: 'English',
  spa: 'Spanish',
  fra: 'French',
  deu: 'German',
  ita: 'Italian',
  por: 'Portuguese',
  rus: 'Russian',
  jpn: 'Japanese',
  chi_sim: 'Chinese Simplified',
  chi_tra: 'Chinese Traditional',
  ara: 'Arabic',
  hin: 'Hindi',
};
```

### OCR Quality Settings

```typescript
export type OCRQuality = 'fast' | 'balanced' | 'accurate';

interface OCROptions {
  quality: OCRQuality;
  language: string;
  preprocessing?: {
    sharpen: boolean;
    denoise: boolean;
    deskew: boolean;
  };
}

const qualitySettings: Record<OCRQuality, any> = {
  fast: {
    scale: 1.0,
    tesseractOptions: {
      tessedit_pageseg_mode: '6', // Assume uniform text block
    },
  },
  balanced: {
    scale: 2.0,
    tesseractOptions: {
      tessedit_pageseg_mode: '3', // Fully automatic
    },
  },
  accurate: {
    scale: 3.0,
    tesseractOptions: {
      tessedit_pageseg_mode: '1', // Automatic with OSD
      tessedit_char_whitelist: '', // No restrictions
    },
  },
};
```

## Performance Tuning

### Memory Optimization

```bash
# Increase Node.js heap
export NODE_OPTIONS="--max-old-space-size=4096"

# Garbage collection
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"
```

```typescript
// In code
if (global.gc) {
  global.gc(); // Force garbage collection
}
```

### Concurrency Limits

```typescript
import pLimit from 'p-limit';

const limit = pLimit(3); // Max 3 concurrent operations

const results = await Promise.all(
  documents.map(doc => 
    limit(() => DocumentClassifier.analyze(doc))
  )
);
```

### Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 3600,        // 1 hour
  checkperiod: 600,    // Check for expired keys every 10 minutes
  maxKeys: 1000,       // Max cached items
});

async function classifyWithCache(text: string) {
  const key = crypto.createHash('md5').update(text).digest('hex');
  
  let result = cache.get(key);
  if (result) {
    return result;
  }
  
  result = await classifier.classifyDocument({...});
  cache.set(key, result);
  
  return result;
}
```

### Batch Size Tuning

```typescript
// Adjust based on your system
const config = {
  // Small documents (< 10 pages)
  smallBatchSize: 10,
  
  // Medium documents (10-50 pages)
  mediumBatchSize: 5,
  
  // Large documents (> 50 pages)
  largeBatchSize: 2,
};

function getBatchSize(pageCount: number): number {
  if (pageCount < 10) return config.smallBatchSize;
  if (pageCount < 50) return config.mediumBatchSize;
  return config.largeBatchSize;
}
```

### PDF Processing Optimization

```typescript
// Extract text first (fast), fallback to OCR (slow)
const config = {
  pdf: {
    tryDirectTextExtraction: true,  // Try embedded text first
    ocrFallback: true,                // Use OCR if no text
    minTextLength: 100,               // Min text to skip OCR
    scale: 2.0,                       // Image quality
  },
};
```

## Security Configuration

### Credential Management

```typescript
// Use environment variables
const config = {
  llm: {
    baseUrl: process.env.MULESOFT_API_BASE_URL,
    username: process.env.MULESOFT_API_USERNAME,
    password: process.env.MULESOFT_API_PASSWORD,
  },
};

// Or use secrets manager (AWS Secrets Manager example)
import { SecretsManager } from 'aws-sdk';

async function getSecrets() {
  const secretsManager = new SecretsManager();
  const secret = await secretsManager.getSecretValue({
    SecretId: 'document-classifier/llm-credentials',
  }).promise();
  
  return JSON.parse(secret.SecretString || '{}');
}
```

### Encrypted Database Credentials

```typescript
import { encrypt, decrypt } from './utils/encryption';

// Store encrypted
await prisma.connector.update({
  where: { id: connectorId },
  data: {
    config: {
      ...config,
      password: encrypt(password),
    },
  },
});

// Retrieve and decrypt
const connector = await prisma.connector.findUnique({...});
const password = decrypt(connector.config.password);
```

## Example: Complete Configuration

```typescript
// config/index.ts
export default {
  llm: {
    baseUrl: process.env.MULESOFT_API_BASE_URL || 'http://localhost:8081',
    username: process.env.MULESOFT_API_USERNAME || 'admin',
    password: process.env.MULESOFT_API_PASSWORD || 'admin',
    timeout: 180000,
    model: 'claude-sonnet-4-20250514',
  },
  
  ocr: {
    language: 'eng',
    quality: 'balanced' as const,
    batchSize: 10,
  },
  
  pdf: {
    scale: 2.0,
    maxPages: 100,
    extractTextFirst: true,
  },
  
  classification: {
    batchSize: 5,
    minTextLength: 20,
    minConfidence: 70,
    promptCategory: 'document_classifier',
  },
  
  performance: {
    maxConcurrent: 5,
    enableCache: true,
    cacheTTL: 3600,
    tempDir: '/tmp/uploads',
  },
  
  database: {
    url: process.env.DATABASE_URL,
    poolSize: 20,
    timeout: 5000,
  },
};
```

---

**Configuration complete!** 🎉 Customize these settings for your specific use case.


