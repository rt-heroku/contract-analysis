# Fill Space Property - Complete Guide

## What is Fill Space?

`fillSpace` is a flexbox property that makes a component **expand to fill available space** in its parent container.

- **fillSpace = Yes** → Component grows to fill remaining space
- **fillSpace = No** → Component only takes space it needs

## ⚠️ Critical Requirements

For `fillSpace` to work, **ALL** of these must be true:

### 1. Parent Must Use Flexbox
The **parent container** must have:
- `display: flex` (automatic in Container, Columns, Column)
- A `flexDirection` set (row or column)

### 2. Parent Must Have Defined Size
The parent needs a **specific height or width**:
- **For vertical fill** (flexDirection: column): Parent needs `height` (e.g., `600px`, `100vh`)
- **For horizontal fill** (flexDirection: row): Parent needs `width` (e.g., `100%`, `800px`)

### 3. Sibling Components
Works best when there are **multiple children** in the parent, where some have `fillSpace: Yes` and others don't.

---

## How It Works

### The CSS Behind It

```css
/* fillSpace = Yes */
flex: 1 1 0%;
/* grow: 1 (will expand)
   shrink: 1 (will shrink if needed)
   basis: 0% (start from zero size) */

/* fillSpace = No */
flex: 0 1 auto;
/* grow: 0 (won't expand)
   shrink: 1 (can shrink if needed)
   basis: auto (use natural size) */
```

---

## ✅ Working Examples

### Example 1: Sidebar Layout (Horizontal)

```
Parent Container
├─ width: 100%
├─ height: 600px
├─ flexDirection: row
├─ Children:
│   ├─ Container (Sidebar)
│   │   ├─ fillSpace: No
│   │   └─ width: 200px
│   │
│   └─ Container (Main Content)
│       ├─ fillSpace: Yes  ✅
│       └─ Fills remaining space!
```

**Steps to Create:**
1. Add Container to canvas
2. Set: `width: 100%`, `height: 600px`, `flexDirection: row`
3. Add Container inside (Sidebar):
   - `fillSpace: No`
   - `width: 200px`
4. Add another Container inside (Content):
   - `fillSpace: Yes` ✨
   - **Result**: Content fills the rest!

---

### Example 2: Header/Content/Footer (Vertical)

```
Parent Container
├─ width: 100%
├─ height: 100vh
├─ flexDirection: column
├─ Children:
│   ├─ Container (Header)
│   │   ├─ fillSpace: No
│   │   └─ height: auto (content height)
│   │
│   ├─ Container (Main)
│   │   ├─ fillSpace: Yes  ✅
│   │   └─ Fills remaining space!
│   │
│   └─ Container (Footer)
│       ├─ fillSpace: No
│       └─ height: auto (content height)
```

**Steps to Create:**
1. Add Container to canvas
2. Set: `width: 100%`, `height: 100vh`, `flexDirection: column`
3. Add 3 Containers inside:
   - Header: `fillSpace: No`
   - Main: `fillSpace: Yes` ✨
   - Footer: `fillSpace: No`
4. **Result**: Main content fills space between header/footer!

---

### Example 3: Two-Column Equal Split

```
Parent Container
├─ width: 100%
├─ height: 600px
├─ flexDirection: row
├─ Children:
│   ├─ Column 1: fillSpace: Yes  ✅
│   └─ Column 2: fillSpace: Yes  ✅
│       Both fill 50% each!
```

**Steps to Create:**
1. Add Container to canvas
2. Set: `width: 100%`, `height: 600px`, `flexDirection: row`
3. Add 2 Containers inside:
   - Both: `fillSpace: Yes`
4. **Result**: Each takes 50% of space!

---

## ❌ Common Mistakes

### Mistake 1: Parent Has No Defined Size

```
❌ Parent Container
├─ height: auto  ← Problem!
└─ Child: fillSpace: Yes  (Won't work)
```

**Why it fails:** `auto` height means "fit content". There's no "extra" space to fill.

**Fix:**
```
✅ Parent Container
├─ height: 600px  ← Fixed size!
└─ Child: fillSpace: Yes  (Works!)
```

---

### Mistake 2: Only One Child with fillSpace

```
❌ Parent Container
└─ Single Child: fillSpace: Yes
    (Nothing to contrast with)
```

**Why it's confusing:** Child will fill space, but it's not obvious since there are no other children.

**Better:**
```
✅ Parent Container
├─ Child 1: fillSpace: No, height: 100px
└─ Child 2: fillSpace: Yes
    (Clearly fills remaining space)
```

---

### Mistake 3: Using fillSpace on Root Canvas

```
❌ Component on canvas root
└─ fillSpace: Yes  (Won't work)
```

**Why it fails:** The canvas root has `height: auto`, so there's no space to fill.

**Fix:** Create a parent container with defined height first:
```
✅ Container (height: 600px)
└─ Child: fillSpace: Yes  (Works!)
```

