import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Loading } from './Loading';

export interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  height?: string | number;
  theme?: 'vs-dark' | 'light' | 'vs';
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  options?: any;
  className?: string;
}

/**
 * Reusable Monaco Editor Component
 * 
 * Supports multiple languages: javascript, typescript, json, markdown, html, css, python, etc.
 * 
 * @example
 * <MonacoEditor
 *   value={code}
 *   onChange={setCode}
 *   language="javascript"
 *   height="400px"
 * />
 */
export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  height = '400px',
  theme = 'vs',
  readOnly = false,
  minimap = true,
  lineNumbers = 'on',
  wordWrap = 'on',
  options = {},
  className = '',
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco editor
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.lineHighlightBackground': '#f5f5f5',
      },
    });

    // Set custom theme if needed
    if (theme === 'light') {
      monaco.editor.setTheme('custom-light');
    }
  };

  const handleChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={`monaco-editor-wrapper ${className}`}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={theme}
        loading={<Loading size="md" />}
        options={{
          readOnly,
          minimap: { enabled: minimap },
          lineNumbers,
          wordWrap,
          fontSize: 14,
          fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          suggest: {
            snippetsPreventQuickSuggestions: false,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          ...options,
        }}
      />
    </div>
  );
};

/**
 * Monaco Editor for Markdown with preview support
 */
export const MarkdownMonacoEditor: React.FC<MonacoEditorProps & { 
  showPreview?: boolean;
  onPreviewToggle?: (show: boolean) => void;
}> = ({
  showPreview = false,
  onPreviewToggle,
  ...props
}) => {
  return (
    <div className="markdown-monaco-editor">
      <MonacoEditor
        {...props}
        language="markdown"
        wordWrap="on"
      />
    </div>
  );
};

/**
 * Monaco Editor for JSON with validation
 */
export const JSONMonacoEditor: React.FC<MonacoEditorProps> = (props) => {
  return (
    <MonacoEditor
      {...props}
      language="json"
      options={{
        ...props.options,
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
};

/**
 * Monaco Editor for JavaScript/TypeScript
 */
export const CodeMonacoEditor: React.FC<MonacoEditorProps> = (props) => {
  return (
    <MonacoEditor
      {...props}
      language={props.language || 'javascript'}
      options={{
        ...props.options,
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
        suggest: {
          snippetsPreventQuickSuggestions: false,
        },
      }}
    />
  );
};

