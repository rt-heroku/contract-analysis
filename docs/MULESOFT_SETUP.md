# MuleSoft API Integration Setup

## Overview

This application integrates with MuleSoft IDP (Intelligent Document Processing) APIs to process contracts and analyze data. The integration uses a **jobId-based workflow** where both files are uploaded first, then processed together using the same jobId.

## Environment Configuration

### 1. Backend Environment Variables

Create or update `/backend/.env` with:

```bash
# MuleSoft API Configuration
MULESOFT_API_BASE_URL="http://localhost:8081"
MULESOFT_API_USERNAME=""           # Optional - for basic auth
MULESOFT_API_PASSWORD=""           # Optional - for basic auth
MULESOFT_API_TIMEOUT="30000"       # 30 seconds
```

**Important:** The `.env` file is in `.gitignore` for security. Never commit credentials!

### 2. Example File

An `.env.example` file has been provided in `/backend/.env.example` with all the required variables. Copy this file to create your local `.env`:

```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

## API Flow

### Workflow Overview

```
1. Frontend uploads both files (contract + data)
   ├─ Upload contract PDF → generates jobId
   └─ Upload data Excel → uses same jobId
   
2. User clicks "Process Documents"
   ├─ Backend receives both upload IDs
   └─ Backend extracts jobId from uploads
   
3. Backend calls MuleSoft /process/document
   ├─ POST http://localhost:8081/process/document?job={jobId}
   ├─ MuleSoft processes both files using jobId
   └─ Returns: { document, status, terms[], products[] }
   
4. Backend saves contract analysis
   
5. Backend calls MuleSoft /analyze
   ├─ POST http://localhost:8081/analyze?job={jobId}
   ├─ MuleSoft generates final analysis
   └─ Returns: { analysis_markdown, data_table }
   
6. Backend saves data analysis
   
7. User views complete results
```

### API Endpoints

#### 1. Process Document

**Endpoint:** `POST /process/document?job={jobId}`

**Description:** Extracts information from the contract PDF and data file using the jobId.

**Request:**
- Method: `POST`
- URL: `http://localhost:8081/process/document?job=job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469`
- Body: `{}` (empty body - files already uploaded)

**Response:**
```json
{
  "document": "Dreamfields_Distribution_Agreement_Puff_Utica_REC.pdf",
  "status": "SUCCEEDED",
  "terms": [
    "Promotional discount funded 50% by Distributor and 50% by Retailer",
    "SRP markdowns must comply with state minimums",
    "Approved mechanics: price-drop, bundle (2 for), cart add-on"
  ],
  "products": [
    "Infused Jeeter XL 2g Blueberry Kush - Units sold: 4",
    "Infused Jeeter 1g Blue ZKZ - Units sold: 3",
    "Infused Baby Jeeter 0.5g X 5 Tropicali - Units sold: 3"
  ]
}
```

#### 2. Analyze Data

**Endpoint:** `POST /analyze?job={jobId}`

**Description:** Generates final analysis combining contract terms and data insights.

**Request:**
- Method: `POST`
- URL: `http://localhost:8081/analyze?job=job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469`
- Body: `{}` (empty body - uses contract analysis from step 1)

**Response:**
```json
{
  "analysis_markdown": "# Contract Analysis Report\n\n## Summary\n...",
  "data_table": [
    {
      "product": "Infused Jeeter XL 2g Blueberry Kush",
      "category": "Premium",
      "unitsSold": 4,
      "complianceStatus": "Compliant"
    }
  ]
}
```

## Code Structure

### Backend Files

#### 1. `/backend/src/config/env.ts`
- Loads environment variables from `.env`
- Validates required configuration
- Exports typed config object

#### 2. `/backend/src/config/muleSoft.ts`
- Defines MuleSoft configuration structure
- Sets API endpoints
- Exports MuleSoft-specific config

#### 3. `/backend/src/services/muleSoft.service.ts`
- Handles all MuleSoft API communication
- Methods:
  - `processContractDocument(jobId)` - Calls `/process/document?job={jobId}`
  - `analyzeDataFile(jobId)` - Calls `/analyze?job={jobId}`
  - `makeRequest()` - Internal method for HTTP requests
  - `testConnection()` - Tests API connectivity

#### 4. `/backend/src/services/document.service.ts`
- Orchestrates the complete processing workflow
- Methods:
  - `startProcessing()` - Initiates processing, extracts jobId
  - `processDocuments()` - Calls MuleSoft APIs in sequence
  - Handles database operations
  - Sends notifications

