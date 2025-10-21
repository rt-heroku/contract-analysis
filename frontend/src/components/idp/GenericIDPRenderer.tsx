import React from 'react';
import { Card } from '@/components/common/Card';
import {
  AlertCircle, Package, List
} from 'lucide-react';

interface GenericIDPRendererProps {
  data: any;
}

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  
  if (typeof value === 'number') {
    // Check if it looks like currency
    if (value > 0 && value < 1000000) {
      return `$${value.toFixed(2)}`;
    }
    return value.toString();
  }

  return String(value);
};

const renderValue = (value: any, _key?: string): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 text-sm italic">N/A</span>;
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 text-sm italic">No data</span>;
      }
      // If it's an array of objects, render as a table
      if (typeof value[0] === 'object' && value[0] !== null) {
        const headers = Object.keys(value[0]).filter(h => h !== '__typename');
        return (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {formatKey(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {value.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-3 py-3 text-sm text-gray-700">
                        {renderValue(row[header], header)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Array of primitives
      return (
        <ul className="space-y-1 mt-2">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span className="text-gray-700">{renderValue(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    // Regular object
    return (
      <div className="space-y-3 pl-4 border-l-2 border-blue-200 mt-2">
        {Object.entries(value).map(([subKey, subValue]) => (
          <div key={subKey}>
            <div className="flex items-center gap-2 mb-1">
              {getIcon(subKey)}
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {formatKey(subKey)}
              </p>
            </div>
            <div className="text-sm text-gray-900 ml-6">
              {renderValue(subValue, subKey)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm text-gray-900 font-medium">{formatValue(value)}</span>;
};

export const GenericIDPRenderer: React.FC<GenericIDPRendererProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No IDP response data available.</p>
      </div>
    );
  }

  // Check for the new paginated format
  const isPaginated = Array.isArray(data.pages) && data.pages.length > 0;

  return (
    <div className="space-y-4">
      {isPaginated ? (
        // Paginated format
        data.pages.map((pageData: any, pageIndex: number) => (
          <div key={pageIndex} className="space-y-4">

            {/* Fields Section */}
            {pageData.fields && Object.keys(pageData.fields).length > 0 && (
              <Card>
                <div className="p-6">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <List className="w-5 h-5 text-primary-600" />
                    {pageData.page ? `Page ${pageData.page} - ` : ''}Extracted Fields
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(pageData.fields).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-gray-600 mb-1">{formatKey(key)}</p>
                        <div>{renderValue(value, key)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Tables Section */}
            {pageData.tables && Object.keys(pageData.tables).length > 0 && (
              Object.entries(pageData.tables).map(([tableName, tableData]: [string, any], tableIndex: number) => (
                <Card key={tableIndex}>
                  <div className="p-6">
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary-600" />
                      {formatKey(tableName)}
                    </h4>
                    {renderValue(tableData, tableName)}
                  </div>
                </Card>
              ))
            )}
          </div>
        ))
      ) : (
        // Fallback for old flat format
        <Card>
          <div className="p-6">
            <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-primary-600" />
              Extracted Data
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data).map(([key, value]) => {
                // Exclude already handled fields
                if (['id', 'documentName', 'status', 'documentSummary', 'pages'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key}>
                    <p className="text-sm text-gray-600 mb-1">{formatKey(key)}</p>
                    <div>{renderValue(value, key)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

    </div>
  );
};
