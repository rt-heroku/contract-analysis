import React, { useState, useEffect } from 'react';
import { Plus, Trash, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/helpers';

interface Column {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
}

interface AlterTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (column: any) => void;
  onDropColumn: (columnName: string) => void;
  tableName: string;
  schemaName: string;
  existingColumns: Column[];
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
];

export const AlterTableDialog: React.FC<AlterTableDialogProps> = ({
  isOpen,
  onClose,
  onAddColumn,
  onDropColumn,
  tableName,
  schemaName,
  existingColumns,
  isLoading = false,
}) => {
  // Ensure existingColumns is always an array
  const safeExistingColumns = Array.isArray(existingColumns) ? existingColumns : [];
  
  const [activeTab, setActiveTab] = useState<'add' | 'drop'>('add');
  const [newColumn, setNewColumn] = useState({
    name: '',
    dataType: 'VARCHAR',
    length: '',
    precision: '',
    scale: '',
    isNotNull: false,
    isUnique: false,
    defaultValue: '',
  });
  const [selectedColumnToDrop, setSelectedColumnToDrop] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setNewColumn({
        name: '',
        dataType: 'VARCHAR',
        length: '',
        precision: '',
        scale: '',
        isNotNull: false,
        isUnique: false,
        defaultValue: '',
      });
      setSelectedColumnToDrop('');
      setErrors({});
      setActiveTab('add');
    }
  }, [isOpen]);

  const needsLength = (dataType: string) => {
    return ['VARCHAR', 'CHAR'].includes(dataType);
  };

  const needsPrecisionScale = (dataType: string) => {
    return ['DECIMAL', 'NUMERIC'].includes(dataType);
  };

  const validateAddColumn = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newColumn.name.trim()) {
      newErrors.name = 'Column name is required';
    }

    if (safeExistingColumns.some(col => col.name.toLowerCase() === newColumn.name.toLowerCase())) {
      newErrors.name = 'Column name already exists';
    }

    if (needsLength(newColumn.dataType) && !newColumn.length) {
      newErrors.length = 'Length is required for this data type';
    }

    if (needsPrecisionScale(newColumn.dataType)) {
      if (!newColumn.precision) {
        newErrors.precision = 'Precision is required';
      }
      if (!newColumn.scale) {
        newErrors.scale = 'Scale is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddColumn = () => {
    if (!validateAddColumn()) return;

    const column = {
      name: newColumn.name.trim(),
      dataType: newColumn.dataType,
      length: newColumn.length || undefined,
      precision: newColumn.precision || undefined,
      scale: newColumn.scale || undefined,
      isNotNull: newColumn.isNotNull,
      isUnique: newColumn.isUnique,
      defaultValue: newColumn.defaultValue || undefined,
    };

    onAddColumn(column);
  };

  const handleDropColumn = () => {
    if (!selectedColumnToDrop) {
      setErrors({ drop: 'Please select a column to drop' });
      return;
    }

    const column = safeExistingColumns.find(c => c.name === selectedColumnToDrop);
    if (column?.isPrimaryKey) {
      setErrors({ drop: 'Cannot drop primary key column' });
      return;
    }

    onDropColumn(selectedColumnToDrop);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Alter Table: {schemaName}.{tableName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'add'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            Add Column
          </button>
          <button
            onClick={() => setActiveTab('drop')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'drop'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            Drop Column
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'add' ? (
            <div className="space-y-4">
              {/* Column Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Column Name *
                </label>
                <input
                  type="text"
                  value={newColumn.name}
                  onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                  placeholder="new_column"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100',
                    errors.name && 'border-red-500'
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Data Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Type
                  </label>
                  <select
                    value={newColumn.dataType}
                    onChange={(e) => setNewColumn({ ...newColumn, dataType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    {DATA_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Length/Precision */}
                {needsLength(newColumn.dataType) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Length *
                    </label>
                    <input
                      type="text"
                      value={newColumn.length}
                      onChange={(e) => setNewColumn({ ...newColumn, length: e.target.value })}
                      placeholder="255"
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600',
                        errors.length && 'border-red-500'
                      )}
                    />
                    {errors.length && (
                      <p className="mt-1 text-sm text-red-600">{errors.length}</p>
                    )}
                  </div>
                )}

                {needsPrecisionScale(newColumn.dataType) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Precision *
                      </label>
                      <input
                        type="text"
                        value={newColumn.precision}
                        onChange={(e) => setNewColumn({ ...newColumn, precision: e.target.value })}
                        placeholder="10"
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600',
                          errors.precision && 'border-red-500'
                        )}
                      />
                      {errors.precision && (
                        <p className="mt-1 text-sm text-red-600">{errors.precision}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scale *
                      </label>
                      <input
                        type="text"
                        value={newColumn.scale}
                        onChange={(e) => setNewColumn({ ...newColumn, scale: e.target.value })}
                        placeholder="2"
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600',
                          errors.scale && 'border-red-500'
                        )}
                      />
                      {errors.scale && (
                        <p className="mt-1 text-sm text-red-600">{errors.scale}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Default Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  value={newColumn.defaultValue}
                  onChange={(e) => setNewColumn({ ...newColumn, defaultValue: e.target.value })}
                  placeholder="NULL"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newColumn.isNotNull}
                    onChange={(e) => setNewColumn({ ...newColumn, isNotNull: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NOT NULL</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newColumn.isUnique}
                    onChange={(e) => setNewColumn({ ...newColumn, isUnique: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">UNIQUE</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> Dropping a column will permanently delete all data in that column. This action cannot be undone.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Column to Drop
                </label>
                <select
                  value={selectedColumnToDrop}
                  onChange={(e) => setSelectedColumnToDrop(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">-- Select a column --</option>
                  {safeExistingColumns.map(col => (
                    <option
                      key={col.name}
                      value={col.name}
                      disabled={col.isPrimaryKey}
                    >
                      {col.name} ({col.dataType}){col.isPrimaryKey ? ' - PRIMARY KEY (cannot drop)' : ''}
                    </option>
                  ))}
                </select>
                {errors.drop && (
                  <p className="mt-1 text-sm text-red-600">{errors.drop}</p>
                )}
              </div>

              {selectedColumnToDrop && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {(() => {
                    const col = safeExistingColumns.find(c => c.name === selectedColumnToDrop);
                    return col ? (
                      <div className="text-sm space-y-1">
                        <div><strong>Name:</strong> {col.name}</div>
                        <div><strong>Type:</strong> {col.dataType}</div>
                        <div><strong>Nullable:</strong> {col.isNullable ? 'Yes' : 'No'}</div>
                        {col.defaultValue && <div><strong>Default:</strong> {col.defaultValue}</div>}
                        {col.isPrimaryKey && (
                          <div className="text-blue-600 dark:text-blue-400"><strong>Primary Key</strong></div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}
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
            variant={activeTab === 'drop' ? 'danger' : 'primary'}
            onClick={activeTab === 'add' ? handleAddColumn : handleDropColumn}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (
              <>
                {activeTab === 'add' ? (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Column
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4 mr-1" />
                    Drop Column
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

