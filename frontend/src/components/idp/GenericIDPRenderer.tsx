import React from 'react';
import { Card } from '@/components/common/Card';
import {
  FileText, AlertCircle, Building, MapPin, Phone,
  Package, Info, List, DollarSign, Mail,
  Truck, Globe, User, Home, Flag
} from 'lucide-react';

interface GenericIDPRendererProps {
  data: any;
}

const getIcon = (key: string) => {
  const lowerKey = key.toLowerCase();
  
  if (lowerKey.includes('email')) return <Mail className="w-4 h-4 text-blue-600" />;
  if (lowerKey.includes('phone')) return <Phone className="w-4 h-4 text-green-600" />;
  if (lowerKey.includes('fob')) return <Truck className="w-4 h-4 text-orange-600" />;
  if (lowerKey.includes('tax')) return <DollarSign className="w-4 h-4 text-red-600" />;
  if (lowerKey.includes('total')) return <DollarSign className="w-4 h-4 text-green-600" />;
  if (lowerKey.includes('carrier')) return <Truck className="w-4 h-4 text-blue-600" />;
  if (lowerKey.includes('buyer') || lowerKey.includes('customer')) return <User className="w-4 h-4 text-purple-600" />;
  if (lowerKey.includes('bill') || lowerKey.includes('ship')) return <Home className="w-4 h-4 text-indigo-600" />;
  if (lowerKey.includes('address')) return <MapPin className="w-4 h-4 text-red-600" />;
  if (lowerKey.includes('city')) return <Building className="w-4 h-4 text-blue-600" />;
  if (lowerKey.includes('state')) return <Flag className="w-4 h-4 text-indigo-600" />;
  if (lowerKey.includes('country')) return <Globe className="w-4 h-4 text-green-600" />;
  if (lowerKey.includes('zip')) return <MapPin className="w-4 h-4 text-orange-600" />;
  if (lowerKey.includes('name')) return <User className="w-4 h-4 text-gray-600" />;
  
  return <Info className="w-4 h-4 text-gray-400" />;
};

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
      // If it's an array of objects, render as a styled table
      if (typeof value[0] === 'object' && value[0] !== null) {
        const headers = Object.keys(value[0]).filter(h => h !== '__typename');
        return (
          <div className="overflow-x-auto mt-3">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      {formatKey(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {value.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-blue-50 transition-colors">
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
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
    <div className="space-y-6">
      {isPaginated ? (
        // Paginated format
        data.pages.map((pageData: any, pageIndex: number) => (
          <div key={pageIndex} className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Page {pageData.page}</h3>
                <p className="text-sm text-gray-500">Extracted Information</p>
              </div>
            </div>

            {/* Fields Section */}
            {pageData.fields && Object.keys(pageData.fields).length > 0 && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <List className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-bold text-gray-900">Fields</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(pageData.fields).map(([key, value]) => (
                      <div key={key} className="group">
                        <div className="flex items-center gap-2 mb-2">
                          {getIcon(key)}
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {formatKey(key)}
                          </p>
                        </div>
                        <div className="pl-6 transition-all group-hover:pl-7">
                          {renderValue(value, key)}
                        </div>
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
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-orange-600" />
                      <h4 className="text-lg font-bold text-gray-900">{formatKey(tableName)}</h4>
                    </div>
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
            <div className="flex items-center gap-2 mb-6">
              <List className="w-5 h-5 text-blue-600" />
              <h4 className="text-lg font-bold text-gray-900">Extracted Data</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(data).map(([key, value]) => {
                // Exclude already handled fields
                if (['id', 'documentName', 'status', 'documentSummary', 'pages'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key} className="group">
                    <div className="flex items-center gap-2 mb-2">
                      {getIcon(key)}
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {formatKey(key)}
                      </p>
                    </div>
                    <div className="pl-6 transition-all group-hover:pl-7">
                      {renderValue(value, key)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Full Response - Collapsible */}
      {data && (
        <Card>
          <div className="p-6">
            <details className="cursor-pointer group">
              <summary className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                <FileText className="w-4 h-4" />
                <span>Full MuleSoft IDP Response (Raw JSON)</span>
                <span className="ml-auto text-xs text-gray-500 group-open:hidden">Click to expand</span>
                <span className="ml-auto text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
              </summary>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs mt-4 border border-gray-200 font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        </Card>
      )}
    </div>
  );
};
