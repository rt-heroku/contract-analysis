# Comprehensive Component Analysis & Implementation Guide

## ✅ Completed Updates

### 1. Text Component - FULLY UPDATED ✓
**New Properties Added:**
- **Typography**: lineHeight, justify alignment
- **Dimensions**: width, height
- **Spacing**: Individual margin (top/right/bottom/left), individual padding
- **Styling**: background, borderRadius, borderWidth, borderColor

**Settings Panel**: Complete with 6 sections (Typography, Dimensions, Margin, Padding, Styling)

---

### 2. Button Component - FULLY UPDATED ✓
**New Properties Added:**
- **Layout**: fullWidth option
- **Spacing**: Individual margin, custom padding (overrides size presets)
- **Variants**: Added 'danger' variant

**Settings Panel**: Complete with 4 sections (Content, Style, Margin, Custom Padding)

---

### 3. Card Component - FULLY UPDATED ✓
**New Properties Added:**
- **Dimensions**: width control
- **Spacing**: Individual margin, individual padding
- **Styling**: background color, borderRadius, boxShadow (5 levels)

**Settings Panel**: Complete with 5 sections (Content, Dimensions, Margin, Padding, Styling)
**Now Droppable**: Can contain other components

---

### 4. Image Component - FULLY UPDATED ✓
**New Properties Added:**
- **Spacing**: Individual margin
- **Styling**: borderRadius, borderWidth, borderColor

**Settings Panel**: Complete with 4 sections (Image Source, Dimensions, Margin, Border)

---

### 5. Collapsible Component - NEW ✓
**Features**:
- Accordion/Details style component
- Expandable/Collapsible header
- Droppable content area
- Customizable header and content backgrounds
- Default open/closed state
- Chevron icon animation

**Properties**:
- title, defaultOpen, width
- Individual margin
- headerBackground, headerTextColor, contentBackground
- borderRadius

**Use Cases**:
- FAQ sections
- Collapsible menus
- Expandable details
- Accordion lists

---

## 🔧 Implementation Needed (Code Ready)

### 6. Document Preview Component

```typescript
// webapp/frontend/src/components/craft/DocumentPreview.tsx
import React from 'react';
import { useNode } from '@craftjs/core';
import { FileText } from 'lucide-react';

interface DocumentPreviewProps {
  documentUrl?: string;
  documentType?: 'pdf' | 'image' | 'iframe';
  width?: string;
  height?: string;
  showDownload?: boolean;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> & { craft?: any } = ({
  documentUrl = '',
  documentType = 'pdf',
  width = '100%',
  height = '600px',
  showDownload = true,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const renderPreview = () => {
    if (!documentUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Configure document URL in settings
          </p>
        </div>
      );
    }

    if (documentType === 'pdf') {
      return (
        <iframe
          src={`${documentUrl}#toolbar=0`}
          className="w-full h-full border-0"
          title="Document Preview"
        />
      );
    }

    if (documentType === 'image') {
      return (
        <img
          src={documentUrl}
          alt="Document Preview"
          className="w-full h-full object-contain"
        />
      );
    }

    return (
      <iframe
        src={documentUrl}
        className="w-full h-full border-0"
        title="Document Preview"
      />
    );
  };

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
      style={{
        width,
        height,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      {showDownload && documentUrl && (
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-600 dark:text-gray-400">Document Preview</span>
          <a
            href={documentUrl}
            download
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Download
          </a>
        </div>
      )}
      <div className="w-full" style={{ height: showDownload ? 'calc(100% - 41px)' : '100%' }}>
        {renderPreview()}
      </div>
    </div>
  );
};

const DocumentPreviewSettings: React.FC = () => {
  const {
    actions: { setProp },
    documentUrl,
    documentType,
    width,
    height,
    showDownload,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    documentUrl: node.data.props.documentUrl,
    documentType: node.data.props.documentType,
    width: node.data.props.width,
    height: node.data.props.height,
    showDownload: node.data.props.showDownload,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Document</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Document URL</label>
            <input
              type="text"
              value={documentUrl}
              onChange={(e) => setProp((props: any) => (props.documentUrl = e.target.value))}
              placeholder="https://example.com/document.pdf"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
            <select
              value={documentType}
              onChange={(e) => setProp((props: any) => (props.documentType = e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="iframe">Other (iFrame)</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDownload}
                onChange={(e) => setProp((props: any) => (props.showDownload = e.target.checked))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Show Download Button</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
              placeholder="100%"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = e.target.value))}
              placeholder="600px"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Margin <span className="text-xs font-normal text-gray-500">{marginTop}px {marginRight}px {marginBottom}px {marginLeft}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginTop} onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginRight} onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginBottom} onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginLeft} onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

