# Job ID Workflow - How Files are Linked

## Overview

The `jobId` is used to link contract and data files that belong to the same processing session. Both files MUST share the same `jobId` so they can be correctly paired during analysis.

## The Problem

Initially, each file upload generated its own `jobId`, resulting in:
- ❌ Contract file: `job_1728518400000_abc123`
- ❌ Data file: `job_1728518401000_xyz789`
- ❌ Files cannot be matched together!

## The Solution

Now the workflow ensures both files share the same `jobId`:

### Step-by-Step Workflow

```
1. User selects contract PDF ────────┐
2. User selects data Excel file     │
3. User clicks "Process Documents"  │
                                     │
4. Frontend: Upload Contract        ↓
   POST /api/uploads
   ├─ file: contract.pdf
   ├─ uploadType: 'contract'
   └─ (no jobId provided)
   
5. Backend: Generates NEW jobId
   🆕 jobId = job_1728518400000_abc123
   
6. Backend Response:
   {
     upload: {
       id: 1,
       jobId: "job_1728518400000_abc123",  ← Extract this!
       filename: "contract.pdf",
       ...
     }
   }
   
7. Frontend: Extract jobId
   const jobId = contractUploadRes.data.upload.jobId;
   console.log('📝 Job ID:', jobId);
   
8. Frontend: Upload Data with SAME jobId
   POST /api/uploads
   ├─ file: data.xlsx
   ├─ uploadType: 'data'
   └─ jobId: "job_1728518400000_abc123"  ← Pass the same jobId!
   
9. Backend: Reuses existing jobId
   ♻️ jobId = job_1728518400000_abc123
   
10. Result: Both files have the SAME jobId! ✅
    ├─ Contract: job_1728518400000_abc123
    └─ Data:     job_1728518400000_abc123
```

## Code Implementation

### Frontend (`Processing.tsx`)

```typescript
// Step 1: Upload contract (generates jobId)
const contractUploadRes = await api.post('/uploads', contractFormData);

// Step 2: Extract jobId from response
const jobId = contractUploadRes.data.upload.jobId;

// Step 3: Upload data with the SAME jobId
const dataFormData = new FormData();
dataFormData.append('file', dataFile);
dataFormData.append('uploadType', 'data');
dataFormData.append('jobId', jobId); // ✅ Pass the same jobId

const dataUploadRes = await api.post('/uploads', dataFormData);
```

### Backend (`upload.controller.ts`)

```typescript
// Check if jobId is provided in request
let jobId = req.body.jobId || req.session?.jobId;

if (!jobId) {
  // Generate new jobId for first upload
  jobId = `job_${Date.now()}_${uuidv4()}`;
  console.log('🆕 Generated new jobId:', jobId);
} else {
  // Reuse existing jobId for second upload
  console.log('♻️ Reusing existing jobId:', jobId);
}

// Save upload with jobId
await fileService.createUpload(userId, jobId, ...);
```

## Verification

### Check in Console

**Frontend Console:**
```
📝 Job ID for this session: job_1728518400000_abc123
```

**Backend Console:**
```
🆕 Generated new jobId: job_1728518400000_abc123
♻️ Reusing existing jobId: job_1728518400000_abc123
```

### Check in Database

```sql
SELECT 
  id, 
  filename, 
  upload_type, 
  job_id, 
  created_at 
FROM uploads 
ORDER BY created_at DESC 
LIMIT 2;
```

**Expected Result:**
```
| id | filename        | upload_type | job_id                              | created_at          |
|----|-----------------|-------------|-------------------------------------|---------------------|
| 2  | data.xlsx       | data        | job_1728518400000_abc123           | 2025-10-10 01:30:45 |
| 1  | contract.pdf    | contract    | job_1728518400000_abc123           | 2025-10-10 01:30:42 |
```

✅ **Both have the same `job_id`!**

## Benefits

### 1. **Complete Traceability**
```sql
-- Find all files for a specific job
SELECT * FROM uploads WHERE job_id = 'job_xxx';

-- Find all processing steps for a job
SELECT * FROM analysis_records WHERE job_id = 'job_xxx';

-- Find all API calls for a job
SELECT * FROM api_logs WHERE job_id = 'job_xxx';
```

### 2. **Audit Trail**
```sql
-- Complete timeline of a job
SELECT 
  'upload' as event_type, 
  filename as details, 
  created_at 
FROM uploads 
WHERE job_id = 'job_xxx'
UNION ALL
SELECT 
  'analysis', 
  status, 
  created_at 
FROM analysis_records 
WHERE job_id = 'job_xxx'
ORDER BY created_at;
```

### 3. **Data Integrity**
- Ensures contract and data files are correctly paired
- Prevents mixing files from different sessions
- Enables batch operations on related files

## Troubleshooting

### Issue: Files have different jobIds

**Check:**
1. Is frontend passing `jobId` in second upload?
2. Is backend receiving `req.body.jobId`?
3. Are console logs showing the jobId flow?

**Debug:**
```typescript
// Frontend - add logging
console.log('Contract upload response:', contractUploadRes.data);
console.log('Extracted jobId:', jobId);
console.log('Data form data:', Array.from(dataFormData.entries()));
```

### Issue: jobId is undefined

**Cause:** Backend not returning jobId in response

**Fix:** Verify upload controller returns jobId:
```typescript
res.status(201).json({
  upload: {
    id: upload.id,
    jobId: upload.jobId, // ← Must include this!
    ...
  }
});
```

## Summary

| Step | Action | Who Generates | Result |
|------|--------|---------------|--------|
| 1 | Upload contract | Backend | New jobId created |
| 2 | Return jobId | Backend | Frontend receives jobId |
| 3 | Upload data with jobId | Frontend | Same jobId reused |
| 4 | All records use jobId | Both | Complete traceability |

**Key Principle:** First upload generates, subsequent uploads reuse! ✨

---

**Last Updated:** October 10, 2025  
**Status:** ✅ Implemented and Working
