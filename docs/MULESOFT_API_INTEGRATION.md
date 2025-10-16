# MuleSoft API Integration

## Overview

The application integrates with MuleSoft's document processing and analysis APIs to extract data from contracts and perform analysis with associated data files.

## API Flow

### Step 1: Process Contract Document
```
POST http://localhost:8081/process/document?job={jobId}
Headers:
  Content-Type: application/json
  Authorization: Basic {credentials} (if configured)
Body: {} (empty - MuleSoft retrieves files by jobId)

Response:
{
  "document": "filename.pdf",
  "status": "SUCCEEDED",
  "terms": ["term1", "term2"],
  "products": ["product1", "product2"]
}
```

### Step 2: Analyze Data File
```
POST http://localhost:8081/analyze?job={jobId}
Headers:
  Content-Type: application/json
  Authorization: Basic {credentials} (if configured)
Body: {contractResult} (from Step 1)

Response:
{
  "reportMarkdown": "# Analysis Report\n...",
  "summaryData": {...},
  "analysisDetails": {...}
}
```

## Configuration

### Backend Environment Variables

```env
# MuleSoft API Configuration
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_USERNAME=
MULESOFT_API_PASSWORD=
MULESOFT_API_TIMEOUT=180000  # 3 minutes

# Logging
LOG_LEVEL=info  # Set to 'debug' for verbose logs
```

## Implementation Details

### File Upload
1. User uploads contract PDF and data file (Excel/CSV)
2. Files are stored in database as base64
3. A unique `jobId` (UUID) is generated and associated with both files
4. Files are tagged with upload type: 'contract' or 'data'

### Processing Workflow

#### Backend Services
- **document.service.ts**: Orchestrates the two-step processing
- **muleSoft.service.ts**: Handles API communication
- **logging.service.ts**: Logs all API calls to database

#### Processing Steps
1. **Upload Phase**
   - Contract file uploaded → generates `jobId`
   - Data file uploaded → uses same `jobId`
   - Creates `AnalysisRecord` with status 'processing'

2. **Step 1: Contract Processing**
   - Calls `/process/document?job={jobId}`
   - MuleSoft retrieves contract by `jobId`
   - Stores response in `ContractAnalysis` table
   - If fails: marks `AnalysisRecord` as 'failed', stops processing

3. **Step 2: Data Analysis**
   - Calls `/analyze?job={jobId}` with contract result in body
   - MuleSoft retrieves data file by `jobId`
   - Uses contract context from request body
   - Stores response in `DataAnalysis` table
   - Updates `AnalysisRecord` status to 'completed'

### Error Handling

#### Connection Errors
```javascript
ECONNREFUSED → "MuleSoft service is not running or not reachable"
ENOTFOUND → "DNS error - hostname could not be resolved"
timeout → "Request timeout - service took too long to respond"
```

#### Step-by-Step Error Tracking
- Each step is wrapped in try-catch
- If Step 1 fails, Step 2 is not attempted
- Error messages include step number (Step 1/2, Step 2/2)
- Frontend displays detailed error information

### Frontend Integration

#### Processing Page
```typescript
// Upload with same jobId
const contractResponse = await uploadFile(contractFile, 'contract');
const jobId = contractResponse.jobId;
await uploadFile(dataFile, 'data', jobId);

// Trigger processing
await processDocuments(jobId);
```

#### Analysis Details Page
- Polls `/api/analysis/:id` every 5 seconds
- Shows loading state while processing
- Displays results when status = 'completed'
- Shows error details when status = 'failed'

## Logging

### Clean Logs (Default)
```bash
LOG_LEVEL=info
```
Shows only important events:
- API requests and responses
- Processing steps
- Errors and warnings

### Debug Logs
```bash
LOG_LEVEL=debug
```
Shows additional details:
- Database queries
- Request/response bodies
- Timing information

## Database Schema

### Key Tables
- **uploads**: Stores files as base64 with jobId
- **analysis_records**: Tracks overall processing status
- **contract_analysis**: Stores contract extraction results
- **data_analysis**: Stores final analysis results
- **api_logs**: Records all API calls and responses

### jobId Tracking
Every record related to a processing job shares the same `jobId`:
- uploads.job_id
- analysis_records.job_id
- contract_analysis.job_id
- data_analysis.job_id
- api_logs.job_id

## Timeout Configuration

### Default: 3 Minutes
The `/analyze` endpoint can take 1-2 minutes to complete. The timeout is set to 3 minutes to accommodate this.

To adjust:
```env
MULESOFT_API_TIMEOUT=180000  # milliseconds (3 min)
```

### Heroku Configuration
```bash
heroku config:set MULESOFT_API_TIMEOUT=180000
```

## Testing

### Local Testing
1. Start MuleSoft service on port 8081
2. Set `MULESOFT_API_BASE_URL=http://localhost:8081`
3. Upload files and process
4. Check logs for step-by-step progress

### Error Handling Testing
1. Stop MuleSoft service
2. Try processing documents
3. Should see clear error message
4. Frontend shows "MuleSoft service is currently unavailable"

## API Logging

All MuleSoft API calls are logged to the `api_logs` table:
- Request URL, headers, body
- Response status, body, time
- Related records (upload, analysis)
- Duration in milliseconds

## Deployment

### Heroku
```bash
# Set environment variables
heroku config:set MULESOFT_API_BASE_URL=https://your-mulesoft-api.com
heroku config:set MULESOFT_API_TIMEOUT=180000
heroku config:set LOG_LEVEL=info

# Optional: Basic Auth
heroku config:set MULESOFT_API_USERNAME=your-username
heroku config:set MULESOFT_API_PASSWORD=your-password
```

### Production Considerations
- Use HTTPS for MuleSoft API
- Configure proper authentication
- Set appropriate timeout values
- Monitor API logs for failures
- Implement retry logic for transient failures
