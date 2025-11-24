import React, { useState } from 'react';
import { Plus, Trash, X, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/helpers';

interface Column {
  id: string;
  name: string;
  dataType: string;
  length?: string;
  precision?: string;
  scale?: string;
  isNotNull: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue?: string;
}

interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    tableName: string;
    schemaName: string;
    columns: Column[];
    primaryKey: string[];
  }) => void;
  schemaName: string;
  isLoading?: boolean;
}

const DATA_TYPES = [
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  'SERIAL',
  'BIGSERIAL',
  'DECIMAL',
  'NUMERIC',
  'REAL',
  'DOUBLE PRECISION',
  'VARCHAR',
  'CHAR',
  'TEXT',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'TIME',
  'INTERVAL',
  'JSON',
  'JSONB',
  'UUID',
  'BYTEA',
  'ARRAY',
];

export const CreateTableDialog: React.FC<CreateTableDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  schemaName,
  isLoading = false,
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    {
      id: '1',
      name: '',
      dataType: 'INTEGER',
      isNotNull: false,
      isPrimaryKey: false,
      isUnique: false,
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: '',
      dataType: 'VARCHAR',
      isNotNull: false,
      isPrimaryKey: false,
      isUnique: false,
    };
    setColumns([...columns, newColumn]);
  };

  const removeColumn = (id: string) => {
    if (columns.length > 1) {
      setColumns(columns.filter(col => col.id !== id));
    }
  };

  const updateColumn = (id: string, field: keyof Column, value: any) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, [field]: value } : col
    ));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    }

    columns.forEach((col, index) => {
      if (!col.name.trim()) {
        newErrors[`col_${index}_name`] = 'Column name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const primaryKeyColumns = columns.filter(col => col.isPrimaryKey).map(col => col.name);

    onSubmit({
      tableName: tableName.trim(),
      schemaName,
      columns: columns.map(col => ({
        ...col,
        name: col.name.trim(),
      })),
      primaryKey: primaryKeyColumns,
    });
  };

  const needsLength = (dataType: string) => {
    return ['VARCHAR', 'CHAR'].includes(dataType);
  };

  const needsPrecisionScale = (dataType: string) => {
    return ['DECIMAL', 'NUMERIC'].includes(dataType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create Table in "{schemaName}"
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Table Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Table Name *
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="users"
              className={cn(
                'w-full px-3 py-2 border rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100',
                errors.tableName && 'border-red-500'
              )}
            />
            {errors.tableName && (
              <p className="mt-1 text-sm text-red-600">{errors.tableName}</p>
            )}
          </div>

          {/* Columns */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Columns
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={addColumn}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Column
              </Button>
            </div>

            <div className="space-y-3">
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                >
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    {/* Column Name */}
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                        placeholder="column_name"
                        className={cn(
                          'w-full px-2 py-1 text-sm border rounded',
                          'dark:bg-gray-800 dark:border-gray-600',
                          errors[`col_${index}_name`] && 'border-red-500'
                        )}
                      />
                    </div>

                    {/* Data Type */}
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={column.dataType}
                        onChange={(e) => updateColumn(column.id, 'dataType', e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                      >
                        {DATA_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Length/Precision */}
                    {needsLength(column.dataType) && (
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Length
                        </label>
                        <input
                          type="text"
                          value={column.length || ''}
                          onChange={(e) => updateColumn(column.id, 'length', e.target.value)}
                          placeholder="255"
                          className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                    )}

                    {needsPrecisionScale(column.dataType) && (
                      <>
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Precision
                          </label>
                          <input
                            type="text"
                            value={column.precision || ''}
                            onChange={(e) => updateColumn(column.id, 'precision', e.target.value)}
                            placeholder="10"
                            className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Scale
                          </label>
                          <input
                            type="text"
                            value={column.scale || ''}
                            onChange={(e) => updateColumn(column.id, 'scale', e.target.value)}
                            placeholder="2"
                            className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                          />
                        </div>
                      </>
                    )}

                    {/* Default Value */}
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Default
                      </label>
                      <input
                        type="text"
                        value={column.defaultValue || ''}
                        onChange={(e) => updateColumn(column.id, 'defaultValue', e.target.value)}
                        placeholder="NULL"
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="col-span-1 flex items-end">
                      <button
                        onClick={() => removeColumn(column.id)}
                        disabled={columns.length === 1}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={column.isNotNull}
                        onChange={(e) => updateColumn(column.id, 'isNotNull', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">NOT NULL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={column.isPrimaryKey}
                        onChange={(e) => updateColumn(column.id, 'isPrimaryKey', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Primary Key</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={column.isUnique}
                        onChange={(e) => updateColumn(column.id, 'isUnique', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Unique</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Create Table
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

