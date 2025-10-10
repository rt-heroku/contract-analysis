# MuleSoft API Response Format - ACTUAL STRUCTURE

## Expected Response from `/analyze` Endpoint

This document reflects the **ACTUAL** response format from your MuleSoft API.

### Complete Response Structure

```json
{
  "status": "SUCCEEDED",
  "analysis_markdown": "# Contract Compliance Report\n\n## Contract Summary\n...",
  "data_table": [],
  "jsonData": {
    "contract_summary": {
      "document": "Scanned MED.pdf",
      "terms": [
        "Promotional discount funded 50% by Distributor and 50% by Retailer (25/25 split)",
        "SRP markdowns must comply with state minimums",
        "Approved mechanics: price-drop, bundle (2 for), cart add-on",
        "Limits: 4 units per customer/day"
      ],
      "products_reference": [
        "Infused Baby Jeeter 0.5g X 5 Grapefruit Romulan - Units sold (ref): 2",
        "Infused Jeeter XL 2g Preroll Acapulco Gold - Units sold (ref): 1"
      ]
    },
    "validation_summary": {
      "matched_products": [
        "Infused Baby Jeeter 0.5g x 5 Grapefruit Romulan",
        "Infused Jeeter Cannon 1.3g Granddaddy Purp"
      ],
      "missing_products": [
        "Infused Jeeter XL 2g Preroll Acapulco Gold"
      ],
      "over_limit_products": [],
      "quantity_discrepancies": [
        {
          "product": "Infused Baby Jeeter 0.5g x 5 Grapefruit Romulan",
          "expected": 2,
          "actual": 6
        }
      ],
      "pricing_issues": [],
      "term_violations": []
    },
    "anomalies_detected": [
      {
        "issue": "Quantity Discrepancy",
        "explanation": "The quantity sold in the dataset exceeds the reference quantity specified in the contract for certain products.",
        "possible_cause": "Data entry error or incorrect sales recording."
      }
    ],
    "compliance_score": "80%",
    "recommendations": [
      "Review sales data entry processes to ensure accurate recording.",
      "Conduct a detailed audit of sales records to verify discrepancies.",
      "Implement checks for compliance with unit limits and promotional terms."
    ]
  }
}
```

## Field Descriptions

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Processing status: `"SUCCEEDED"`, `"FAILED"`, `"PROCESSING"` |
| `analysis_markdown` | string | Yes | Complete analysis report in Markdown format |
| `data_table` | array | Yes | Optional array for tabular data (can be empty) |
| `jsonData` | object | Yes | Structured data for dashboard and detailed views |

### jsonData.contract_summary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | string | Yes | Contract document filename |
| `terms` | string[] | Yes | List of contract terms extracted from document |
| `products_reference` | string[] | Yes | List of products mentioned in contract with reference quantities |

### jsonData.validation_summary

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matched_products` | string[] | Yes | Products that match between contract and data file |
| `missing_products` | string[] | Yes | Products in contract but not found in data |
| `over_limit_products` | string[] | Yes | Products that exceed limits |
| `quantity_discrepancies` | array | Yes | Products with quantity mismatches |
| `pricing_issues` | array | Yes | Products with pricing problems |
| `term_violations` | array | Yes | Products violating contract terms |

### jsonData.validation_summary.quantity_discrepancies[]

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product` | string | Yes | Product name |
| `expected` | number | Yes | Expected quantity from contract |
| `actual` | number | Yes | Actual quantity from data file |

### jsonData.anomalies_detected[]

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issue` | string | Yes | Name/type of the anomaly |
| `explanation` | string | Yes | Detailed explanation of the issue |
| `possible_cause` | string | Yes | Suspected root cause |

### jsonData.compliance_score

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `compliance_score` | string | Yes | Overall compliance percentage (e.g., "80%") |

### jsonData.recommendations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recommendations` | string[] | Yes | List of recommended actions |

## Request Format

The `/analyze` endpoint expects the contract processing result in the request body:

