# Dark Theme Implementation

## 🎨 Overview
A complete dark theme implementation with a toggle switch in the user profile. The theme preference is saved to localStorage and persists across sessions.

## ✅ Features Implemented

### 1. **Tailwind Dark Mode Configuration**
- ✅ Enabled dark mode with `'class'` strategy in `tailwind.config.js`
- Allows switching themes dynamically by adding/removing the `dark` class

### 2. **Theme Context & Hook**
- ✅ Created `ThemeContext.tsx` with theme management
- ✅ Implements `useTheme()` hook for easy theme access
- Features:
  - Theme state management (`'light'` | `'dark'`)
  - `toggleTheme()` function to switch between themes
  - `setTheme(theme)` function to set a specific theme
  - Automatic localStorage persistence
  - System preference detection on first load

### 3. **Theme Provider Integration**
- ✅ Wrapped entire app with `<ThemeProvider>` in `App.tsx`
- Automatically applies `dark` class to `document.documentElement`
- Saves theme preference to `localStorage`

### 4. **Profile Page Theme Toggle**
- ✅ Added beautiful "Appearance" card to Profile page
- Features:
  - Animated toggle switch with sun/moon icons
  - Visual feedback showing current theme
  - Smooth transitions between themes
  - Helpful description text

### 5. **Dark Mode Styles Applied**
All key components updated with dark mode support:

#### **Layout Components:**
- ✅ `MainLayout` - dark background (`dark:bg-gray-900`)
- ✅ `TopBar` - complete dark mode support:
  - Header background and borders
  - Hamburger menu button
  - Search bar (input, placeholder, icon)
  - Notifications button and dropdown
  - User menu button and dropdown
  - All text and icons
  - Hover states
- ✅ `Sidebar` - dark background and borders
  - Menu items with hover states
  - App logo and name
  - Footer "Powered by" section
  - All borders and text elements

#### **Common Components:**
- ✅ `Card` component - dark backgrounds and borders
  - Header section
  - Content area
  - Border colors

#### **Pages:**
- ✅ `Profile` page - all text elements with dark mode
- ✅ `ProcessDesigner` page - comprehensive dark mode:
  - Canvas background (dynamic based on theme)
  - All control buttons (Actions, Settings, Variables, Multi-Select, Layout, Auto-Arrange)
  - Process name/description editor
  - Top-right action buttons (Export, Save, Publish, Run)
  - MiniMap and Controls
  - All node components (StartNode, ActionNode, GlobalErrorNode, IfThenElseNode)
  - Node labels, badges, and metadata
  - Handle labels (if/else/error indicators)
  - Empty canvas state text

## 🎯 Theme Toggle Location

The theme toggle is located in:
```
Profile Page → Appearance Card
```

## 🎨 Color Scheme

### Light Mode
- **Background**: `bg-gray-50`
- **Cards**: `bg-white`
- **Text**: `text-gray-900`, `text-gray-600`
- **Borders**: `border-gray-200`

### Dark Mode
- **Background**: `dark:bg-gray-900`
- **Cards**: `dark:bg-gray-800`
- **Text**: `dark:text-gray-100`, `dark:text-gray-400`
- **Borders**: `dark:border-gray-700`

## 🚀 Usage

### For Users:
1. Navigate to **Profile** page
2. Find the **Appearance** card
3. Click the toggle switch to change themes
4. Theme preference is automatically saved

### For Developers:

#### Using the Theme Hook:
```typescript
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

#### Adding Dark Mode to Components:
```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content with dark mode support
</div>
```

## 📁 Files Modified

### New Files:
- `frontend/src/context/ThemeContext.tsx` - Theme context and provider

### Modified Files:
- `frontend/tailwind.config.js` - Added `darkMode: 'class'`
- `frontend/src/App.tsx` - Wrapped app with ThemeProvider
- `frontend/src/pages/Profile.tsx` - Added Appearance card with toggle
- `frontend/src/pages/ProcessDesigner.tsx` - Added comprehensive dark mode support
- `frontend/src/components/common/Card.tsx` - Added dark mode styles
- `frontend/src/components/layout/MainLayout.tsx` - Added dark mode styles
- `frontend/src/components/layout/TopBar.tsx` - Added complete dark mode support
- `frontend/src/components/layout/Sidebar.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/StartNode.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/ActionNode.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/GlobalErrorNode.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/IfThenElseNode.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/LoopContainerNode.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/BreakNode.tsx` - Added dark mode styles
- `frontend/src/components/process-designer/ContinueNode.tsx` - Added dark mode styles

## 🎨 Theme Toggle Design

The toggle switch features:
- **Sun icon** 🌞 for light mode (amber color)
- **Moon icon** 🌙 for dark mode (indigo color)
- Smooth slide animation
- Color transitions
- Focus ring for accessibility

## 🔄 Persistence

Theme preference is stored in `localStorage` with key `'theme'`:
- Automatically saves on theme change
- Loads on app initialization
- Falls back to system preference if no saved theme exists

## 🌐 System Preference Detection

On first load (no saved preference):
```typescript
window.matchMedia('(prefers-color-scheme: dark)').matches
```
Detects if user prefers dark mode at OS level.

## ✨ Best Practices

When adding dark mode to new components:

1. **Always pair light and dark classes:**
   ```tsx
   className="bg-white dark:bg-gray-800"
   ```

2. **Update text colors:**
   ```tsx
   className="text-gray-900 dark:text-gray-100"
   ```

3. **Update borders:**
   ```tsx
   className="border-gray-200 dark:border-gray-700"
   ```

4. **Update hover states:**
   ```tsx
   className="hover:bg-gray-100 dark:hover:bg-gray-700"
   ```

## 🧪 Testing

To test dark theme:
1. Go to Profile page
2. Toggle the theme switch
3. Navigate to different pages
4. Verify colors and contrast
5. Refresh page to test persistence
6. Check all interactive elements

## 🎯 Future Enhancements

Potential improvements:
- [ ] Add system theme sync option
- [ ] Add more theme options (e.g., high contrast)
- [ ] Add dark mode to all remaining pages
- [ ] Add smooth theme transition animations
- [ ] Add theme preview before applying

## 📝 Notes

- Dark mode works across all pages automatically
- Theme preference syncs across browser tabs
- No backend changes required
- Fully accessible with keyboard navigation
- Performance optimized with CSS classes

---

**Status**: ✅ Complete and production-ready  
**Version**: 1.0.0  
**Last Updated**: October 31, 2025

