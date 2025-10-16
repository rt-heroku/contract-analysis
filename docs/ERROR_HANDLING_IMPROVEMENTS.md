# Error Handling Improvements for MuleSoft Service Failures

## Overview
Enhanced error handling to properly detect, report, and display when MuleSoft service is unavailable or fails during document processing.

---

## Changes Made

### 1. Database Schema (`backend/prisma/schema.prisma`)

**Added `errorMessage` field to `AnalysisRecord` model:**

```prisma
model AnalysisRecord {
  // ... existing fields
  status              String    @db.VarChar(50)
  errorMessage        String?   @map("error_message") @db.Text  // NEW FIELD
  isDeleted           Boolean   @default(false) @map("is_deleted")
  // ... rest of fields
}
```

**Purpose:** Store detailed error information when processing fails, allowing the frontend to display specific error messages to users.

---

### 2. Backend Error Detection (`backend/src/services/document.service.ts`)

**Added explicit try-catch blocks for each step to ensure failures stop execution:**

```typescript
// Step 1: Process contract document
logger.info(`[Step 1/2] Processing contract document for jobId: ${jobId}`);
let contractResult;
try {
  contractResult = await muleSoftService.processContractDocument(
    jobId,
    userId,
    contractUploadId
  );
  logger.info(`[Step 1/2] Contract processing successful for jobId: ${jobId}`);
} catch (error: any) {
  logger.error(`[Step 1/2] Contract processing FAILED for jobId: ${jobId}. Stopping analysis.`, error.message);
  throw error; // Re-throw to outer catch block - STOPS EXECUTION
}

// Save contract analysis...
// (only runs if Step 1 succeeds)

// Step 2: Analyze data with contract context
logger.info(`[Step 2/2] Running final analysis for jobId: ${jobId}`);
let dataResult;
try {
  dataResult = await muleSoftService.analyzeDataFile(
    jobId,
    userId,
    contractAnalysis.id
  );
  logger.info(`[Step 2/2] Analysis successful for jobId: ${jobId}`);
} catch (error: any) {
  logger.error(`[Step 2/2] Analysis FAILED for jobId: ${jobId}`, error.message);
  throw error; // Re-throw to outer catch block
}
```

**Enhanced error handling in outer `catch` block:**

```typescript
catch (error: any) {
  logger.error('❌ Document processing FAILED - Analysis stopped', error);

  // Determine which step failed and create appropriate error message
  let errorMessage = 'Failed to process documents. Please try again.';
  let errorDetails = error.message || 'Unknown error';
  let errorStep = 'Unknown step';
  
  if (error.message?.includes('MuleSoft API Error')) {
    errorMessage = 'MuleSoft service is currently unavailable. Please check if the service is running and try again.';
    
    // Determine which step failed based on stack trace
    if (error.stack?.includes('processContractDocument')) {
      errorStep = 'Step 1/2 - Contract Document Processing';
    } else if (error.stack?.includes('analyzeDataFile')) {
      errorStep = 'Step 2/2 - Data Analysis';
    }
    
    // Detect specific error types and include step info
    if (error.message.includes('ECONNREFUSED')) {
      errorDetails = `Connection refused - MuleSoft service is not running or not reachable (${errorStep})`;
    } else if (error.message.includes('timeout')) {
      errorDetails = `Request timeout - MuleSoft service took too long to respond (${errorStep})`;
    } else if (error.message.includes('ENOTFOUND')) {
      errorDetails = `DNS error - MuleSoft service hostname could not be resolved (${errorStep})`;
    } else {
      errorDetails = `${error.message} (${errorStep})`;
    }
  }
  
  logger.error(`Error details: ${errorDetails}`);

  // Update analysis record as failed with error details
  await prisma.analysisRecord.update({
    where: { id: analysisRecordId },
    data: {
      status: ANALYSIS_STATUS.FAILED,
      errorMessage: errorDetails,  // Store error details
    },
  });

  // Send error notification
  await notificationService.createNotification({
    userId,
    title: 'Processing Error',
    message: errorMessage,
    type: NOTIFICATION_TYPES.ERROR,
    actionUrl: '/processing',
    relatedRecordType: 'analysis_record',
    relatedRecordId: analysisRecordId,
  });
}
```

