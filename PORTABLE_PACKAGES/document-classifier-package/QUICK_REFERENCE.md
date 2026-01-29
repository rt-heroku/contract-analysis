# Quick Reference Card

## Basic Usage

```typescript
import { DocumentClassifier } from './src/packages/document-classifier';

// Analyze document
const result = await DocumentClassifier.analyze('./document.pdf');

// Extract text only
const text = await DocumentClassifier.extractText('./image.jpg');

// Classify text
const type = await DocumentClassifier.classify('Invoice #123...', 1);
```

---

## Document Types

```
purchase_order  invoice    contract    receipt
form            report     letter      product_list
image           table      blank       unknown
```

---

## Configuration

```bash
# .env
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_USERNAME=admin
MULESOFT_API_PASSWORD=admin
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## Options

```typescript
{
  language: 'eng',              // OCR language
  useAI: true,                  // Enable AI classification
  includeMetadata: true,        // Include metadata
  ocrQuality: 'balanced'        // fast | balanced | accurate
}
```

---

## REST API

```bash
# Analyze
curl -X POST http://localhost:3000/api/document-classifier/analyze \
  -F "file=@document.pdf"

# Health check
curl http://localhost:3000/api/document-classifier/health
```

---

## Services

```typescript
import {
  DocumentAnalyzerService,
  ClassifierService,
  OCRService,
  PDFUtils
} from './src/packages/document-classifier';

const analyzer = new DocumentAnalyzerService();
const classifier = new ClassifierService();
```

---

## Database

```bash
# Run migrations
psql $DATABASE_URL -f migrations/001_create_prompts_table.sql
psql $DATABASE_URL -f migrations/002_create_connector_tables.sql

# Seed data
psql $DATABASE_URL -f database/seeds/default-prompts.sql
psql $DATABASE_URL -f database/seeds/llm-connector.sql
```

---

## Connector Pattern

```typescript
const executor = new ConnectorExecutor();

const result = await executor.execute({
  connector: llmConnector,
  connectorAction: chatCompletionAction,
  inputData: { model, messages, ... }
});
```

---

## Troubleshooting

```bash
# Canvas build fails
brew install cairo pango  # macOS
sudo apt-get install libcairo2-dev  # Ubuntu

# Increase memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable debug
DEBUG=document-classifier:* npm start
```

---

## File Structure

```
src/
  ├── services/         # Core services
  ├── types/            # TypeScript types
  ├── utils/            # PDF utilities
  ├── routes/           # REST API
  ├── connectors/       # Connector implementations
  └── index.ts          # Main exports

docs/                   # Documentation
database/               # Schemas & seeds
migrations/             # SQL migrations
examples/               # Code examples
```

---

## Documentation

- **Quick Start**: [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Installation**: [docs/INSTALLATION.md](./docs/INSTALLATION.md)
- **Examples**: [docs/USAGE_EXAMPLES.md](./docs/USAGE_EXAMPLES.md)
- **API Reference**: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- **Connector Pattern**: [docs/CONNECTOR_ARCHITECTURE.md](./docs/CONNECTOR_ARCHITECTURE.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Complete Summary**: [PACKAGE_SUMMARY.md](./PACKAGE_SUMMARY.md)


