# IDP Multi-Page Response Merger

## Overview

This document describes the implementation of intelligent multi-page IDP response merging for the Dreamfields Document Processing application.

## Problem Statement

Previously, when IDP (Intelligent Document Processing) returned multi-page JSON responses, only the first page was extracted and displayed. This resulted in incomplete data when documents spanned multiple pages.

## Solution

Implemented a comprehensive merge utility (`idpMerger.ts`) that intelligently combines data from multiple pages according to these rules:

### 1. Field Merging Rules

- **Non-null Values**: If a field appears in multiple pages, use the non-null value
- **Same Values**: If a field has the same value across pages, display it once (no repetition)
- **Different Values**: If a field has different non-null values, concatenate them with a newline
- **Nested Objects**: Recursively merge nested structures (e.g., parties with buyer/vendor info)

#### Example:

```json
// Page 1
{
  "shipVia": "VC VENDOR CHOICE",
  "tax": null,
  "total": null,
  "purchaseOrderNumber": "P1129124"
}

// Page 2
{
  "shipVia": null,
  "tax": 0,
  "total": 11491.48,
  "purchaseOrderNumber": "P1129124"
}

// Merged Result
{
  "shipVia": "VC VENDOR CHOICE",     // From page 1 (page 2 is null)
  "tax": 0,                          // From page 2 (page 1 is null)
  "total": 11491.48,                 // From page 2 (page 1 is null)
  "purchaseOrderNumber": "P1129124"  // Same in both, not repeated
}
```

### 2. Table Merging Rules

- **Same Columns**: If tables across pages have the same column structure, merge all rows into a single table
- **Different Columns**: If tables have different columns, create separate tables with suffixes (e.g., `table1_page1`, `table1_page2`)

#### Example - Same Columns (Merged):

```json
// Page 1 - table1
[
  { "price": 984.55, "quantity": 240, "description": "Item A" },
  { "price": 984.55, "quantity": 240, "description": "Item B" }
]

// Page 2 - table1
[
  { "price": 468.86, "quantity": 540, "description": "Item C" }
]

// Merged Result - table1
[
  { "price": 984.55, "quantity": 240, "description": "Item A" },
  { "price": 984.55, "quantity": 240, "description": "Item B" },
  { "price": 468.86, "quantity": 540, "description": "Item C" }
]
```

#### Example - Different Columns (Separate Tables):

```json
// Page 1 - table1
[
  { "productCode": "ABC", "description": "Item 1", "price": 100 }
]

// Page 2 - table1 (different columns)
[
  { "itemId": "X123", "name": "Product A", "cost": 50, "quantity": 10 }
]

// Merged Result
{
  "table1_page1": [
    { "productCode": "ABC", "description": "Item 1", "price": 100 }
  ],
  "table1_page2": [
    { "itemId": "X123", "name": "Product A", "cost": 50, "quantity": 10 }
  ]
}
```

### 3. Nested Object Merging

For nested objects like `parties`, the merger:
1. Collects all keys from all pages
2. Recursively merges each sub-object
3. Applies the same field merging rules to nested values

#### Example:

```json
// Page 1
{
  "parties": {
    "buyer": {
      "name": "Warren Derrick",
      "phone": "843-207-8181",
      "city": null
    },
    "vendor": {
      "name": "ATLANTIC COAST ELECTRIC SUPPLY",
      "state": "SC"
    }
  }
}

// Page 2
{
  "parties": {
    "buyer": {
      "name": "ATLANTIC COAST ELECTRIC SUPPLY",
      "phone": null,
      "city": "SUMMERVILLE"
    }
  }
}

// Merged Result
{
  "parties": {
    "buyer": {
      "name": "Warren Derrick\nATLANTIC COAST ELECTRIC SUPPLY", // Different values concatenated
      "phone": "843-207-8181",  // From page 1
      "city": "SUMMERVILLE"      // From page 2
    },
    "vendor": {
      "name": "ATLANTIC COAST ELECTRIC SUPPLY",
      "state": "SC"
    }
  }
}
```

## Implementation Files

### Core Utility
- **`frontend/src/utils/idpMerger.ts`**: Main merger logic with helper functions

### Updated Renderers
All renderers now use the merger utility:
- **`frontend/src/components/idp/PurchaseOrderRenderer.tsx`**: Purchase order display
- **`frontend/src/components/idp/GenericIDPRenderer.tsx`**: Generic document display
- **`frontend/src/components/idp/ContractRenderer.tsx`**: Contract display

### Tests
- **`frontend/src/utils/idpMerger.test.ts`**: Comprehensive test cases

## API Functions

### `mergeMultiPageIDPResponse(data: any): any`

Main function that processes IDP response data.

**Parameters:**
- `data`: IDP response object (may be paginated or flat)

**Returns:**
- Merged data with `fields` and `tables` at the root level
- Original pages preserved in `originalPages` field for reference

