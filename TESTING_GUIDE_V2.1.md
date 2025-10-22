# Testing Guide - Manual Validation Feature v2.1

## 🚀 Quick Start

### Starting the Application
```bash
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp
npm run dev
```

This will start:
- **Backend**: http://localhost:5001
- **Frontend**: http://localhost:3000

---

## 📝 Testing Checklist

### 1. **Setup - IDP Execution Configuration** ✅

**Navigate to**: IDP Executions page (menu)

**Actions**:
1. Click "Create New IDP Execution"
2. Fill in required fields:
   - Name: `Test IDP - Manual Validation`
   - Full URL: `https://idp-rt.us-east-1.anypoint.mulesoft.com/api/v1/organizations/{org}/actions/{actionId}/versions/{version}/executions`
   - Client ID & Secret (required)
   - **NEW**: Anypoint Username & Password (optional)
3. Save

**Expected Result**:
- New IDP execution created
- If Anypoint credentials entered, they are encrypted and stored
- Legend shows: "Credentials are encrypted, but if you don't want to save them..."

---

### 2. **Document Processing** ✅

**Navigate to**: Processing page

**Actions**:
1. Select the IDP execution you just created
2. Upload a PDF or image file (PDF, PNG, JPG, TIFF)
3. Click "Process Document"

**Expected Result**:
- File uploads successfully
- MuleSoft `/process/document` is called
- Redirects to IDPResponse page
- Shows "Waiting for MuleSoft IDP to process..."

---

### 3. **IDPResponse Page - Normal Flow** ✅

**Scenario**: Document processes successfully

**Expected Display**:
- MuleSoft logo and title
- Document Information card (Name, ID, Status)
- Document extraction data (contract/PO/invoice specific renderer)
- **"Continue to Analysis" button is ENABLED** (status = SUCCEEDED)
- "Back to Processing" button

**Actions**:
1. Click "Continue to Analysis"

**Expected Result**:
- Navigates to analysis setup page

---

### 4. **IDPResponse Page - Manual Validation Required** ⚠️ **NEW**

**Scenario**: MuleSoft returns `status: "MANUAL_VALIDATION_REQUIRED"`

**Expected Display**:
- **Amber banner** appears with:
  - Title: "Manual Validation Required"
  - Message: "This document requires manual review..."
  - **Refresh button** (circular arrow icon)
  - **"Review & Approve" button** (amber color)
- **"Continue to Analysis" button is DISABLED**
- Helper text: "Manual validation must be completed..."

**Test Actions**:

#### 4a. **Refresh Status** ✅
1. Click the **refresh button** (circular arrow)

**Expected**:
- Button shows spinning animation
- Calls `/api/idp-status/status`
- Updates status if changed
- If still `MANUAL_VALIDATION_REQUIRED`, banner remains
- If changed to `SUCCEEDED`, banner disappears and "Continue" enables

---

#### 4b. **Review & Approve - With Stored Credentials** ✅
**Scenario**: Anypoint credentials were saved in IDP execution

**Actions**:
1. Click **"Review & Approve"** button

**Expected**:
- Calls `/api/idp-status/review`
- Uses stored credentials automatically
- Redirects to `/idp-review/:id` page

---

#### 4c. **Review & Approve - Without Stored Credentials** ⚠️ **NEW**
**Scenario**: No Anypoint credentials saved

**Actions**:
1. Click **"Review & Approve"** button

**Expected**:
- **Credentials Dialog appears**
- Dialog contains:
  - Title: "Anypoint Credentials Required"
  - Username input
  - Password input (masked)
  - **"Save credentials" checkbox**
  - **Warning message** (amber box):
    > ⚠️ Warning: Credentials will be encrypted and stored...
  - Cancel & Submit buttons

**Actions**:
2. Enter username: `your-anypoint-username`
3. Enter password: `your-anypoint-password`
4. Check "Save credentials" (optional)
5. Click "Submit"

**Expected**:
- Dialog closes
- Calls `/api/idp-status/review` with credentials
- If "Save credentials" checked:
  - Credentials are encrypted and saved to `idp_executions` table
- Redirects to `/idp-review/:id` page

---

### 5. **IDP Review Page** ⚠️ **NEW**

**URL**: `/idp-review/:analysisRecordId?executionId=...&jobId=...&idpExecutionId=...`