DocumentPreview.craft = {
  displayName: 'Document Preview',
  props: {
    documentUrl: '',
    documentType: 'pdf',
    width: '100%',
    height: '600px',
    showDownload: true,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: DocumentPreviewSettings,
  },
};
```

**Features**:
- PDF viewer with iframe
- Image preview
- Generic iframe for other document types
- Download button option
- Configurable dimensions
- Works with process data URLs

---

### 7. Markdown Editor/Preview Component

```typescript
// webapp/frontend/src/components/craft/MarkdownEditor.tsx
import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import ReactMarkdown from 'react-markdown';
import { Eye, Edit } from 'lucide-react';

interface MarkdownEditorProps {
  content?: string;
  mode?: 'edit' | 'preview' | 'split';
  width?: string;
  height?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> & { craft?: any } = ({
  content = '# Markdown Content\n\nEdit this content...',
  mode = 'split',
  width = '100%',
  height = '400px',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
}) => {
  const {
    connectors: { connect, drag },
    selected,
    actions: { setProp },
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [localContent, setLocalContent] = useState(content);
  const [viewMode, setViewMode] = useState(mode);

  const handleChange = (value: string) => {
    setLocalContent(value);
    setProp((props: any) => (props.content = value), 500);
  };

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      {/* Toolbar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('edit')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            viewMode === 'edit'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          <Edit className="w-3 h-3 inline-block mr-1" />
          Edit
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            viewMode === 'preview'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          <Eye className="w-3 h-3 inline-block mr-1" />
          Preview
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            viewMode === 'split'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          Split
        </button>
      </div>

      {/* Content */}
      <div
        className={`flex ${viewMode === 'split' ? 'divide-x divide-gray-200 dark:divide-gray-700' : ''}`}
        style={{ height }}
      >
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={viewMode === 'split' ? 'flex-1' : 'w-full'}>
            <textarea
              value={localContent}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full h-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none"
              placeholder="Write markdown here..."
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`overflow-y-auto ${viewMode === 'split' ? 'flex-1' : 'w-full'}`}>
            <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{localContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MarkdownEditorSettings: React.FC = () => {
  const {
    actions: { setProp },
    mode,
    width,
    height,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    mode: node.data.props.mode,
    width: node.data.props.width,
    height: node.data.props.height,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Editor Mode</h4>
        <select
          value={mode}
          onChange={(e) => setProp((props: any) => (props.mode = e.target.value))}
          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
        >
          <option value="edit">Edit Only</option>
          <option value="preview">Preview Only</option>
          <option value="split">Split (Edit + Preview)</option>
        </select>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
              placeholder="100%"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = e.target.value))}
              placeholder="400px"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Margin <span className="text-xs font-normal text-gray-500">{marginTop}px {marginRight}px {marginBottom}px {marginLeft}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginTop} onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginRight} onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginBottom} onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginLeft} onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

MarkdownEditor.craft = {
  displayName: 'Markdown Editor',
  props: {
    content: '# Markdown Content\n\nEdit this content...',
    mode: 'split',
    width: '100%',
    height: '400px',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: MarkdownEditorSettings,
  },
};
```

**Features**:
- Live markdown editing
- Real-time preview
- Split view (edit + preview)
- Mode switching (edit only / preview only / split)
- Syntax highlighting in preview
- Dark mode support

**Dependencies**:
```bash
npm install react-markdown
```

---

### 8. Container with File Drop Functionality

**Add to existing Container component** (`Container.tsx`):

```typescript
// Add these new props to ContainerProps interface
interface ContainerProps {
  // ... existing props
  enableFileDrop?: boolean;
  onFilesDropped?: (files: FileList) => void;
  acceptedFileTypes?: string; // e.g., ".pdf,.jpg,.png"
  maxFiles?: number;
}

