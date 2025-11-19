import React, { useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { Play, Loader, Clock, Database, FileText, Star, History, Copy } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/helpers';

interface SqlQueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (query: string) => void;
  onExplain?: (query: string) => void;
  onSaveToHistory?: (query: string, queryName?: string) => void;
  onSaveFavorite?: (query: string, queryName: string) => void;
  isExecuting?: boolean;
  executionTime?: number;
  rowCount?: number;
  className?: string;
  readOnly?: boolean;
}

export const SqlQueryEditor: React.FC<SqlQueryEditorProps> = ({
  value,
  onChange,
  onExecute,
  onExplain,
  onSaveToHistory,
  onSaveFavorite,
  isExecuting = false,
  executionTime,
  rowCount,
  className,
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [queryName, setQueryName] = useState('');

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure SQL language
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: () => {
        const word = { startColumn: 1, endColumn: 1, startLineNumber: 1, endLineNumber: 1 };
        const suggestions = [
          // SQL Keywords
          ...['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
             'ON', 'AS', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG',
             'MAX', 'MIN', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'CREATE', 'ALTER', 'DROP',
             'TABLE', 'INDEX', 'VIEW', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE',
             'DEFAULT', 'CHECK', 'CASCADE', 'TRUNCATE', 'GRANT', 'REVOKE'].map(keyword => ({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            detail: 'SQL Keyword',
            range: word,
          })),
          
          // PostgreSQL specific functions
          ...['NOW()', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'COALESCE()', 'NULLIF()', 'CASE WHEN THEN ELSE END',
             'STRING_AGG()', 'ARRAY_AGG()', 'JSON_AGG()', 'JSONB_BUILD_OBJECT()', 'GENERATE_SERIES()',
             'EXTRACT()', 'DATE_TRUNC()', 'TO_CHAR()', 'TO_DATE()', 'TO_TIMESTAMP()', 'AGE()', 'INTERVAL'].map(func => ({
            label: func,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: func,
            detail: 'PostgreSQL Function',
            range: word,
          })),
        ];

        return { suggestions };
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecute();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveToHistory) {
        onSaveToHistory(value);
      }
    });

    // Track selection
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      if (selection) {
        const selected = editor.getModel()?.getValueInRange(selection) || '';
        setSelectedText(selected);
      }
    });
  };

  const handleExecute = () => {
    const queryToExecute = selectedText.trim() || value.trim();
    if (queryToExecute) {
      onExecute(queryToExecute);
    }
  };

  const handleExplain = () => {
    if (onExplain) {
      const queryToExplain = selectedText.trim() || value.trim();
      if (queryToExplain) {
        onExplain(queryToExplain);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleSaveFavorite = () => {
    if (queryName.trim() && onSaveFavorite) {
      onSaveFavorite(value, queryName.trim());
      setShowSaveDialog(false);
      setQueryName('');
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleExecute}
            disabled={isExecuting || !value.trim()}
            className="gap-2"
          >
            {isExecuting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Execute {selectedText ? '(Selection)' : ''}
              </>
            )}
          </Button>

          {onExplain && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExplain}
              disabled={isExecuting || !value.trim()}
              className="gap-2"
            >
              <Database className="w-4 h-4" />
              Explain
            </Button>
          )}

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFormat}
            disabled={readOnly}
            title="Format SQL (Ctrl+Shift+F)"
          >
            <FileText className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </Button>

          {onSaveFavorite && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSaveDialog(true)}
              disabled={!value.trim()}
              title="Save as favorite"
            >
              <Star className="w-4 h-4" />
            </Button>
          )}

          {onSaveToHistory && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSaveToHistory(value)}
              disabled={!value.trim()}
              title="Save to history"
            >
              <History className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {executionTime !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{executionTime}ms</span>
            </div>
          )}
          {rowCount !== undefined && (
            <div className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              <span>{rowCount} rows</span>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={value}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
            readOnly,
            contextmenu: true,
            quickSuggestions: true,
          }}
        />
      </div>

      {/* Save Favorite Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Save as Favorite
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Query Name
              </label>
              <input
                type="text"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., User Statistics Query"
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSaveDialog(false);
                  setQueryName('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveFavorite}
                disabled={!queryName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">Ctrl/Cmd + Enter:</span> Execute • 
        <span className="font-medium ml-2">Ctrl/Cmd + S:</span> Save to history • 
        <span className="font-medium ml-2">Ctrl/Cmd + Shift + F:</span> Format
      </div>
    </div>
  );
};

