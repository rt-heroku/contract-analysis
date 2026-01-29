# Getting Started with Document Classifier

**Welcome!** This guide will get you up and running in minutes.

## 📋 Prerequisites

- Node.js 18+ installed
- npm 9.0+ installed
- 2GB+ RAM available
- PostgreSQL 12+ (optional)

## 🚀 Quick Start (5 Minutes)

### 1. Copy Package

```bash
# Copy to your project
cp -r document-classifier-package /your-project/backend/src/packages/document-classifier
```

### 2. Install Dependencies

```bash
cd /your-project
npm install axios canvas express multer pdf-parse pdfjs-dist tesseract.js
```

### 3. Configure

Create `.env`:
```bash
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_USERNAME=admin
MULESOFT_API_PASSWORD=admin
```

### 4. Test It

Create `test.ts`:
```typescript
import { DocumentClassifier } from './src/packages/document-classifier';

async function test() {
  const result = await DocumentClassifier.analyze('./test-invoice.pdf');
  console.log('Document type:', result.pages[0].documentType);
  console.log('Confidence:', result.pages[0].confidence + '%');
}

test();
```

Run:
```bash
npx ts-node test.ts
```

## 🎯 What's Next?

### For Simple Integration

✅ You're done! Start using the API:
```typescript
const result = await DocumentClassifier.analyze(filePath);
```

See [docs/USAGE_EXAMPLES.md](./docs/USAGE_EXAMPLES.md) for more examples.

---

### For Connector Architecture

If your project uses a connector-based architecture:

1. Read [docs/CONNECTOR_ARCHITECTURE.md](./docs/CONNECTOR_ARCHITECTURE.md)
2. Run database migrations
3. Update ConnectorExecutor
4. Seed connector data

Time: ~1 hour

---

### For Database-Backed Prompts

If you want configurable prompts:

1. Run migrations: `psql $DATABASE_URL -f migrations/001_create_prompts_table.sql`
2. Seed prompts: `psql $DATABASE_URL -f database/seeds/default-prompts.sql`
3. Update prompts in database

---

## 📖 Documentation Map

| Need | Document |
|------|----------|
| **Quick test** | You're reading it! |
| **Detailed setup** | [docs/INSTALLATION.md](./docs/INSTALLATION.md) |
| **Connector pattern** | [docs/CONNECTOR_ARCHITECTURE.md](./docs/CONNECTOR_ARCHITECTURE.md) |
| **Code examples** | [docs/USAGE_EXAMPLES.md](./docs/USAGE_EXAMPLES.md) |
| **API reference** | [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) |
| **Configuration** | [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) |
| **Troubleshooting** | [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) |
| **Complete overview** | [PACKAGE_SUMMARY.md](./PACKAGE_SUMMARY.md) |

---

## 🐛 Common First-Time Issues

### Canvas fails to install

```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Ubuntu
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev
```

### "No configuration found"

Make sure `.env` has:
```
MULESOFT_API_BASE_URL=http://your-api:8081
```

### Classification returns "unknown"

Check:
1. LLM API is reachable
2. Credentials are correct
3. API endpoint returns valid responses

---

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Configuration created
- [ ] Test file runs successfully
- [ ] Documentation reviewed

---

**Ready to integrate?** Head to [docs/USAGE_EXAMPLES.md](./docs/USAGE_EXAMPLES.md) for practical examples!

**Questions?** Check [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) or read the source code (it's well-commented).

**Good luck!** 🚀