**Error Types Detected:**
- `ECONNREFUSED` - Service not running or unreachable
- `timeout` - Service took too long to respond (exceeds configured timeout)
- `ENOTFOUND` - DNS resolution failed (hostname not found)

**Key Features:**
- ✅ **Step 1 failure stops Step 2** - If `/process/document` fails, `/analyze` never runs
- ✅ **Clear step markers** - Logs show `[Step 1/2]` and `[Step 2/2]`
- ✅ **Step identification** - Error messages include which step failed
- ✅ **Immediate failure** - No wasted API calls after a step fails

---

### 3. MuleSoft Service Error Logging (`backend/src/services/muleSoft.service.ts`)

**Fixed error logging to show proper error codes:**

```typescript
catch (err: any) {
  const duration = Date.now() - startTime;

  // Log the actual error properly
  const errorMessage = err.message || 'Unknown error';
  const errorCode = err.code || 'NO_CODE';
  logger.error(`MuleSoft API request failed: ${errorMessage} (Code: ${errorCode})`);
  
  // ... log to database ...
  
  throw new Error(`MuleSoft API Error: ${err.message}`);
}
```

**Improvement:** Now logs show `ECONNREFUSED`, `ETIMEDOUT`, etc. instead of garbled error objects.

---

### 4. Frontend Error Display (`frontend/src/pages/AnalysisDetails.tsx`)

**Added failed state UI before the loading state check:**

