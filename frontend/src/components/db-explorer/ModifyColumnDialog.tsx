import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

interface ModifyColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (modifications: ColumnModifications) => Promise<void>;
  column: {
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue?: string;
  } | null;
  isLoading?: boolean;
}

interface ColumnModifications {
  newName?: string;
  dataType?: string;
  nullable?: boolean;
  defaultValue?: string | null;
}

export const ModifyColumnDialog: React.FC<ModifyColumnDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  column,
  isLoading = false,
}) => {
  const [newName, setNewName] = useState('');
  const [dataType, setDataType] = useState('');
  const [nullable, setNullable] = useState(true);
  const [defaultValue, setDefaultValue] = useState('');
  const [hasDefault, setHasDefault] = useState(false);

  useEffect(() => {
    if (column && isOpen) {
      setNewName(column.name);
      setDataType(column.dataType);
      setNullable(column.nullable);
      setDefaultValue(column.defaultValue || '');
      setHasDefault(!!column.defaultValue);
    }
  }, [column, isOpen]);

  const handleSubmit = async () => {
    if (!column) return;

    const modifications: ColumnModifications = {};
    
    // Only include changed values
    if (newName !== column.name) {
      modifications.newName = newName;
    }
    
    if (dataType !== column.dataType) {
      modifications.dataType = dataType;
    }
    
    if (nullable !== column.nullable) {
      modifications.nullable = nullable;
    }
    
    if (hasDefault) {
      if (defaultValue !== column.defaultValue) {
        modifications.defaultValue = defaultValue || null;
      }
    } else if (column.defaultValue) {
      modifications.defaultValue = null;
    }

    await onSubmit(modifications);
  };

  const commonDataTypes = [
    'integer',
    'bigint',
    'smallint',
    'numeric',
    'decimal',
    'real',
    'double precision',
    'serial',
    'bigserial',
    'text',
    'varchar',
    'char',
    'boolean',
    'date',
    'timestamp',
    'timestamptz',
    'time',
    'timetz',
    'interval',
    'uuid',
    'json',
    'jsonb',
    'bytea',
    'array',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Modify Column</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Modify properties of column: {column?.name}
          </p>
        </div>

        <div className="space-y-4">
          {/* Column Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Column Name
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="column_name"
              disabled={isLoading}
            />
          </div>

          {/* Data Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Type
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {commonDataTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Note: Changing data type may fail if data is incompatible
            </p>
          </div>

          {/* Nullable */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="nullable"
              checked={nullable}
              onChange={(e) => setNullable(e.target.checked)}
              disabled={isLoading}
              className="mt-1 rounded"
            />
            <label htmlFor="nullable" className="cursor-pointer flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">Allow NULL values</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                If unchecked, column will be NOT NULL
              </div>
            </label>
          </div>

          {/* Default Value */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="hasDefault"
              checked={hasDefault}
              onChange={(e) => setHasDefault(e.target.checked)}
              disabled={isLoading}
              className="mt-1 rounded"
            />
            <label htmlFor="hasDefault" className="cursor-pointer flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">Has default value</div>
            </label>
          </div>

          {hasDefault && (
            <div className="ml-7">
              <Input
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="e.g., 0, 'value', NOW()"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use SQL syntax (e.g., 'text' for strings, NOW() for timestamps)
              </p>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Warning:</strong> Modifying column properties may fail if existing data is incompatible.
            Consider backing up data before proceeding.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !newName || !dataType}>
            {isLoading ? 'Modifying...' : 'Modify Column'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

