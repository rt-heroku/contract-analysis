# Troubleshooting Guide

Common issues and solutions for the Document Classifier package.

## Installation Issues

### Canvas Build Fails

**Error:**
```
gyp ERR! build error
Error: `make` failed with exit code: 2
```

**Solution (macOS):**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

**Solution (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev
npm install canvas
```

**Solution (Windows):**
Use WSL2 or Docker. Canvas has limited Windows support.

### Tesseract Training Data Not Downloaded

**Error:**
```
Error: Tesseract training data not found
```

**Solution:**
Tesseract.js downloads training data automatically. Ensure:
- Internet connection available
- Write access to `/tmp` or `TEMP` directory
- At least 150MB free disk space

Manual download:
```bash
wget https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/eng.traineddata.gz
gunzip eng.traineddata.gz
# Place in node_modules/tesseract.js/tessdata/
```

### PDF.js Worker Not Found

**Error:**
```
Error: PDF.js worker script not found
```

**Solution:**
```typescript
// Add at the top of your entry file
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Disable worker (use main thread)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
```

## Runtime Issues

### Classification Timeout

**Error:**
```
Error: Classification timed out after 180000ms
```

**Solutions:**

1. **Increase timeout:**
```typescript
// In config/muleSoft.ts
export async function getMuleSoftConfig(): Promise<MuleSoftConfig> {
  return {
    // ...
    timeout: 300000, // 5 minutes
  };
}
```

2. **Process fewer pages:**
```typescript
const result = await DocumentClassifier.analyze(filePath, {
  useAI: false, // Skip AI classification for speed
  includeMetadata: false
});
```

3. **Use batch processing with smaller batches:**
```typescript
// In classifier.service.ts
async classifyBatch(requests: ClassificationRequest[]) {
  const batchSize = 3; // Reduce from 5
  // ...
}
```

### Low OCR Confidence

**Issue:** OCR confidence < 70%

**Solutions:**

1. **Use higher resolution:**
```typescript
import { PDFUtils } from './utils/pdf-utils';

// Increase scale for better quality
const imageBuffer = await PDFUtils.pageToImage(pdfPath, pageNum, 3.0);
```

2. **Pre-process images:**
```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Ubuntu

# Pre-process image
convert input.jpg -resize 200% -sharpen 0x1 output.jpg
```

3. **Try different languages:**
```typescript
const result = await DocumentClassifier.analyze(filePath, {
  language: 'eng+spa', // Multiple languages
});
```

### Classification Returns "unknown"

**Issue:** All documents classified as "unknown"

**Solutions:**

1. **Check LLM API connection:**
```bash
curl -u username:password http://your-api:8081/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

2. **Verify API credentials:**
```typescript
// Test configuration
import { getMuleSoftConfig } from './config/muleSoft';

const config = await getMuleSoftConfig();
console.log('Base URL:', config.baseUrl);
console.log('Username:', config.username);
console.log('Has password:', !!config.password);
```

3. **Check prompt template:**
```sql
SELECT * FROM prompts 
WHERE category = 'document_classifier' 
AND is_active = true;
```

4. **Enable debug logging:**
```typescript
// In classifier.service.ts
console.log('Prompt:', prompt);
console.log('API Response:', JSON.stringify(response.data, null, 2));
```

### Memory Issues with Large PDFs

**Error:**
```
Error: JavaScript heap out of memory
```

**Solutions:**

1. **Increase Node.js memory:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
node your-app.js
```

2. **Process pages individually:**
```typescript
// Instead of processing all pages at once
for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
  const page = await processPage(pdfPath, pageNum);
  // Process immediately and discard
}
```

3. **Use streaming:**
See [Usage Examples - Stream Processing](./USAGE_EXAMPLES.md#stream-processing-for-large-documents)

## Database Issues

### Prompt Not Found

**Error:**
```
No active prompt found for category 'document_classifier'
```

**Solution:**
```bash
# Seed default prompt
psql $DATABASE_URL -f database/seeds/default-prompts.sql
```

Or the service will fall back to built-in default automatically.

### Connector Not Found

**Error:**
```
No active LLM connector found
```

**Solution:**
```bash
# Seed LLM connector
psql $DATABASE_URL -f database/seeds/llm-connector.sql
```

### Database Connection Failed

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
pg_isready
```

2. **Verify DATABASE_URL:**
```bash
echo $DATABASE_URL
# Should be: postgresql://user:password@host:5432/database
```

3. **Test connection:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

4. **Make prompt database optional:**
```typescript
// In classifier.service.ts
private async getPromptTemplate(): Promise<string> {
  try {
    const prompt = await prisma.prompt.findFirst({...});
    if (prompt?.content) return prompt.content;
  } catch (error) {
    console.log('Database unavailable, using default prompt');
  }
  
  // Always return default
  return this.getDefaultPrompt();
}
```