**Expected Layout**:
- **Split View**:
  - **Left Panel (40%)**: PDF/Image viewer showing original document
  - **Right Panel (60%)**: Scrollable list of editable fields

**Right Panel Contents**:
For each field:
- Field name (label)
- **Confidence Score Badge**:
  - 🟢 Green (80%+)
  - 🟡 Yellow (60-79%)
  - 🔴 Red (<60%)
- Page number badge
- **Text area** with current value (editable)

**Bottom Actions**:
- **"Approve Changes" button**:
  - Initially DISABLED
  - ENABLED when any field is modified

**Test Actions**:

#### 5a. **Review Fields** ✅
1. Scroll through all fields
2. Check confidence scores are color-coded
3. Check page numbers display correctly

**Expected**:
- All fields from `/process/review` displayed
- Confidence scores accurate
- Text areas contain extracted values

---

#### 5b. **Modify Fields** ✅
1. Click into a text area
2. Modify the text (e.g., fix a typo, correct extraction)
3. Check "Approve Changes" button

**Expected**:
- Text area updates as you type
- **"Approve Changes" button becomes ENABLED**
- Changes are tracked

---

#### 5c. **Approve Changes** ✅
1. After modifying one or more fields
2. Click **"Approve Changes"** button

**Expected**:
- Button shows loading state: "Submitting..."
- Calls `/api/idp-status/approve` with body:
  ```json
  {
    "executionId": "...",
    "jobId": "...",
    "idpExecutionId": 123,
    "approvedData": {
      "results": [
        { "id": "...", "name": "...", "result": "modified value", ... }
      ]
    }
  }
  ```
- Success alert shows
- Database `contract_analysis` updated:
  - `status` → "SUCCEEDED"
  - `mulesoftResponse` → approved data
- **Redirects back to** `/idp-response/:id?approved=true`

---

### 6. **Post-Approval Flow** ✅

**Navigate to**: IDPResponse page (after approval redirect)

**Expected**:
- Query param: `?approved=true`
- Automatically calls `/process/status` to refresh
- **Status updated to "SUCCEEDED"**
- Amber banner disappears
- **"Continue to Analysis" button is now ENABLED**
- Can proceed with analysis

**Actions**:
1. Click "Continue to Analysis"

**Expected**:
- Proceeds to analysis setup normally

---

## 🔒 Security Testing

### 7. **Credential Encryption** ✅

**Database Check**:
```sql
SELECT 
  id, 
  name, 
  anypoint_username, 
  anypoint_password 
FROM idp_executions 
WHERE anypoint_username IS NOT NULL;
```

**Expected**:
- `anypoint_username` and `anypoint_password` are **encrypted strings**
- NOT plain text
- Format: `algorithm:iv:encrypted_data` (base64)

**Decryption Test** (via backend service):
- Service successfully decrypts and uses credentials
- MuleSoft API calls succeed with decrypted credentials

---

## 📊 Activity Logging

### 8. **Verify Logging** ✅

