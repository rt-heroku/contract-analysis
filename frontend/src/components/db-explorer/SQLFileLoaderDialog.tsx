import React, { useState, useRef } from 'react';
import { Upload, File, AlertTriangle, CheckCircle, XCircle, Play, Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import Editor from '@monaco-editor/react';

interface SQLFileLoaderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (sql: string, options: ExecutionOptions) => Promise<ExecutionResult>;
}

interface ExecutionOptions {
  useTransaction: boolean;
  stopOnError: boolean;
}

interface ExecutionResult {
  success: boolean;
  totalStatements: number;
  successfulStatements: number;
  failedStatements: number;
  errors: StatementError[];
  results: any[];
}

interface StatementError {
  statement: string;
  statementNumber: number;
  lineNumber: number;
  error: string;
}

export const SQLFileLoaderDialog: React.FC<SQLFileLoaderDialogProps> = ({
  isOpen,
  onClose,
  onExecute,
}) => {
  const [sqlContent, setSqlContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [useTransaction, setUseTransaction] = useState(true);
  const [stopOnError, setStopOnError] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sql')) {
      alert('Please select a .sql file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSqlContent(content);
      setFileName(file.name);
      setExecutionResult(null);
    };
    reader.readAsText(file);
  };

  const handleExecute = async () => {
    if (!sqlContent.trim()) {
      alert('Please load a SQL file first');
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const result = await onExecute(sqlContent, {
        useTransaction,
        stopOnError,
      });
      setExecutionResult(result);
    } catch (error: any) {
      setExecutionResult({
        success: false,
        totalStatements: 0,
        successfulStatements: 0,
        failedStatements: 0,
        errors: [{
          statement: '',
          statementNumber: 0,
          lineNumber: 0,
          error: error.message || 'Failed to execute SQL file',
        }],
        results: [],
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    if (!executing) {
      setSqlContent('');
      setFileName('');
      setExecutionResult(null);
      onClose();
    }
  };

  const getStatementCount = () => {
    if (!sqlContent) return 0;
    // Simple statement counter (split by semicolon, filter non-empty)
    return sqlContent.split(';').filter(s => s.trim()).length;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Execute SQL File</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Load and execute SQL scripts with transaction support
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${sqlContent
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              {sqlContent ? (
                <>
                  <File className="w-12 h-12 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-300">{fileName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getStatementCount()} statement(s) • {(sqlContent.length / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Change File
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="font-semibold">Click to upload SQL file</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SQL Preview */}
          {sqlContent && (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
                <h3 className="text-sm font-semibold">Preview</h3>
              </div>
              <div className="h-64">
                <Editor
                  height="100%"
                  language="sql"
                  value={sqlContent}
                  onChange={(value) => setSqlContent(value || '')}
                  theme="vs-dark"
                  options={{
                    readOnly: false,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Execution Options */}
        {sqlContent && !executionResult && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Execution Options</h3>
            
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="useTransaction"
                checked={useTransaction}
                onChange={(e) => setUseTransaction(e.target.checked)}
                className="mt-1 rounded"
              />
              <label htmlFor="useTransaction" className="flex-1 cursor-pointer">
                <div className="font-medium">Use Transaction</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Execute all statements in a single transaction. Rollback all changes if any statement fails.
                </div>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="stopOnError"
                checked={stopOnError}
                onChange={(e) => setStopOnError(e.target.checked)}
                className="mt-1 rounded"
              />
              <label htmlFor="stopOnError" className="flex-1 cursor-pointer">
                <div className="font-medium">Stop on First Error</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Stop execution when the first error occurs. If unchecked, continues with remaining statements.
                </div>
              </label>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Warning:</strong> This will execute all SQL statements in the file. 
                Review the script carefully before proceeding.
              </div>
            </div>
          </div>
        )}

        {/* Execution Results */}
        {executionResult && (
          <div className="space-y-3">
            <div className={`p-4 rounded-lg border ${
              executionResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-start gap-3">
                {executionResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>Total Statements: {executionResult.totalStatements}</div>
                    <div className="text-green-700 dark:text-green-300">
                      Successful: {executionResult.successfulStatements}
                    </div>
                    {executionResult.failedStatements > 0 && (
                      <div className="text-red-700 dark:text-red-300">
                        Failed: {executionResult.failedStatements}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {executionResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Errors:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {executionResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-sm"
                    >
                      <div className="font-semibold text-red-900 dark:text-red-300">
                        Statement #{error.statementNumber} (Line {error.lineNumber})
                      </div>
                      <div className="mt-1 text-red-700 dark:text-red-400">{error.error}</div>
                      {error.statement && (
                        <div className="mt-2 p-2 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-x-auto">
                          {error.statement}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={executing}>
            {executionResult ? 'Close' : 'Cancel'}
          </Button>
          {sqlContent && !executionResult && (
            <Button
              onClick={handleExecute}
              disabled={executing || !sqlContent.trim()}
              className="flex items-center gap-2"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

