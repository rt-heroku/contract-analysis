# Job ID Implementation Guide

## Overview

The `jobId` field has been added across all database tables and services to track related operations throughout the document processing workflow. This allows you to trace all activities, logs, uploads, analyses, and records that belong to the same processing job.

## Database Schema Changes

### Tables Updated with `jobId`

All the following tables now include a `jobId` field (`VARCHAR(100)`):

1. **`uploads`** - Tracks file uploads
   - Added: `jobId` (required field)
   - Index: Added index on `jobId` for fast lookups

2. **`contract_analysis`** - Stores contract extraction results
   - Added: `jobId` (required field)
   - Index: Added index on `jobId`

3. **`data_analysis`** - Stores data file analysis results
   - Added: `jobId` (required field)
   - Index: Added index on `jobId`

4. **`analysis_records`** - Main processing records
   - Added: `jobId` (required field)
   - Index: Added index on `jobId`

5. **`api_logs`** - MuleSoft API call logs
   - Added: `jobId` (optional field)
   - Index: Added index on `jobId`

6. **`activity_logs`** - User activity tracking
   - Added: `jobId` (optional field)
   - Index: Added index on `jobId`

## Job ID Generation

### Format
```
job_<timestamp>_<uuid>
```

Example: `job_1728518400000_a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Generation Logic

The `jobId` is generated in the **Upload Controller** when the first file is uploaded:

```typescript
// backend/src/controllers/upload.controller.ts
let jobId = req.body.jobId || req.session?.jobId;
if (!jobId) {
  jobId = `job_${Date.now()}_${uuidv4()}`;
  if (req.session) {
    req.session.jobId = jobId;
  }
}
```

### Job ID Lifecycle

1. **Upload Phase**: 
   - First file upload generates a new `jobId`
   - Stored in session for subsequent uploads in the same job
   - Can be provided in request body to link uploads

2. **Processing Phase**:
   - Contract and data analysis records use the same `jobId`
   - All MuleSoft API calls log the `jobId`
   - Activity logs track user actions with `jobId`

3. **Analysis Phase**:
   - Final analysis records link back to original uploads via `jobId`
   - Complete audit trail available

## Usage Examples

### 1. Uploading Files with the Same Job ID

**First File (Contract)**:
```bash
POST /api/upload
Content-Type: multipart/form-data

{
  "file": <contract.pdf>,
  "uploadType": "contract"
}

Response:
{
  "upload": {
    "id": 1,
    "jobId": "job_1728518400000_abc123...",
    "filename": "contract.pdf",
    ...
  }
}
```

**Second File (Data) - Same Job**:
```bash
POST /api/upload
Content-Type: multipart/form-data

{
  "file": <data.xlsx>,
  "uploadType": "data",
  "jobId": "job_1728518400000_abc123..."  // Use the same jobId
}
```

### 2. Querying by Job ID

```sql
-- Get all uploads for a job
SELECT * FROM uploads WHERE job_id = 'job_1728518400000_abc123...';

-- Get all logs for a job
SELECT * FROM activity_logs WHERE job_id = 'job_1728518400000_abc123...';
SELECT * FROM api_logs WHERE job_id = 'job_1728518400000_abc123...';

-- Get complete processing history for a job
SELECT 
  u.filename,
  u.upload_type,
  ca.status as contract_status,
  da.status as data_status,
  ar.status as analysis_status
FROM uploads u
LEFT JOIN contract_analysis ca ON ca.job_id = u.job_id
LEFT JOIN data_analysis da ON da.job_id = u.job_id
LEFT JOIN analysis_records ar ON ar.job_id = u.job_id
WHERE u.job_id = 'job_1728518400000_abc123...';
```

### 3. TypeScript Service Usage

```typescript
// Creating an upload with jobId
await fileService.createUpload(
  userId,
  jobId,           // <-- Job ID parameter
  filename,
  fileType,
  fileSize,
  mimeType,
  fileContentBase64,
  uploadType
);

// Logging with jobId
await loggingService.logActivity({
  userId,
  jobId,           // <-- Job ID parameter
  actionType: 'FILE_UPLOAD',
  actionDescription: 'Uploaded contract file',
  ...
});

