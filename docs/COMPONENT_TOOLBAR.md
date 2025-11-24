# Component Toolbar Guide

## Overview

When you select a component in the page builder, a **blue toolbar** appears above it with quick action buttons.

## Toolbar Features

### Component Name Badge
- Shows the **name** of the selected component (e.g., "Text", "Button", "Container")
- Includes a **move icon** (⋮⋮) indicating you can drag the component

### Action Buttons

#### 1. **Move Up** ↑
- Moves the component **up** in the order within its parent
- Useful for reordering components

#### 2. **Move Down** ↓
- Moves the component **down** in the order within its parent
- Useful for reordering components

#### 3. **Duplicate** 📋
- **Copies** the selected component
- Creates an exact duplicate with all properties
- Places the copy right after the original

#### 4. **Delete** 🗑️
- **Removes** the component from the page
- Only appears if the component can be deleted
- Root container cannot be deleted

## Visual Indicators

### Selection Ring
When a component is selected, it shows a **blue ring** around it:
- **Light mode**: Primary blue ring
- **Dark mode**: Lighter blue ring for better visibility

### Hover Effect
When hovering over a draggable component:
- **Dashed outline** appears
- **Move cursor** is shown
- Indicates the component can be dragged

## Keyboard Shortcuts (Future Feature)

These could be added:
- `Del` or `Backspace` - Delete selected component
- `Cmd/Ctrl + D` - Duplicate selected component
- `Cmd/Ctrl + ↑` - Move up
- `Cmd/Ctrl + ↓` - Move down

## Tips & Tricks

### 1. Quick Duplication
To create multiple similar components:
1. Style one component completely
2. Click **Duplicate** button
3. Adjust the copy as needed
4. Repeat!

### 2. Reordering Made Easy
Instead of dragging components around:
1. Select the component
2. Use **↑** or **↓** buttons to reorder
3. Faster for small movements!

### 3. Nested Components
When working with containers:
1. Select the **parent** container
2. The toolbar shows container actions
3. Click on a **child** component to work with it specifically

### 4. Toolbar Always Follows
The toolbar is **positioned above** the selected component and stays visible even when scrolling.

## Troubleshooting

### Toolbar Not Appearing?
- Make sure the component is **selected** (should have blue ring)
- Try clicking the component again
- Check if you're in **Edit mode** (not Preview)

### Can't Move Component?
- Some components are locked to specific positions
- Root containers cannot be moved
- Try duplicating instead

### Delete Button Missing?
- Some essential components (like the root Container) cannot be deleted
- This is by design to prevent breaking the page

## Integration with Settings Panel

The toolbar works alongside the **Settings Panel**:
- **Toolbar** = Quick actions (move, duplicate, delete)
- **Settings Panel** = Detailed properties (text, colors, sizes)

Use both together for maximum productivity!

---

## Example Workflow

**Creating a 3-Column Layout with Cards:**

1. Drag **Columns** component to canvas
2. Select Columns → Use toolbar to set 3 columns in Settings
3. Drag **CraftCard** into first column
4. Style the card in Settings Panel
5. Click card → Press **Duplicate** button (in toolbar)
6. Drag duplicate to second column
7. Press **Duplicate** again
8. Drag to third column
9. Done! 🎉

This is much faster than dragging 3 separate cards!

