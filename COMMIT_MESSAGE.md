feat(idp): Implement intelligent multi-page IDP response merging

Added comprehensive merge utility that intelligently combines IDP data
from multiple pages according to business rules:

**Field Merging**:
- Use non-null values from any page
- Don't repeat same values across pages
- Concatenate different values with newline
- Recursively merge nested objects (e.g., parties)

**Table Merging**:
- Merge rows if columns match across pages
- Create separate tables if columns differ

**Updated Components**:
- PurchaseOrderRenderer: Dynamic table rendering for merged data
- GenericIDPRenderer: Info banner for multi-page documents
- ContractRenderer: Proper handling of merged nested data

**Files Changed**:
- frontend/src/utils/idpMerger.ts (new)
- frontend/src/utils/idpMerger.test.ts (new)
- frontend/src/components/idp/PurchaseOrderRenderer.tsx
- frontend/src/components/idp/GenericIDPRenderer.tsx
- frontend/src/components/idp/ContractRenderer.tsx
- docs/IDP_MULTIPAGE_MERGER.md (new)
- docs/MULTIPAGE_IDP_IMPLEMENTATION_SUMMARY.md (new)
- demo-idp-merger.js (new)

**Testing**:
- Comprehensive test suite with 6+ test cases
- Demo script validates with user-provided example
- All renderers backward compatible

**Impact**:
- Complete data extraction from all pages
- No data loss from multi-page documents
- Improved user experience with clear feedback