```json
POST http://localhost:8081/analyze?job={jobId}
Content-Type: application/json

{
  "document": "Dreamfields_Distribution_Agreement_Puff_Utica_REC.pdf",
  "status": "SUCCEEDED",
  "terms": [
    "Promotional discount funded 50% by Distributor and 50% by Retailer (25/25 split). SRP markdowns must comply with state minimums. Approved mechanics: price-drop, bundle (2 for), cart add-on. Limits: 4 units per customer/day."
  ],
  "products": [
    "Infused Jeeter XL 2g Blueberry Kush - Units sold (ref): 4",
    "Infused Jeeter 1g Blue ZKZ - Units sold (ref): 3"
  ]
}
```

## How the App Uses This Data

### Backend (document.service.ts)
```typescript
// Stores in database
await prisma.dataAnalysis.create({
  data: {
    contractAnalysisId: contractAnalysis.id,
    jobId,
    analysisMarkdown: dataResult.analysis_markdown,  // Used for markdown report
    dataTable: dataResult.data_table || [],          // Stored as JSON
    mulesoftResponse: dataResult,                    // Full response stored
  },
});
```

### Frontend (AnalysisDetails.tsx)
```typescript
// Sets analysis result
setAnalysisResult({
  status: data.status,
  analysisMarkdown: data.dataAnalysis.analysisMarkdown,  // Rendered as markdown
  dataTable: data.dataAnalysis.dataTable,                // Used for tables
  jsonData: data.dataAnalysis.mulesoftResponse?.jsonData // Used for dashboard
});
```

### UI Components

The frontend displays:

1. **Compliance Score Card** - Large prominent display of `jsonData.compliance_score`
2. **Validation Summary Grid** (4 cards)
   - Matched Products: `jsonData.validation_summary.matched_products.length`
   - Missing Products: `jsonData.validation_summary.missing_products.length`
   - Quantity Issues: `jsonData.validation_summary.quantity_discrepancies.length`
   - Pricing Issues: `jsonData.validation_summary.pricing_issues.length`
3. **Contract Terms** - Bulleted list of `jsonData.contract_summary.terms`
4. **Quantity Discrepancies Table** - Detailed table showing expected vs actual quantities
5. **Anomalies Section** - Cards showing each anomaly with explanation and cause
6. **Recommendations** - Numbered list of `jsonData.recommendations`
7. **Full Markdown Report** - Renders `analysis_markdown` as formatted HTML
8. **PDF Export** - Combines all sections into downloadable PDF

## Example Usage

### Minimal Valid Response

```json
{
  "status": "SUCCEEDED",
  "analysis_markdown": "# Analysis Report\n\nBasic content...",
  "data_table": [],
  "jsonData": {
    "contract_summary": {
      "document": "contract.pdf",
      "terms": [],
      "products_reference": []
    },
    "validation_summary": {
      "matched_products": [],
      "missing_products": [],
      "over_limit_products": [],
      "quantity_discrepancies": [],
      "pricing_issues": [],
      "term_violations": []
    },
    "anomalies_detected": [],
    "compliance_score": "100%",
    "recommendations": []
  }
}
```

## Error Response

If processing fails:

```json
{
  "status": "FAILED",
  "error": "Error message describing what went wrong",
  "analysis_markdown": "",
  "data_table": [],
  "jsonData": {}
}
```

## Notes

- All fields should be present even if empty (use empty arrays `[]` or empty strings `""`)
- `analysis_markdown` should be well-formatted Markdown
- `compliance_score` should include the `%` symbol (e.g., "80%", not just 80)
- `data_table` is currently unused but kept for backward compatibility
- MuleSoft retrieves files by `jobId` from the database
- The contract result is provided in the request body for context

## Validation Checklist

When implementing the MuleSoft API, ensure:

- ✅ `status` is always present (`"SUCCEEDED"`, `"FAILED"`, or `"PROCESSING"`)
- ✅ `analysis_markdown` contains a comprehensive Markdown report
- ✅ `jsonData.compliance_score` is a string with percentage (e.g., "80%")
- ✅ All arrays exist even if empty (don't omit them)
- ✅ `quantity_discrepancies` objects have all three fields: `product`, `expected`, `actual`
- ✅ `anomalies_detected` objects have all three fields: `issue`, `explanation`, `possible_cause`
- ✅ Response is valid JSON (no trailing commas, proper escaping)
