# Quick Start: Multi-Page IDP Response Handling

## Overview

The system now automatically handles multi-page IDP responses. No configuration needed - it just works!

---

## How It Works

### Automatic Detection
```typescript
// The renderers automatically detect paginated data
if (data.pages && Array.isArray(data.pages)) {
  // Multi-page detected - merge automatically
}
```

### Smart Merging

#### Example: Your 2-Page Purchase Order

**Input JSON**:
```json
{
  "id": "36607f2d-69e5-49f3-9c4c-86ca31925296",
  "pages": [
    {
      "page": 1,
      "fields": {
        "shipVia": "VC VENDOR CHOICE",
        "tax": null,
        "total": null
      },
      "tables": {
        "table1": [
          { "price": 984.55, "quantity": 240 }
        ]
      }
    },
    {
      "page": 2,
      "fields": {
        "shipVia": null,
        "tax": 0,
        "total": 11491.48
      },
      "tables": {
        "table1": [
          { "price": 468.86, "quantity": 540 }
        ]
      }
    }
  ]
}
```

**Output (Merged)**:
```json
{
  "fields": {
    "shipVia": "VC VENDOR CHOICE",  // From page 1
    "tax": 0,                        // From page 2
    "total": 11491.48               // From page 2
  },
  "tables": {
    "table1": [
      { "price": 984.55, "quantity": 240 },  // Page 1
      { "price": 468.86, "quantity": 540 }   // Page 2
    ]
  }
}
```

---

## Usage in Your Code

### Import the Utilities

```typescript
import { 
  mergeMultiPageIDPResponse, 
  isPaginatedIDPResponse 
} from '@/utils/idpMerger';
```

### Basic Usage

```typescript
// Check if data is paginated
if (isPaginatedIDPResponse(data)) {
  console.log('Multi-page document detected');
}

// Merge the data
const mergedData = mergeMultiPageIDPResponse(data);

// Access merged fields and tables
const fields = mergedData.fields;
const tables = mergedData.tables;
```

### In React Components

```typescript
export const MyRenderer: React.FC<{ data: any }> = ({ data }) => {
  // Merge multi-page data
  const mergedData = mergeMultiPageIDPResponse(data);
  const fields = mergedData.fields || {};
  const tables = mergedData.tables || {};
  
  return (
    <div>
      <h2>{fields.purchaseOrderNumber}</h2>
      <p>Total: {fields.total}</p>
      
      {/* Render table */}
      {tables.table1 && (
        <table>
          {tables.table1.map((row, i) => (
            <tr key={i}>
              <td>{row.description}</td>
              <td>{row.price}</td>
            </tr>
          ))}
        </table>
      )}
    </div>
  );
};
```

---

## Merge Rules Reference

### Fields

| Scenario | Example | Result |
|----------|---------|--------|
| **Only one has value** | Page 1: `"ABC"`, Page 2: `null` | `"ABC"` |
| **Same value** | Page 1: `"ABC"`, Page 2: `"ABC"` | `"ABC"` (not repeated) |
| **Different values** | Page 1: `"ABC"`, Page 2: `"XYZ"` | `"ABC\nXYZ"` (concatenated) |
| **Nested objects** | Recursively merge | Smart merge at each level |

### Tables

| Scenario | Result |
|----------|--------|
| **Same columns** | Merge all rows into one table |
| **Different columns** | Create separate tables: `table1_page1`, `table1_page2` |

---

## Testing Your Implementation

### Run Demo Script

```bash
cd /Users/rodrigo.torres/mulesoft-work/customers/dreamfields/webapp
node demo-idp-merger.js
```

This demonstrates merging with your exact example JSON.

### Check Results

The demo shows:
- ✅ Field merging (null handling, concatenation)
- ✅ Table merging (4 rows from 2 pages)
- ✅ Nested object merging (parties)

---

## Common Scenarios

### Scenario 1: Purchase Order with Financial Data on Last Page

```javascript
// Page 1: Items and header info
// Page 2: Tax, total, subtotal

// Result: Complete PO with all items and financial totals
```

### Scenario 2: Contract with Different Buyer Names

