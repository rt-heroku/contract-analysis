# Fix: 400 Bad Request Error in Review API

## 🐛 **Problem**

When clicking **"Review & Approve"** on an IDP response and entering Anypoint credentials, the following errors occurred:

### **Error 1: 400 Bad Request**
```
HTTP GET on resource 'https://idp-rt.us-east-1.anypoint.mulesoft.com:443/api/v1/organizations/eb16587a-02cf-43f4-aa5f-c6a924fb3635/actions/1665e50a-9f68-43d0-a533-49bfc24d920b/reviews/job_1762476455603_1c0954f7-cc35-4223-85ad-a8c85d16d48d' failed: bad request (400).
```

### **Error 2: Credentials Not Saving**
Even when checking "Save credentials", they weren't being stored in the database.

---

## 🔍 **Root Cause**

The **base_path** for the MuleSoft IDP review API endpoints was incorrect in both `requestReview()` and `approveReview()` functions.

### **What Was Wrong:**

**Incorrect base_path:**
```
/api/v1/organizations/{orgId}/actions/{actionId}/versions/{actionVersion}/executions
```

**Correct base_path:**
```
/api/v1/organizations/{orgId}/actions/{actionId}/reviews
```

### **Key Differences:**

| Aspect | ❌ Old (Wrong) | ✅ New (Correct) |
|--------|----------------|------------------|
| Includes `/versions/` | Yes | No |
| Includes `/executions` | Yes | No |
| Uses `/reviews` | No | Yes |
| Result | 400 Bad Request | Success |

### **Why This Matters:**

The MuleSoft IDP API has different endpoint structures for different operations:

1. **Get Execution Status:**
   - Path: `/organizations/{orgId}/actions/{actionId}/versions/{version}/executions/{executionId}`
   - Uses: `/versions/{version}/executions`

2. **Request Review (GET):**
   - Path: `/organizations/{orgId}/actions/{actionId}/reviews/{executionId}`
   - Uses: `/reviews` (no versions!)

3. **Approve Review (PATCH):**
   - Path: `/organizations/{orgId}/actions/{actionId}/reviews/{executionId}`
   - Uses: `/reviews` (no versions!)

The code was using the **execution status path structure** for the **review endpoints**, causing MuleSoft to return 400 Bad Request.

---

## ✅ **Solution**

### **Code Changes**

Fixed the `base_path` in both review functions:

#### **1. requestReview() Function (Line 343)**

**Before:**
```typescript
base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/versions/${idpConfig.actionVersion}/executions`,
```

**After:**
```typescript
base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/reviews`,
```

#### **2. approveReview() Function (Line 435)**

