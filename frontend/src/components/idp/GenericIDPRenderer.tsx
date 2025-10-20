import React from 'react';
import { FileText } from 'lucide-react';

interface GenericIDPRendererProps {
  data: any;
}

export const GenericIDPRenderer: React.FC<GenericIDPRendererProps> = ({ data }) => {
  // Format field names: camelCase or snake_case to Title Case
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/_/g, ' ') // Replace underscores with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  // Render a table from array of objects
  const renderTable = (data: any[], tableName?: string) => {
    if (!data || data.length === 0) {
      return <div className="text-gray-400 text-sm">No data</div>;
    }

    // Get all unique keys from all objects
    const allKeys = Array.from(
      new Set(data.flatMap(obj => Object.keys(obj)))
    );

    return (
      <div className="overflow-x-auto">
        {tableName && (
          <h6 className="text-sm font-medium text-gray-700 mb-2">{formatFieldName(tableName)}</h6>
        )}
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {allKeys.map(key => (
                <th
                  key={key}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {formatFieldName(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {allKeys.map(key => (
                  <td key={key} className="px-3 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {renderCellValue(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render a single cell value
  const renderCellValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">N/A</span>;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    }

    return String(value);
  };

  // Render a value (single, nested object, or array)
  const renderValue = (value: any, key?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">N/A</span>;
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="text-gray-400">No items</span>;
        }
        
        // If array contains objects, render as table
        if (typeof value[0] === 'object' && value[0] !== null) {
          return renderTable(value);
        }
        
        // Simple array of primitives
        return (
          <ul className="list-disc list-inside space-y-1">
            {value.map((item, idx) => (
              <li key={idx} className="text-gray-700">
                {String(item)}
              </li>
            ))}
          </ul>
        );
      }
      
      // Nested object
      return (
        <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4">
              <div className="font-medium text-gray-600 col-span-1">
                {formatFieldName(k)}:
              </div>
              <div className="col-span-2">
                {renderValue(v, k)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-gray-900">{String(value)}</span>;
  };

  // Render a single page with fields and tables
  const renderPage = (page: any, pageIdx: number) => {
    const pageNumber = page.page || pageIdx + 1;
    const fields = page.fields || {};
    const tables = page.tables || {};

    return (
      <div key={pageIdx} className="border border-gray-200 rounded-lg p-6 bg-white">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Page {pageNumber}
        </h4>

        {/* Fields Section */}
        {Object.keys(fields).length > 0 && (
          <div className="mb-6">
            <h5 className="text-md font-semibold text-gray-700 mb-3">Fields</h5>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {Object.entries(fields).map(([fieldKey, fieldValue]) => (
                <div key={fieldKey} className="grid grid-cols-3 gap-4">
                  <div className="font-medium text-gray-600 col-span-1">
                    {formatFieldName(fieldKey)}:
                  </div>
                  <div className="col-span-2">
                    {renderValue(fieldValue, fieldKey)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Section */}
        {Object.keys(tables).length > 0 && (
          <div>
            <h5 className="text-md font-semibold text-gray-700 mb-3">Tables</h5>
            <div className="space-y-4">
              {Object.entries(tables).map(([tableKey, tableData]) => (
                <div key={tableKey}>
                  {Array.isArray(tableData) && tableData.length > 0 ? (
                    renderTable(tableData, tableKey)
                  ) : (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-2">
                        {formatFieldName(tableKey)}
                      </h6>
                      <div className="text-gray-400 text-sm">No data</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main render logic
  if (!data) {
    return <div className="text-gray-400">No data available</div>;
  }

  // Check if data has pages (new format)
  if (data.pages && Array.isArray(data.pages)) {
    return (
      <div className="space-y-6">
        {data.pages.map((page: any, idx: number) => renderPage(page, idx))}
      </div>
    );
  }

  // Legacy format - render all fields as a single "page"
  const fieldsToRender = Object.entries(data).filter(
    ([key]) => !['id', 'documentName', 'status'].includes(key)
  );

  if (fieldsToRender.length === 0) {
    return <div className="text-gray-400">No extractable data found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Extracted Data</h4>
        <div className="space-y-4">
          {fieldsToRender.map(([key, value]) => (
            <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
              <h5 className="font-semibold text-gray-700 mb-2">{formatFieldName(key)}</h5>
              <div>{renderValue(value, key)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