## API Issues

### LLM API Returns Empty Response

**Issue:** `response.data.choices` is undefined

**Solution:**

Check response format:
```typescript
// Add debug logging
console.log('Raw response:', JSON.stringify(response.data, null, 2));

// Handle different formats
const content = 
  data?.choices?.[0]?.message?.content ||  // OpenAI format
  data?.response ||                         // MuleSoft simple format
  data?.content ||                          // Direct content
  data?.result?.content ||                  // Nested format
  JSON.stringify(data);                     // Last resort
```

### Authentication Failed

**Error:**
```
Error: Request failed with status code 401
```

**Solutions:**

1. **Basic Auth:**
```typescript
// Verify credentials
const config = await getMuleSoftConfig();
const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
console.log('Auth header:', `Basic ${auth}`);
```

2. **API Key:**
```typescript
// If using API key instead
const client = axios.create({
  baseURL: config.baseUrl,
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`
  }
});
```

## Performance Issues

### Slow Classification

**Issue:** Takes >30 seconds per page

**Solutions:**

1. **Reduce PDF resolution:**
```typescript
const imageBuffer = await PDFUtils.pageToImage(pdfPath, pageNum, 1.5); // Lower scale
```

2. **Skip AI for certain pages:**
```typescript
if (page.textLength < 20) {
  // Skip AI for blank pages
  return { documentType: 'blank', confidence: 100 };
}
```

3. **Use parallel processing:**
```typescript
const results = await Promise.all(
  pages.map(page => classifyPage(page))
);
```

4. **Cache results:**
```typescript
const cacheKey = crypto.createHash('md5').update(text).digest('hex');
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### High Memory Usage

**Issue:** Memory grows over time

**Solutions:**

1. **Clear temp files:**
```typescript
// In document-analyzer.service.ts
finally {
  await fs.unlink(filePath).catch(() => undefined);
  await fs.unlink(tempImagePath).catch(() => undefined);
}
```

2. **Limit concurrent operations:**
```typescript
const limit = pLimit(3); // Max 3 concurrent operations
const results = await Promise.all(
  pages.map(page => limit(() => processPage(page)))
);
```

## TypeScript Issues

### Type Errors

**Error:**
```
Cannot find module './config/database'
```

**Solution:**

1. **Check imports match your structure:**
```typescript
// Adjust import paths to match your project
import prisma from '../../../config/database';  // Adjust ../
```

2. **Create stub files if optional:**
```typescript
// config/database.ts (stub if not using Prisma)
export default {
  prompt: {
    findFirst: async () => null
  }
};
```

3. **Update tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Debugging Tips

### Enable Verbose Logging

```typescript
// At the top of your entry file
process.env.DEBUG = 'document-classifier:*';

// In service files, add detailed logs
console.log('[DocumentAnalyzer] Starting analysis:', filePath);
console.log('[OCR] Extracted text length:', text.length);
console.log('[Classifier] API call duration:', duration, 'ms');
```

### Test Individual Components

```typescript
// Test OCR only
import { OCRService } from './services/ocr.service';
const result = await OCRService.extractText('./test.jpg');
console.log('OCR result:', result);

// Test Classifier only
import { ClassifierService } from './services/classifier.service';
const classifier = new ClassifierService();
const result = await classifier.classifyDocument({
  extractedText: 'Invoice #12345...',
  pageNumber: 1,
  textLength: 100
});
console.log('Classification:', result);

// Test PDF Utils only
import { PDFUtils } from './utils/pdf-utils';
const text = await PDFUtils.extractTextDirect('./test.pdf');
console.log('PDF text:', text);
```

### Check System Resources

```bash
# Check disk space
df -h

# Check memory
free -h  # Linux
vm_stat  # macOS

# Check Node.js memory
node -e "console.log(process.memoryUsage())"
```

## Getting Help

If you're still stuck:

1. Check [Usage Examples](./USAGE_EXAMPLES.md) for working code
2. Review [Installation Guide](./INSTALLATION.md) step-by-step
3. Examine source code - it's well-commented
4. Check GitHub issues (if hosted)
5. Enable debug logging and examine output

## Common Gotchas

❌ **Don't:**
- Process 100+ page PDFs without streaming
- Run OCR on high-resolution images (>4000px)
- Call LLM API for blank pages
- Forget to clean up temp files
- Use synchronous file operations

✅ **Do:**
- Process large PDFs page-by-page
- Resize images before OCR
- Check text length before classification
- Clean up temp files in `finally` blocks
- Use async/await properly

---

**Still having issues?** Check the source code - each service has detailed comments explaining its operation.


