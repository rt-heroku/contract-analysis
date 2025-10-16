# What's New - MuleSoft API Integration

## 🎯 Summary of Changes

All changes have been made to integrate your MuleSoft IDP API at `http://localhost:8081` with a jobId-based workflow.

## ✅ Files Modified

### Backend Configuration
1. **`/backend/src/config/muleSoft.ts`**
   - Updated analyze endpoint from `/analyze/data` → `/analyze`
   
2. **`/backend/src/services/muleSoft.service.ts`**
   - Changed API calls to use query parameters: `?job={jobId}`
   - Removed file content from request body
   - Updated methods to accept jobId instead of file data
   - Added jobId logging for traceability

3. **`/backend/src/services/document.service.ts`**
   - Updated to call MuleSoft APIs with jobId
   - Removed file upload logic from API calls
   - Enhanced logging with jobId context

4. **`/backend/.env.local`** (Created)
   - Contains all environment variables including:
   - `MULESOFT_API_BASE_URL=http://localhost:8081`

### Documentation Created
1. **`MULESOFT_SETUP.md`** - Complete integration guide
2. **`CONFIGURATION_SUMMARY.md`** - Quick start guide
3. **`API_FLOW_DIAGRAM.md`** - Visual workflow
4. **`WHATS_NEW.md`** - This file

### Documentation Updated
1. **`README.md`** - Updated with MuleSoft setup link

## 🔄 New API Flow

### Your MuleSoft API Endpoints

#### 1. Process Document
```
POST http://localhost:8081/process/document?job={jobId}
Body: {} (empty)
```

**What it does:**
- Retrieves contract PDF and data Excel using the jobId
- Extracts terms and products from the contract
- Returns document analysis

**Expected Response:**
```json
{
  "document": "filename.pdf",
  "status": "SUCCEEDED",
  "terms": ["term1", "term2", ...],
  "products": ["product1", "product2", ...]
}
```

#### 2. Analyze
```
POST http://localhost:8081/analyze?job={jobId}
Body: {} (empty)
```

**What it does:**
- Uses the contract analysis from step 1
- Combines with data file
- Generates final analysis report

**Expected Response:**
```json
{
  "analysis_markdown": "# Report...",
  "data_table": [...]
}
```

## 📋 What You Need to Do

### Step 1: Copy Environment File
```bash
cd backend
cp .env.local .env
```

This creates your local `.env` file with the MuleSoft API URL configured.

### Step 2: Ensure Your MuleSoft API Supports the New Flow

Your MuleSoft API should:
1. Accept jobId as a query parameter: `?job={jobId}`
2. Store files internally when they're uploaded to the webapp
3. Retrieve files using the jobId when processing
4. Return the expected JSON responses

### Step 3: Restart the Backend
```bash
cd backend
npm run dev
```

### Step 4: Test the Integration

1. Start your MuleSoft API: `http://localhost:8081`
2. Start the webapp backend: `http://localhost:5001`
3. Start the webapp frontend: `http://localhost:3000`
4. Upload both files (contract + data)
5. Click "Process Documents"
6. Watch the backend logs for MuleSoft API calls

## 🧪 Expected Log Output

```
🆕 Generated new jobId: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
♻️  Reusing existing jobId: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
Processing contract and data for jobId: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
Making MuleSoft API request to /process/document with jobId: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
MuleSoft API request successful (1234ms)
Running final analysis for jobId: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
Making MuleSoft API request to /analyze with jobId: job_1760073877948_b45bce2b-ba3d-4f0c-ba4b-1ee737389469
MuleSoft API request successful (2345ms)
Processing completed for analysis record 1
```

## 📊 Database Impact

All tables now include `jobId` for complete traceability:
- `uploads` - Links uploaded files
- `contract_analysis` - Links extracted data
- `data_analysis` - Links final analysis
- `analysis_records` - Links complete session
- `api_logs` - Links API calls
- `activity_logs` - Links user actions

## 🎨 UI Changes

The frontend already supports this workflow:
- Extracts jobId from contract upload response
- Passes same jobId when uploading data file
- Displays jobId in logs for debugging

## 📚 Documentation Index

1. **Quick Start** → `CONFIGURATION_SUMMARY.md`
2. **Detailed Setup** → `MULESOFT_SETUP.md`
3. **Visual Flow** → `API_FLOW_DIAGRAM.md`
4. **jobId Workflow** → `JOBID_WORKFLOW.md`
5. **Deployment** → `DEPLOYMENT.md`

## 🐛 Troubleshooting

### Issue: "connect ECONNREFUSED"
- **Solution:** Start your MuleSoft API on port 8081

### Issue: ".env file not found"
- **Solution:** Copy `.env.local` to `.env` in backend folder

### Issue: "Different jobIds for files"
- **Solution:** Check frontend logs, ensure jobId is passed in second upload

### Issue: "MuleSoft returns 404"
- **Solution:** Verify your MuleSoft API supports the query parameter format

## ✨ Benefits of This Integration

1. **Complete Traceability**
   - Every file, API call, and result linked by jobId
   - Easy to debug and audit

2. **Simplified API Calls**
   - No file content in API requests
   - Just pass the jobId, MuleSoft retrieves files

3. **Better Performance**
   - Files uploaded once to webapp
   - MuleSoft can cache and reuse

4. **Clean Architecture**
   - Frontend uploads to webapp
   - Backend orchestrates processing
   - MuleSoft handles IDP logic

## 🎯 Next Actions

- [ ] Copy `backend/.env.local` to `backend/.env`
- [ ] Restart backend server
- [ ] Test with sample contract and data files
- [ ] Verify MuleSoft API receives correct jobId
- [ ] Check database for linked records

## 📞 Need Help?

Refer to these files:
- API not responding → `MULESOFT_SETUP.md` (Troubleshooting section)
- Understanding flow → `API_FLOW_DIAGRAM.md`
- jobId issues → `JOBID_WORKFLOW.md`

---

**Configuration Date:** October 10, 2025  
**Status:** ✅ Ready for Testing  
**MuleSoft API URL:** http://localhost:8081
