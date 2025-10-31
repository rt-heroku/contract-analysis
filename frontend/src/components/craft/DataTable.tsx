import React from 'react';
import { useNode } from '@craftjs/core';
import { useProcessData } from '@/hooks/useProcessData';

interface DataTableProps {
  dataPath?: string;
  columns?: Array<{ key: string; label: string }>;
  title?: string;
}

export const DataTable: React.FC<DataTableProps> & { craft?: any } = ({ 
  dataPath = '', 
  columns = [], 
  title = '' 
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const data = useProcessData(dataPath);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} p-4`}
    >
      {title && (
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      
      {columns.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(data) && data.length > 0 ? (
                data.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      >
                        {row[col.key] !== undefined ? String(row[col.key]) : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Configure columns in the settings panel →
          </p>
        </div>
      )}
    </div>
  );
};

DataTable.craft = {
  displayName: 'Data Table',
  props: {
    dataPath: '',
    columns: [],
    title: '',
  },
  rules: {
    canDrag: () => true,
  },
};

