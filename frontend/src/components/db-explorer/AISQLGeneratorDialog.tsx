import React, { useState } from 'react';
import { Sparkles, Loader, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

interface AISQLGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSQL: (prompt: string) => Promise<{ sql: string; explanation: string; tablesUsed: string[] }>;
  onInsertSQL: (sql: string) => void;
}

export const AISQLGeneratorDialog: React.FC<AISQLGeneratorDialogProps> = ({
  isOpen,
  onClose,
  onGenerateSQL,
  onInsertSQL,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    sql: string;
    explanation: string;
    tablesUsed: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const generatedResult = await onGenerateSQL(prompt);
      setResult(generatedResult);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to generate SQL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    if (result?.sql) {
      navigator.clipboard.writeText(result.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsert = () => {
    if (result?.sql) {
      onInsertSQL(result.sql);
      handleClose();
    }
  };

  const handleClose = () => {
    setPrompt('');
    setResult(null);
    setError(null);
    setLoading(false);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">AI SQL Generator</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              What would you like to do?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Show me all users who registered in the last 7 days with their total order count"
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Tip: Mention specific table names for better results. Press Cmd/Ctrl+Enter to generate.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-12 h-12 animate-spin mx-auto text-primary-600 dark:text-primary-400 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyzing your request and generating SQL...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  Generation Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Explanation */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Query Explanation
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">{result.explanation}</p>
              </div>

              {/* Tables Used */}
              {result.tablesUsed.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Tables Used:
                  </span>
                  {result.tablesUsed.map((table) => (
                    <Badge key={table} variant="info">
                      {table}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Generated SQL */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Generated SQL
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopySQL}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-4 bg-gray-900 dark:bg-black border border-gray-700 rounded-lg overflow-x-auto">
                  <code className="text-sm text-gray-100 font-mono">{result.sql}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {result ? (
              <span>✨ SQL generated successfully</span>
            ) : (
              <span>Powered by AI • Context-aware generation</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {result ? (
              <Button
                variant="primary"
                onClick={handleInsert}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Insert into Editor
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate SQL
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

