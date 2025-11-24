import React, { useState, useRef } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Upload, File, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface DataImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  connectorId: number;
  schemaName: string;
  tableName: string;
  columns: Array<{
    name: string;
    dataType: string;
    nullable: boolean;
  }>;
}

interface ImportOptions {
  conflictResolution: 'insert' | 'update' | 'skip';
  primaryKeyColumn?: string;
  batchSize: number;
  validateData: boolean;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export const DataImportDialog: React.FC<DataImportDialogProps> = ({
  isOpen,
  onClose,
  connectorId,
  schemaName,
  tableName,
  columns,
}) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    conflictResolution: 'insert',
    batchSize: 100,
    validateData: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'json') {
      alert('Please select a CSV or JSON file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile, extension as 'csv' | 'json');
  };

  const parseFile = (file: File, type: 'csv' | 'json') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (type === 'csv') {
        parseCSV(content);
      } else {
        parseJSON(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have at least a header row and one data row');
      return;
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    setHeaders(headers);

    // Parse data
    const data = lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      const row: any = { _rowNumber: index + 2 };
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    setParsedData(data);
    
    // Auto-map columns with same names
    const mapping: Record<string, string> = {};
    headers.forEach(header => {
      const matchingColumn = columns.find(col => 
        col.name.toLowerCase() === header.toLowerCase()
      );
      if (matchingColumn) {
        mapping[header] = matchingColumn.name;
      }
    });
    setColumnMapping(mapping);
    
    setStep(2);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseJSON = (content: string) => {
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        alert('JSON must be an array of objects');
        return;
      }

      if (data.length === 0) {
        alert('JSON array is empty');
        return;
      }

      // Extract headers from first object
      const headers = Object.keys(data[0]);
      setHeaders(headers);
      
      // Add row numbers
      const dataWithRows = data.map((row, index) => ({
        ...row,
        _rowNumber: index + 1,
      }));
      setParsedData(dataWithRows);

      // Auto-map columns
      const mapping: Record<string, string> = {};
      headers.forEach(header => {
        const matchingColumn = columns.find(col => 
          col.name.toLowerCase() === header.toLowerCase()
        );
        if (matchingColumn) {
          mapping[header] = matchingColumn.name;
        }
      });
      setColumnMapping(mapping);

      setStep(2);
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Transform data according to column mapping
      const mappedData = parsedData.map(row => {
        const mapped: any = {};
        Object.entries(columnMapping).forEach(([sourceCol, targetCol]) => {
          if (targetCol) {
            mapped[targetCol] = row[sourceCol];
          }
        });
        return mapped;
      });

      const response = await api.post(
        `/db-explorer/${connectorId}/data/import`,
        {
          schemaName,
          tableName,
          data: mappedData,
          options,
        }
      );

      setImportResult(response.data);
      setStep(4);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setStep(1);
      setFile(null);
      setParsedData([]);
      setHeaders([]);
      setColumnMapping({});
      setImportResult(null);
      onClose();
    }
  };

  const getMappedColumnsCount = () => {
    return Object.values(columnMapping).filter(v => v).length;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Data</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {schemaName}.{tableName}
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${file
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                {file ? (
                  <>
                    <File className="w-12 h-12 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-300">{file.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {parsedData.length} rows • {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div>
                      <p className="font-semibold">Click to upload CSV or JSON file</p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Map Columns</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getMappedColumnsCount()} of {headers.length} mapped
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{header}</div>
                    <div className="text-xs text-gray-500">
                      Sample: {parsedData[0]?.[header]?.toString().slice(0, 30)}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <select
                    value={columnMapping[header] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Skip --</option>
                    {columns.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name} ({col.dataType})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Options & Preview */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Import Options</h3>

            {/* Conflict Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conflict Resolution
              </label>
              <select
                value={options.conflictResolution}
                onChange={(e) => setOptions({ ...options, conflictResolution: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="insert">Insert Only (fail on conflict)</option>
                <option value="update">Update on Conflict</option>
                <option value="skip">Skip on Conflict</option>
              </select>
            </div>

            {/* Batch Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                value={options.batchSize}
                onChange={(e) => setOptions({ ...options, batchSize: parseInt(e.target.value) || 100 })}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Rows per transaction (1-1000)</p>
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Preview (first 5 rows)</h4>
              <div className="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      {Object.values(columnMapping).filter(v => v).map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                        {Object.entries(columnMapping)
                          .filter(([_, target]) => target)
                          .map(([source]) => (
                            <td key={source} className="px-3 py-2">
                              {row[source]?.toString() || ''}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && importResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              importResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>Total Rows: {importResult.totalRows}</div>
                    <div className="text-green-700 dark:text-green-300">
                      Inserted: {importResult.insertedRows}
                    </div>
                    {importResult.updatedRows > 0 && (
                      <div className="text-blue-700 dark:text-blue-300">
                        Updated: {importResult.updatedRows}
                      </div>
                    )}
                    {importResult.skippedRows > 0 && (
                      <div className="text-yellow-700 dark:text-yellow-300">
                        Skipped: {importResult.skippedRows}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Errors:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-sm"
                    >
                      <div className="font-semibold text-red-900 dark:text-red-300">
                        Row {error.row}
                      </div>
                      <div className="mt-1 text-red-700 dark:text-red-400">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          {step > 1 && step < 4 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={importing}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          {step < 3 && step > 1 && (
            <Button onClick={() => setStep(step + 1)} disabled={getMappedColumnsCount() === 0}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 3 && (
            <Button onClick={handleImport} disabled={importing || getMappedColumnsCount() === 0}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Data'
              )}
            </Button>
          )}

          {step === 4 && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}

          {step === 1 && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

