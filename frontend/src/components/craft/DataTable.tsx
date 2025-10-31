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

const DataTableSettings: React.FC = () => {
  const {
    actions: { setProp },
    title,
    dataPath,
    columns,
  } = useNode((node) => ({
    title: node.data.props.title,
    dataPath: node.data.props.dataPath,
    columns: node.data.props.columns,
  }));

  const [newColumnKey, setNewColumnKey] = React.useState('');
  const [newColumnLabel, setNewColumnLabel] = React.useState('');

  const handleAddColumn = () => {
    if (newColumnKey && newColumnLabel) {
      setProp((props: any) => {
        props.columns = [...(props.columns || []), { key: newColumnKey, label: newColumnLabel }];
      });
      setNewColumnKey('');
      setNewColumnLabel('');
    }
  };

  const handleRemoveColumn = (index: number) => {
    setProp((props: any) => {
      props.columns = props.columns.filter((_: any, i: number) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Table Configuration</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
              placeholder="Table Title"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Data Path</label>
            <input
              type="text"
              value={dataPath}
              onChange={(e) => setProp((props: any) => (props.dataPath = e.target.value))}
              placeholder="e.g., results.items"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Path to array data in process response
            </p>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Columns</h4>
        
        {/* Existing Columns */}
        {columns && columns.length > 0 && (
          <div className="space-y-2 mb-3">
            {columns.map((col: any, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{col.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Key: {col.key}</div>
                </div>
                <button
                  onClick={() => handleRemoveColumn(index)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Column */}
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Add Column</div>
          <div className="space-y-2">
            <input
              type="text"
              value={newColumnKey}
              onChange={(e) => setNewColumnKey(e.target.value)}
              placeholder="Column Key (e.g., name)"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
            <input
              type="text"
              value={newColumnLabel}
              onChange={(e) => setNewColumnLabel(e.target.value)}
              placeholder="Column Label (e.g., Full Name)"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
            <button
              onClick={handleAddColumn}
              disabled={!newColumnKey || !newColumnLabel}
              className="w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
            >
              Add Column
            </button>
          </div>
        </div>
      </div>
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
  related: {
    settings: DataTableSettings,
  },
};

