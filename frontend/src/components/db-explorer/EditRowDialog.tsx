import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/helpers';

interface EditRowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  columns: Array<{ name: string; dataType: string; isNullable: boolean; isPrimaryKey: boolean }>;
  initialData?: Record<string, any>;
  tableName: string;
  schemaName: string;
  isLoading?: boolean;
  mode: 'add' | 'edit';
}

export const EditRowDialog: React.FC<EditRowDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  columns,
  initialData,
  tableName,
  schemaName,
  isLoading = false,
  mode,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({ ...initialData });
      } else {
        // Initialize with empty values for add mode
        const emptyData: Record<string, any> = {};
        columns.forEach(col => {
          emptyData[col.name] = col.isNullable ? null : '';
        });
        setFormData(emptyData);
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData, columns]);

  const handleChange = (columnName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: value === '' ? null : value,
    }));
    // Clear error for this field
    if (errors[columnName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[columnName];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    columns.forEach(col => {
      const value = formData[col.name];
      
      // Check required fields (NOT NULL and no default)
      if (!col.isNullable && (value === null || value === '' || value === undefined)) {
        newErrors[col.name] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Clean data - remove primary key if in edit mode (can't update PK)
    const submitData = { ...formData };
    if (mode === 'edit') {
      columns.forEach(col => {
        if (col.isPrimaryKey) {
          delete submitData[col.name];
        }
      });
    }

    onSubmit(submitData);
  };

  const getInputType = (dataType: string): string => {
    const type = dataType.toUpperCase();
    
    if (type.includes('INT') || type.includes('SERIAL')) return 'number';
    if (type.includes('DECIMAL') || type.includes('NUMERIC') || type.includes('REAL') || type.includes('DOUBLE')) return 'number';
    if (type.includes('BOOL')) return 'checkbox';
    if (type.includes('DATE')) return 'date';
    if (type.includes('TIME')) return 'time';
    if (type === 'JSON' || type === 'JSONB') return 'textarea';
    if (type === 'TEXT') return 'textarea';
    
    return 'text';
  };

  const renderInput = (column: { name: string; dataType: string; isNullable: boolean; isPrimaryKey: boolean }) => {
    const inputType = getInputType(column.dataType);
    const value = formData[column.name];
    const isDisabled = mode === 'edit' && column.isPrimaryKey; // Can't edit primary key

    if (inputType === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={value === true || value === 't' || value === 'true'}
          onChange={(e) => handleChange(column.name, e.target.checked)}
          disabled={isDisabled}
          className="rounded"
        />
      );
    }

    if (inputType === 'textarea') {
      return (
        <textarea
          value={value ?? ''}
          onChange={(e) => handleChange(column.name, e.target.value)}
          disabled={isDisabled}
          rows={4}
          placeholder={column.isNullable ? 'NULL' : ''}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
            errors[column.name] && 'border-red-500',
            isDisabled && 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed'
          )}
        />
      );
    }

    return (
      <input
        type={inputType}
        value={value ?? ''}
        onChange={(e) => handleChange(column.name, e.target.value)}
        disabled={isDisabled}
        step={inputType === 'number' && column.dataType.includes('DECIMAL') ? '0.01' : undefined}
        placeholder={column.isNullable ? 'NULL' : ''}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100',
          errors[column.name] && 'border-red-500',
          isDisabled && 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed'
        )}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'add' ? 'Add Row' : 'Edit Row'} - {schemaName}.{tableName}
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
          <div className="space-y-4">
            {columns.map(column => (
              <div key={column.name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {column.name}
                  {!column.isNullable && <span className="text-red-500 ml-1">*</span>}
                  {column.isPrimaryKey && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(PK)</span>}
                  {mode === 'edit' && column.isPrimaryKey && (
                    <span className="ml-2 text-xs text-gray-500">(read-only)</span>
                  )}
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {column.dataType}
                </div>
                {renderInput(column)}
                {errors[column.name] && (
                  <p className="mt-1 text-sm text-red-600">{errors[column.name]}</p>
                )}
              </div>
            ))}
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
            {isLoading ? (mode === 'add' ? 'Adding...' : 'Saving...') : (
              <>
                <Check className="w-4 h-4 mr-1" />
                {mode === 'add' ? 'Add Row' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