**Usage:**
```typescript
import { mergeMultiPageIDPResponse } from '@/utils/idpMerger';

const mergedData = mergeMultiPageIDPResponse(idpResponse);
console.log(mergedData.fields);  // All merged fields
console.log(mergedData.tables);  // All merged tables
```

### `isPaginatedIDPResponse(data: any): boolean`

Check if data is in paginated format.

**Parameters:**
- `data`: IDP response object

**Returns:**
- `true` if data has a `pages` array with at least one page
- `false` otherwise

**Usage:**
```typescript
import { isPaginatedIDPResponse } from '@/utils/idpMerger';

if (isPaginatedIDPResponse(data)) {
  // Handle paginated data
}
```

## User Interface Changes

### GenericIDPRenderer
- Now displays an info banner when data has been merged from multiple pages
- Shows: "ℹ️ This document has X pages. Data has been intelligently merged."

### PurchaseOrderRenderer
- Dynamically renders all tables (handles both merged and separate tables)
- Table headers are generated from actual column names
- Shows item count in table title

### ContractRenderer
- Uses merged data for all field displays
- Handles nested party information correctly

## Testing

The implementation includes comprehensive test cases:

1. **Multi-page with same table columns**: Verifies rows are merged
2. **Multi-page with different table columns**: Verifies separate tables are created
3. **Single page**: Ensures no unnecessary processing
4. **Non-paginated data**: Returns data as-is
5. **Nested object merging**: Tests deep merge logic
6. **String value concatenation**: Tests different value handling

## Example JSON (User Provided)

The implementation handles the exact example provided by the user:

```json
{
  "id": "36607f2d-69e5-49f3-9c4c-86ca31925296",
  "pages": [
    {
      "page": 1,
      "fields": {
        "fob": null,
        "tax": null,
        "total": null,
        "shipVia": "VC VENDOR CHOICE",
        "paymentTerms": "Net 30 Days",
        "purchaseOrderDate": "08/25/2025",
        "purchaseOrderNumber": "P1129124",
        "parties": {
          "buyer": { "name": "Warren Derrick", "headerPhone": "843-207-8181" },
          "vendor": { "name": "ATLANTIC COAST ELECTRIC SUPPLY 3" }
        }
      },
      "tables": {
        "table1": [
          { "price": 984.55, "quantity": 240, "description": "SW XH3/0BN CU" }
        ]
      }
    },
    {
      "page": 2,
      "fields": {
        "fob": null,
        "tax": 0,
        "total": 11491.48,
        "shipVia": null,
        "paymentTerms": null,
        "purchaseOrderDate": "08/25/2025",
        "purchaseOrderNumber": "P1129124",
        "parties": {
          "buyer": { "name": "ATLANTIC COAST\nELECTRIC SUPPLY" }
        }
      },
      "tables": {
        "table1": [
          { "price": 468.86, "quantity": 540, "description": "SW XH6GN 6 XHHW GREEN" }
        ]
      }
    }
  ],
  "status": "SUCCEEDED",
  "documentName": "P1129124-0001.pdf"
}
```

**Merge Result:**
- `shipVia`: "VC VENDOR CHOICE" (from page 1)
- `tax`: 0 (from page 2)
- `total`: 11491.48 (from page 2)
- `purchaseOrderNumber`: "P1129124" (same in both, not repeated)
- `parties.buyer.name`: Concatenated with newline (different values)
- `parties.buyer.headerPhone`: "843-207-8181" (from page 1)
- `table1`: 2 rows merged (same columns)

## Benefits

1. **Complete Data**: All pages are processed, no data loss
2. **Intelligent Merging**: Only non-null values are used
3. **No Duplication**: Same values aren't repeated
4. **Flexible Tables**: Handles both uniform and varied table structures
5. **Backward Compatible**: Works with both paginated and flat formats
6. **Performance**: Efficient merging algorithms
7. **User Feedback**: Clear indication when data is merged

## Future Enhancements

Potential improvements:
- Add configuration options for merge behavior
- Support custom merge rules per field type
- Add visual indicators for merged vs. original data
- Export merged data in various formats
- Add merge conflict resolution UI

## Related Files

- `/webapp/frontend/src/utils/idpMerger.ts`
- `/webapp/frontend/src/utils/idpMerger.test.ts`
- `/webapp/frontend/src/components/idp/PurchaseOrderRenderer.tsx`
- `/webapp/frontend/src/components/idp/GenericIDPRenderer.tsx`
- `/webapp/frontend/src/components/idp/ContractRenderer.tsx`
- `/webapp/frontend/src/pages/IDPResponse.tsx`

## Git Commit Message

```
feat(idp): Implement intelligent multi-page IDP response merging

Added comprehensive merge utility that intelligently combines IDP data
from multiple pages according to business rules:
- Fields: merge non-null values, concatenate different values
- Tables: merge rows if columns match, create separate tables if different
- Nested objects: recursively merge with proper value handling

Updated all IDP renderers to use merged data for complete document display.
Includes tests and documentation.
```

