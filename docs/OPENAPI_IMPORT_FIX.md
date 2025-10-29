# OpenAPI Import Fix - YAML Support & Error Handling

## Issue
OpenAPI import was silently failing when users pasted YAML specifications:
- Nothing happened after paste
- Only showed "Failed to import OpenAPI spec" with no details
- No error messages in browser console or server logs
- Unclear what went wrong

## Root Causes

### 1. Frontend Issue
**File**: `frontend/src/pages/Connectors.tsx`
- Line 194: `payload.openApiSpec = JSON.parse(openApiSpec);`
- **Problem**: Attempting to `JSON.parse()` YAML content fails silently
- YAML is not valid JSON, so parse throws exception
- Exception was caught but error wasn't informative

### 2. Backend Issue
**File**: `backend/src/services/openapi-importer.service.ts`
- `importFromSpec()` expected already-parsed object
- No YAML parsing capability
- **Problem**: Couldn't handle YAML format at all

### 3. Error Handling Issue
- Generic error messages
- No detailed logging
- No way to debug what went wrong

## Solution

### Backend Enhancements

#### 1. Added YAML Parsing Support
```typescript
private parseSpec(specString: string): OpenAPISpec {
  try {
    // First try JSON parsing
    logger.info('Attempting to parse spec as JSON...');
    return JSON.parse(specString);
  } catch (jsonError) {
    // If JSON parsing fails, try YAML
    try {
      logger.info('JSON parsing failed, attempting to parse as YAML...');
      const parsed = yaml.load(specString) as OpenAPISpec;
      logger.info('Successfully parsed YAML spec');
      return parsed;
    } catch (yamlError: any) {
      throw new Error(`Failed to parse OpenAPI spec. Not valid JSON or YAML.`);
    }
  }
}
```

#### 2. Enhanced Validation
```typescript
// Validate spec structure
if (!parsedSpec.openapi && !parsedSpec['swagger']) {
  throw new Error('Invalid OpenAPI spec: missing "openapi" or "swagger" field');
}

if (!parsedSpec.paths || Object.keys(parsedSpec.paths).length === 0) {
  throw new Error('Invalid OpenAPI spec: no paths defined');
}

if (operations.length === 0) {
  throw new Error('No operations found in OpenAPI spec');
}
```

#### 3. Comprehensive Logging
```typescript
logger.info(`OpenAPI version: ${parsedSpec.openapi || parsedSpec['swagger']}`);
logger.info(`API title: ${parsedSpec.info?.title || 'N/A'}`);
logger.info(`Found ${Object.keys(parsedSpec.paths).length} paths`);
logger.info(`Extracted ${operations.length} operations from OpenAPI spec`);
```

#### 4. Support for Swagger 2.0
```typescript
interface OpenAPISpec {
  openapi?: string;
  swagger?: string; // For Swagger 2.0
  info: any;
  servers?: any[];
  paths: Record<string, Record<string, any>>;
  components?: any;
}
```

### Frontend Enhancements

#### 1. Remove JSON Parsing
```typescript
// Before: Failed on YAML
payload.openApiSpec = JSON.parse(openApiSpec);

// After: Send as raw string (backend handles parsing)
payload.openApiSpec = openApiSpec.trim();
```

#### 2. Add Console Logging
```typescript
console.log('Sending OpenAPI spec to backend:', payload.openApiSpec.substring(0, 200) + '...');
console.log('Importing OpenAPI spec for connector:', selectedConnector.id);
console.log('OpenAPI import response:', response.data);
```

#### 3. Better Error Display
```typescript
const errorMessage = error.response?.data?.error || error.message || 'Failed to import OpenAPI spec';

console.error('Error importing OpenAPI spec:', error);
console.error('Error response:', error.response?.data);
```

#### 4. Reload After Import
```typescript
// Reload connectors to show updated data
loadConnectors();
```

### Controller Enhancements

#### 1. Detailed Request Logging
```typescript
console.log('=== OpenAPI Import Request ===');
console.log('Connector ID:', connectorId);
console.log('URL provided:', !!url);
console.log('Spec provided:', !!openApiSpec);
if (openApiSpec) {
  console.log('Spec type:', typeof openApiSpec);
  console.log('Spec preview:', specString.substring(0, 200));
}
```

#### 2. Comprehensive Error Logging
```typescript
console.error('=== OpenAPI Import Error ===');
console.error('Error:', error);
console.error('Error message:', error.message);
console.error('Error stack:', error.stack);
```

## New Dependencies

```json
{
  "devDependencies": {
    "@types/js-yaml": "^4.0.9"
  }
}
```

## Testing

### Supported Formats

#### ✅ JSON OpenAPI 3.0
```json
{
  "openapi": "3.0.0",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/users": {
      "get": { "summary": "Get users" }
    }
  }
}
```

#### ✅ YAML OpenAPI 3.0
```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
```

#### ✅ Swagger 2.0 (JSON or YAML)
```yaml
swagger: '2.0'
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
```

### Error Messages

#### Invalid Format
```
Failed to parse OpenAPI spec. Not valid JSON or YAML.
JSON error: Unexpected token...
YAML error: bad indentation...
```

#### Missing Required Fields
```
Invalid OpenAPI spec: missing "openapi" or "swagger" field
```

#### Empty Spec
```
Invalid OpenAPI spec: no paths defined
```

#### No Operations
```
No operations found in OpenAPI spec
```

## Usage

### Via UI
1. Go to **Connectors** page
2. Find a REST connector
3. Click **Import OpenAPI** button
4. **Option A**: Paste YAML or JSON spec
5. **Option B**: Provide URL to spec
6. Click **Import**
7. See success message with action count

### Via Console
**Browser Console (F12)**:
- See request payload preview
- See parsing attempts
- See response or detailed errors

**Server Logs** (Heroku or local):
- See OpenAPI version
- See API title
- See path count
- See operation extraction
- See action creation progress

## Benefits

1. ✅ **YAML Support**: Users can paste OpenAPI specs in YAML format
2. ✅ **Better Errors**: Specific, actionable error messages
3. ✅ **Debuggable**: Full logging in both browser and server
4. ✅ **Swagger 2.0**: Support for older Swagger specifications
5. ✅ **Validation**: Multiple validation checks before processing
6. ✅ **Transparency**: Users see exactly what's happening

## Files Changed

- `backend/src/services/openapi-importer.service.ts` - Added YAML parsing & validation
- `backend/src/controllers/connector.controller.ts` - Enhanced logging
- `frontend/src/pages/Connectors.tsx` - Fixed parsing, added logging
- `backend/package.json` - Added @types/js-yaml

## Deployment

After deploying to Heroku:
1. Users can now import YAML OpenAPI specs
2. Clear error messages appear for any issues
3. Check Heroku logs: `heroku logs --tail --app contract-dev`
4. Look for `=== OpenAPI Import Request ===` and `=== OpenAPI Import Error ===`

## Future Enhancements

- [ ] File upload for OpenAPI specs
- [ ] Preview operations before import
- [ ] Batch import multiple specs
- [ ] OpenAPI 3.1 support
- [ ] GraphQL schema import
- [ ] Postman collection import

