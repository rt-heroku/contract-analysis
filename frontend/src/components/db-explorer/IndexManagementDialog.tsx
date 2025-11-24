import React, { useState, useEffect } from 'react';
import { Plus, Trash, X, Key, Info } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/utils/helpers';

interface Index {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
  indexType: string;
}

interface IndexManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIndex: (data: { name: string; columns: string[]; isUnique: boolean }) => void;
  onDropIndex: (indexName: string) => void;
  tableName: string;
  schemaName: string;
  existingIndexes: Index[];
  columns: Array<{ name: string; dataType: string }>;
  isLoading?: boolean;
}

export const IndexManagementDialog: React.FC<IndexManagementDialogProps> = ({
  isOpen,
  onClose,
  onCreateIndex,
  onDropIndex,
  tableName,
  schemaName,
  existingIndexes,
  columns,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [indexName, setIndexName] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isUnique, setIsUnique] = useState(false);
  const [selectedIndexToDrop, setSelectedIndexToDrop] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setIndexName('');
      setSelectedColumns([]);
      setIsUnique(false);
      setSelectedIndexToDrop('');
      setErrors({});
      setActiveTab('create');
    }
  }, [isOpen]);

  const validateCreateIndex = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!indexName.trim()) {
      newErrors.name = 'Index name is required';
    }

    if (existingIndexes.some(idx => idx.name.toLowerCase() === indexName.toLowerCase())) {
      newErrors.name = 'Index name already exists';
    }

    if (selectedColumns.length === 0) {
      newErrors.columns = 'At least one column must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateIndex = () => {
    if (!validateCreateIndex()) return;

    onCreateIndex({
      name: indexName.trim(),
      columns: selectedColumns,
      isUnique,
    });
  };

  const handleDropIndex = () => {
    if (!selectedIndexToDrop) {
      setErrors({ drop: 'Please select an index to drop' });
      return;
    }

    const index = existingIndexes.find(idx => idx.name === selectedIndexToDrop);
    if (index?.isPrimary) {
      setErrors({ drop: 'Cannot drop primary key index' });
      return;
    }

    onDropIndex(selectedIndexToDrop);
  };

  const toggleColumn = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter(c => c !== columnName));
    } else {
      setSelectedColumns([...selectedColumns, columnName]);
    }
  };

  const generateIndexName = () => {
    if (selectedColumns.length === 0) return;
    const suffix = isUnique ? 'unique_idx' : 'idx';
    const columnsPart = selectedColumns.join('_');
    const name = `${tableName}_${columnsPart}_${suffix}`;
    setIndexName(name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Manage Indexes: {schemaName}.{tableName}
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
            onClick={() => setActiveTab('create')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'create'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            Create Index
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'manage'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            Existing Indexes ({existingIndexes.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              {/* Info Box */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Tip:</strong> Indexes improve query performance but use disk space. Create indexes on columns frequently used in WHERE, JOIN, and ORDER BY clauses.
                </div>
              </div>

              {/* Index Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Index Name *
                  </label>
                  <button
                    onClick={generateIndexName}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    disabled={selectedColumns.length === 0}
                  >
                    Auto-generate
                  </button>
                </div>
                <input
                  type="text"
                  value={indexName}
                  onChange={(e) => setIndexName(e.target.value)}
                  placeholder="idx_users_email"
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

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Columns * <span className="text-xs text-gray-500">(select one or more)</span>
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {columns.map((column) => (
                    <label
                      key={column.name}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column.name)}
                        onChange={() => toggleColumn(column.name)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {column.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {column.dataType}
                        </div>
                      </div>
                      {selectedColumns.includes(column.name) && (
                        <Badge variant="info">
                          #{selectedColumns.indexOf(column.name) + 1}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
                {errors.columns && (
                  <p className="mt-1 text-sm text-red-600">{errors.columns}</p>
                )}
                {selectedColumns.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Selected order: {selectedColumns.join(', ')}
                  </p>
                )}
              </div>

              {/* Unique Constraint */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnique}
                    onChange={(e) => setIsUnique(e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Unique Index
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Prevents duplicate values in indexed columns
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {existingIndexes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No indexes found. Create one to improve query performance.
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {existingIndexes.map((index) => (
                      <div
                        key={index.name}
                        className={cn(
                          'p-4 border rounded-lg',
                          selectedIndexToDrop === index.name
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700',
                          index.isPrimary && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Key className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {index.name}
                              </span>
                              {index.isPrimary && (
                                <Badge variant="info">PRIMARY KEY</Badge>
                              )}
                              {index.isUnique && !index.isPrimary && (
                                <Badge variant="success">UNIQUE</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                              Columns: {index.columns.join(', ')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                              Type: {index.indexType || 'B-tree'}
                            </div>
                          </div>
                          {!index.isPrimary && (
                            <button
                              onClick={() => setSelectedIndexToDrop(index.name === selectedIndexToDrop ? '' : index.name)}
                              className={cn(
                                'flex-shrink-0 p-2 rounded transition-colors',
                                selectedIndexToDrop === index.name
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                              )}
                              title="Select to drop"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.drop && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.drop}</p>
                    </div>
                  )}
                </>
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
            Close
          </Button>
          {activeTab === 'create' ? (
            <Button
              variant="primary"
              onClick={handleCreateIndex}
              disabled={isLoading || selectedColumns.length === 0}
            >
              {isLoading ? 'Creating...' : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Create Index
                </>
              )}
            </Button>
          ) : selectedIndexToDrop && (
            <Button
              variant="danger"
              onClick={handleDropIndex}
              disabled={isLoading}
            >
              {isLoading ? 'Dropping...' : (
                <>
                  <Trash className="w-4 h-4 mr-1" />
                  Drop Index
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

