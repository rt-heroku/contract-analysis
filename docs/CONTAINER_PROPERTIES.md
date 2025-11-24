# Container Component - Complete Property Reference

## Overview

The **Container** component is the most versatile component in the Page Builder. It's used to create layouts, sections, and organize other components. In the screenshot you saw, "App" is simply a Container with a custom name.

## All Available Properties

### 📐 Dimensions

Control the size of your container:

- **Width**: Any CSS value (e.g., `auto`, `100%`, `800px`, `50vw`)
- **Height**: Any CSS value (e.g., `auto`, `100%`, `500px`, `50vh`)

**Use Cases:**
- `width: 100%` - Full width container
- `width: 800px` - Fixed width (like in the screenshot)
- `height: 100vh` - Full viewport height

---

### 🎨 Colors

Style the appearance:

- **Background**: Any CSS color (e.g., `transparent`, `#ffffff`, `rgb(59, 130, 246)`)
- **Text Color**: Any CSS color (e.g., `inherit`, `#000000`, `rgb(255, 255, 255)`)

**Use Cases:**
- `background: #f3f4f6` - Light gray background
- `background: linear-gradient(to right, #3b82f6, #8b5cf6)` - Gradient background
- `textColor: #ffffff` - White text on dark backgrounds

---

### 📏 Margin (Individual Sides)

Space **outside** the container (0-100px each side):

- **Margin Top**: Space above the container
- **Margin Right**: Space to the right
- **Margin Bottom**: Space below
- **Margin Left**: Space to the left

**Display Format**: Shows as `10px 20px 10px 20px` (top, right, bottom, left)

**Use Cases:**
- Center horizontally: Set left/right margins to create spacing
- Separate sections: Add bottom margin between containers
- Offset layouts: Use different margins on each side

---

### 📦 Padding (Individual Sides)

Space **inside** the container (0-80px each side, slider 0-20 × 4):

- **Padding Top**: Space from top edge to content
- **Padding Right**: Space from right edge to content
- **Padding Bottom**: Space from bottom edge to content
- **Padding Left**: Space from left edge to content

**Display Format**: Shows as `40px 40px 40px 40px` (top, right, bottom, left)

**Use Cases:**
- `40px all sides` - Comfortable spacing (like in screenshot)
- `20px top/bottom, 40px left/right` - Wide but short padding
- `0px` - No padding (edge-to-edge content)

---

### ✨ Decoration

Visual styling:

#### Border Radius (0-50px)
- Rounds the corners of the container
- **0px** = Sharp corners
- **8px** = Slightly rounded
- **16px** = Moderately rounded
- **50px** = Very rounded (pill shape if small container)

#### Box Shadow (0-4 levels)
- **None** (0): No shadow
- **Small** (1): Subtle shadow `0 1px 3px`
- **Medium** (2): Standard shadow `0 4px 6px`
- **Large** (3): Pronounced shadow `0 10px 15px`
- **Extra Large** (4): Dramatic shadow `0 20px 25px`

**Use Cases:**
- Cards: `borderRadius: 8px` + `boxShadow: 2`
- Modals: `borderRadius: 12px` + `boxShadow: 4`
- Sections: `borderRadius: 0` + `boxShadow: 0`

---

### 🧭 Alignment (Flexbox)

Control how child components are arranged:

#### Flex Direction
- **Row**: Children arranged horizontally →
- **Column**: Children arranged vertically ↓

#### Fill Space
- **Yes**: Container expands to fill available space (flex: 1)
- **No**: Container only takes space it needs

#### Align Items (Cross-axis alignment)
How children align perpendicular to flex direction:

| Direction | Flex Start | Center | Flex End |
|-----------|-----------|--------|----------|
| **Row** | Top | Middle | Bottom |
| **Column** | Left | Center | Right |

#### Justify Content (Main-axis alignment)
How children are distributed along flex direction:

- **Flex Start**: Packed at the start
- **Center**: Centered in container
- **Flex End**: Packed at the end
- **Space Between**: Even spacing, no edge gaps
- **Space Around**: Even spacing, including edges

---