---

## 📐 Root Canvas Setup

The Page Builder root canvas is set to:
```
width: 100%
height: 100vh  (full viewport height)
flexDirection: column
```

This means:
- **Vertical fillSpace works** ✅
- Components can fill vertical space
- First-level containers can use `fillSpace: Yes`

---

## 🧪 Testing fillSpace

### Quick Test (Horizontal):

1. **Add Container** to canvas
   - `width: 100%`
   - `height: 400px`
   - `flexDirection: row`
   - `background: #f3f4f6` (to see it)

2. **Add Button** inside
   - `fillSpace: No`
   - Default size

3. **Add Container** inside (after button)
   - `fillSpace: Yes`
   - `background: #dbeafe` (blue to see it)

4. **Result**: Blue container fills remaining horizontal space! ✅

---

### Quick Test (Vertical):

1. **Add Container** to canvas
   - `width: 100%`
   - `height: 600px`
   - `flexDirection: column`
   - `background: #f3f4f6`

2. **Add Text** at top
   - "Header"
   - `fillSpace: No`

3. **Add Container** below
   - `fillSpace: Yes`
   - `background: #dcfce7` (green to see it)

4. **Add Text** at bottom
   - "Footer"
   - `fillSpace: No`

5. **Result**: Green container fills space between header and footer! ✅

---

## 💡 Pro Tips

### Tip 1: Use Backgrounds for Debugging
Always add background colors when testing fillSpace so you can **see** what's happening:
```
Container 1: background: #dbeafe (blue)
Container 2: background: #dcfce7 (green)
```

### Tip 2: Multiple fillSpace Components Split Space
If you have 2 components with `fillSpace: Yes`, they split equally:
```
Parent: 600px height
├─ Child 1: fillSpace: Yes → Gets 300px
└─ Child 2: fillSpace: Yes → Gets 300px
```

### Tip 3: Fixed + Fill = Perfect Layouts
Combine fixed-size and fill-space components:
```
├─ Header: 60px (fixed)
├─ Content: fillSpace: Yes (fills rest)
└─ Footer: 40px (fixed)
```

### Tip 4: Nested fillSpace Works!
You can nest containers with fillSpace:
```
Parent Container (height: 600px, fillSpace: Yes)
└─ Child Container (fillSpace: Yes)
    └─ Grandchild (fillSpace: Yes)
```

---

## 🔍 Troubleshooting

### "fillSpace doesn't do anything"

Check:
1. ✅ Is parent a flexbox? (Container/Column are by default)
2. ✅ Does parent have defined height (for vertical) or width (for horizontal)?
3. ✅ Are there other siblings to contrast with?
4. ✅ Is flexDirection set on parent?

### "All children have fillSpace but nothing changes"

This is expected! When **all** children have `fillSpace: Yes`, they **split space equally**. Try:
- Set one to `fillSpace: No` with fixed size
- The others will fill remaining space

### "fillSpace makes component too small"

This can happen if:
- Multiple siblings all have `fillSpace: Yes`
- They're splitting available space

Fix:
- Use `fillSpace: No` on some
- Or set `minHeight`/`minWidth` on the component

---

## 📊 Quick Reference

| Scenario | Parent Height | flexDirection | fillSpace Works? |
|----------|---------------|---------------|------------------|
| Vertical fill | Defined (600px, 100vh) | column | ✅ Yes |
| Vertical fill | auto | column | ❌ No |
| Horizontal fill | Any | row | ✅ Yes (if parent has width) |
| Root canvas | 100vh | column | ✅ Yes |
| Nested containers | Defined | any | ✅ Yes |

---

## 🎯 Real-World Layouts

### Dashboard Layout
```
Root Container (100vh, column)
├─ Header (No fill, 60px)
├─ Main Content (fillSpace: Yes) ✨
│   └─ Row Container (100%, row)
│       ├─ Sidebar (No fill, 250px)
│       └─ Content (fillSpace: Yes) ✨
└─ Footer (No fill, 40px)
```

### Card Grid with Variable Heights
```
Container (row)
├─ Card 1 (No fill, width: 300px)
├─ Card 2 (fillSpace: Yes) ✨
└─ Card 3 (No fill, width: 300px)
```

### Form with Expanding Textarea
```
Container (column, height: 400px)
├─ Input fields (No fill, auto height)
├─ Textarea (fillSpace: Yes) ✨
└─ Submit button (No fill, auto height)
```

---

## ✅ Summary

**fillSpace = Yes** makes a component **expand to fill remaining space** in its parent.

**Requirements:**
1. Parent uses flexbox (Container/Column/Columns)
2. Parent has defined size
3. Works best with sibling components

**Test it now:**
Create a Container with `height: 400px`, add two child Containers, set one to `fillSpace: Yes`, and watch it fill the space! 🎉