```javascript
// Page 1: buyer.name = "Warren Derrick"
// Page 2: buyer.name = "ATLANTIC COAST ELECTRIC SUPPLY"

// Result: buyer.name = "Warren Derrick\nATLANTIC COAST\nELECTRIC SUPPLY"
```

### Scenario 3: Invoice with Continuation Table

```javascript
// Page 1: Line items 1-10
// Page 2: Line items 11-15

// Same columns → Merged table with all 15 items
```

### Scenario 4: Document with Summary Table

```javascript
// Page 1: Detailed line items
// Page 2: Summary table (different columns)

// Different columns → Two separate tables:
// - lineItems_page1
// - summary_page2
```

---

## UI Indicators

### Multi-Page Banner

When a document has multiple pages, users see:

```
ℹ️ This document has 2 pages. Data has been intelligently merged.
```

This appears at the top of the IDP response view.

---

## API Reference

### `mergeMultiPageIDPResponse(data: any): any`

Merges multi-page IDP response into single data structure.

**Parameters**:
- `data`: IDP response object

**Returns**:
- Merged data with `fields` and `tables` at root level
- Original pages preserved in `originalPages`

**Example**:
```typescript
const merged = mergeMultiPageIDPResponse(idpResponse);
console.log(merged.fields.total);  // Access merged field
console.log(merged.tables.table1); // Access merged table
console.log(merged.originalPages); // Access original pages if needed
```

### `isPaginatedIDPResponse(data: any): boolean`

Check if data is paginated.

**Parameters**:
- `data`: IDP response object

**Returns**:
- `true` if data has `pages` array
- `false` otherwise

**Example**:
```typescript
if (isPaginatedIDPResponse(data)) {
  // Handle multi-page
} else {
  // Handle flat format
}
```

---

## Troubleshooting

### Issue: Tables Not Merging

**Cause**: Different column structures across pages

**Solution**: This is expected behavior. Check for separate tables:
```typescript
console.log(Object.keys(mergedData.tables));
// Expected: ['table1_page1', 'table1_page2']
```

### Issue: Field Values Missing

**Cause**: Null in all pages

**Solution**: Verify source data has non-null value in at least one page

### Issue: Values Concatenated When Shouldn't Be

**Cause**: Different non-null values in multiple pages

**Solution**: This is expected - review source data to ensure values should be different

---

## Best Practices

### 1. Always Check for Merged Data

```typescript
const mergedData = mergeMultiPageIDPResponse(data);
// Use mergedData, not data.pages[0]
```

### 2. Handle Both Formats

```typescript
const fields = isPaginatedIDPResponse(data) 
  ? mergeMultiPageIDPResponse(data).fields 
  : data;
```

### 3. Display Multi-Page Indicator

```typescript
{mergedData.originalPages && mergedData.originalPages.length > 1 && (
  <InfoBanner>
    Document has {mergedData.originalPages.length} pages
  </InfoBanner>
)}
```

### 4. Render All Tables

```typescript
// Don't assume only table1 exists
Object.entries(tables).map(([tableName, tableData]) => (
  <Table key={tableName} data={tableData} title={tableName} />
))
```

---

## Examples in Codebase

### PurchaseOrderRenderer
See: `frontend/src/components/idp/PurchaseOrderRenderer.tsx`

Shows how to:
- Merge data
- Render all tables dynamically
- Handle parties information

### GenericIDPRenderer
See: `frontend/src/components/idp/GenericIDPRenderer.tsx`

Shows how to:
- Detect pagination
- Show multi-page banner
- Render merged data

### ContractRenderer
See: `frontend/src/components/idp/ContractRenderer.tsx`

Shows how to:
- Handle nested objects
- Merge contract-specific fields

---

## Documentation

- **Full Documentation**: `/docs/IDP_MULTIPAGE_MERGER.md`
- **Implementation Summary**: `/docs/MULTIPAGE_IDP_IMPLEMENTATION_SUMMARY.md`
- **Source Code**: `/frontend/src/utils/idpMerger.ts`
- **Tests**: `/frontend/src/utils/idpMerger.test.ts`

---

## Support

For questions or issues:
1. Check the full documentation
2. Run the demo script
3. Review test cases
4. Examine existing renderer implementations

---

**You're all set!** The system automatically handles multi-page IDP responses. 🎉