**Check Activity Logs**:
```sql
SELECT * FROM activity_logs 
WHERE action_type LIKE 'processing.%' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected Log Entries**:
1. "Checked IDP status for execution {id}: {status}"
2. "Requested manual review for execution {id}"
3. "Approved manual review for execution {id}"

All with correct:
- `user_id`
- `job_id`
- `action_type`
- `action_description`
- `ip_address`
- `user_agent`
- `created_at`

---

## 🐛 Error Scenarios

### 9. **Network Errors** ⚠️

**Test Case**: MuleSoft service is down

**Actions**:
1. Stop MuleSoft service (or use invalid URL)
2. Try to process document
3. Try to refresh status
4. Try to review

**Expected**:
- Graceful error messages in UI
- No crashes or blank screens
- Errors logged to `api_logs`
- User can retry or go back

---

### 10. **Invalid Credentials** ⚠️

**Test Case**: Wrong Anypoint credentials

**Actions**:
1. Enter incorrect username/password in credentials dialog
2. Submit

**Expected**:
- API returns error from MuleSoft
- Error alert displays: "Failed to request review with credentials"
- User can try again with correct credentials
- No credentials saved if wrong

---

### 11. **Missing Execution ID** ⚠️

**Test Case**: `executionId` not extracted from MuleSoft response

**Actions**:
1. Process document with IDP that doesn't return execution_id
2. Try to refresh status or review

**Expected**:
- Graceful handling
- Error message: "Execution ID not available"
- Can still view document extraction
- Manual validation features disabled

---

## 🎨 UI/UX Testing

### 12. **Visual Checks** ✅

**IDPResponse Page**:
- [ ] Amber banner is visually distinct
- [ ] Refresh button has hover effect
- [ ] Spinning animation smooth
- [ ] Buttons correctly enabled/disabled
- [ ] Helper text is readable

**Credentials Dialog**:
- [ ] Modal centers on screen
- [ ] Input fields have proper focus states
- [ ] Warning message is visible (amber background)
- [ ] Checkbox is clickable and shows state
- [ ] Form validation works

**IDP Review Page**:
- [ ] Split view is responsive
- [ ] PDF viewer loads correctly
- [ ] Text areas are editable and styled
- [ ] Confidence badges are color-coded correctly
- [ ] Scrolling works independently
- [ ] "Approve" button state changes

---

## 📱 Responsive Testing

### 13. **Mobile/Tablet Views** ✅

**Test on different screen sizes**:
- Desktop (1920x1080)
- Laptop (1440x900)
- Tablet (768x1024)
- Mobile (375x667)

**Expected**:
- IDPResponse banner stacks properly
- Credentials dialog is modal and centered
- IDP Review page switches to single column on mobile
- All buttons are tappable (min 44x44px)

---

## 🧪 Database State Testing

### 14. **Contract Analysis Updates** ✅

**Before Approval**:
```sql
SELECT status, execution_id, mulesoft_response 
FROM contract_analysis 
WHERE job_id = 'test_job_id';
```
- `status`: "MANUAL_VALIDATION_REQUIRED"
- `execution_id`: `"exec_12345"`
- `mulesoft_response`: Original IDP response

**After Approval**:
- `status`: "SUCCEEDED"
- `mulesoft_response`: **Updated with approved data**

---

## 🚦 Happy Path Summary

**Complete Flow (5-10 minutes)**:
1. ✅ Create IDP execution with Anypoint credentials
2. ✅ Upload & process document
3. ✅ See "Manual Validation Required" banner
4. ✅ Click "Review & Approve"
5. ✅ Credentials dialog appears (or skips if stored)
6. ✅ View fields in split-view page
7. ✅ Modify some field values
8. ✅ Click "Approve Changes"
9. ✅ Redirect back to IDPResponse
10. ✅ Status refreshed to "SUCCEEDED"
11. ✅ "Continue to Analysis" enabled
12. ✅ Proceed with normal analysis flow

---

## 📝 Test Report Template

```
## Test Session: [Date/Time]
Tester: [Name]
Environment: [Local/Staging/Production]

### Tests Executed:
- [ ] IDP Execution Setup
- [ ] Document Processing
- [ ] Manual Validation Banner
- [ ] Status Refresh
- [ ] Credentials Dialog
- [ ] Review Page
- [ ] Approval Flow
- [ ] Post-Approval
- [ ] Security (Encryption)
- [ ] Activity Logging
- [ ] Error Handling

### Issues Found:
1. [Description]
   - Steps to reproduce:
   - Expected:
   - Actual:
   - Screenshot:

### Notes:
[Any additional observations]

### Conclusion:
✅ All tests passed
⚠️ Minor issues found
❌ Critical issues found
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Continue to Analysis" stays disabled
- **Check**: Document `status` in database
- **Fix**: Run status check or re-approve

**Issue**: Credentials dialog doesn't appear
- **Check**: Browser console for errors
- **Fix**: Check `/api/idp-status/review` endpoint

**Issue**: PDF doesn't load in review page
- **Check**: Network tab for file request
- **Fix**: Verify file upload and storage

**Issue**: Approved data not saving
- **Check**: Backend logs for errors
- **Fix**: Verify MuleSoft `/process/approve` response

---

## 📞 Support

**Questions or Issues**:
- Rodrigo Torres: rodrigo.torres@salesforce.com
- Documentation: `/FEATURE_V2.1_MANUAL_VALIDATION.md`
- Logs: Check `activity_logs` and `api_logs` tables

---

**Last Updated**: October 22, 2025
**Feature Version**: v2.1
**Status**: Ready for Testing 🚀

