# API Reference

Complete API documentation for the Document Classifier package.

## Table of Contents

1. [DocumentClassifier (Main API)](#documentclassifier-main-api)
2. [DocumentAnalyzerService](#documentanalyzerservice)
3. [ClassifierService](#classifierservice)
4. [OCRService](#ocrservice)
5. [PDFUtils](#pdfutils)
6. [Types](#types)
7. [REST API Endpoints](#rest-api-endpoints)

## DocumentClassifier (Main API)

The main entry point for document classification.

### `DocumentClassifier.analyze()`

Analyze a document (PDF or image) with OCR and AI classification.

**Signature:**
```typescript
DocumentClassifier.analyze(
  filePath: string,
  options?: DocumentAnalyzerOptions
): Promise<DocumentAnalysisResult>
```

**Parameters:**
- `filePath` (string): Path to PDF or image file
- `options` (DocumentAnalyzerOptions, optional):
  - `language` (string, default: 'eng'): OCR language code
  - `useAI` (boolean, default: true): Enable AI classification
  - `includeMetadata` (boolean, default: true): Include detailed metadata
  - `ocrQuality` ('fast' | 'balanced' | 'accurate', default: 'balanced'): OCR quality setting

**Returns:** `Promise<DocumentAnalysisResult>`

**Example:**
```typescript
const result = await DocumentClassifier.analyze('/path/to/invoice.pdf', {
  language: 'eng',
  useAI: true,
  includeMetadata: true
});
```

---

### `DocumentClassifier.extractText()`

Extract text from an image using OCR (no classification).

**Signature:**
```typescript
DocumentClassifier.extractText(
  imagePath: string,
  language?: string
): Promise<OCRResult>
```

**Parameters:**
- `imagePath` (string): Path to image file
- `language` (string, optional, default: 'eng'): OCR language code

**Returns:** `Promise<OCRResult>`

**Example:**
```typescript
const result = await DocumentClassifier.extractText('/path/to/image.jpg', 'eng');
console.log(result.text);
console.log(result.confidence);
```

---

### `DocumentClassifier.classify()`

Classify text using AI (without OCR).

**Signature:**
```typescript
DocumentClassifier.classify(
  text: string,
  pageNumber: number
): Promise<ClassificationResponse>
```

**Parameters:**
- `text` (string): Text to classify
- `pageNumber` (number): Page number for context

**Returns:** `Promise<ClassificationResponse>`

**Example:**
```typescript
const result = await DocumentClassifier.classify(
  'Invoice #12345\nDate: 2025-01-15\nTotal: $500',
  1
);
console.log(result.documentType);     // 'invoice'
console.log(result.confidence);       // 95
console.log(result.reasoning);        // 'Contains invoice header...'
```

---

## DocumentAnalyzerService

Main orchestrator for document analysis.

### `new DocumentAnalyzerService()`

Create a new analyzer instance.

```typescript
const analyzer = new DocumentAnalyzerService();
```

---

### `analyzeDocument()`

Analyze a document file.

**Signature:**
```typescript
analyzeDocument(
  filePath: string,
  options?: DocumentAnalyzerOptions
): Promise<DocumentAnalysisResult>
```

**Parameters:** Same as `DocumentClassifier.analyze()`

**Returns:** `Promise<DocumentAnalysisResult>`

**Example:**
```typescript
const analyzer = new DocumentAnalyzerService();
const result = await analyzer.analyzeDocument('/path/to/doc.pdf', {
  language: 'eng',
  useAI: true,
  includeMetadata: true
});
```

---

## ClassifierService

AI-powered classification service.

### `new ClassifierService()`

Create a new classifier instance.

```typescript
const classifier = new ClassifierService();
```

---

### `classifyDocument()`

Classify extracted text.

**Signature:**
```typescript
classifyDocument(
  request: ClassificationRequest
): Promise<ClassificationResponse>
```

**Parameters:**
- `request` (ClassificationRequest):
  - `extractedText` (string): Text to classify
  - `pageNumber` (number): Page number
  - `textLength` (number): Length of text

**Returns:** `Promise<ClassificationResponse>`

**Example:**
```typescript
const classifier = new ClassifierService();
const result = await classifier.classifyDocument({
  extractedText: 'Invoice #12345...',
  pageNumber: 1,
  textLength: 100
});
```

---

### `classifyBatch()`

Classify multiple pages in batches.

**Signature:**
```typescript
classifyBatch(
  requests: ClassificationRequest[]
): Promise<ClassificationResponse[]>
```

**Parameters:**
- `requests` (ClassificationRequest[]): Array of classification requests

**Returns:** `Promise<ClassificationResponse[]>`

**Example:**
```typescript
const requests = pages.map((text, idx) => ({
  extractedText: text,
  pageNumber: idx + 1,
  textLength: text.length
}));

const results = await classifier.classifyBatch(requests);
```

---

## OCRService

Text extraction using Tesseract.js.

### `OCRService.extractText()`

Extract text from a single image.

**Signature:**
```typescript
static extractText(
  imagePath: string | Buffer,
  language?: string
): Promise<OCRResult>
```

**Parameters:**
- `imagePath` (string | Buffer): Path to image or image buffer
- `language` (string, optional, default: 'eng'): OCR language

**Returns:** `Promise<OCRResult>`

**Example:**
```typescript
const result = await OCRService.extractText('/path/to/image.jpg', 'eng');
console.log('Text:', result.text);
console.log('Confidence:', result.confidence);
console.log('Language:', result.language);
console.log('Processing time:', result.processingTime, 'ms');
```

---

### `OCRService.extractTextBatch()`

Extract text from multiple images in parallel.

**Signature:**
```typescript
static extractTextBatch(
  images: Array<string | Buffer>,
  language?: string
): Promise<OCRResult[]>
```

**Parameters:**
- `images` (Array<string | Buffer>): Array of image paths or buffers
- `language` (string, optional, default: 'eng'): OCR language

**Returns:** `Promise<OCRResult[]>`

**Example:**
```typescript
const images = ['/path/to/page1.jpg', '/path/to/page2.jpg'];
const results = await OCRService.extractTextBatch(images, 'eng');
results.forEach((result, idx) => {
  console.log(`Page ${idx + 1}:`, result.text);
});
```

---

## PDFUtils

PDF processing utilities.

### `PDFUtils.extractTextDirect()`

Extract embedded text from PDF.

**Signature:**
```typescript
static extractTextDirect(
  pdfPath: string
): Promise<string | null>
```

**Parameters:**
- `pdfPath` (string): Path to PDF file

**Returns:** `Promise<string | null>` - Text if found, null if scanned PDF

**Example:**
```typescript
const text = await PDFUtils.extractTextDirect('/path/to/document.pdf');
if (text) {
  console.log('PDF has embedded text:', text);
} else {
  console.log('PDF is scanned, needs OCR');
}
```

---

### `PDFUtils.getPageCount()`

Get number of pages in PDF.

**Signature:**
```typescript
static getPageCount(
  pdfPath: string
): Promise<number>
```

**Parameters:**
- `pdfPath` (string): Path to PDF file

**Returns:** `Promise<number>`

**Example:**
```typescript
const pageCount = await PDFUtils.getPageCount('/path/to/document.pdf');
console.log(`PDF has ${pageCount} pages`);
```

---

### `PDFUtils.pageToImage()`

Convert a PDF page to image buffer.

**Signature:**
```typescript
static pageToImage(
  pdfPath: string,
  pageNumber: number,
  scale?: number
): Promise<Buffer>
```

**Parameters:**
- `pdfPath` (string): Path to PDF file
- `pageNumber` (number): Page number (1-indexed)
- `scale` (number, optional, default: 2.0): Image scale/quality

**Returns:** `Promise<Buffer>` - PNG image buffer

**Example:**
```typescript
const imageBuffer = await PDFUtils.pageToImage('/path/to/doc.pdf', 1, 2.0);
// Use imageBuffer with OCR or save to file
await fs.writeFile('page1.png', imageBuffer);
```

---

### `PDFUtils.allPagesToImages()`

Convert all PDF pages to image buffers.

**Signature:**
```typescript
static allPagesToImages(
  pdfPath: string,
  scale?: number
): Promise<Buffer[]>
```

**Parameters:**
- `pdfPath` (string): Path to PDF file
- `scale` (number, optional, default: 2.0): Image scale/quality

**Returns:** `Promise<Buffer[]>` - Array of PNG image buffers

**Example:**
```typescript
const images = await PDFUtils.allPagesToImages('/path/to/doc.pdf', 2.0);
console.log(`Converted ${images.length} pages to images`);
```

---

## Types

### DocumentType

Supported document types.

```typescript
type DocumentType =
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
  | 'unknown';
```

---

### PageClassification

Classification result for a single page.

```typescript
interface PageClassification {
  pageNumber: number;
  documentType: DocumentType;
  confidence: number;
  extractedText: string;
  textLength: number;
  hasImages: boolean;
  hasTables: boolean;
  metadata?: {
    language?: string;
    ocrConfidence?: number;
    processingTime?: number;
    reasoning?: string;
    suggestedFields?: string[];
    [key: string]: unknown;
  };
}
```

---

### DocumentAnalysisResult

Complete analysis result.

```typescript
interface DocumentAnalysisResult {
  success: boolean;
  totalPages: number;
  pages: PageClassification[];
  summary: {
    documentTypes: Record<DocumentType, number>;
    totalProcessingTime: number;
    averageConfidence: number;
  };
  error?: string;
}
```

---

### OCRResult

OCR extraction result.

```typescript
interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}
```

---

### ClassificationRequest

Request for text classification.

```typescript
interface ClassificationRequest {
  extractedText: string;
  pageNumber: number;
  textLength: number;
}
```

---

### ClassificationResponse

Classification result.

```typescript
interface ClassificationResponse {
  documentType: DocumentType;
  confidence: number;
  reasoning?: string;
  suggestedFields?: string[];
}
```

---

### DocumentAnalyzerOptions

Options for document analysis.

```typescript
interface DocumentAnalyzerOptions {
  language?: string;
  useAI?: boolean;
  includeMetadata?: boolean;
  ocrQuality?: 'fast' | 'balanced' | 'accurate';
}
```

---

## REST API Endpoints

### POST /api/document-classifier/analyze

Analyze an uploaded document.

**Request:**
```bash
POST /api/document-classifier/analyze
Content-Type: multipart/form-data

file: [PDF or image file]
language: eng (optional)
useAI: true (optional)
includeMetadata: true (optional)
```

**Response:**
```json
{
  "success": true,
  "totalPages": 3,
  "pages": [
    {
      "pageNumber": 1,
      "documentType": "invoice",
      "confidence": 95,
      "extractedText": "Invoice #12345...",
      "textLength": 1234,
      "hasImages": false,
      "hasTables": true,
      "metadata": {
        "language": "eng",
        "ocrConfidence": 98,
        "processingTime": 2500,
        "reasoning": "Contains invoice header and line items",
        "suggestedFields": ["invoiceNumber", "date", "total"]
      }
    }
  ],
  "summary": {
    "documentTypes": {
      "invoice": 3
    },
    "totalProcessingTime": 7500,
    "averageConfidence": 94
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "totalPages": 0,
  "pages": [],
  "summary": {
    "documentTypes": {},
    "totalProcessingTime": 0,
    "averageConfidence": 0
  }
}
```

---

### GET /api/document-classifier/health

Health check endpoint.

**Request:**
```bash
GET /api/document-classifier/health
```

**Response:**
```json
{
  "success": true,
  "service": "document-classifier",
  "status": "operational",
  "timestamp": "2025-12-24T12:00:00.000Z"
}
```

---

## Error Handling

All methods can throw errors. Always use try-catch:

```typescript
try {
  const result = await DocumentClassifier.analyze(filePath);
  // Process result
} catch (error) {
  if (error instanceof Error) {
    console.error('Classification failed:', error.message);
    
    // Check for specific errors
    if (error.message.includes('ENOENT')) {
      // File not found
    } else if (error.message.includes('timeout')) {
      // API timeout
    } else if (error.message.includes('OCR failed')) {
      // OCR processing error
    }
  }
}
```

---

## Complete Example

```typescript
import { 
  DocumentClassifier,
  DocumentAnalyzerService,
  ClassifierService,
  OCRService,
  PDFUtils
} from './src/packages/document-classifier';

async function completeExample() {
  // 1. Simple classification
  const result1 = await DocumentClassifier.analyze('./invoice.pdf');
  console.log('Document type:', result1.pages[0].documentType);

  // 2. Advanced classification
  const result2 = await DocumentClassifier.analyze('./contract.pdf', {
    language: 'eng+spa',
    useAI: true,
    includeMetadata: true,
    ocrQuality: 'accurate'
  });

  // 3. Individual services
  const analyzer = new DocumentAnalyzerService();
  const result3 = await analyzer.analyzeDocument('./receipt.jpg');

  // 4. OCR only
  const ocrResult = await OCRService.extractText('./page.png');
  console.log('Extracted text:', ocrResult.text);

  // 5. Classification only
  const classifier = new ClassifierService();
  const classification = await classifier.classifyDocument({
    extractedText: 'Purchase Order #12345',
    pageNumber: 1,
    textLength: 50
  });

  // 6. PDF utilities
  const pageCount = await PDFUtils.getPageCount('./document.pdf');
  const text = await PDFUtils.extractTextDirect('./document.pdf');
  const imageBuffer = await PDFUtils.pageToImage('./document.pdf', 1, 3.0);
}
```

---

**API Reference complete!** 🎉 See [Usage Examples](./USAGE_EXAMPLES.md) for practical implementations.


