import React, { useState } from 'react';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { exportToCSV, exportToJSON, exportToSQL, exportToExcel, copyToClipboard } from '@/utils/dataExport';

interface ExportDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  tableName?: string;
  schemaName?: string;
  selectedRowsCount?: number;
}

type ExportFormat = 'csv' | 'json' | 'sql' | 'excel' | 'clipboard-csv' | 'clipboard-json' | 'clipboard-sql' | 'clipboard-tsv';

export const ExportDataDialog: React.FC<ExportDataDialogProps> = ({
  isOpen,
  onClose,
  data,
  tableName = 'exported_table',
  schemaName = 'public',
  selectedRowsCount = 0,
}) => {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [delimiter, setDelimiter] = useState(',');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [filename, setFilename] = useState('');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const rowCount = data.length;
  const exportCount = selectedRowsCount > 0 ? selectedRowsCount : rowCount;

  const handleExport = async () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);

    try {
      const actualDelimiter = delimiter === 'custom' ? customDelimiter : delimiter;
      const actualFilename = filename || `${tableName}_export`;

      switch (format) {
        case 'csv':
          exportToCSV(data, {
            filename: `${actualFilename}.csv`,
            includeHeaders,
            delimiter: actualDelimiter,
          });
          break;

        case 'json':
          exportToJSON(data, {
            filename: `${actualFilename}.json`,
          });
          break;

        case 'sql':
          exportToSQL(data, {
            filename: `${actualFilename}.sql`,
            tableName,
            schemaName,
          });
          break;

        case 'excel':
          exportToExcel(data, {
            filename: `${actualFilename}.xlsx`,
            includeHeaders,
          });
          break;

        case 'clipboard-csv':
          await copyToClipboard(data, 'csv');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;

        case 'clipboard-json':
          await copyToClipboard(data, 'json');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;

        case 'clipboard-sql':
          await copyToClipboard(data, 'sql');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;

        case 'clipboard-tsv':
          await copyToClipboard(data, 'tsv');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;
      }

      // Close dialog after successful export (except clipboard)
      if (!format.startsWith('clipboard-')) {
        setTimeout(() => onClose(), 500);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Export Data</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Exporting {exportCount} of {rowCount} rows
            {selectedRowsCount > 0 && ' (selected rows only)'}
          </p>
        </div>

        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                format === 'csv'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">CSV</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Comma-separated values</div>
            </button>

            <button
              onClick={() => setFormat('json')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                format === 'json'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">JSON</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">JavaScript Object Notation</div>
            </button>

            <button
              onClick={() => setFormat('sql')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                format === 'sql'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">SQL</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">INSERT statements</div>
            </button>

            <button
              onClick={() => setFormat('excel')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                format === 'excel'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">Excel</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Tab-separated (TSV)</div>
            </button>
          </div>
        </div>

        {/* Clipboard Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or Copy to Clipboard
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormat('clipboard-csv');
                handleExport();
              }}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" />
              CSV
              {copied && format === 'clipboard-csv' && <CheckCircle className="w-3 h-3 text-green-600" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormat('clipboard-json');
                handleExport();
              }}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" />
              JSON
              {copied && format === 'clipboard-json' && <CheckCircle className="w-3 h-3 text-green-600" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormat('clipboard-sql');
                handleExport();
              }}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" />
              SQL
              {copied && format === 'clipboard-sql' && <CheckCircle className="w-3 h-3 text-green-600" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormat('clipboard-tsv');
                handleExport();
              }}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-3 h-3" />
              TSV
              {copied && format === 'clipboard-tsv' && <CheckCircle className="w-3 h-3 text-green-600" />}
            </Button>
          </div>
        </div>

        {/* CSV/Excel Options */}
        {(format === 'csv' || format === 'excel') && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeHeaders"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="includeHeaders" className="text-sm text-gray-700 dark:text-gray-300">
                Include column headers
              </label>
            </div>

            {format === 'csv' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delimiter
                </label>
                <div className="flex gap-2">
                  <select
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=";">Semicolon (;)</option>
                    <option value="\t">Tab</option>
                    <option value="|">Pipe (|)</option>
                    <option value="custom">Custom</option>
                  </select>

                  {delimiter === 'custom' && (
                    <input
                      type="text"
                      value={customDelimiter}
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      placeholder="Enter delimiter"
                      maxLength={1}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SQL Options */}
        {format === 'sql' && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Table Name
              </label>
              <input
                type="text"
                value={tableName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schema
              </label>
              <input
                type="text"
                value={schemaName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            </div>
          </div>
        )}

        {/* Filename */}
        {!format.startsWith('clipboard-') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filename (optional)
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder={`${tableName}_export`}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!format.startsWith('clipboard-') && (
            <Button
              onClick={handleExport}
              disabled={exporting || data.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

