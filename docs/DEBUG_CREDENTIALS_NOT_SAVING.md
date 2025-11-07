# DEBUG: Credentials Not Being Saved

## 🐛 **Problem**

Users get the error:
```
{error: 'Anypoint credentials are required', needsCredentials: true}
```

Even after entering credentials and checking "Save credentials for future use", the credentials are not being stored and the user has to enter them again.

---

## 🔍 **Investigation Steps**

I've added comprehensive logging to help diagnose the issue. Follow these steps:

### **Step 1: Deploy the Latest Code**

```bash
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp
git pull origin feature/actions
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

Deploy to your environment (Heroku, Docker, etc.)

---

### **Step 2: Check Browser Console Logs**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Review & Approve" button
4. Look for these log messages:

**Expected Logs:**
```
[IDPResponse] Requesting review for: {
  executionId: "job_xxx",
  jobId: "job_xxx",
  idpExecutionId: 123,              ← Should be a number
  idpExecutionIdFromContract: 123,  ← Should match
  idpExecutionIdFromState: 123      ← Should match
}
```

**Problem Indicators:**
```
[IDPResponse] idpExecutionId is null/undefined! {
  contractAnalysisIdpExecutionId: null,  ← Problem!
  urlSearchParams: ""
}
```

**What This Tells Us:**
- If `idpExecutionId` is `null`, the contract analysis doesn't have an `idpExecutionId` set
- This means when the document was processed, it wasn't linked to an IDP execution
- Without `idpExecutionId`, the backend can't find where to save credentials

---

### **Step 3: Check Backend Logs**

Look for these log messages in your backend logs:

**On Heroku:**
```bash
heroku logs --tail --app your-app-name | grep -i "requestReview"
```

**Expected Logs:**
```
[requestReview] Request body: {
  executionId: 'job_xxx',
  jobId: 'job_xxx',
  idpExecutionId: 123,      ← Should be a number
  hasUsername: true,        ← Should be true when entering credentials
  hasPassword: true,        ← Should be true when entering credentials
  saveCredentials: true     ← Should be true if checkbox checked
}

[requestReview] IDP Execution lookup: {
  idpExecutionId: 123,
  found: true,                ← Should be true
  hasStoredUsername: false,   ← Initially false, then true after saving
  hasStoredPassword: false    ← Initially false, then true after saving
}

[requestReview] Credentials check: {
  hasProvidedUsername: true,
  hasProvidedPassword: true,
  hasStoredUsername: false,
  hasStoredPassword: false
}

[requestReview] Final credentials: {
  hasUsername: true,
  hasPassword: true
}
```

**Problem Indicators:**

**Issue 1: idpExecutionId is null**
```
[requestReview] Missing required fields: {
  hasExecutionId: true,
  hasJobId: true,
  hasIdpExecutionId: false  ← Problem! Should be true
}
```

**Issue 2: IDP Execution not found**
```
[requestReview] IDP execution not found for ID: 123
```

**Issue 3: No credentials provided or stored**
```
[requestReview] Final credentials: {
  hasUsername: false,  ← Problem!
  hasPassword: false   ← Problem!
}
```

---

### **Step 4: Check Database**

Run the SQL query I created:

```bash
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp
psql -U postgres -d contract_analysis -f check-idp-execution.sql
```

Or manually:

```sql
SELECT 
  ca.id,
  ca.job_id,
  ca.execution_id,
  ca.idp_execution_id,            -- Should NOT be null
  ca.document_name,
  ca.status,
  ca.created_at,
  ie.id as idp_exec_exists,       -- Should match idp_execution_id
  ie.anypoint_username IS NOT NULL as has_username,  -- Should be true after saving
  ie.anypoint_password IS NOT NULL as has_password   -- Should be true after saving
