# Installation Guide

This guide will walk you through installing the Document Classifier package into your Cursor/Node.js project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Database Setup (Optional)](#database-setup-optional)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Next Steps](#next-steps)

## Prerequisites

Before installing, ensure you have:

- ✅ Node.js 18.x or higher
- ✅ npm 9.0.0 or higher
- ✅ PostgreSQL 12+ (optional, for prompt storage)
- ✅ Access to an LLM API (MuleSoft, OpenAI, or compatible)
- ✅ ~500MB free disk space for dependencies
- ✅ 2GB+ RAM available

## Installation Steps

### Step 1: Copy Package Files

Copy the entire `document-classifier-package` folder to your project:

```bash
# Navigate to your project root
cd /path/to/your/project

# Copy the package
cp -r /path/to/document-classifier-package ./backend/src/packages/document-classifier
```

**Alternative:** You can place it anywhere in your project structure:
```
your-project/
├── src/
│   ├── packages/
│   │   └── document-classifier/  # <-- Place here
│   ├── services/
│   └── ...
```

### Step 2: Install Dependencies

Add these dependencies to your `package.json`:

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

Then install:

```bash
npm install
```

**Note:** If you're using Prisma for prompt storage, also add:
```bash
npm install @prisma/client
```

### Step 3: Configure TypeScript (if needed)

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

### Step 4: Create Configuration Files

#### Option A: Environment Variables

Create or update your `.env` file:

```bash
# LLM API Configuration
MULESOFT_API_BASE_URL=http://your-mulesoft-instance:8081
MULESOFT_API_USERNAME=your-username
MULESOFT_API_PASSWORD=your-password
MULESOFT_API_TIMEOUT=180000

# Alternative: OpenAI-compatible API
# OPENAI_API_BASE_URL=https://api.openai.com/v1
# OPENAI_API_KEY=sk-...
```

#### Option B: Configuration Module

Create `src/config/muleSoft.ts` (or adapt existing):

```typescript
import { getSetting } from '../utils/getSettings';

export interface MuleSoftConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout: number;
  endpoints: {
    processDocument: string;
    analyzeData: string;
    llmChatCompletions?: string;
  };
}

export async function getMuleSoftConfig(): Promise<MuleSoftConfig> {
  // Get from database or environment
  const baseUrl = process.env.MULESOFT_API_BASE_URL || 'http://localhost:8081';
  const username = process.env.MULESOFT_API_USERNAME || '';
  const password = process.env.MULESOFT_API_PASSWORD || '';
  const timeout = parseInt(process.env.MULESOFT_API_TIMEOUT || '180000', 10);

  return {
    baseUrl,
    username,
    password,
    timeout,
    endpoints: {
      processDocument: '/process/document',
      analyzeData: '/analyze',
      llmChatCompletions: '/v1/chat/completions',
    },
  };
}
```

### Step 5: Set Up Database Connection (if using Prisma)

Create or update `src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
```

## Database Setup (Optional)

If you want to store classification prompts in your database:

### Step 1: Run Migration

```bash
# Using Prisma
npx prisma migrate dev --name add_prompts_table

# Or manually with PostgreSQL
psql $DATABASE_URL -f migrations/001_create_prompts_table.sql
```

### Step 2: Seed Default Prompts

```bash
psql $DATABASE_URL -f database/seeds/default-prompts.sql
```

### Step 3: Update Prisma Schema

Add to your `prisma/schema.prisma`:

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
```

Then generate Prisma client:

```bash
npx prisma generate
```

**Note:** If you don't want database storage, the package will use built-in default prompts.

## Configuration

### Option 1: Without Database (Simpler)

The classifier will use built-in default prompts. No database configuration needed!

Just ensure your LLM API is configured:

```typescript
// src/config/muleSoft.ts or similar
export const getMuleSoftConfig = async () => ({
  baseUrl: process.env.MULESOFT_API_BASE_URL!,
  username: process.env.MULESOFT_API_USERNAME!,
  password: process.env.MULESOFT_API_PASSWORD!,
  timeout: 180000,
  endpoints: {
    llmChatCompletions: '/v1/chat/completions'
  }
});
```

### Option 2: With Database (More Flexible)

Follow the [Database Setup](#database-setup-optional) steps above.

This allows you to:
- Edit classification prompts without code changes
- A/B test different prompts
- Track prompt performance
- Version prompts over time

## Verification

### Test Installation

Create a test file `test-classifier.ts`:

```typescript
import { DocumentClassifier } from './src/packages/document-classifier';

async function test() {
  try {
    // Test with a sample file
    const result = await DocumentClassifier.analyze('./test-document.pdf', {
      language: 'eng',
      useAI: true,
      includeMetadata: true
    });

    console.log('✅ Classification successful!');
    console.log('Total pages:', result.totalPages);
    console.log('Average confidence:', result.summary.averageConfidence);
    console.log('Document types:', result.summary.documentTypes);
  } catch (error) {
    console.error('❌ Classification failed:', error);
  }
}

test();
```

Run the test:

```bash
npx ts-node test-classifier.ts
```

### Test REST API

If using Express routes, add to your server:

```typescript
import express from 'express';
import documentClassifierRoutes from './src/packages/document-classifier/routes/document-classifier.routes';

const app = express();

// Mount routes
app.use('/api/document-classifier', documentClassifierRoutes);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

Test with curl:

```bash
curl -X POST http://localhost:3000/api/document-classifier/analyze \
  -F "file=@/path/to/document.pdf" \
  -F "useAI=true"
```

## Troubleshooting

### Issue: "Cannot find module 'canvas'"

**Solution:** Canvas has native dependencies. Install build tools:

```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Ubuntu/Debian
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Then reinstall
npm install canvas
```

### Issue: "Tesseract training data not found"

**Solution:** Tesseract.js downloads training data automatically on first use. Ensure you have:
- Internet connection
- Write access to `/tmp` or equivalent
- ~150MB free disk space

### Issue: "LLM API connection failed"

**Solution:** Verify your configuration:

```bash
# Test connectivity
curl -u username:password http://your-mulesoft-instance:8081/v1/chat/completions

# Check environment variables
echo $MULESOFT_API_BASE_URL
echo $MULESOFT_API_USERNAME
```

### Issue: "Database connection failed"

**Solution:** If not using database for prompts:

```typescript
// In classifier.service.ts, wrap database calls
private async getPromptTemplate(): Promise<string> {
  try {
    // Try to load from database
    const prompt = await prisma.prompt.findFirst({...});
    if (prompt?.content) return prompt.content;
  } catch (error) {
    // Fall back to default prompt (already implemented)
    console.log('Using default prompt template');
  }
  
  // Return default template
  return `...default template...`;
}
```

## Next Steps

Now that installation is complete:

1. 📖 Read the [Configuration Guide](./CONFIGURATION.md) for advanced options
2. 🔌 If using a connector architecture, see [Connector Architecture Guide](./CONNECTOR_ARCHITECTURE.md)
3. 📚 Explore [Usage Examples](./USAGE_EXAMPLES.md) for common scenarios
4. 🎯 Review [API Reference](./API_REFERENCE.md) for complete API documentation

## Getting Help

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues
- Review [examples/](../examples/) for working code samples
- Examine the source code - it's well-commented!

---

**Installation complete!** 🎉 You're ready to start classifying documents.