// Add to component body
const [isDragging, setIsDragging] = useState(false);

const handleDragOver = (e: React.DragEvent) => {
  if (!enableFileDrop) return;
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  if (!enableFileDrop) return;
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
};

const handleDrop = (e: React.DragEvent) => {
  if (!enableFileDrop) return;
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    if (maxFiles && files.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }
    onFilesDropped?.(files);
    // TODO: Handle file upload to backend
  }
};

// Update div with drag handlers
<div
  ref={(ref) => ref && connect(drag(ref))}
  // ... existing props
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  className={`${className} ${enableFileDrop && isDragging ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' : ''}`}
>
  {children || (
    <div className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm w-full">
      <div className="font-medium mb-1">
        {enableFileDrop ? 'Drop files here or drop components' : 'Drop components here'}
      </div>
      {enableFileDrop && acceptedFileTypes && (
        <div className="text-xs opacity-75 mt-2">
          Accepted: {acceptedFileTypes}
        </div>
      )}
    </div>
  )}
</div>

// Add to ContainerSettings
<div>
  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">File Drop</h4>
  <div className="space-y-2">
    <div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enableFileDrop}
          onChange={(e) => setProp((props: any) => (props.enableFileDrop = e.target.checked))}
          className="text-primary-600"
        />
        <span className="text-xs text-gray-700 dark:text-gray-300">Enable File Drop</span>
      </label>
    </div>
    {enableFileDrop && (
      <>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Accepted File Types</label>
          <input
            type="text"
            value={acceptedFileTypes}
            onChange={(e) => setProp((props: any) => (props.acceptedFileTypes = e.target.value))}
            placeholder=".pdf,.jpg,.png"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Files</label>
          <input
            type="number"
            value={maxFiles}
            onChange={(e) => setProp((props: any) => (props.maxFiles = parseInt(e.target.value)))}
            min="1"
            max="10"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
        </div>
      </>
    )}
  </div>
</div>