```typescript
// Show failed state
if (analysisStatus === 'failed') {
  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="text-xl font-semibold text-red-600">Processing Failed</h3>
            <p className="text-sm text-gray-600 mt-1">
              The document processing could not be completed.
            </p>
          </div>
        </div>
        
        {analysisData?.errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
            <p className="text-sm text-red-700">{analysisData.errorMessage}</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600">
            <strong>Possible reasons:</strong>
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
            <li>MuleSoft service is not running or not reachable</li>
            <li>Network connectivity issues</li>
            <li>Service timeout (processing took longer than expected)</li>
            <li>Invalid document format or corrupted file</li>
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          <Button 
            onClick={() => navigate('/processing')} 
            className="bg-primary-600 hover:bg-primary-700"
          >
            Try Again
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/history')}
          >
            Back to History
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

**Features:**
- Clear visual indication with red alert icon
- Displays specific error details from backend
- Lists possible reasons for failure
- Provides actionable buttons: "Try Again" and "Back to History"
- Stops polling when status is 'failed'

---

## User Experience Flow

### Before (Old Behavior):
1. ❌ User uploads documents
2. ❌ Processing starts
3. ❌ MuleSoft service is down at Step 1 (`/process/document`)
4. ❌ **BUT Step 2 (`/analyze`) still tried to run!**
5. ❌ Both steps failed with confusing logs
6. ❌ Frontend shows "Waiting for MuleSoft analysis to complete..." **indefinitely**
7. ❌ No error message displayed
8. ❌ User has no idea what went wrong

### After (New Behavior):
1. ✅ User uploads documents
2. ✅ Processing starts
3. ✅ `[Step 1/2]` Tries to call `/process/document`
4. ✅ MuleSoft service is down - Step 1 fails immediately
5. ✅ **Step 2 (`/analyze`) NEVER runs** - execution stopped!
6. ✅ Backend logs: `[Step 1/2] Contract processing FAILED. Stopping analysis.`
7. ✅ Analysis status updated to 'failed' with error details including step info
8. ✅ Frontend polls every 5 seconds
9. ✅ Frontend detects 'failed' status
10. ✅ User sees error screen with:
    - Clear heading: "Processing Failed"
    - Specific error: "Connection refused - MuleSoft service is not running (Step 1/2 - Contract Document Processing)"
    - Possible reasons list
    - "Try Again" button → redirects to /processing
    - "Back to History" button → redirects to /history

---

## Testing Instructions

### Test Case 1: MuleSoft Service Down (localhost)

**Setup:**
```bash
# backend/.env
MULESOFT_API_BASE_URL=http://localhost:8081
```

**Steps:**
1. Ensure MuleSoft is NOT running on localhost:8081
2. Start your webapp: `npm run dev`
3. Login to the application
4. Go to Processing page
5. Upload a PDF contract and Excel/CSV data file
6. Click "Process Documents"

**Expected Result:**
- Processing starts
- Within ~5 seconds, status changes to 'failed'
- Error screen displays:
  - Title: "Processing Failed"
  - Error Details: "Connection refused - MuleSoft service is not running or not reachable"
  - Possible reasons list
  - Action buttons

---

### Test Case 2: MuleSoft Service Timeout

**Setup:**
```bash
# backend/.env
MULESOFT_API_TIMEOUT=5000  # 5 seconds (very short)
```

**Steps:**
1. Configure a very short timeout
2. Restart backend
3. Process documents with a slow MuleSoft response

**Expected Result:**
- Error Details: "Request timeout - MuleSoft service took too long to respond"

---

### Test Case 3: Invalid Hostname

**Setup:**
```bash
# backend/.env
MULESOFT_API_BASE_URL=http://invalid-hostname-that-does-not-exist.com
```

**Expected Result:**
- Error Details: "DNS error - MuleSoft service hostname could not be resolved"

---

## Configuration Files

### Database Schema Applied
The new `error_message` column was added to the `analysis_records` table:

```bash
# Applied via:
cd backend && npm run prisma:push
npx prisma generate
```

### Environment Variables

**Backend `.env` (for testing failure handling):**
```env
MULESOFT_API_BASE_URL=http://localhost:8081
MULESOFT_API_TIMEOUT=180000
```

**Backend `.env` (for production):**
```env
MULESOFT_API_BASE_URL=https://idp-process-contracts-w4i20p.y8riuw.usa-e2.cloudhub.io
MULESOFT_API_TIMEOUT=180000
```

---

## Files Modified

1. `backend/prisma/schema.prisma`
   - Added `errorMessage` field to `AnalysisRecord` model

2. `backend/src/services/document.service.ts`
   - Enhanced error handling in `processDocuments()` method
   - Added specific error type detection
   - Store error details in database

3. `frontend/src/pages/AnalysisDetails.tsx`
   - Added failed state UI rendering
   - Display error details from API
   - Provide user-friendly error messages
   - Add "Try Again" and "Back to History" buttons

---

## Benefits

1. **Better User Experience**
   - Clear error messages instead of infinite loading
   - Users know exactly what went wrong
   - Actionable next steps provided

2. **Easier Debugging**
   - Specific error types captured
   - Error details stored in database
   - Logs show exact failure reason

3. **Demo/Production Ready**
   - Handles service outages gracefully
   - No confusing UI states
   - Professional error presentation

---

## Next Steps

To use the production MuleSoft API (when service is running), update `backend/.env`:

```bash
MULESOFT_API_BASE_URL=https://idp-process-contracts-w4i20p.y8riuw.usa-e2.cloudhub.io
```

Then restart the backend:
```bash
npm run dev
```

---

## Summary

✅ Enhanced error detection in backend  
✅ Store error details in database  
✅ Display user-friendly error messages in frontend  
✅ Stop polling when processing fails  
✅ Provide actionable buttons for users  
✅ Handle various error types (connection refused, timeout, DNS)  
✅ Professional error UI with clear messaging  

The application now gracefully handles MuleSoft service failures and provides users with clear, actionable information instead of leaving them stuck on a loading screen.

