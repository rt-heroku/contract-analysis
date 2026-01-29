# Usage Examples

Practical examples for common use cases of the Document Classifier package.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Advanced Classification](#advanced-classification)
3. [Batch Processing](#batch-processing)
4. [REST API Integration](#rest-api-integration)
5. [Connector Architecture](#connector-architecture)
6. [Custom Document Types](#custom-document-types)
7. [Error Handling](#error-handling)
8. [Performance Optimization](#performance-optimization)

## Basic Usage

### Classify a Single PDF

```typescript
import { DocumentClassifier } from './src';

async function classifyPDF() {
  const result = await DocumentClassifier.analyze('/path/to/invoice.pdf', {
    language: 'eng',
    useAI: true,
    includeMetadata: true
  });

  if (result.success) {
    console.log(`Analyzed ${result.totalPages} pages`);
    console.log(`Average confidence: ${result.summary.averageConfidence}%`);
    
    // Print page classifications
    result.pages.forEach(page => {
      console.log(`Page ${page.pageNumber}: ${page.documentType} (${page.confidence}%)`);
    });
  }
}

classifyPDF();
```

### Classify an Image

```typescript
import { DocumentClassifier } from './src';

async function classifyImage() {
  const result = await DocumentClassifier.analyze('/path/to/receipt.jpg', {
    language: 'eng',
    useAI: true
  });

  const page = result.pages[0];
  console.log(`Document type: ${page.documentType}`);
  console.log(`Confidence: ${page.confidence}%`);
  console.log(`Extracted text length: ${page.textLength} characters`);
  
  if (page.metadata?.suggestedFields) {
    console.log('Suggested fields to extract:', page.metadata.suggestedFields);
  }
}

classifyImage();
```

### Extract Text Only (No Classification)

```typescript
import { DocumentClassifier } from './src';

async function extractText() {
  const result = await DocumentClassifier.analyze('/path/to/document.pdf', {
    language: 'eng',
    useAI: false, // Skip AI classification
    includeMetadata: false
  });

  result.pages.forEach(page => {
    console.log(`\n--- Page ${page.pageNumber} ---`);
    console.log(page.extractedText);
  });
}

extractText();
```

## Advanced Classification

### Multi-Language Documents

```typescript
import { DocumentClassifier } from './src';

async function classifyMultiLanguage() {
  // German document
  const germanResult = await DocumentClassifier.analyze('/path/to/german-contract.pdf', {
    language: 'deu', // German
    useAI: true
  });

  // Spanish document
  const spanishResult = await DocumentClassifier.analyze('/path/to/spanish-invoice.pdf', {
    language: 'spa', // Spanish
    useAI: true
  });

  console.log('German document:', germanResult.pages[0].documentType);
  console.log('Spanish document:', spanishResult.pages[0].documentType);
}

classifyMultiLanguage();
```

### Using Individual Services

```typescript
import { 
  OCRService, 
  ClassifierService,
  DocumentAnalyzerService 
} from './src';

async function useIndividualServices() {
  // 1. Extract text with OCR
  const ocrResult = await OCRService.extractText('/path/to/image.png', 'eng');
  console.log('Extracted text:', ocrResult.text);
  console.log('OCR confidence:', ocrResult.confidence);

  // 2. Classify the extracted text
  const classifier = new ClassifierService();
  const classification = await classifier.classifyDocument({
    extractedText: ocrResult.text,
    pageNumber: 1,
    textLength: ocrResult.text.length
  });
  
  console.log('Document type:', classification.documentType);
  console.log('Classification confidence:', classification.confidence);
  console.log('Reasoning:', classification.reasoning);

  // 3. Full analysis
  const analyzer = new DocumentAnalyzerService();
  const fullResult = await analyzer.analyzeDocument('/path/to/document.pdf');
  console.log('Full analysis:', fullResult);
}

useIndividualServices();
```

## Batch Processing

### Process Multiple Documents

```typescript
import { DocumentClassifier } from './src';
import * as fs from 'fs';
import * as path from 'path';

async function processBatch() {
  const documentsDir = '/path/to/documents';
  const files = fs.readdirSync(documentsDir)
    .filter(f => f.endsWith('.pdf') || f.endsWith('.jpg'));

  console.log(`Processing ${files.length} documents...`);

  const results = [];
  for (const file of files) {
    const filePath = path.join(documentsDir, file);
    
    try {
      const result = await DocumentClassifier.analyze(filePath, {
        language: 'eng',
        useAI: true
      });
      
      results.push({
        file,
        success: true,
        type: result.pages[0]?.documentType,
        confidence: result.pages[0]?.confidence
      });
      
      console.log(`✓ ${file}: ${result.pages[0]?.documentType}`);
    } catch (error) {
      results.push({
        file,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`✗ ${file}: ${error}`);
    }
  }

  // Summary
  const successCount = results.filter(r => r.success).length;
  console.log(`\nProcessed: ${successCount}/${files.length} documents`);
  
  // Group by document type
  const byType: Record<string, number> = {};
  results.forEach(r => {
    if (r.success && r.type) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }
  });
  
  console.log('Document types:', byType);
}

processBatch();
```

### Parallel Batch Processing

```typescript
import { DocumentClassifier } from './src';
import * as fs from 'fs';
import * as path from 'path';

async function processBatchParallel() {
  const documentsDir = '/path/to/documents';
  const files = fs.readdirSync(documentsDir)
    .filter(f => f.endsWith('.pdf'));

  console.log(`Processing ${files.length} documents in parallel...`);

  // Process 5 documents at a time
  const batchSize = 5;
  const allResults = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const filePath = path.join(documentsDir, file);
        try {
          const result = await DocumentClassifier.analyze(filePath);
          return { file, success: true, result };
        } catch (error) {
          return { file, success: false, error };
        }
      })
    );
    
    allResults.push(...batchResults);
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
  }

  return allResults;
}

processBatchParallel();
```

## REST API Integration

### Express Server Setup

```typescript
import express from 'express';
import documentClassifierRoutes from './src/routes/document-classifier.routes';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount document classifier routes
app.use('/api/document-classifier', documentClassifierRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Document Classifier API: http://localhost:${PORT}/api/document-classifier`);
});
```

### Client-Side Usage (Frontend)

```typescript
// React component example
import React, { useState } from 'react';

function DocumentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('useAI', 'true');
    formData.append('includeMetadata', 'true');

    try {
      const response = await fetch('/api/document-classifier/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Classification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setFile(e.target.files?.[0] || null)} 
      />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Analyzing...' : 'Analyze Document'}
      </button>

      {result && (
        <div>
          <h3>Results:</h3>
          <p>Total Pages: {result.totalPages}</p>
          <p>Average Confidence: {result.summary.averageConfidence}%</p>
          
          <h4>Pages:</h4>
          {result.pages.map((page: any) => (
            <div key={page.pageNumber}>
              <strong>Page {page.pageNumber}:</strong> {page.documentType} ({page.confidence}%)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentUploader;
```

### cURL Examples

```bash
# Analyze a PDF
curl -X POST http://localhost:3000/api/document-classifier/analyze \
  -F "file=@/path/to/document.pdf" \
  -F "language=eng" \
  -F "useAI=true" \
  -F "includeMetadata=true"

# Analyze an image (fast mode)
curl -X POST http://localhost:3000/api/document-classifier/analyze \
  -F "file=@/path/to/receipt.jpg" \
  -F "useAI=false"

# Health check
curl http://localhost:3000/api/document-classifier/health
```

## Connector Architecture

### Using Connector Executor

```typescript
import { ConnectorExecutor } from './execution-engine/connectors/ConnectorExecutor';
import prisma from './config/database';

async function useConnector() {
  const executor = new ConnectorExecutor();

  // Load connector and action from database
  const connector = await prisma.connector.findFirst({
    where: { name: 'document_classifier', isActive: true }
  });

  const action = await prisma.connectorAction.findFirst({
    where: { 
      connectorId: connector!.id,
      operation: 'analyze_document',
      isActive: true 
    }
  });

  // Execute through connector
  const result = await executor.execute({
    connector,
    connectorAction: action,
    inputData: {
      filePath: '/path/to/document.pdf',
      language: 'eng',
      useAI: true
    },
    executionContext: {}
  });

  console.log('Classification result:', result);
}

useConnector();
```

### Creating a Custom Connector

```typescript
import { DocumentAnalyzerService } from './services/document-analyzer.service';

export class CustomDocumentClassifierConnector {
  private analyzer: DocumentAnalyzerService;

  constructor() {
    this.analyzer = new DocumentAnalyzerService();
  }

  async execute(operation: string, inputData: any): Promise<any> {
    switch (operation) {
      case 'analyze_document':
        return await this.analyzeDocument(inputData);
      
      case 'extract_text':
        return await this.extractText(inputData);
      
      case 'classify_text':
        return await this.classifyText(inputData);
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private async analyzeDocument(inputData: any) {
    return await this.analyzer.analyzeDocument(inputData.filePath, {
      language: inputData.language || 'eng',
      useAI: inputData.useAI !== false,
      includeMetadata: inputData.includeMetadata !== false
    });
  }

  private async extractText(inputData: any) {
    const { OCRService } = require('./services/ocr.service');
    return await OCRService.extractText(
      inputData.imagePath,
      inputData.language || 'eng'
    );
  }

  private async classifyText(inputData: any) {
    const { ClassifierService } = require('./services/classifier.service');
    const classifier = new ClassifierService();
    return await classifier.classifyDocument({
      extractedText: inputData.text,
      pageNumber: inputData.pageNumber || 1,
      textLength: inputData.text.length
    });
  }
}
```

## Custom Document Types

### Adding New Document Types

```typescript
// 1. Update types
export type DocumentType =
  | 'purchase_order'
  | 'invoice'
  | 'contract'
  | 'receipt'
  | 'form'
  | 'report'
  | 'letter'
  | 'product_list'
  | 'image'
  | 'table'
  | 'blank'
  | 'unknown'
  | 'shipping_label'  // New type
  | 'tax_form';       // New type

// 2. Update prompt in database
const updatedPrompt = `
DOCUMENT TYPES:
- purchase_order: Purchase orders, POs
- invoice: Invoices, bills
- contract: Contracts, agreements
- ...
- shipping_label: Shipping labels, package labels
- tax_form: Tax forms, W2, 1099, etc.
`;

await prisma.prompt.update({
  where: { id: promptId },
  data: { content: updatedPrompt }
});
```

## Error Handling

### Robust Error Handling

```typescript
import { DocumentClassifier } from './src';

async function robustClassification(filePath: string) {
  try {
    const result = await DocumentClassifier.analyze(filePath, {
      language: 'eng',
      useAI: true,
      includeMetadata: true
    });

    if (!result.success) {
      console.error('Classification failed:', result.error);
      return null;
    }

    // Validate results
    if (result.totalPages === 0) {
      console.warn('No pages found in document');
      return null;
    }

    // Check confidence threshold
    const lowConfidencePages = result.pages.filter(p => p.confidence < 70);
    if (lowConfidencePages.length > 0) {
      console.warn(`${lowConfidencePages.length} pages have low confidence`);
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error('File not found:', filePath);
      } else if (error.message.includes('timeout')) {
        console.error('Classification timed out');
      } else if (error.message.includes('OCR failed')) {
        console.error('OCR processing failed');
      } else {
        console.error('Unexpected error:', error.message);
      }
    }
    
    return null;
  }
}
```

### Retry Logic

```typescript
async function classifyWithRetry(filePath: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await DocumentClassifier.analyze(filePath);
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Performance Optimization

### Caching Results

```typescript
import { DocumentClassifier } from './src';
import * as crypto from 'crypto';

const cache = new Map<string, any>();

async function classifyWithCache(filePath: string) {
  // Generate cache key from file hash
  const fileBuffer = await fs.promises.readFile(filePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  // Check cache
  if (cache.has(hash)) {
    console.log('Cache hit!');
    return cache.get(hash);
  }
  
  // Classify and cache
  const result = await DocumentClassifier.analyze(filePath);
  cache.set(hash, result);
  
  return result;
}
```

### Stream Processing for Large Documents

```typescript
import { PDFUtils } from './src/utils/pdf-utils';
import { OCRService } from './src/services/ocr.service';
import { ClassifierService } from './src/services/classifier.service';

async function streamProcessLargePDF(pdfPath: string) {
  const pageCount = await PDFUtils.getPageCount(pdfPath);
  console.log(`Processing ${pageCount} pages...`);
  
  const classifier = new ClassifierService();
  const results = [];
  
  // Process one page at a time to save memory
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const imageBuffer = await PDFUtils.pageToImage(pdfPath, pageNum);
    const ocr = await OCRService.extractText(imageBuffer);
    const classification = await classifier.classifyDocument({
      extractedText: ocr.text,
      pageNumber: pageNum,
      textLength: ocr.text.length
    });
    
    results.push({ pageNum, ...classification });
    console.log(`Processed page ${pageNum}/${pageCount}`);
  }
  
  return results;
}
```

---

For more examples, check the [examples/](../examples/) directory in the package.


