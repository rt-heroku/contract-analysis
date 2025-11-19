# Monaco Editor Implementation Guide

## Overview

Monaco Editor (the editor from VS Code) is now implemented across the application for all text/code editing needs. This provides a professional, feature-rich editing experience with syntax highlighting, IntelliSense, code formatting, and more.

---

## ✅ Implemented Locations

Monaco Editor has been integrated in:

1. **Action Creator** (`ActionCreator.tsx`)
   - JavaScript code editing for script actions
   - Syntax highlighting and auto-completion

2. **Prompts Editor** (`Prompts.tsx`)
   - Markdown editing for prompt content
   - Full-height editor with word wrap

3. **Markdown Editor Component** (`MarkdownEditor.tsx`)
   - Craft.js markdown editing component
   - Split view with preview support

---

## 📦 Components Available

### 1. `MonacoEditor` (Base Component)

The main reusable Monaco Editor component.

```tsx
import { MonacoEditor } from '@/components/common/MonacoEditor';

<MonacoEditor
  value={code}
  onChange={(value) => setCode(value || '')}
  language="javascript"
  height="400px"
  theme="light"
  readOnly={false}
  minimap={true}
  lineNumbers="on"
  wordWrap="on"
/>
```

**Props**:
- `value: string` - Editor content
- `onChange?: (value: string | undefined) => void` - Change handler
- `language?: string` - Language mode (javascript, typescript, json, markdown, html, css, python, etc.)
- `height?: string | number` - Editor height (default: "400px")
- `theme?: 'vs-dark' | 'light' | 'vs'` - Editor theme (default: "vs")
- `readOnly?: boolean` - Read-only mode (default: false)
- `minimap?: boolean` - Show minimap (default: true)
- `lineNumbers?: 'on' | 'off' | 'relative' | 'interval'` - Line numbers display (default: "on")
- `wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'` - Word wrap mode (default: "on")
- `options?: any` - Additional Monaco editor options
- `className?: string` - Custom CSS class

### 2. `CodeMonacoEditor`

Specialized for JavaScript/TypeScript code editing.

```tsx
import { CodeMonacoEditor } from '@/components/common/MonacoEditor';

<CodeMonacoEditor
  value={jsCode}
  onChange={(value) => setJsCode(value || '')}
  language="javascript"
  height="300px"
  theme="light"
/>
```

Features:
- Auto-formatting on paste and type
- IntelliSense and auto-completion
- Syntax error detection
- Bracket matching and auto-closing

### 3. `MarkdownMonacoEditor`

Specialized for Markdown editing.

```tsx
import { MarkdownMonacoEditor } from '@/components/common/MonacoEditor';

<MarkdownMonacoEditor
  value={markdown}
  onChange={(value) => setMarkdown(value || '')}
  height="500px"
  theme="light"
  wordWrap="on"
/>
```

Features:
- Markdown syntax highlighting
- Word wrap enabled by default
- Preview support (can be combined with ReactMarkdown)

### 4. `JSONMonacoEditor`

Specialized for JSON editing with validation.

```tsx
import { JSONMonacoEditor } from '@/components/common/MonacoEditor';

<JSONMonacoEditor
  value={jsonString}
  onChange={(value) => setJsonString(value || '')}
  height="400px"
  theme="light"
/>
```

Features:
- JSON syntax validation
- Auto-formatting
- Bracket matching
- Error highlighting

---

## 🎨 Supported Languages

Monaco Editor supports many languages out of the box:

- `javascript` / `typescript`
- `json`
- `markdown`
- `html`
- `css` / `scss` / `less`
- `python`
- `java`
- `sql`
- `xml`
- `yaml`
- `shell` / `bash`
- `plaintext`
- And many more...

---

## 🚀 Usage Examples

### Example 1: JavaScript Code Editor

```tsx
import { CodeMonacoEditor } from '@/components/common/MonacoEditor';

const MyComponent = () => {
  const [code, setCode] = useState('// Write your code here\n');

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <CodeMonacoEditor
        value={code}
        onChange={(value) => setCode(value || '')}
        language="javascript"
        height="400px"
        theme="light"
      />
    </div>
  );
};
```

### Example 2: Markdown Editor with Preview

```tsx
import { MarkdownMonacoEditor } from '@/components/common/MonacoEditor';
import ReactMarkdown from 'react-markdown';

const MyMarkdownEditor = () => {
  const [markdown, setMarkdown] = useState('# Hello\n\nWrite markdown here...');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <MarkdownMonacoEditor
          value={markdown}
          onChange={(value) => setMarkdown(value || '')}
          height="500px"
          theme="light"
        />
      </div>
      {showPreview && (
        <div className="flex-1 border p-4 overflow-auto">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};
```

### Example 3: JSON Editor with Validation

```tsx
import { JSONMonacoEditor } from '@/components/common/MonacoEditor';

const JSONConfigEditor = () => {
  const [config, setConfig] = useState('{\n  "key": "value"\n}');

  const handleSave = () => {
    try {
      const parsed = JSON.parse(config);
      // Save parsed config
      console.log('Valid JSON:', parsed);
    } catch (error) {
      alert('Invalid JSON!');
    }
  };

  return (
    <div>
      <JSONMonacoEditor
        value={config}
        onChange={(value) => setConfig(value || '')}
        height="400px"
        theme="light"
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

### Example 4: Read-Only Code Display

```tsx
import { MonacoEditor } from '@/components/common/MonacoEditor';