## jobId Workflow

### Why jobId?

The `jobId` links all files and processing steps for a single analysis session:
- Both files (contract + data) share the same jobId
- MuleSoft APIs use this jobId to retrieve and process the correct files
- Database records are linked via jobId for traceability

### jobId Generation

Generated in `/backend/src/controllers/upload.controller.ts`:
```typescript
const jobId = `job_${Date.now()}_${uuidv4()}`;
// Example: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
```

### Database Schema

All processing-related tables include `jobId`:
- `uploads` - Links uploaded files
- `contract_analysis` - Links extracted contract data
- `data_analysis` - Links final analysis results
- `analysis_records` - Links complete analysis session
- `api_logs` - Links API calls to processing session
- `activity_logs` - Links user actions to processing session

## Testing the Integration

### 1. Start MuleSoft API

Ensure your MuleSoft API is running on port 8081:
```bash
# Your MuleSoft API should be listening on:
http://localhost:8081
```

### 2. Test API Connectivity

```bash
# Test if MuleSoft API is accessible
curl http://localhost:8081/health
```

### 3. Start the Application

```bash
# Start backend and frontend
npm run dev
```

### 4. Test the Workflow

1. Navigate to http://localhost:3000
2. Login or register
3. Go to "Processing" page
4. Upload a contract PDF
5. Upload a data Excel/CSV file
6. Click "Process Documents"
7. Monitor the backend logs:
   ```
   🆕 Generated new jobId: job_xxx
   Making MuleSoft API request to /process/document with jobId: job_xxx
   Making MuleSoft API request to /analyze with jobId: job_xxx
   ```

## Troubleshooting

### Issue: "MuleSoft API Error: connect ECONNREFUSED"

**Cause:** MuleSoft API is not running or wrong URL

**Solution:**
1. Verify MuleSoft API is running:
   ```bash
   curl http://localhost:8081
   ```
2. Check `MULESOFT_API_BASE_URL` in `.env`
3. Ensure no firewall is blocking the connection

### Issue: "MuleSoft API Error: 401 Unauthorized"

**Cause:** MuleSoft API requires authentication

**Solution:**
1. Add credentials to `.env`:
   ```bash
   MULESOFT_API_USERNAME="your-username"
   MULESOFT_API_PASSWORD="your-password"
   ```
2. Restart the backend

### Issue: "MuleSoft API Error: 404 Not Found"

**Cause:** Wrong endpoint path

**Solution:**
1. Verify MuleSoft API endpoints:
   - `/process/document?job={jobId}`
   - `/analyze?job={jobId}`
2. Check `/backend/src/config/muleSoft.ts` endpoint configuration

### Issue: "MuleSoft API Error: Timeout"

**Cause:** Processing takes too long

**Solution:**
1. Increase timeout in `.env`:
   ```bash
   MULESOFT_API_TIMEOUT="60000"  # 60 seconds
   ```
2. Restart the backend

## API Logs

All MuleSoft API calls are logged to the `api_logs` table:

```sql
SELECT 
  id,
  job_id,
  request_method,
  request_url,
  response_status,
  response_time_ms,
  created_at
FROM api_logs
WHERE job_id = 'job_xxx'
ORDER BY created_at;
```

This provides complete visibility into:
- When APIs were called
- What data was sent
- What responses were received
- How long each call took
- Any errors that occurred

## Security Notes

### Credentials

- Never commit `.env` files
- Use environment variables for all sensitive data
- Consider using secrets management (AWS Secrets Manager, Vault)

### Data

- Files are stored as base64 in the database
- Consider implementing file encryption at rest
- Implement proper access controls

### API Communication

- Use HTTPS in production
- Implement API authentication
- Rate limit API calls
- Log all API interactions

## Production Deployment

### Heroku

Set environment variables via Heroku CLI:
```bash
heroku config:set MULESOFT_API_BASE_URL="https://your-mulesoft-api.com"
heroku config:set MULESOFT_API_USERNAME="production-username"
heroku config:set MULESOFT_API_PASSWORD="production-password"
```

### Other Platforms

Consult your platform's documentation for setting environment variables:
- AWS: Use Parameter Store or Secrets Manager
- Azure: Use Key Vault
- Google Cloud: Use Secret Manager

## Support

For issues with:
- **Application code**: Check backend logs, review this documentation
- **MuleSoft API**: Contact MuleSoft support or check MuleSoft API documentation
- **Database**: Review Prisma schema, check database logs

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Configured and Ready


