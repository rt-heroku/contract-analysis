# Try-Catch-Finally Refactoring Specification

## Problem Statement

The current Try-Catch-Finally implementation uses a single node with three output handles (try, catch, finally), which is semantically incorrect. The "finally" path is not an alternative - it's a convergence point that ALWAYS executes.

## Correct Flow Semantics

### Execution Rules:
1. **Try Block** - Executes first, always
2. **Catch Block** - Executes ONLY if Try throws an error (conditional)
3. **Finally Block** - ALWAYS executes, regardless of success or error (convergence)

### Key Principle:
**Finally is not a third path - it's where success and error paths converge**

## Proposed Implementation

### Option A: Three Separate Node Types (Recommended)

#### 1. Try Block Node
```typescript
type: 'tryBlock'
icon: ShieldAlert (or Box with T)
color: #3b82f6 (blue)

Handles:
- Input: 1 (from previous action)
- Output Success: 1 (bottom center) → connects to next action OR Finally
- Output Error: 1 (right side) → connects to Catch block
```

**Config:**
```json
{
  "errorVariable": "error",
  "captureStackTrace": true
}
```

**Visual:**
```
┌──────────────────┐
│   🛡️ Try Block   │
│                  │
│  [Region Start]  │
└────┬────────┬────┘
     │        │
  success   error
```

#### 2. Catch Block Node
```typescript
type: 'catchBlock'
icon: AlertOctagon
color: #ef4444 (red)

Handles:
- Input: 1 (from Try error handle)
- Output: 1 (bottom) → connects to Finally block
```

**Config:**
```json
{
  "errorTypes": ["all", "ValidationError", "SystemError"],
  "logError": true,
  "errorVariable": "error"
}
```

**Visual:**
```
┌──────────────────┐
│  ⚠️ Catch Block  │
│                  │
│ Handle Error     │
└────────┬─────────┘
         │
    (to Finally)
```

#### 3. Finally Block Node
```typescript
type: 'finallyBlock'
icon: CheckCircle or RefreshCw
color: #8b5cf6 (purple)

Handles:
- Input: 2 or more (accepts from Try success AND Catch output)
- Output: 1 (bottom) → continues flow
```

**Config:**
```json
{
  "alwaysExecute": true,
  "cleanupActions": []
}
```

**Visual:**
```
┌──────────────────┐
│ 🔄 Finally Block │
│                  │
│  Always Runs     │
└────────┬─────────┘
         │
     (continue)
```

### Connection Rules

1. **Try → Success Path:**
   - Can connect directly to Finally
   - Can connect to other actions first, then to Finally
   - Must eventually reach Finally (validation)

2. **Try → Error Path:**
   - MUST connect to a Catch block
   - Cannot skip Catch and go to Finally directly

3. **Catch → Output:**
   - MUST connect to Finally block
   - Cannot continue without Finally

4. **Finally → Output:**
   - Can connect to any action
   - Can connect to End node
   - Represents the convergence point

### Visual Grouping

Add visual container/region styling:

```
╔═══════════════════════════════════════╗
║  TRY-CATCH-FINALLY REGION             ║
╠═══════════════════════════════════════╣
║                                       ║
║   ┌──────────────┐                   ║
║   │  Try Block   │                   ║
║   └───┬──────┬───┘                   ║
║       │      │                        ║
║    success  error                     ║
║       │      └──────────┐             ║
║       │                 ▼             ║
║       │          ┌──────────────┐    ║
║       │          │ Catch Block  │    ║
║       │          └──────┬───────┘    ║
║       └─────────┬───────┘             ║
║                 ▼                     ║
║          ┌──────────────┐            ║
║          │Finally Block │            ║
║          └──────┬───────┘            ║
╚═════════════════╬═══════════════════╝
                  │
                  ▼
```

## Implementation Steps

### Phase 1: Backend - New Action Definitions

1. Remove current `try_catch_finally` action
2. Create three new actions:
   - `try_block`
   - `catch_block`
   - `finally_block`

### Phase 2: Frontend - Custom Node Components

1. Create `TryBlockNode.tsx`
2. Create `CatchBlockNode.tsx`
3. Create `FinallyBlockNode.tsx`

Each component should:
- Have appropriate icons and colors
- Show region boundaries
- Have correct handle positions
- Display configuration summary

### Phase 3: Validation Logic

Add process validation rules:
- Try block must have a Catch block connected to error handle
- Catch block must connect to Finally block
- Finally block must be present if Try block exists
- Detect orphaned blocks

