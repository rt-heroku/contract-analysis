import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import Editor from '@monaco-editor/react';

interface CellValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: any;
  columnName: string;
}

export const CellValueModal: React.FC<CellValueModalProps> = ({
  isOpen,
  onClose,
  value,
  columnName,
}) => {
  const [copied, setCopied] = useState(false);
  const [formattedValue, setFormattedValue] = useState('');
  const [language, setLanguage] = useState('text');

  useEffect(() => {
    if (value === null || value === undefined) {
      setFormattedValue('NULL');
      setLanguage('text');
      return;
    }

    // Try to detect if it's JSON
    if (typeof value === 'object') {
      setFormattedValue(JSON.stringify(value, null, 2));
      setLanguage('json');
    } else if (typeof value === 'string') {
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(value);
        setFormattedValue(JSON.stringify(parsed, null, 2));
        setLanguage('json');
      } catch {
        // Not JSON, just display as text
        setFormattedValue(String(value));
        setLanguage('text');
      }
    } else {
      setFormattedValue(String(value));
      setLanguage('text');
    }
  }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cell Value
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Column: <span className="font-mono">{columnName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {language === 'json' ? (
            <Editor
              height="100%"
              defaultLanguage="json"
              value={formattedValue}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                folding: true,
              }}
            />
          ) : (
            <div className="p-4 overflow-auto h-full">
              <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono">
                {formattedValue}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'json' ? 'JSON formatted' : 'Text format'} • {formattedValue.length} characters
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

