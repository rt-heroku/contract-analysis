# File Type Support Fix - JPG, PNG, TIFF Restored

**Date:** November 17, 2025  
**Issue:** Frontend blocking JPG, PNG, and TIFF file uploads for contracts  
**Status:** ✅ FIXED

## Problem

The document processing system was no longer accepting JPG, PNG, and TIFF files for contract uploads, even though:
- The backend was correctly configured to accept these formats
- This functionality had been working previously
- Users expected to be able to upload image files

## Root Cause

The **backend validation** was correctly configured to accept multiple file formats:
```typescript
// backend/src/utils/helpers.ts
const validTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/tiff',
  'image/tif'
];
```

However, the **frontend validation** was only accepting PDFs:
```typescript
// frontend/src/utils/validation.ts (BEFORE)
if (type === 'contract') {
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Only PDF files are allowed for contracts' };
  }
}
```

## Changes Made

### 1. Frontend Validation (`frontend/src/utils/validation.ts`)
✅ Updated `validateFileType()` to accept all supported image formats:
- `application/pdf`
- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/tiff`
- `image/tif`

### 2. Processing Page Dropzone (`frontend/src/pages/Processing.tsx`)
✅ Updated dropzone configuration to accept multiple file types:
```typescript
const contractDropzone = useDropzone({
  onDrop: onContractDrop,
  accept: { 
    'application/pdf': ['.pdf'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/tiff': ['.tiff', '.tif']
  },
  maxFiles: 1,
  multiple: false,
});
```

### 3. User-Facing Messages
✅ Updated all UI text to reflect supported formats:
- Page title: "Upload your contract document (PDF, PNG, JPG, or TIFF)"
- Card title: "Step 1: Upload Contract Document"
- Drop zone text: "Supports PDF, PNG, JPG, TIFF files up to 10MB"
- Error messages: "Please upload a contract file (PDF, PNG, JPG, or TIFF)"

### 4. Library Filtering (`frontend/src/pages/Processing.tsx`)
✅ Updated document library filtering to include image files:
```typescript
const matchesType = 
  (librarySelectionType === 'contract' && 
   (doc.fileType.includes('pdf') || doc.fileType.includes('image')))
```

### 5. Documents Page (`frontend/src/pages/Documents.tsx`)
✅ Updated file input to accept image formats:
```html
<input
  type="file"
  accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
  onChange={(e) => handleUpload(e, 'contract')}
/>
```
✅ Updated button text from "Upload PDF" to "Upload Contract"

### 6. Documentation
✅ Updated API documentation (`frontend/public/docs/API.md`):
- Changed "PDF file" to "PDF, PNG, JPG, or TIFF file"

✅ Updated process triggers documentation (`docs/PROCESS_TRIGGERS_SYSTEM.md`):
- Changed "Only PDFs" to "Contract files (PDF, PNG, JPG, TIFF)"

## Supported File Types

### Contract Documents ✅
- **PDF** (.pdf) - `application/pdf`
- **PNG** (.png) - `image/png`
- **JPG/JPEG** (.jpg, .jpeg) - `image/jpeg`, `image/jpg`
- **TIFF** (.tiff, .tif) - `image/tiff`, `image/tif`
- **Max Size:** 10MB (8MB for images, 10MB for PDF)

### Data Files ✅
- **Excel** (.xlsx, .xls) - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`
- **CSV** (.csv) - `text/csv`
- **Max Size:** 50MB

## Testing

### ✅ Test Cases to Verify

1. **Upload PNG file in Processing page**
   - Navigate to `/processing`
   - Drag and drop a PNG file
   - Verify it's accepted and uploaded

2. **Upload JPG file in Processing page**
   - Navigate to `/processing`
   - Click to browse and select a JPG file
   - Verify it's accepted and uploaded

3. **Upload TIFF file in Processing page**
   - Navigate to `/processing`
   - Upload a TIFF file
   - Verify it's accepted and uploaded

4. **Upload PNG via Documents Library**
   - Navigate to `/documents`
   - Click "Upload Contract" button
   - Select a PNG file
   - Verify it uploads successfully

5. **Select image from library**
   - Upload an image file to library
   - Go to Processing page
   - Click "Select from Library"
   - Verify image files appear in the list
   - Select an image file
   - Verify it can be used for processing

6. **Verify error for invalid file types**
   - Try uploading a .txt or .docx file as contract
   - Verify proper error message is shown

## Files Changed

1. `frontend/src/utils/validation.ts` - Validation logic
2. `frontend/src/pages/Processing.tsx` - Dropzone config, UI text, filtering
3. `frontend/src/pages/Documents.tsx` - File input accept attribute, button text
4. `docs/PROCESS_TRIGGERS_SYSTEM.md` - Documentation update
5. `frontend/public/docs/API.md` - API documentation update

## Backend Verification

The backend was already correctly configured and didn't need any changes:

### ✅ Backend validation (`backend/src/utils/helpers.ts`)
Correctly accepts all required formats

### ✅ Upload controller (`backend/src/controllers/upload.controller.ts`)
Properly validates file types and sizes

### ✅ File size limits (`backend/src/utils/constants.ts`)
- PDF: 10MB
- Images: 8MB
- Excel: 50MB

## Commit

```bash
git commit -m "fix(validation): Restore support for JPG, PNG, and TIFF contract files

- Updated frontend validation to accept image formats (PNG, JPG, JPEG, TIFF)
- Modified dropzone configuration to accept all supported file types
- Updated Documents page to allow image uploads for contracts
- Fixed library filtering to include image files
- Updated user-facing messages to reflect supported file types
- Updated documentation (API.md, PROCESS_TRIGGERS_SYSTEM.md)

The backend already supported these formats, but frontend validation
was blocking them. This restores the previously working functionality."
```

## Summary

The issue was a **frontend-only problem** where the validation logic and dropzone configuration were restricting uploads to PDF only, even though the backend fully supported image formats. All frontend components have been updated to match the backend's capabilities, and the documentation has been updated to reflect the correct supported file types.

Users can now upload **PDF, PNG, JPG, and TIFF** files for contract processing as originally intended.