## Example Configurations

### 1. Hero Section (Full Width)
```
Dimensions: 100% × auto
Background: linear-gradient(to right, #3b82f6, #8b5cf6)
Text Color: #ffffff
Padding: 80px all sides
Flex Direction: Column
Align Items: Center
Justify Content: Center
```

### 2. Content Card (Like Screenshot)
```
Dimensions: 800px × auto
Background: #ffffff
Margin: 20px all sides
Padding: 40px all sides
Border Radius: 8px
Box Shadow: Medium
Flex Direction: Column
Align Items: Flex start
```

### 3. Sidebar Container
```
Dimensions: 300px × 100vh
Background: #f3f4f6
Padding: 20px all sides
Flex Direction: Column
Fill Space: Yes
Justify Content: Flex start
```

### 4. Button Row
```
Dimensions: 100% × auto
Padding: 16px horizontal, 8px vertical
Flex Direction: Row
Align Items: Center
Justify Content: Flex end
```

### 5. Image Gallery Grid
```
Dimensions: 100% × auto
Padding: 40px all sides
Flex Direction: Row
Justify Content: Space between
```

---

## Tips & Tricks

### 1. **Nested Containers**
Use containers inside containers for complex layouts:
- Outer container: Page section (full width, vertical)
- Inner container: Content area (fixed width, centered)

### 2. **Flexbox Magic**
Combine flexbox properties for powerful layouts:
- **Center everything**: Column direction + Center align + Center justify
- **Header layout**: Row direction + Center align + Space between justify
- **Sidebar layout**: Parent uses Row, sidebar uses fillSpace: No, content uses fillSpace: Yes

### 3. **Responsive Design**
Use percentages and viewport units:
- `width: 90%` instead of fixed pixels
- `maxWidth: 1200px` to cap width
- `height: 100vh` for full-height sections

### 4. **Visual Hierarchy**
- Use shadows and rounded corners for depth
- Lighter backgrounds for less important sections
- Darker backgrounds + white text for emphasis

### 5. **Spacing System**
Keep consistent spacing:
- **Small**: 8px (2 × 4)
- **Medium**: 16px (4 × 4)
- **Large**: 32px (8 × 4)
- **Extra Large**: 64px (16 × 4)

---

## Common Patterns

### Card Pattern
```
Container (column, centered)
├─ Image
├─ Container (padding: 16px)
│  ├─ Heading
│  ├─ Text
│  └─ Button
```

### Split Layout
```
Container (row, stretch)
├─ Container (fillSpace: Yes, column)
│  └─ Left content
└─ Container (fillSpace: Yes, column)
   └─ Right content
```

### Header + Content + Footer
```
Container (column, 100vh)
├─ Container (row, no fill) - Header
├─ Container (column, fillSpace: Yes) - Main content
└─ Container (row, no fill) - Footer
```

---

## Troubleshooting

**Q: My container isn't showing up!**
- Add a background color or border
- Ensure it has children or minimum height
- Check if parent has space available

**Q: Flexbox not working as expected?**
- Verify flex direction matches your intent
- Check if children have fixed sizes that prevent flexibility
- Try fillSpace: Yes on the container

**Q: Margins collapsing?**
- Margins can collapse between siblings
- Use padding instead for internal spacing
- Or wrap in another container

**Q: Why doesn't my container center?**
- Container must have a defined width less than parent
- Parent must use flex with justify-content: center
- Or use margin: 0 auto with block display

---

## Comparison with "App" in Screenshot

The "App" component you saw is simply a Container with:
- Custom display name ("App" instead of "Container")
- Width: 800px
- Margin: Some space around it
- Padding: 40px on all sides
- Flex Direction: Column
- Other alignment settings as needed

You can recreate this exact setup:
1. Drag a Container to the canvas
2. In Settings Panel → Dimensions: Set width to `800px`
3. In Settings Panel → Padding: Set all sides to `10` (40px)
4. In Settings Panel → Alignment: Set as needed

That's it! 🎉

---

*Remember: The Container is your most powerful tool. Master it, and you can build any layout you imagine!*