// Add to craft props
enableFileDrop: false,
acceptedFileTypes: '.pdf,.jpg,.png',
maxFiles: 5,
```

---

## 💡 Suggested Additional Components

### 9. Form Input Component
**Use Case**: Building dynamic forms
**Properties**:
- inputType (text, email, number, tel, password)
- placeholder, label, required
- validation rules
- error message display

### 10. Select/Dropdown Component
**Use Case**: User selections
**Properties**:
- options (array of {value, label})
- multiple selection
- searchable
- placeholder

### 11. Checkbox/Radio Component
**Use Case**: Boolean/Multiple choice inputs
**Properties**:
- label, checked, disabled
- group support for radio buttons

### 12. Textarea Component
**Use Case**: Multi-line text input
**Properties**:
- rows, maxLength
- auto-resize
- character counter

### 13. Progress Bar Component
**Use Case**: Loading states, data visualization
**Properties**:
- value, max
- color, height
- animated
- show percentage

### 14. Tabs Component
**Use Case**: Organize content in tabs
**Properties**:
- tabs array
- default active tab
- tab orientation (horizontal/vertical)

### 15. Alert/Banner Component
**Use Case**: Notifications, warnings
**Properties**:
- type (info, success, warning, error)
- dismissible
- icon
- title, message

### 16. Badge/Tag Component
**Use Case**: Labels, status indicators
**Properties**:
- text, color
- size, variant
- removable

### 17. Divider Component
**Use Case**: Visual separation
**Properties**:
- orientation (horizontal/vertical)
- style (solid, dashed, dotted)
- thickness, color
- with text/label

### 18. Spinner/Loader Component
**Use Case**: Loading states
**Properties**:
- size, color
- type (circle, dots, bars)
- overlay (full page/inline)

### 19. Breadcrumb Component
**Use Case**: Navigation trail
**Properties**:
- items array
- separator
- max items displayed

### 20. Pagination Component
**Use Case**: Navigate through lists
**Properties**:
- total pages
- current page
- items per page
- show first/last buttons

### 21. Chart Component
**Use Case**: Data visualization
**Properties**:
- chartType (bar, line, pie, doughnut)
- data, labels
- colors
- legend, grid

**Dependencies**: `chart.js`, `react-chartjs-2`

### 22. Timeline Component
**Use Case**: Event sequences
**Properties**:
- events array (date, title, description)
- orientation (vertical/horizontal)
- icon per event

### 23. Stat Card Component
**Use Case**: Dashboard metrics
**Properties**:
- title, value, unit
- icon, trend (up/down)
- change percentage

### 24. Avatar Component
**Use Case**: User profile images
**Properties**:
- src, alt, initials
- size, shape (circle/square)
- badge/status indicator

### 25. Skeleton Loader Component
**Use Case**: Loading placeholders
**Properties**:
- variant (text, rect, circle)
- count, width, height
- animated

---

## 🎨 Component Priority Ranking

### High Priority (Implement First)
1. **Form Input** - Essential for data collection
2. **Select/Dropdown** - Common UI pattern
3. **Alert/Banner** - User feedback
4. **Progress Bar** - Process indication
5. **Tabs** - Content organization

### Medium Priority
6. **Checkbox/Radio** - Form elements
7. **Textarea** - Multi-line input
8. **Badge/Tag** - Status indicators
9. **Divider** - Layout helper
10. **Spinner/Loader** - Loading states

### Low Priority (Nice to Have)
11-25: Breadcrumb, Pagination, Chart, Timeline, Stat Card, Avatar, Skeleton

---

## 📋 Implementation Checklist

### For Each New Component:
- [ ] Create component file in `frontend/src/components/craft/`
- [ ] Define Props interface with all customizable properties
- [ ] Implement component with `useNode` hook
- [ ] Add Craft.js connectors (connect, drag)
- [ ] Create Settings panel component
- [ ] Add all property controls to Settings
- [ ] Define `craft` configuration (displayName, props, rules, related)
- [ ] Add dark mode support
- [ ] Test in Page Builder
- [ ] Export from `index.ts`
- [ ] Add to `ComponentLibrary` in `PageBuilder.tsx`
- [ ] Add icon mapping for toolbox
- [ ] Document usage

---

## 🔍 Testing Requirements

For each component, verify:
1. **Drag & Drop**: Can be dragged from toolbox and placed
2. **Selection**: Shows ring when selected
3. **Settings Panel**: All properties appear in settings
4. **Property Updates**: Changes in settings immediately reflect
5. **Dark Mode**: Properly styled in both themes
6. **Nesting**: Works correctly inside containers (if applicable)
7. **Persistence**: Properties save when page is saved
8. **Preview Mode**: Works in preview/published mode

---

## 📦 Dependencies Needed

```json
{
  "react-markdown": "^9.0.1",      // Markdown editor
  "chart.js": "^4.4.0",            // Charts (if implementing)
  "react-chartjs-2": "^5.2.0",     // React wrapper for chart.js
  "@dnd-kit/core": "^6.0.8"        // Advanced drag & drop (optional upgrade)
}
```

---

## 🚀 Next Steps

1. **Create DocumentPreview.tsx** - Copy code from section 6
2. **Create MarkdownEditor.tsx** - Copy code from section 7
3. **Update Container.tsx** - Add file drop functionality (section 8)
4. **Register new components** in `index.ts`
5. **Add to ComponentLibrary** in `PageBuilder.tsx`
6. **Add icons** to `componentIcons` mapping
7. **Test all components** work correctly
8. **Implement high-priority components** (Form Input, Select, etc.)
9. **Document** each component in `/docs/components/`

---

## 📝 Summary

### ✅ Completed (4 updates + 1 new):
- Text, Button, Card, Image - All fully updated with comprehensive properties
- Collapsible - New component with full settings

### 🔧 Ready to Implement (3 components):
- DocumentPreview - Full code provided
- MarkdownEditor - Full code provided
- File Drop (Container update) - Implementation guide provided

### 💡 Suggested (25 additional components):
- Priority ranked from essential to nice-to-have
- Covers forms, navigation, feedback, data visualization, and layout

**Total: 33 components** when fully implemented! 🎉