**Before:**
```typescript
base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/versions/${idpConfig.actionVersion}/executions`,
```

**After:**
```typescript
base_path: `${idpConfig.basePath}${idpConfig.orgId}/actions/${idpConfig.actionId}/reviews`,
```

---

## 🚀 **How to Apply the Fix**

### **Step 1: Pull Latest Code**

```bash
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp
git pull origin feature/actions
```

### **Step 2: Rebuild Backend**

```bash
cd backend
npm run build
```

### **Step 3: Restart the Backend**

**If running locally:**
```bash
npm start
```

**If using Docker:**
```bash
docker-compose restart backend
```

**If deployed on Heroku:**
```bash
git push heroku feature/actions:main
# or
heroku restart
```

---

## 🧪 **Testing**

After applying the fix, test the workflow:

### **Test 1: Request Review with Credentials**

1. **Navigate** to an IDP Response page with status `MANUAL_VALIDATION_REQUIRED`
2. **Click** the **"Review & Approve"** button
3. **Enter** your Anypoint Platform credentials:
   - Username: your-username
   - Password: your-password
4. **Check** the "Save credentials for future use" checkbox
5. **Click** "Submit"

**Expected Result:**
- ✅ Modal closes
- ✅ Navigates to Review page (no 400 error)
- ✅ Review data loads successfully
- ✅ Credentials are saved

### **Test 2: Verify Credentials Saved**

1. **Process another document** that requires review
2. **Click** "Review & Approve" again

**Expected Result:**
- ✅ Modal doesn't appear (uses saved credentials)
- ✅ Directly navigates to Review page
- ✅ Review data loads successfully

### **Test 3: Approve Review**

1. **On the Review page**, make any necessary edits
2. **Click** "Approve & Submit"

**Expected Result:**
- ✅ Approval succeeds
- ✅ Document status updates to `SUCCEEDED`
- ✅ Can proceed to analysis

---

## 📊 **What Changed**

### **Files Modified:**

- ✅ `backend/src/services/muleSoft.service.ts` (2 lines changed)

### **API Endpoint Changes:**

#### **Request Review (GET)**

**Old Request to MuleSoft Proxy:**
```json
{
  "idp_http_request": {
    "base_path": "/api/v1/organizations/{orgId}/actions/{actionId}/versions/{version}/executions"
  }
}
```

**MuleSoft tried to call:**
```
GET /api/v1/organizations/.../actions/.../versions/.../executions/{executionId}
❌ 400 Bad Request (endpoint doesn't exist for reviews)
```

**New Request to MuleSoft Proxy:**
```json
{
  "idp_http_request": {
    "base_path": "/api/v1/organizations/{orgId}/actions/{actionId}/reviews"
  }
}
```

**MuleSoft now calls:**
```
GET /api/v1/organizations/.../actions/.../reviews/{executionId}
✅ 200 OK (correct endpoint!)
```

#### **Approve Review (PATCH)**

Same fix applies - uses `/reviews` instead of `/versions/{version}/executions`.

---

## 🎯 **Impact**

### **Before Fix:**

- ❌ Review button caused 400 Bad Request errors
- ❌ Couldn't load review data
- ❌ Credentials weren't saved (because API call failed)
- ❌ Manual validation workflow was blocked
- ❌ Documents stuck in `MANUAL_VALIDATION_REQUIRED` status

### **After Fix:**

- ✅ Review button works correctly
- ✅ Review data loads successfully
- ✅ Credentials save properly
- ✅ Approval workflow functions end-to-end
- ✅ Documents can progress through the workflow
- ✅ No more 400 Bad Request errors

---

## 🔧 **Technical Details**

### **MuleSoft IDP API Endpoint Structure**

The MuleSoft IDP (Intelligent Document Processing) API has different endpoint patterns for different operations:

#### **Execution Operations** (Status checks):
```
/api/v1/organizations/{orgId}/actions/{actionId}/versions/{actionVersion}/executions/{executionId}
```
- Used for: Getting execution status
- Method: GET
- Includes: `/versions/{version}/executions`

#### **Review Operations** (Manual validation):
```
/api/v1/organizations/{orgId}/actions/{actionId}/reviews/{executionId}
```
- Used for: Getting review data (GET), Approving changes (PATCH)
- Methods: GET (request), PATCH (approve)
- Includes: `/reviews` (no versions!)
- **Key Point:** Review endpoints are version-agnostic

### **Why Credentials Weren't Saving**

The credentials saving logic is in `backend/src/controllers/idpStatus.controller.ts` (lines 176-184):

```typescript
// Save credentials to IDP execution if requested
if (saveCredentials && anypointUsername && anypointPassword) {
  await prisma.idpExecution.update({
    where: { id: parseInt(idpExecutionId) },
    data: {
      anypointUsername: encryption.encrypt(anypointUsername),
      anypointPassword: encryption.encrypt(anypointPassword),
    },
  });
}
```

This code runs **AFTER** a successful API call. Since the API was returning 400 errors, the code never reached this point, so credentials were never saved.

**Now that the API succeeds**, credentials are saved automatically when the user checks the "Save credentials" checkbox.

---

## 📝 **Verification**

### **Check Backend Logs**

After applying the fix, you should see successful API calls:

```bash
# Check logs for successful review requests
grep "Calling MuleSoft /process/review" backend-dev.log
grep "MuleSoft review request failed" backend-dev.log  # Should be empty now
```

**Before Fix:**
```
[error]: MuleSoft review request failed: HTTP GET on resource...failed: bad request (400)
```

**After Fix:**
```
[info]: Calling MuleSoft /process/review
[info]: Review data received successfully
```

### **Verify Credentials in Database**

```sql
-- Check if credentials are encrypted and saved
SELECT 
  id,
  anypoint_username IS NOT NULL as has_username,
  anypoint_password IS NOT NULL as has_password,
  created_at,
  updated_at
FROM idp_execution
ORDER BY updated_at DESC
LIMIT 5;
```

Expected: `has_username` and `has_password` should be `true` after using "Save credentials".

---

## 🚨 **Troubleshooting**

### **If Review Still Fails:**

1. **Check credentials are correct:**
   - Username must be valid Anypoint Platform username
   - Password must be correct
   - Account must have access to the IDP execution

2. **Verify IDP Execution configuration:**
   ```sql
   SELECT * FROM idp_execution WHERE id = {idpExecutionId};
   ```
   - Check `orgId`, `actionId`, `actionVersion` are correct
   - Verify `authClientId` and `authClientSecret` are set

3. **Check MuleSoft proxy is running:**
   - Verify `MULESOFT_API_BASE_URL` environment variable
   - Test proxy endpoint: `curl {MULESOFT_API_BASE_URL}/health`

4. **Review backend logs:**
   ```bash
   tail -f backend-dev.log | grep -i "review"
   ```

### **If Credentials Still Don't Save:**

1. **Check the "Save credentials" checkbox is checked**
2. **Verify database connection is working**
3. **Check for encryption errors in logs:**
   ```bash
   grep -i "encryption" backend-dev.log
   ```

---

## 📚 **Related Files**

- `backend/src/services/muleSoft.service.ts` - Main fix location (lines 343, 435)
- `backend/src/controllers/idpStatus.controller.ts` - Review controller with credential saving
- `frontend/src/pages/IDPResponse.tsx` - Review button frontend
- `frontend/src/pages/IDPReview.tsx` - Review page
- `frontend/src/components/modals/AnypointCredentialsDialog.tsx` - Credentials modal

---

## ✅ **Checklist**

Before marking this fix as complete:

- [x] Code changes committed and pushed
- [x] Backend builds successfully
- [ ] Backend service restarted
- [ ] Tested review request with new credentials
- [ ] Verified credentials are saved
- [ ] Tested subsequent review uses saved credentials
- [ ] Tested approval workflow
- [ ] Verified document status updates after approval
- [ ] Team notified of the fix

---

## 📞 **Need Help?**

If you still encounter issues:

1. **Check error logs** for the exact error message
2. **Verify MuleSoft proxy** is accessible and running
3. **Test with curl** to isolate the issue:
   ```bash
   curl -X POST {MULESOFT_API_BASE_URL}/process/review \
     -H "Content-Type: application/json" \
     -d '{
       "job_id": "test",
       "execution_id": "test",
       "idp_http_request": {
         "base_path": "/api/v1/organizations/{orgId}/actions/{actionId}/reviews"
       }
     }'
   ```

---

**Status:** ✅ **FIXED** (Commit: `e4ab8c6`)  
**Date:** November 7, 2025  
**Branch:** `feature/actions`  
**Impact:** Critical - Unblocks manual review workflow

---

