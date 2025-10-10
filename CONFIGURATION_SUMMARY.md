# MuleSoft API Configuration - Quick Summary

## ✅ What Has Been Configured

### 1. Environment Variable Setup

**Location:** `/backend/.env.local` (created for you)

```bash
MULESOFT_API_BASE_URL="http://localhost:8081"
```

This tells the backend where to find your MuleSoft API.

### 2. API Integration Updated

The following files have been updated to support the new jobId-based workflow:

#### `/backend/src/config/muleSoft.ts`
- Endpoint for document processing: `/process/document`
- Endpoint for final analysis: `/analyze`

#### `/backend/src/services/muleSoft.service.ts`
- `processContractDocument(jobId)` - Calls `http://localhost:8081/process/document?job={jobId}`
- `analyzeDataFile(jobId)` - Calls `http://localhost:8081/analyze?job={jobId}`
- Both methods now pass the jobId as a query parameter
- Removed file upload from API calls (files are uploaded to webapp first)

#### `/backend/src/services/document.service.ts`
- Extracts jobId from uploaded files
- Calls MuleSoft APIs with the jobId
- Stores responses in database

## 🔄 New Workflow

### Before (Old)
```
Upload contract → Send to MuleSoft → Process
Upload data → Send to MuleSoft → Analyze
```

### Now (New)
```
1. Upload contract PDF → Stores in DB with jobId
2. Upload data Excel → Stores in DB with SAME jobId
3. Click "Process Documents"
4. Backend calls: POST http://localhost:8081/process/document?job={jobId}
   - MuleSoft retrieves both files using jobId
   - Returns: { document, status, terms[], products[] }
5. Backend calls: POST http://localhost:8081/analyze?job={jobId}
   - MuleSoft generates final analysis
   - Returns: { analysis_markdown, data_table }
6. User views complete results
```

## 📝 What You Need to Do

### 1. Copy the .env file

```bash
cd backend
cp .env.local .env
```

Or manually create `/backend/.env` with:
```bash
MULESOFT_API_BASE_URL="http://localhost:8081"
```

### 2. Ensure Your MuleSoft API is Running

Your MuleSoft API should be listening on `http://localhost:8081` and support these endpoints:

#### Endpoint 1: Process Document
```
POST http://localhost:8081/process/document?job={jobId}
Body: {} (empty)
```

Expected response:
```json
{
  "document": "filename.pdf",
  "status": "SUCCEEDED",
  "terms": ["term1", "term2"],
  "products": ["product1", "product2"]
}
```

#### Endpoint 2: Analyze
```
POST http://localhost:8081/analyze?job={jobId}
Body: {} (empty)
```

Expected response:
```json
{
  "analysis_markdown": "# Report...",
  "data_table": [...]
}
```

### 3. Restart the Backend

```bash
cd backend
npm run dev
```

## 🧪 Testing

1. Start your MuleSoft API on port 8081
2. Start the webapp backend on port 5001
3. Start the webapp frontend on port 3000
4. Navigate to http://localhost:3000
5. Upload a contract PDF
6. Upload a data Excel file
7. Click "Process Documents"
8. Check the backend logs:
   ```
   🆕 Generated new jobId: job_xxx
   Making MuleSoft API request to /process/document with jobId: job_xxx
   MuleSoft API request successful
   Making MuleSoft API request to /analyze with jobId: job_xxx
   MuleSoft API request successful
   ```

## 📚 Additional Documentation

- **Detailed Setup:** See [MULESOFT_SETUP.md](./MULESOFT_SETUP.md)
- **jobId Workflow:** See [JOBID_WORKFLOW.md](./JOBID_WORKFLOW.md)
- **Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🐛 Common Issues

### Issue: "MuleSoft API Error: connect ECONNREFUSED"

**Solution:** Ensure your MuleSoft API is running on port 8081:
```bash
curl http://localhost:8081
```

### Issue: Backend can't find .env file

**Solution:** Copy the .env.local to .env:
```bash
cd backend
cp .env.local .env
```

### Issue: Wrong jobId in MuleSoft logs

**Solution:** Check that:
1. Frontend passes jobId when uploading second file
2. Backend logs show "Reusing existing jobId"
3. Both files have the same jobId in the database

## ✨ What's Different

| Aspect | Before | Now |
|--------|--------|-----|
| File Upload | Sent to MuleSoft directly | Stored in webapp DB first |
| jobId | Not used | Links all files & processing |
| API Calls | Sent file content | Sent jobId only |
| Traceability | Limited | Complete audit trail |

## 🎯 Summary

✅ MuleSoft API URL configured: `http://localhost:8081`  
✅ API endpoints updated: `/process/document` and `/analyze`  
✅ jobId-based workflow implemented  
✅ Files uploaded to webapp first, then processed by MuleSoft  
✅ Complete traceability via jobId  

**Next Step:** Copy `.env.local` to `.env` and restart the backend!

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Ready to Use