### Phase 4: Execution Engine

Update process executor to:
1. Recognize Try-Catch-Finally regions
2. Execute Try block first
3. On error: execute Catch, then Finally
4. On success: execute Finally directly
5. Continue after Finally completes

## Alternative: Nested Scope Approach

### Concept:
Instead of separate nodes, use scope markers:

```
┌─────────────────────────────────────────┐
│  Try-Catch-Finally (Scope Container)    │
├─────────────────────────────────────────┤
│                                         │
│  Try Actions: [action1, action2, ...]  │
│                                         │
│  Catch Actions: [catchAction1, ...]    │
│                                         │
│  Finally Actions: [finallyAction, ...] │
│                                         │
└─────────────────────────────────────────┘
```

**Pros:**
- Single node in UI
- Clearer scope boundaries
- Easier to move/copy entire block

**Cons:**
- More complex UI for nested actions
- Harder to visualize flow
- Less flexible

## Recommendation

**Implement Option A (Three Separate Nodes)** because:
1. ✅ Visual clarity - shows actual flow
2. ✅ Explicit connections - easy to understand
3. ✅ Flexible - can insert actions between blocks
4. ✅ Familiar - similar to standard flowchart patterns
5. ✅ Easy validation - check connections
6. ✅ Extensible - can add more error handling patterns

## Migration Strategy

### For Existing Processes

1. Detect old `try_catch_finally` nodes
2. Show migration prompt
3. Auto-convert:
   - Create Try block at same position
   - Create Catch block to the right
   - Create Finally block below
   - Connect appropriately
   - Copy configuration

### Backward Compatibility

- Keep old action in database for existing processes
- Mark as deprecated
- Show warning in UI
- Provide "Upgrade" button

## UI Considerations

### Action Palette

Group under "Error Handling":
```
Error Handling
  ├─ Try Block
  ├─ Catch Block
  ├─ Finally Block
  ├─ Raise Error
  └─ Retry
```

### Drag & Drop Behavior

**Option 1: Individual Nodes**
- User drags Try, Catch, Finally separately
- User connects manually

**Option 2: Smart Template (Recommended)**
- User drags "Try-Catch-Finally"
- System creates all 3 nodes pre-connected
- User can then modify connections

### Visual Feedback

- Highlight matching blocks on hover
- Show region boundaries when selected
- Validate connections in real-time
- Show warnings for incomplete structures

## Testing Checklist

- [ ] Try block executes successfully
- [ ] Catch block executes only on error
- [ ] Finally block ALWAYS executes
- [ ] Multiple inputs to Finally work correctly
- [ ] Error propagation works
- [ ] Validation catches invalid configurations
- [ ] Migration from old format works
- [ ] Visual grouping displays correctly
- [ ] Execution logs show correct flow

## Example Flows

### Example 1: Database Transaction

```
Try Block
  ├─ Begin Transaction
  ├─ Insert Record
  └─ Update Related Record
     │
     ├─ (success) → Finally Block → Commit Transaction
     │
     └─ (error) → Catch Block → Log Error → Finally Block → Rollback Transaction
```

### Example 2: File Processing

```
Try Block
  ├─ Open File
  └─ Process Data
     │
     ├─ (success) → Finally Block → Close File → Save Results
     │
     └─ (error) → Catch Block → Log Error → Notify Admin → Finally Block → Close File
```

### Example 3: API Call with Retry

```
Try Block
  └─ Call External API
     │
     ├─ (success) → Finally Block → Log Success → Continue
     │
     └─ (error) → Catch Block → Retry Logic → Finally Block → Log Attempt → Continue
```

## Future Enhancements

1. **Nested Try-Catch:**
   - Support Try blocks within Catch blocks
   - Visual indentation for nesting

2. **Specific Catch Types:**
   - Catch ValidationError
   - Catch NetworkError
   - Multiple Catch blocks for different error types

3. **Conditional Finally:**
   - Finally executes based on condition
   - Different cleanup for success vs. error

4. **Transaction Support:**
   - Explicit Begin/Commit/Rollback markers
   - Automatic rollback on error

## Conclusion

Refactoring Try-Catch-Finally into three separate nodes provides:
- **Semantic Correctness**: Properly represents flow semantics
- **Visual Clarity**: Easy to understand execution path
- **Flexibility**: Can insert actions anywhere in the flow
- **Maintainability**: Easier to debug and modify

This change aligns with industry-standard flowchart conventions and makes the error handling flow explicit and unambiguous.