FROM contract_analysis ca
LEFT JOIN idp_execution ie ON ca.idp_execution_id = ie.id
ORDER BY ca.created_at DESC
LIMIT 10;
```

**What to Look For:**

1. **idp_execution_id is NULL**
   - ❌ Problem: Document wasn't processed with IDP execution config
   - ✅ Solution: Re-process document with proper IDP execution selection

2. **idp_exec_exists is NULL**
   - ❌ Problem: IDP execution record was deleted or never created
   - ✅ Solution: Check IDP execution setup in System Environment page

3. **has_username and has_password are both false**
   - ❌ Problem: Credentials never saved or were cleared
   - ✅ Solution: Check if API call succeeds before saving credentials

4. **has_username and has_password are both true**
   - ✅ Good: Credentials ARE saved!
   - ❌ But still getting error: Check decryption or credential retrieval logic

---

## 🎯 **Root Cause Scenarios**

### **Scenario 1: idpExecutionId is NULL in contract_analysis**

**Cause:** Document was processed without selecting an IDP execution config.

**Solution:**
1. Go to System Environment page
2. Check if IDP Execution configs exist
3. When processing new documents, make sure to select an IDP execution from the dropdown
4. The `idpExecutionId` should be passed when calling `/analysis/process`

**Code to Check:**
- `frontend/src/pages/AnalysisSetup.tsx` - Should pass `idpExecutionId` to API
- `backend/src/services/document.service.ts` - Should save `idpExecutionId` to `contract_analysis`

---

### **Scenario 2: IDP Execution Record Doesn't Exist**

**Cause:** The `idp_execution` record was deleted or the ID is wrong.

**Solution:**
1. Check System Environment page for IDP Execution configs
2. Verify the ID in the database matches what's being sent
3. Re-create IDP execution if needed

**SQL to Create IDP Execution:**
```sql
INSERT INTO idp_execution (
  name,
  protocol,
  host,
  base_path,
  org_id,
  action_id,
  action_version,
  auth_client_id,
  auth_client_secret,
  created_at
) VALUES (
  'Dev IDP',
  'https',
  'idp-rt.us-east-1.anypoint.mulesoft.com',
  '/api/v1/organizations/',
  'your-org-id',
  'your-action-id',
  '1.0.0',
  'encrypted-client-id',
  'encrypted-client-secret',
  NOW()
);
```

---

### **Scenario 3: Credentials Saved But Can't Be Retrieved**

**Cause:** Encryption/decryption issue or database read problem.

**Solution:**
1. Check backend logs for decryption errors
2. Verify `ENCRYPTION_KEY` environment variable is set correctly
3. Check if credentials were encrypted with a different key

**Test Encryption:**
```typescript
// In backend console or test
const encryption = require('./utils/encryption');
const encrypted = encryption.encrypt('test-password');
const decrypted = encryption.decrypt(encrypted);
console.log('Decrypted matches:', decrypted === 'test-password');
```

---

### **Scenario 4: API Call Fails Before Saving Credentials**

**Cause:** Credentials are only saved AFTER successful API call. If API fails, credentials aren't saved.

**Solution:**
1. Check if MuleSoft API call succeeds
2. Look for errors between "Calling MuleSoft /process/review" and credential save
3. Fix API call issue first, then credentials will save

**Logs to Check:**
```
[info]: Calling MuleSoft /process/review
... (should see success, not error)
... credentials get saved here (line 176-184)
```

---

## 🔧 **Quick Fixes**

### **Fix 1: Manually Set idpExecutionId**

If you have documents without `idpExecutionId`, update them:

```sql
-- Find the IDP execution ID you want to use
SELECT id, name FROM idp_execution;

-- Update contract analyses to use that IDP execution
UPDATE contract_analysis
SET idp_execution_id = 1  -- Use the correct ID
WHERE idp_execution_id IS NULL;
```

---

### **Fix 2: Manually Add Credentials to IDP Execution**

If you want to save credentials directly in the database:

```typescript
// Backend console or script
const encryption = require('./utils/encryption');
const prisma = require('./config/database').default;

async function saveCredentials() {
  await prisma.idpExecution.update({
    where: { id: 1 },  // Your IDP execution ID
    data: {
      anypointUsername: encryption.encrypt('your-username'),
      anypointPassword: encryption.encrypt('your-password'),
    },
  });
  console.log('Credentials saved!');
}

saveCredentials();
```

---

### **Fix 3: Pass idpExecutionId from Frontend**

Make sure the frontend is passing `idpExecutionId` when processing documents:

**File:** `frontend/src/pages/AnalysisSetup.tsx`

```typescript
const response = await api.post('/analysis/process', {
  contractUploadId: contractId,
  dataUploadId: dataId,
  idpExecutionId: selectedIdpExecutionId,  // Make sure this is set!
  prompt: selectedPrompt,
  variables: variables,
});
```

---

## 📊 **Expected Flow**

Here's how it SHOULD work:

### **First Time (No Saved Credentials):**

1. User clicks "Review & Approve"
2. Frontend sends: `{executionId, jobId, idpExecutionId}` (no credentials)
3. Backend checks IDP execution for saved credentials (finds none)
4. Backend returns: `{needsCredentials: true}`
5. Frontend shows credentials dialog
6. User enters credentials and checks "Save credentials"
7. Frontend sends: `{executionId, jobId, idpExecutionId, username, password, saveCredentials: true}`
8. Backend makes MuleSoft API call
9. **API succeeds** ✅
10. Backend saves encrypted credentials to `idp_execution` table
11. User is taken to review page

### **Second Time (Credentials Saved):**

1. User clicks "Review & Approve"
2. Frontend sends: `{executionId, jobId, idpExecutionId}` (no credentials)
3. Backend checks IDP execution for saved credentials (finds them!)
4. Backend decrypts credentials
5. Backend makes MuleSoft API call with decrypted credentials
6. **API succeeds** ✅
7. User is taken directly to review page (no dialog!)

---

## ✅ **Checklist**

After deploying the debug version, verify:

- [ ] Browser console shows `idpExecutionId` is a number (not null)
- [ ] Backend logs show IDP execution found
- [ ] Backend logs show credentials provided (first time) or retrieved (second time)
- [ ] Database shows `idp_execution_id` is set in `contract_analysis`
- [ ] Database shows `idp_execution` record exists
- [ ] Database shows `anypoint_username` and `anypoint_password` are not null (after first save)
- [ ] MuleSoft API call succeeds
- [ ] Credentials are saved after successful API call
- [ ] Second attempt uses saved credentials (no dialog shown)

---

## 📞 **Report Back**

After checking the logs and database, please share:

1. **Browser console logs** (screenshot or copy/paste)
2. **Backend logs** for `/idp-status/review` calls
3. **SQL query results** from `check-idp-execution.sql`
4. **Which scenario** matches your situation (1, 2, 3, or 4)

This will help me provide the exact fix for your specific issue!

---

**Status:** 🔍 **INVESTIGATING** (Commit: `f9c0533`)  
**Date:** November 6, 2025  
**Branch:** `feature/actions`

---

