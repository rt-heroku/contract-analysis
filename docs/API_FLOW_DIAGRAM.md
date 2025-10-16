# MuleSoft API Integration Flow

## Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                         (Frontend - Port 3000)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1. Upload contract PDF
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POST /api/uploads                                    │
│                         Body: { file: contract.pdf, uploadType: 'contract' } │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND GENERATES jobId                              │
│                         🆕 job_1760073877948_b45bce2b...                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Response: { upload: { id, jobId, ... } }
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND EXTRACTS jobId                              │
│                         const jobId = response.data.upload.jobId             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 2. Upload data Excel
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POST /api/uploads                                    │
│                         Body: {                                              │
│                           file: data.xlsx,                                   │
│                           uploadType: 'data',                                │
│                           jobId: 'job_1760073877948_b45bce2b...'  ✅         │
│                         }                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND REUSES SAME jobId                            │
│                         ♻️  job_1760073877948_b45bce2b...                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 3. User clicks "Process Documents"
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POST /api/analysis/start                             │
│                         Body: {                                              │
│                           contractUploadId: 1,                               │
│                           dataUploadId: 2                                    │
│                         }                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND PROCESSING WORKFLOW                               │
│                    (document.service.ts)                                     │
│                                                                              │
│  1. Create analysis_record (status: PROCESSING)                             │
│  2. Extract jobId from uploads                                              │
│  3. Call MuleSoft APIs in sequence ─────────────────────────────────┐       │
└─────────────────────────────────────────────────────────────────────┼───────┘
                                                                       │
       ┌───────────────────────────────────────────────────────────────┘
       │
       │ STEP 1: Process Document
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MULESOFT API CALL #1                                 │
│                         (muleSoft.service.ts)                                │
│                                                                              │
│  POST http://localhost:8081/process/document?job=job_176007387...           │
│  Headers: { Content-Type: application/json }                                │
│  Body: {} (empty - MuleSoft retrieves files using jobId)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULESOFT IDP API (Port 8081)                              │
│                                                                              │
│  1. Receives jobId: job_176007387...                                        │
│  2. Retrieves contract PDF using jobId                                      │
│  3. Retrieves data Excel using jobId                                        │
│  4. Processes document extraction                                           │
│  5. Returns contract analysis                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Response
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                           │
│    "document": "Dreamfields_Distribution_Agreement.pdf",                    │
│    "status": "SUCCEEDED",                                                   │
│    "terms": [                                                               │
│      "Promotional discount funded 50% by Distributor...",                   │
│      "SRP markdowns must comply with state minimums",                       │
│      "Approved mechanics: price-drop, bundle, cart add-on"                  │
│    ],                                                                       │
│    "products": [                                                            │
│      "Infused Jeeter XL 2g Blueberry Kush - Units: 4",                     │
│      "Infused Jeeter 1g Blue ZKZ - Units: 3",                              │
│      "Infused Baby Jeeter 0.5g X 5 Tropicali - Units: 3"                   │
│    ]                                                                        │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND SAVES CONTRACT ANALYSIS                           │
│                    (contract_analysis table)                                 │
│                                                                              │
│  - uploadId, jobId, documentName, status                                    │
│  - terms[], products[], mulesoftResponse                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ STEP 2: Analyze Data
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MULESOFT API CALL #2                                 │
│                         (muleSoft.service.ts)                                │
│                                                                              │
│  POST http://localhost:8081/analyze?job=job_176007387...                    │
│  Headers: { Content-Type: application/json }                                │
│  Body: {} (empty - MuleSoft uses contract analysis from step 1)             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULESOFT IDP API (Port 8081)                              │
│                                                                              │
│  1. Receives jobId: job_176007387...                                        │
│  2. Retrieves contract analysis from step 1                                 │
│  3. Combines with data file                                                 │
│  4. Generates final analysis                                                │
│  5. Returns markdown report + data table                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Response
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                           │
│    "analysis_markdown": "# Contract Analysis Report\n\n## Summary...",      │
│    "data_table": [                                                          │
│      {                                                                      │
│        "product": "Infused Jeeter XL 2g Blueberry Kush",                   │
│        "category": "Premium",                                               │
│        "unitsSold": 4,                                                      │
│        "complianceStatus": "Compliant"                                      │
│      },                                                                     │
│      ...                                                                    │
│    ]                                                                        │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND SAVES DATA ANALYSIS                               │
│                    (data_analysis table)                                     │
│                                                                              │
│  - contractAnalysisId, jobId                                                │
│  - analysisMarkdown, dataTable, mulesoftResponse                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UPDATE ANALYSIS RECORD                                    │
│                    status: COMPLETED                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SEND NOTIFICATION TO USER                                 │
│                    "Your analysis is ready!"                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER VIEWS RESULTS                                        │
│                    (Frontend - Analysis Details Page)                        │
│                                                                              │
│  Tab 1: Document Extraction                                                 │
│    - Terms, Products                                                        │
│                                                                              │
│  Tab 2: Final Analysis                                                      │
│    - Summary stats, Markdown report                                         │
│    - Export to PDF                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Tables with jobId

```
uploads
├─ id, userId, jobId ✅, filename, fileContentBase64, uploadType
│
├─→ contract_analysis
│   ├─ id, uploadId, jobId ✅, documentName, status, terms, products
│   │
│   └─→ data_analysis
│       ├─ id, contractAnalysisId, jobId ✅, analysisMarkdown, dataTable
│       │
│       └─→ analysis_records
│           ├─ id, userId, jobId ✅, contractUploadId, dataUploadId
│           └─ contractAnalysisId, dataAnalysisId, status
│
├─→ api_logs
│   └─ id, userId, jobId ✅, requestUrl, responseStatus, responseTimeMs
│
└─→ activity_logs
    └─ id, userId, jobId ✅, actionType, actionDescription
```

## Key Points

### 1. Single jobId Throughout
- ✅ Both files share the same jobId
- ✅ All database records linked by jobId
- ✅ Complete audit trail

### 2. Files Uploaded First
- ✅ Files stored in webapp database (base64)
- ✅ MuleSoft retrieves files using jobId
- ✅ No file content in API requests

### 3. Sequential Processing
1. Upload both files → Store in DB with shared jobId
2. Process document → MuleSoft extracts contract info
3. Analyze data → MuleSoft generates final report
4. Display results → Frontend shows complete analysis

### 4. API Query Parameters
- ✅ jobId passed as query parameter: `?job={jobId}`
- ✅ Empty request body: `{}`
- ✅ MuleSoft uses jobId to retrieve files

## Code References

### Frontend
- **File:** `frontend/src/pages/Processing.tsx`
- **Line:** ~95-110
- **Action:** Extracts jobId from contract upload, passes to data upload

### Backend
- **File:** `backend/src/controllers/upload.controller.ts`
- **Line:** ~30-45
- **Action:** Generates or reuses jobId

- **File:** `backend/src/services/document.service.ts`
- **Line:** ~18-40
- **Action:** Orchestrates processing workflow

- **File:** `backend/src/services/muleSoft.service.ts`
- **Line:** ~93-128
- **Action:** Makes API calls with jobId

## Testing Checklist

- [ ] MuleSoft API running on port 8081
- [ ] Backend .env configured with MULESOFT_API_BASE_URL
- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] Upload contract PDF
- [ ] Upload data Excel file
- [ ] Both uploads show same jobId in logs
- [ ] Click "Process Documents"
- [ ] Backend logs show MuleSoft API calls
- [ ] Contract analysis saved to database
- [ ] Final analysis saved to database
- [ ] Results displayed in frontend

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Complete Workflow Documentation