const CodeDisplay = ({ code }: { code: string }) => {
  return (
    <MonacoEditor
      value={code}
      language="javascript"
      height="300px"
      theme="vs-dark"
      readOnly={true}
      minimap={false}
    />
  );
};
```

### Example 5: Full-Height Editor

```tsx
import { MonacoEditor } from '@/components/common/MonacoEditor';

const FullHeightEditor = () => {
  const [content, setContent] = useState('');

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        <MonacoEditor
          value={content}
          onChange={(value) => setContent(value || '')}
          language="typescript"
          height="100%"
          theme="vs-dark"
        />
      </div>
    </div>
  );
};
```

---

## ⚙️ Advanced Configuration

### Custom Theme

```tsx
<MonacoEditor
  value={code}
  onChange={setCode}
  language="javascript"
  theme="vs-dark"  // or "light" or "vs"
/>
```

### Custom Options

```tsx
<MonacoEditor
  value={code}
  onChange={setCode}
  language="javascript"
  options={{
    fontSize: 16,
    fontFamily: "'Fira Code', monospace",
    lineHeight: 24,
    rulers: [80, 120],
    renderWhitespace: 'all',
    cursorStyle: 'line',
    scrollBeyondLastLine: false,
  }}
/>
```

### Without Minimap

```tsx
<MonacoEditor
  value={code}
  onChange={setCode}
  language="python"
  minimap={false}
/>
```

### Different Line Number Styles

```tsx
// Relative line numbers (like Vim)
<MonacoEditor lineNumbers="relative" />

// No line numbers
<MonacoEditor lineNumbers="off" />

// Interval (every 10 lines)
<MonacoEditor lineNumbers="interval" />
```

---

## 🎯 Best Practices

### 1. Always Handle Undefined

Monaco Editor `onChange` can return `undefined`:

```tsx
onChange={(value) => setCode(value || '')}  // ✅ Safe
onChange={(value) => setCode(value)}         // ❌ Can be undefined
```

### 2. Wrap in Border Container

For better visual appearance:

```tsx
<div className="border border-gray-300 rounded-md overflow-hidden">
  <MonacoEditor ... />
</div>
```

### 3. Set Appropriate Height

Always specify height for proper rendering:

```tsx
<MonacoEditor height="400px" />  // ✅ Fixed height
<MonacoEditor height="100%" />   // ✅ In flex container
```

### 4. Choose Right Component

- Use `CodeMonacoEditor` for JavaScript/TypeScript
- Use `MarkdownMonacoEditor` for Markdown
- Use `JSONMonacoEditor` for JSON with validation
- Use `MonacoEditor` for other languages or custom setup

### 5. Theme Consistency

Match your app's theme:

```tsx
// Light mode app
<MonacoEditor theme="light" />

// Dark mode app
<MonacoEditor theme="vs-dark" />
```

---

## 📝 Migration from Textarea

### Before (Textarea)

```tsx
<textarea
  value={code}
  onChange={(e) => setCode(e.target.value)}
  className="w-full h-64 font-mono"
  rows={10}
/>
```

### After (Monaco Editor)

```tsx
<div className="border border-gray-300 rounded-md overflow-hidden">
  <CodeMonacoEditor
    value={code}
    onChange={(value) => setCode(value || '')}
    height="256px"  // h-64 = 256px
    theme="light"
  />
</div>
```

---

## 🐛 Troubleshooting

### Issue: Editor Not Showing

**Solution**: Ensure parent container has a defined height:

```tsx
<div className="h-96">  {/* or height: 400px */}
  <MonacoEditor height="100%" />
</div>
```

### Issue: onChange Returns Undefined

**Solution**: Handle undefined in onChange:

```tsx
onChange={(value) => setCode(value || '')}
```

### Issue: Editor Too Small

**Solution**: Increase height or use percentage in flex container:

```tsx
<div className="flex-1">
  <MonacoEditor height="100%" />
</div>
```

---

## 🚀 Future Use Cases

For any future text/code editing needs, use Monaco Editor:

1. **SQL Query Editors** - Use `language="sql"`
2. **Configuration Files** - Use `JSONMonacoEditor` or `language="yaml"`
3. **API Request Bodies** - Use `JSONMonacoEditor`
4. **Script Editors** - Use `CodeMonacoEditor`
5. **Template Editors** - Use `MonacoEditor` with appropriate language
6. **Documentation** - Use `MarkdownMonacoEditor`
7. **CSS/HTML Editors** - Use `language="css"` or `language="html"`

---

## 📚 Resources

- **Monaco Editor Docs**: https://microsoft.github.io/monaco-editor/
- **React Monaco Editor**: https://github.com/suren-atoyan/monaco-react
- **Language Support**: https://microsoft.github.io/monaco-editor/monarch.html

---

## ✅ Checklist for New Editors

When implementing a new editor:

- [ ] Import appropriate Monaco component
- [ ] Set `value` prop
- [ ] Handle `onChange` with undefined check
- [ ] Specify `height`
- [ ] Choose correct `language`
- [ ] Set `theme` to match app design
- [ ] Wrap in border container for styling
- [ ] Test with empty content
- [ ] Test with large content
- [ ] Verify auto-completion works (if applicable)

---

**Monaco Editor is now the standard for all text/code editing in the application!** 🎉

