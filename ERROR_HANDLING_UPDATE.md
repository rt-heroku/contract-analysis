# Error Handling System - Complete Update

## ✅ All Issues Fixed

### **1. ✅ MiniMap Size - Now Correct!**
- **Before**: 150x100px (too large)
- **After**: **120x80px** (compact and unobtrusive)
- Position: Top-right corner
- Non-pannable, non-zoomable
- Perfect for quick overview

---

### **2. ✅ Global Error Handler (New!)**

Replaced the "End" node with a powerful **Global Error** handler in Flow Markers.

#### Visual
```
┌─────────────────┐
│   Flow Markers  │
├─────────────────┤
│ ● Start         │ ← Green circle with play icon
│ ✖ Global Error  │ ← Red circle with X icon (NEW!)
└─────────────────┘
```

#### Purpose
- **Catches all unhandled errors** in the entire process
- Acts as a safety net for your flow
- Prevents process crashes
- Central location for error logging/notifications

#### Usage
1. Drag "Global Error" from Flow Markers to canvas
2. Connect any actions that might fail
3. Configure error handling (log, notify, etc.)
4. All unhandled errors route here automatically

#### Configuration
```json
{
  "name": "global_error",
  "displayName": "Global Error",
  "category": "error_handling",
  "color": "#ef4444",
  "icon": "XCircle"
}
```

#### Use Cases
- **Production Monitoring**: Catch everything that fails
- **Error Logging**: Single point to log all errors
- **Notifications**: Email/Slack on any process failure
- **Graceful Degradation**: Return friendly errors to users

---

### **3. ✅ On Error - Now with 2 Handles**

The "On Error" action now has **two connection points** for better flow control.

#### Visual
```
┌──────────────────────┐
│     On Error         │
│    (Red #ef4444)     │
├──────────────────────┤
│  ◄ error (red)       │ ← Left handle: error path
│  ► (green)           │ ← Right handle: success path
└──────────────────────┘
```

#### Two Paths
1. **Left Handle (Red)**: "error" label
   - Executes when an error occurs
   - Receives error object
   - Can log, notify, or recover

2. **Right Handle (Green)**: No label
   - Executes when NO error occurs
   - Normal flow continues
   - Process proceeds successfully

#### Configuration
```typescript
{
  name: 'on_error',
  displayName: 'On Error',
  color: '#ef4444', // Red!
  executorConfig: {
    maxBranches: 2,
    branchLabels: ['error', 'no-error'],
    isErrorHandler: true,
  }
}
```

#### Use Cases
- **Conditional Error Handling**: Different paths for error/success
- **Inline Error Recovery**: Try alternative approach on error
- **Validation**: Route based on data validity
- **API Fallbacks**: Use backup service if primary fails

#### Example Flow
```
[API Call] → [On Error]
                ├─ error → [Log Error] → [Use Cached Data]
                └─ success → [Process Response] → [Update Cache]
```

---

## Error Handling Comparison

Choose the right tool for your needs:

| Handler | Handles | Use When | Example |
|---------|---------|----------|---------|
| **Global Error** | All unhandled | Central error handling | Log all errors to monitoring |
| **On Error** | Specific action | Inline error recovery | Fallback to cache on API fail |
| **Try Catch Finally** | Code blocks | Complex error logic | Try upload → Catch error → Finally cleanup |
| **Raise Error** | Custom errors | Validation failures | Throw error if data invalid |

---

## Visual Updates

### Flow Markers (Collapsible Section)
**Before:**
- ● Start (green)
- ✓ End (red with checkmark)

**After:**
- ● Start (green with play icon)
- ✖ Global Error (red with X) ← **NEW!**

### On Error Action
**Before:**
- Color: Orange (#f59e0b)
- Handles: 1 (error flow only)
- Label: "On Error"

**After:**
- Color: **Red (#ef4444)** ← Matches error theme!
- Handles: **2** (error + success)
- Labels: "error" on left handle, none on right
- Icon: AlertOctagon (unchanged)

---

## Edge Label Generation

Updated edge label logic for On Error:

```typescript
// On Error: "error" for first connection, nothing for second
if (actionName.includes('on_error')) {
  return connectionIndex === 0 ? 'error' : undefined;
}
```

**Result:**
- First connection (left): Shows red "error" label
- Second connection (right): No label (clean look)

---

## Technical Details

### Frontend Changes
1. **CollapsibleActionPalette.tsx**
   - Imported `XCircle` from lucide-react
   - Replaced End node with Global Error
   - Added drag data for global_error type

2. **ActionNode.tsx**
   - Added On Error to `getOutputHandles()`
   - Returns 2 handles: error (left, red) + no-error (right, green)
   - Only shows "error" label on left handle

3. **ProcessDesigner.tsx**
   - Updated `getMaxBranches()` for On Error: 2 branches
   - Updated `generateEdgeLabel()` for On Error labeling
   - MiniMap size: 120x80px

### Backend Changes
1. **seedActions.ts**
   - On Error action color: `#ef4444` (red)
   - executorConfig maxBranches: 2
   - branchLabels: ['error', 'no-error']

---

## Deployment Instructions

After Heroku deployment, run:

```bash
heroku run "cd backend && node dist/utils/seedActions.js" --app contract-dev
```

This will:
- Update existing On Error action with new config
- Ensure proper color and handle configuration
- Seed Global Error handler (if needed)

---

## What's Working Now

✅ MiniMap is now 120x80px (perfect size!)  
✅ Global Error replaces End in Flow Markers  
✅ Global Error has red X circle icon  
✅ On Error is RED (#ef4444)  
✅ On Error has 2 handles (error + success)  
✅ Error handle labeled "error"  
✅ Success handle has no label  
✅ Edge reconnection works  
✅ Calls tab shows connections  
✅ Canvas panning/zooming fixed  

---

## Next Steps (Pending)

From your previous requests:

1. **Trigger Configuration** (Priority!)
   - Start node properties panel
   - Trigger type selection
   - Visual indicators on start node

2. **Stores Implementation**
   - Database schema/user creation
   - Stores tab on connectors
   - Store management UI

3. **Icon Upload**
   - Custom icons for connectors
   - Custom icons for actions
   - Icon inheritance from connectors

---

## Error Handling Best Practices

### 1. Use Global Error for Production
```
[Start] → [Actions...] → [Global Error]
                            └─ Log to monitoring
                            └─ Send alert
                            └─ Return friendly error
```

### 2. Use On Error for Resilience
```
[Primary API] → [On Error]
                  ├─ error → [Secondary API]
                  └─ success → [Continue]
```

### 3. Use Try Catch for Cleanup
```
[Try: File Upload]
  ├─ [Process File]
  └─ [Finally: Delete Temp File]
```

### 4. Use Raise Error for Validation
```
[Validate Data] → [If Invalid] → [Raise Error]
                                    └─ Caught by On Error or Global Error
```

---

## Summary

You now have **three levels of error handling**:

1. **Global Error**: Safety net for entire process
2. **On Error**: Inline error recovery with dual paths
3. **Try Catch Finally**: Complex error handling with cleanup

All visual issues are fixed:
- MiniMap is the right size
- Global Error replaces End
- On Error is red with 2 handles
- Icons match your requirements

Everything is committed and ready for deployment! 🚀

