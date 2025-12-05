# OpenAPI/RAML Flow Import Feature

## Overview

This feature allows users to automatically generate flows for MuleSoft APIs by importing OpenAPI, Swagger, or RAML specifications. Instead of manually creating each flow, users can parse an API specification and import multiple flows at once.

## Implementation Date

December 5, 2025

## What Was Added

### Backend Changes

#### New Service: Flow OpenAPI Importer

**File:** `backend/src/services/flow-openapi-importer.service.ts`

- Parses OpenAPI 3.0, Swagger 2.0, and RAML specifications
- Supports JSON and YAML formats
- Extracts flow information:
  - Flow name (from operationId or generated from path)
  - Description (from summary or description)
  - HTTP method and URL path
  - Variables from parameters and request body
- Maps OpenAPI types to flow variable types (string, number, boolean, json)

#### New Controller Methods

**File:** `backend/src/controllers/mulesoftApi.controller.ts`

- `parseFlowSpec(req, res)` - Parse spec and return preview
  - Accepts: `{ openApiSpec?, url? }`
  - Returns: `{ flows: FlowPreview[], duplicates: string[] }`
  - No database writes, only parsing
  
- `bulkCreateFlows(req, res)` - Create multiple flows
  - Accepts: `{ flows: FlowData[], duplicateAction: 'skip' | 'update' | 'cancel' }`
  - Returns: `{ created: number, updated: number, skipped: number }`
  - Handles duplicate flows based on action

#### New Service Methods

**File:** `backend/src/services/mulesoftApi.service.ts`

- `parseFlowSpec()` - Validate access and parse spec
  - Checks user authorization
  - Detects duplicate flow names
  - Returns parsed flows and duplicates list

- `bulkCreateFlows()` - Bulk create/update flows
  - Skip duplicates: Only create new flows
  - Update duplicates: Update existing, create new
  - Cancel on duplicates: Abort entire import

#### New Routes

**File:** `backend/src/routes/mulesoftApi.routes.ts`

```
POST /api/mulesoft-apis/:id/parse-flow-spec
POST /api/mulesoft-apis/:id/bulk-create-flows
```

### Frontend Changes

#### Modified Flows Management Modal

**File:** `frontend/src/pages/MulesoftApis.tsx`

Added new state variables:
- `activeTab` - Current tab (manual/import)
- `importMethod` - Import method (paste/upload/url)
- `specInput` - Specification text
- `specFile` - Uploaded file
- `parsedFlows` - Preview of parsed flows
- `selectedFlows` - User-selected flows to import
- `duplicates` - List of duplicate flow names
- `duplicateAction` - How to handle duplicates
- `importing` - Import in progress flag
- `parsing` - Parse in progress flag

Added helper functions:
- `resetImportForm()` - Clear all import state
- `handleFileUpload()` - Read uploaded file
- `handleSpecParse()` - Parse specification
- `handleToggleFlow()` - Toggle flow selection
- `handleToggleAll()` - Select/deselect all flows
- `handleImportFlows()` - Execute bulk import

#### New UI Components

**Tab Navigation:**
- Manual tab - Existing flow management
- Import tab - New import interface

**Import Tab Features:**

1. **Input Method Selector**
   - Radio buttons: Paste / Upload / URL
   - Dynamically shows appropriate input

2. **Input Areas**
   - Paste: Large textarea for YAML/JSON
   - Upload: File input (.yaml, .yml, .json, .raml)
   - URL: Input field for spec URL

3. **Parse Button**
   - Validates input
   - Calls API to parse specification
   - Shows progress indicator

4. **Flow Preview Table**
   - Shows all parsed flows
   - Columns: Checkbox, Name, Method, Path, Variables
   - Select/Deselect all button
   - Highlights duplicate flows

5. **Duplicate Handling**
   - Radio options for duplicate action
   - Warning message with count
   - Visual indication on table rows

6. **Import Button**
   - Shows selected count
   - Disabled if no flows selected
   - Progress indicator during import
   - Success message with statistics

