# Icon Upload Feature - Implementation Plan

## Completed in this session:
✅ Search functionality in action palette
✅ Icon display (lucide icons for system actions)  
✅ GlobalErrorNode matching StartNode design
✅ Canvas container size fix
✅ Duplicate actions bug fix (rest_3, database_4)
✅ On Error handle positioning fix

## Remaining: Icon Upload

### Database Schema (Already exists)
- Connector.iconUrl (String?)
- Action.iconUrl (String?)

### Implementation Needed:
1. **File Upload Component** - Reusable for connectors + actions
2. **Connectors Page** - Add icon upload field
3. **Actions Page** - Add icon upload field for user actions
4. **Storage** - Base64 data URLs in database
5. **Display** - Already working (iconUrl support exists)

### Files to Modify:
- `/frontend/src/components/common/IconUpload.tsx` (NEW)
- `/frontend/src/pages/Connectors.tsx` (ADD upload field)
- `/frontend/src/pages/Actions.tsx` (ADD upload field)
- `/backend/src/services/connector.service.ts` (accept iconUrl)
- `/backend/src/services/action.service.ts` (accept iconUrl)

### User Experience:
1. Click "Upload Icon" button
2. Select image file (PNG, JPG, SVG)
3. Preview appears
4. Save to store as base64
5. Icon shows in palette and designer

This feature will be implemented in the next session.
