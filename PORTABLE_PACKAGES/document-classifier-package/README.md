# Document Classifier Package

**Version:** 1.0.0  
**Author:** Extracted from Contract Processing System  
**Date:** December 24, 2025

## Overview

The Document Classifier is a powerful, portable OCR + AI-powered document classification system that can analyze PDFs and images, extract text, and intelligently classify document types using LLM-based inference.

### Key Features

✅ **OCR Processing** - Extract text from scanned documents and images using Tesseract.js  
✅ **AI Classification** - Classify documents using LLM inference (Claude, OpenAI-compatible APIs)  
✅ **PDF Support** - Process multi-page PDFs with both embedded text and scanned pages  
✅ **Batch Processing** - Efficiently process multiple pages in parallel  
✅ **Configurable Prompts** - Store and manage classification prompts in database  
✅ **RESTful API** - Ready-to-use Express routes for document analysis  
✅ **TypeScript** - Fully typed for better developer experience  
✅ **Extensible** - Easy to add new document types or classification logic

### Document Types Supported

- `purchase_order` - Purchase orders, POs
- `invoice` - Invoices, bills
- `contract` - Contracts, agreements, terms
- `receipt` - Receipts, payment confirmations
- `form` - Forms, applications, questionnaires
- `report` - Reports, analyses, summaries
- `letter` - Letters, correspondence
- `product_list` - Product lists, catalogs, inventory
- `image` - Mostly images with minimal text
- `table` - Primarily tables or data grids
- `blank` - Empty or nearly empty pages
- `unknown` - Cannot determine type

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Document Upload                         │
│                    (PDF or Image File)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              DocumentAnalyzerService                        │
│  • Detects file type (PDF vs Image)                        │
│  • Extracts embedded text or initiates OCR                 │
│  • Orchestrates the analysis pipeline                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  PDF Utils   │          │  OCR Service │
│              │          │              │
│ • Extract    │          │ • Tesseract  │
│   embedded   │          │ • Batch      │
│   text       │          │   processing │
│ • Convert    │          │ • Parallel   │
│   pages to   │          │   execution  │
│   images     │          │              │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Extracted Text       │
        │  (Per Page)           │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  ClassifierService    │
        │                       │
        │ • Load prompts from   │
        │   database            │
        │ • Call LLM API        │
        │ • Parse responses     │
        │ • Batch classify      │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Classification       │
        │  Results              │
        │                       │
        │ • Document type       │
        │ • Confidence score    │
        │ • Reasoning           │
        │ • Suggested fields    │
        └───────────────────────┘
```

## Quick Start

See [INSTALLATION.md](./docs/INSTALLATION.md) for detailed installation instructions.

### Basic Usage

```typescript
import { DocumentClassifier } from './src';

// Analyze a document
const result = await DocumentClassifier.analyze('/path/to/document.pdf', {
  language: 'eng',
  useAI: true,
  includeMetadata: true
});

console.log(result);
// {
//   success: true,
//   totalPages: 5,
//   pages: [
//     {
//       pageNumber: 1,
//       documentType: 'invoice',
//       confidence: 95,
//       extractedText: '...',
//       textLength: 1234,
//       hasImages: false,
//       hasTables: true,
//       metadata: {
//         language: 'eng',
//         ocrConfidence: 98,
//         processingTime: 2500,
//         reasoning: 'Contains invoice header and line items',
//         suggestedFields: ['invoiceNumber', 'date', 'total']
//       }
//     },
//     // ... more pages
//   ],
//   summary: {
//     documentTypes: { invoice: 5 },
//     totalProcessingTime: 12500,
//     averageConfidence: 94
//   }
// }
```

### Using the REST API

```bash
# Analyze a document
curl -X POST http://localhost:3000/api/document-classifier/analyze \
  -F "file=@/path/to/document.pdf" \
  -F "language=eng" \
  -F "useAI=true" \
  -F "includeMetadata=true"

