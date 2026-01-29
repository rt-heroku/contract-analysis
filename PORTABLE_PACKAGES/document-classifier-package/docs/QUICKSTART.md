# Quick Start Guide

Get up and running with Document Classifier in 5 minutes!

## 1. Copy Files

```bash
# Copy to your project
cp -r document-classifier-package /path/to/your/project/backend/src/packages/
```

## 2. Install Dependencies

```bash
cd /path/to/your/project
npm install axios canvas express multer pdf-parse pdfjs-dist tesseract.js
```

## 3. Basic Configuration

Create `.env` file:

```bash
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_USERNAME=admin
MULESOFT_API_PASSWORD=admin
```

## 4. Use It!

```typescript
import { DocumentClassifier } from './src/packages/document-classifier';

// Analyze a document
const result = await DocumentClassifier.analyze('./invoice.pdf');

console.log(`Document type: ${result.pages[0].documentType}`);
console.log(`Confidence: ${result.pages[0].confidence}%`);
```

## 5. Add REST API (Optional)

```typescript
import express from 'express';
import documentClassifierRoutes from './src/packages/document-classifier/routes/document-classifier.routes';

const app = express();
app.use('/api/document-classifier', documentClassifierRoutes);
app.listen(3000);
```

Test it:

```bash
curl -X POST http://localhost:3000/api/document-classifier/analyze \
  -F "file=@invoice.pdf"
```

## That's It! 🎉

You're ready to classify documents. For more details:

- 📖 [Full Installation Guide](./INSTALLATION.md)
- 🔌 [Connector Architecture](./CONNECTOR_ARCHITECTURE.md)
- 📚 [Usage Examples](./USAGE_EXAMPLES.md)
- 🐛 [Troubleshooting](./TROUBLESHOOTING.md)


