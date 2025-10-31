# Page Builder Guide

## Table of Contents
1. [Component Toolbar](#component-toolbar)
2. [Modal Functionality](#modal-functionality)
3. [Container Component](#container-component)
4. [Adding Properties to Components](#adding-properties-to-components)
5. [Creating Reusable Components](#creating-reusable-components)

---

## Component Toolbar

### Quick Actions Bar

When you select any component in the page builder, a **blue toolbar** appears above it with instant actions:

#### Toolbar Buttons:

- **Component Name Badge** - Shows the selected component type (e.g., "Text", "Button", "Container")
- **Move Up ↑** - Move the component earlier in the order within its parent
- **Move Down ↓** - Move the component later in the order within its parent
- **Duplicate 📋** - Create an exact copy of the component with all properties
- **Delete 🗑️** - Remove the component (only appears if deletable)

#### Features:

- **Auto-positioning**: The toolbar always appears above the selected component
- **Scroll tracking**: Follows the component even when scrolling
- **Smooth animations**: Fades in/out when selecting different components
- **Visual feedback**: Hover effects on all buttons

#### Tips:

1. **Quick Duplication**: Style one component perfectly, then duplicate it multiple times instead of styling each one
2. **Easy Reordering**: Use ↑/↓ buttons instead of dragging for small position changes
3. **Context Awareness**: The toolbar only shows delete button for components that can be deleted

See [COMPONENT_TOOLBAR.md](./COMPONENT_TOOLBAR.md) for detailed usage guide.

---

## Modal Functionality

### How the Modal Works

The modal now has **full close functionality** in preview mode:

- **X button** (top right) - Closes the modal
- **Cancel button** (footer) - Closes the modal  
- **Click outside** (on the overlay) - Closes the modal
- After closing, an **"Open Modal"** button appears to re-open it

### Modal Modes

1. **Editor Mode**: Modal displays inline without overlay (for editing)
2. **Preview Mode**: Modal displays with overlay and can be closed/reopened

---

## Container Component

### The Most Powerful Component

The **Container** is your most versatile building block. In the example screenshot you showed with "App", that's simply a Container component with extensive properties configured.

### What You Asked About: "App" vs Container

- **"App"** is just a Container with a custom name
- It has the same properties as any Container
- The extensive settings you saw are all available in our Container too!

### All Container Properties

Our Container now includes **all** the properties from that example:

#### 📐 Dimensions
- Width & Height (e.g., `800px × auto`)

#### 🎨 Colors
- Background color
- Text color

#### 📏 Margin (Individual Sides)
- Top, Right, Bottom, Left sliders
- Displays as: `0px 0px 0px 0px`

#### 📦 Padding (Individual Sides)
- Top, Right, Bottom, Left sliders
- Displays as: `40px 40px 40px 40px`

#### ✨ Decoration
- Border Radius (0-50px)
- Box Shadow (None, Small, Medium, Large, Extra Large)

#### 🧭 Alignment (Flexbox)
- **Flex Direction**: Row or Column
- **Fill Space**: Yes or No
- **Align Items**: Flex start, Center, Flex end
- **Justify Content**: Flex start, Center, Flex end

### Quick Examples

**Card Container (like in screenshot):**
```
Width: 800px
Background: #ffffff
Padding: 40px all sides
Border Radius: 8px
Shadow: Medium
Flex Direction: Column
```

**Full-Width Section:**
```
Width: 100%
Background: #f3f4f6
Padding: 60px all sides
Flex Direction: Column
Align Items: Center
```

**Button Row:**
```
Width: 100%
Flex Direction: Row
Align Items: Center
Justify Content: Flex end
```

### 📘 Complete Reference

For a **comprehensive guide** with all properties, use cases, patterns, and troubleshooting, see:

**[CONTAINER_PROPERTIES.md](./CONTAINER_PROPERTIES.md)** - Complete Container documentation

This includes:
- Detailed explanation of every property
- Visual examples and patterns
- Common layouts (hero section, cards, sidebars, grids)
- Flexbox alignment guide
- Spacing system
- Troubleshooting tips

---

## Adding Properties to Components

You can **add as many properties as you want** to any component! Here's how:

### Example: Adding Color Property to Text Component

**File**: `frontend/src/components/craft/Text.tsx`

#### Step 1: Add to Props Interface
```typescript
interface CraftTextProps {
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;           // NEW PROPERTY
  backgroundColor?: string; // NEW PROPERTY
  textAlign?: 'left' | 'center' | 'right';
  margin?: number;
}
```

#### Step 2: Use in Component
```typescript
export const CraftText: React.FC<CraftTextProps> = ({
  text = 'Text',
  fontSize = 16,
  fontWeight = 'normal',
  color = '#000000',       // NEW
  backgroundColor = 'transparent', // NEW
  textAlign = 'left',
  margin = 0,
}) => {
  // ... existing code ...
  
  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      style={{ 
        margin: `${margin * 4}px`,
        backgroundColor,  // NEW
      }}
    >
      <ContentEditable
        html={text}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight,
          color,  // NEW
          textAlign,
        }}
      />
    </div>
  );
};
```

#### Step 3: Add to Settings Panel
```typescript
const TextSettings: React.FC = () => {
  const {
    actions: { setProp },
    text,
    fontSize,
    color,           // NEW
    backgroundColor, // NEW
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    color: node.data.props.color,           // NEW
    backgroundColor: node.data.props.backgroundColor, // NEW
  }));

  return (
    <div className="space-y-4">
      {/* Existing settings ... */}
      
      {/* NEW: Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
          className="w-full h-10 rounded-lg cursor-pointer"
        />
      </div>

      {/* NEW: Background Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setProp((props: any) => (props.backgroundColor = e.target.value))}
          className="w-full h-10 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
```

#### Step 4: Update Default Props
```typescript
CraftText.craft = {
  displayName: 'Text',
  props: {
    text: 'Text',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#000000',           // NEW
    backgroundColor: 'transparent', // NEW
    textAlign: 'left',
    margin: 0,
  },
  related: {
    settings: TextSettings,
  },
};
```

### Common Property Types

```typescript
// Text input
<input
  type="text"
  value={prop}
  onChange={(e) => setProp((props: any) => (props.propName = e.target.value))}
  className="..."
/>

// Number input
<input
  type="number"
  value={prop}
  onChange={(e) => setProp((props: any) => (props.propName = parseInt(e.target.value)))}
  className="..."
/>

// Range slider
<input
  type="range"
  min="0"
  max="100"
  value={prop}
  onChange={(e) => setProp((props: any) => (props.propName = parseInt(e.target.value)))}
  className="..."
/>

// Color picker
<input
  type="color"
  value={prop}
  onChange={(e) => setProp((props: any) => (props.propName = e.target.value))}
  className="..."
/>

// Select dropdown
<select
  value={prop}
  onChange={(e) => setProp((props: any) => (props.propName = e.target.value))}
  className="..."
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>

// Checkbox
<input
  type="checkbox"
  checked={prop}
  onChange={(e) => setProp((props: any) => (props.propName = e.target.checked))}
  className="..."
/>

// Textarea
<textarea
  value={prop}
  onChange={(e) => setProp((props: any) => (props.propName = e.target.value))}
  className="..."
  rows={4}
/>
```

---

## Creating Reusable Components

### Method 1: Save Page and Reuse (Copy/Paste)

1. **Build your component** in the page builder
2. **Save the page**
3. **Export the page** (use the export button)
4. **Import it** into another page when needed

### Method 2: Create a Custom Component (Recommended)

#### Example: Creating a "Hero Section" Component

**File**: `frontend/src/components/craft/HeroSection.tsx`

```typescript
import React from 'react';
import { useNode, Element } from '@craftjs/core';
import { Container } from './Container';
import { CraftText } from './Text';
import { CraftButton } from './CraftButton';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  backgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> & { craft?: any } = ({
  title = 'Welcome to Our Site',
  subtitle = 'Build something amazing',
  buttonText = 'Get Started',
  backgroundImage = '',
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} relative`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 py-20 px-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-4">{title}</h1>
        <p className="text-xl text-white/90 mb-8">{subtitle}</p>
        <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

// Settings Panel
const HeroSectionSettings: React.FC = () => {
  const {
    actions: { setProp },
    title,
    subtitle,
    buttonText,
    backgroundImage,
  } = useNode((node) => ({
    title: node.data.props.title,
    subtitle: node.data.props.subtitle,
    buttonText: node.data.props.buttonText,
    backgroundImage: node.data.props.backgroundImage,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Subtitle
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setProp((props: any) => (props.subtitle = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Button Text
        </label>
        <input
          type="text"
          value={buttonText}
          onChange={(e) => setProp((props: any) => (props.buttonText = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Background Image URL
        </label>
        <input
          type="text"
          value={backgroundImage}
          onChange={(e) => setProp((props: any) => (props.backgroundImage = e.target.value))}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        />
      </div>
    </div>
  );
};

HeroSection.craft = {
  displayName: 'Hero Section',
  props: {
    title: 'Welcome to Our Site',
    subtitle: 'Build something amazing',
    buttonText: 'Get Started',
    backgroundImage: '',
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: HeroSectionSettings,
  },
};
```

#### Register the Component

**File**: `frontend/src/components/craft/index.ts`

```typescript
import { HeroSection as HeroSectionComponent } from './HeroSection';

export { HeroSection } from './HeroSection';

export const ComponentLibrary = {
  // ... existing components
  HeroSection: HeroSectionComponent,
};
```

### Method 3: Component Templates System (Advanced)

You could build a system to save/load component configurations:

```typescript
// Save component template
const saveTemplate = (name: string, componentData: any) => {
  const templates = JSON.parse(localStorage.getItem('componentTemplates') || '{}');
  templates[name] = componentData;
  localStorage.setItem('componentTemplates', JSON.stringify(templates));
};

// Load component template
const loadTemplate = (name: string) => {
  const templates = JSON.parse(localStorage.getItem('componentTemplates') || '{}');
  return templates[name];
};
```

---

## Best Practices

### 1. Component Organization
```
craft/
├── basic/          # Simple components (Text, Button, Image)
├── layout/         # Layout components (Container, Columns, Column)
├── composite/      # Complex components (Card, Modal, HeroSection)
└── data/           # Data-driven components (DataTable)
```

### 2. Naming Conventions
- Components: `PascalCase` (e.g., `HeroSection`)
- Props: `camelCase` (e.g., `backgroundColor`)
- Display names: `Title Case` (e.g., `'Hero Section'`)

### 3. Dark Mode Support
Always include dark mode variants:
```typescript
className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
```

### 4. Reusable Styles
Extract common patterns:
```typescript
const inputClassName = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg";
```

---

## Tips & Tricks

1. **Test in Both Modes**: Always test your components in both Edit and Preview modes
2. **Use TypeScript**: Define proper interfaces for better type safety
3. **Add Validation**: Validate prop values in the settings panel
4. **Provide Defaults**: Always provide sensible default values
5. **Document Your Components**: Add comments explaining complex logic
6. **Keep It Simple**: Start with basic properties and add more as needed

---

## Need Help?

- Check existing components for examples
- Use the browser console to debug
- Test changes incrementally
- Ask for help if stuck!