## How to Use

### Step 1: Navigate to MuleSoft APIs

1. Go to Admin → MuleSoft APIs (`/apis`)
2. Find your API in "My MuleSoft APIs"
3. Click "Manage Flows" button

### Step 2: Switch to Import Tab

1. In the Flows Management modal, click "Import from Spec" tab
2. Choose your import method

### Step 3: Provide Specification

**Option A: Paste**
1. Select "Paste Spec" radio button
2. Paste your OpenAPI/RAML specification in the textarea
3. Supports YAML and JSON formats

**Option B: Upload File**
1. Select "Upload File" radio button
2. Click "Choose File" and select your spec file
3. Accepts: .yaml, .yml, .json, .raml

**Option C: URL**
1. Select "URL" radio button
2. Enter the URL to your specification
3. Example: `https://api.example.com/openapi.json`

### Step 4: Parse Specification

1. Click "Parse Specification" button
2. Wait for parsing to complete
3. Review the flow preview table

### Step 5: Select Flows to Import

1. By default, all flows are selected
2. Uncheck flows you don't want to import
3. Use "Select All" / "Deselect All" for quick selection

### Step 6: Handle Duplicates

If duplicate flows are detected:

1. **Skip Duplicates** (default)
   - Only create new flows
   - Existing flows remain unchanged
   - Good for adding new flows to existing API

2. **Update Existing**
   - Update matching flows with new data
   - Create flows that don't exist
   - Good for refreshing flow definitions

3. **Cancel on Duplicates**
   - Abort entire import if any duplicates found
   - Ensures no accidental overwrites
   - Good for clean imports only

### Step 7: Import

1. Click "Import X Flow(s)" button
2. Wait for import to complete
3. Review success message showing:
   - Number of flows created
   - Number of flows updated
   - Number of flows skipped

## Supported Formats

