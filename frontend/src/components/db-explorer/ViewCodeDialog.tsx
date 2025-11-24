import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Copy, Download, CheckCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import api from '@/lib/api';

interface ViewCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connectorId: number;
  schemaName: string;
  objectName: string;
  objectType: 'view' | 'function';
}

export const ViewCodeDialog: React.FC<ViewCodeDialogProps> = ({
  isOpen,
  onClose,
  connectorId,
  schemaName,
  objectName,
  objectType,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCode();
    } else {
      setCode('');
      setError(null);
      setCopied(false);
    }
  }, [isOpen, connectorId, schemaName, objectName, objectType]);

  const loadCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = objectType === 'view'
        ? `/db-explorer/${connectorId}/schemas/${schemaName}/views/${objectName}/ddl`
        : `/db-explorer/${connectorId}/schemas/${schemaName}/functions/${objectName}/ddl`;
      
      const response = await api.get(endpoint);
      setCode(response.data.ddl || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName}.${objectName}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {objectType === 'view' ? 'View Definition' : 'Function Code'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {schemaName}.{objectName}
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-red-600">{error}</div>
          </div>
        ) : (
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="h-96">
              <Editor
                height="100%"
                language="sql"
                value={code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={loading || !!error}
            className="gap-2"
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
            variant="outline"
            onClick={handleDownload}
            disabled={loading || !!error}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