# Health check
curl http://localhost:3000/api/document-classifier/health
```

## Documentation

- 📋 [Installation Guide](./docs/INSTALLATION.md) - Step-by-step installation
- 🔧 [Configuration Guide](./docs/CONFIGURATION.md) - Configure the package
- 🔌 [Connector Architecture](./docs/CONNECTOR_ARCHITECTURE.md) - Adapt to connector pattern
- 🗃️ [Database Setup](./docs/DATABASE_SETUP.md) - Database schema and migrations
- 📚 [API Reference](./docs/API_REFERENCE.md) - Complete API documentation
- 🎯 [Usage Examples](./docs/USAGE_EXAMPLES.md) - Code examples
- 🐛 [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions

## Project Structure

```
document-classifier-package/
├── src/
│   ├── index.ts                          # Main exports
│   ├── services/
│   │   ├── classifier.service.ts         # AI classification service
│   │   ├── document-analyzer.service.ts  # Main orchestrator
│   │   └── ocr.service.ts                # Tesseract OCR wrapper
│   ├── types/
│   │   └── document-classifier.types.ts  # TypeScript types
│   ├── utils/
│   │   └── pdf-utils.ts                  # PDF processing utilities
│   ├── routes/
│   │   └── document-classifier.routes.ts # Express routes
│   └── connectors/                       # Connector architecture examples
│       ├── LLMConnector.ts               # LLM connector implementation
│       └── DocumentClassifierConnector.ts # Full connector wrapper
├── database/
│   ├── schema.prisma                     # Prisma schema for prompts table
│   └── seeds/
│       └── default-prompts.sql           # Default classification prompts
├── migrations/
│   └── 001_create_prompts_table.sql      # Database migration
├── docs/                                 # Comprehensive documentation
├── examples/                             # Usage examples
├── config/                               # Configuration templates
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript configuration
└── README.md                             # This file
```

## Dependencies

### Required NPM Packages

```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "canvas": "^2.11.2",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1",
    "pdfjs-dist": "^3.11.174",
    "tesseract.js": "^5.0.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3"
  }
}
```

### Optional Dependencies

- `@prisma/client` - If using database for prompt storage
- `pg` - If using PostgreSQL for prompt storage

## System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.0.0 or higher
- **Memory**: Minimum 2GB RAM (4GB+ recommended for large PDFs)
- **Disk Space**: ~500MB for Tesseract training data
- **Database**: PostgreSQL 12+ (optional, for prompt storage)

## Configuration

The package can be configured to work with different LLM providers:

### MuleSoft LLM Inference API (Default)

```typescript
// Set environment variables
MULESOFT_API_BASE_URL=http://your-mulesoft-instance:8081
MULESOFT_API_USERNAME=your-username
MULESOFT_API_PASSWORD=your-password
```

### OpenAI-Compatible APIs

The classifier service works with any OpenAI-compatible API endpoint.

See [CONFIGURATION.md](./docs/CONFIGURATION.md) for detailed configuration options.

## Migration Paths

### Standard Integration (Current Architecture)

For applications using a standard Express + service pattern:

1. Copy the `src/` folder to your project
2. Install dependencies
3. Set up database (if using prompt storage)
4. Import and use the services

See: [INSTALLATION.md](./docs/INSTALLATION.md)

### Connector Architecture Integration

For applications using a connector-based execution engine:

1. Follow standard integration steps
2. Create LLM connector definition in database
3. Wrap services in connector executor pattern
4. Register connector actions

See: [CONNECTOR_ARCHITECTURE.md](./docs/CONNECTOR_ARCHITECTURE.md)

## License

MIT License - Free to use in commercial and non-commercial projects

## Support

For issues, questions, or contributions, please refer to the [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) guide.

---

**Note:** This package was extracted from a production contract processing system. It has been battle-tested with thousands of documents and various document types.