### OpenAPI 3.0 (JSON)
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {
    "/analyze": {
      "post": {
        "operationId": "analyzeDocument",
        "summary": "Analyze a document",
        "parameters": [
          {
            "name": "documentId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": { "type": "object" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### OpenAPI 3.0 (YAML)
```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /analyze:
    post:
      operationId: analyzeDocument
      summary: Analyze a document
      parameters:
        - name: documentId
          in: query
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: object
```

### Swagger 2.0
```yaml
swagger: '2.0'
info:
  title: My API
  version: 1.0.0
paths:
  /analyze:
    post:
      operationId: analyzeDocument
      summary: Analyze a document
      parameters:
        - name: documentId
          in: query
          required: true
          type: string
        - name: body
          in: body
          required: true
          schema:
            type: object
```

## Variable Extraction

The importer automatically extracts variables from:

### 1. Query Parameters
```yaml
parameters:
  - name: filter
    in: query
    required: true
    schema:
      type: string
```
**Becomes:** `{ name: "filter", type: "string", mandatory: true }`

### 2. Path Parameters
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: number
```
**Becomes:** `{ name: "id", type: "number", mandatory: true }`

### 3. Request Body Properties
```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [name]
        properties:
          name:
            type: string
          age:
            type: integer
```
**Becomes:**
- `{ name: "name", type: "string", mandatory: true }`
- `{ name: "age", type: "number", mandatory: false }`

### 4. Generic Body
If schema properties aren't defined:
```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
```
**Becomes:** `{ name: "body", type: "json", mandatory: true }`

## Type Mapping

| OpenAPI Type | Flow Variable Type |
|--------------|-------------------|
| string       | string            |
| number       | number            |
| integer      | number            |
| boolean      | boolean           |
| object       | json              |
| array        | json              |

## Activity Logging

All import operations are logged:
- `mulesoft_flow.bulk_import` - When flows are imported
- Metadata includes:
  - `mulesoftApiId` - API ID
  - `created` - Number of flows created
  - `updated` - Number of flows updated
  - `skipped` - Number of flows skipped

## Error Handling

### Invalid Specification Format
```
Failed to parse OpenAPI spec. Not valid JSON or YAML.
```
**Solution:** Verify your specification is valid JSON or YAML

### Missing Required Fields
```
Invalid OpenAPI spec: missing "openapi" or "swagger" field
```
**Solution:** Ensure spec has `openapi` or `swagger` version field

### No Paths Defined
```
Invalid OpenAPI spec: no paths defined
```
**Solution:** Add at least one path to your specification

### No Operations Found
```
No operations found in OpenAPI spec
```
**Solution:** Add HTTP methods (GET, POST, etc.) to your paths

### Duplicate Cancellation
```
Import cancelled due to duplicates
```
**Solution:** Change duplicate action or remove/rename duplicates

### Network Error (URL Import)
```
Failed to fetch OpenAPI spec: [error details]
```
**Solution:** Verify URL is accessible and returns valid spec

## Testing Checklist

### Parse Tests
- [ ] Parse OpenAPI 3.0 JSON
- [ ] Parse OpenAPI 3.0 YAML
- [ ] Parse Swagger 2.0 JSON
- [ ] Parse Swagger 2.0 YAML
- [ ] Fetch from URL
- [ ] Upload file (.yaml, .json)
- [ ] Paste text
- [ ] Reject invalid JSON/YAML
- [ ] Reject spec without paths
- [ ] Reject spec without version

### Variable Extraction
- [ ] Extract query parameters
- [ ] Extract path parameters
- [ ] Extract request body properties
- [ ] Extract generic body
- [ ] Map types correctly (string, number, boolean, json)
- [ ] Detect required vs optional

### Flow Selection
- [ ] Select/deselect individual flows
- [ ] Select all flows
- [ ] Deselect all flows
- [ ] Show correct count in import button

### Duplicate Handling
- [ ] Detect duplicate flow names
- [ ] Skip duplicates (create only new)
- [ ] Update duplicates (update existing + create new)
- [ ] Cancel on duplicates (abort import)
- [ ] Show duplicate count in warning

### Import
- [ ] Import selected flows successfully
- [ ] Show correct statistics (created/updated/skipped)
- [ ] Refresh flow list after import
- [ ] Clear import form after success
- [ ] Switch back to manual tab

### Authorization
- [ ] Only API owner can import flows
- [ ] Shared users cannot import
- [ ] Admin can import to any API

### Edge Cases
- [ ] Empty specification
- [ ] Specification with no operations
- [ ] Very large specification (100+ endpoints)
- [ ] Special characters in flow names
- [ ] Duplicate method+path combinations
- [ ] Missing operationId (use generated name)

## Known Limitations

1. **RAML Support**: Basic RAML parsing supported, but advanced features may not be fully supported
2. **Nested Objects**: Request body properties with nested objects are simplified to JSON type
3. **Authentication**: Authentication requirements from spec are not imported
4. **Response Schemas**: Response definitions are not imported
5. **Flow Names**: Must be unique per API (spec's operationId or generated from path)

## Future Enhancements

- [ ] Support for RAML data types
- [ ] Import authentication configurations
- [ ] Import response schemas
- [ ] Preview variable details before import
- [ ] Edit flows in preview table
- [ ] Save import templates
- [ ] Batch import to multiple APIs
- [ ] Export flows to OpenAPI spec

## Benefits

1. **Time Saving**: Import dozens of flows in seconds vs manual creation
2. **Accuracy**: Automatically extract correct parameters and types
3. **Consistency**: Maintain naming and structure from API specification
4. **Flexibility**: Choose which flows to import and how to handle duplicates
5. **Documentation**: Keep flows synchronized with API specification

## Related Documentation

- [Flow Management Feature](./FLOW_MANAGEMENT_FEATURE.md)
- [MuleSoft APIs Implementation](./MULESOFT_APIS_IMPLEMENTATION.md)
- [README](../README.md)

---

**Status:** ✅ Complete and Ready for Testing

**Build Status:**
- Backend: ✅ Compiled successfully
- Frontend: ✅ Compiled successfully

**Ready for Testing:** Yes