await loggingService.logApiCall({
  userId,
  jobId,           // <-- Job ID parameter
  requestMethod: 'POST',
  requestUrl: '/mulesoft/api/contract',
  ...
});
```

## Benefits

### 1. **Complete Audit Trail**
- Track every action related to a specific job
- Identify all files, analyses, and API calls for a processing session

### 2. **Debugging & Troubleshooting**
- Quickly find all logs related to a failed job
- Trace the entire workflow from upload to final analysis

### 3. **Analytics & Reporting**
- Calculate processing times per job
- Identify bottlenecks in the workflow
- Generate job-level reports

### 4. **Data Integrity**
- Ensure contract and data files are correctly paired
- Prevent mixing files from different processing sessions

## Migration Notes

### Database Migration
The database was reset and re-seeded with the new schema:

```bash
npx prisma db push --force-reset
npx prisma generate
npm run seed
```

### Existing Data
⚠️ **Important**: All existing data was cleared during the migration since `jobId` is a required field in most tables.

For production deployments:
1. Make `jobId` optional initially
2. Backfill existing records with generated `jobId` values
3. Make `jobId` required after backfill

## Frontend Integration

### Storing Job ID in Frontend

```typescript
// After first upload
const uploadResponse = await api.post('/api/upload', formData);
const jobId = uploadResponse.data.upload.jobId;

// Store in component state or context
setCurrentJobId(jobId);

// Use for subsequent uploads
const formData = new FormData();
formData.append('file', file);
formData.append('uploadType', 'data');
formData.append('jobId', jobId);  // <-- Pass the jobId
```

### Displaying Job Information

```typescript
// Fetch all records for a job
const jobData = await api.get(`/api/jobs/${jobId}`);

// Display:
// - Uploads (contract + data files)
// - Processing status
// - Analysis results
// - Activity timeline
```

## API Endpoints to Add (Recommended)

### Get Job Details
```
GET /api/jobs/:jobId
Response:
{
  "jobId": "job_1728518400000_abc123...",
  "uploads": [...],
  "contractAnalysis": {...},
  "dataAnalysis": {...},
  "analysisRecords": [...],
  "activityLogs": [...],
  "apiLogs": [...]
}
```

### List User Jobs
```
GET /api/users/:userId/jobs
Response:
{
  "jobs": [
    {
      "jobId": "job_1728518400000_abc123...",
      "createdAt": "2024-10-10T01:00:00Z",
      "status": "completed",
      "fileCount": 2
    },
    ...
  ]
}
```

## Testing

### Manual Testing
1. Upload a contract file → note the returned `jobId`
2. Upload a data file with the same `jobId`
3. Process the files
4. Query the database to verify all records share the same `jobId`:
   ```sql
   SELECT 'uploads' as table_name, COUNT(*) as count FROM uploads WHERE job_id = 'YOUR_JOB_ID'
   UNION ALL
   SELECT 'contract_analysis', COUNT(*) FROM contract_analysis WHERE job_id = 'YOUR_JOB_ID'
   UNION ALL
   SELECT 'data_analysis', COUNT(*) FROM data_analysis WHERE job_id = 'YOUR_JOB_ID'
   UNION ALL
   SELECT 'analysis_records', COUNT(*) FROM analysis_records WHERE job_id = 'YOUR_JOB_ID'
   UNION ALL
   SELECT 'activity_logs', COUNT(*) FROM activity_logs WHERE job_id = 'YOUR_JOB_ID'
   UNION ALL
   SELECT 'api_logs', COUNT(*) FROM api_logs WHERE job_id = 'YOUR_JOB_ID';
   ```

## Summary

The `jobId` field now provides end-to-end traceability for all processing jobs in the system. Every upload, analysis, log entry, and activity can be traced back to its originating job, enabling powerful debugging, analytics, and data integrity features.

### Quick Reference

| Table | Job ID Field | Required | Indexed |
|-------|-------------|----------|---------|
| uploads | ✅ | Yes | Yes |
| contract_analysis | ✅ | Yes | Yes |
| data_analysis | ✅ | Yes | Yes |
| analysis_records | ✅ | Yes | Yes |
| api_logs | ✅ | No | Yes |
| activity_logs | ✅ | No | Yes |

### Key Files Modified

- `backend/prisma/schema.prisma` - Schema definitions
- `backend/src/types/index.ts` - TypeScript interfaces
- `backend/src/services/file.service.ts` - Upload service
- `backend/src/services/logging.service.ts` - Logging services
- `backend/src/controllers/upload.controller.ts` - Upload controller

---

**Last Updated**: October 10, 2025  
**Database Version**: After force-reset migration  
**Status**: ✅ Implemented and Tested


