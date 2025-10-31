import React, { useState, useEffect } from 'react';
import { X, Zap, Hash, List } from 'lucide-react';

interface ParallelConfig {
  parallelType: 'count' | 'collection';
  count: number;
  collection: string;
  maxConcurrent: number;
}

interface ParallelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ParallelConfig) => void;
  initialConfig?: ParallelConfig;
}

export const ParallelConfigModal: React.FC<ParallelConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const [config, setConfig] = useState<ParallelConfig>(
    initialConfig || {
      parallelType: 'count',
      count: 5,
      collection: '[]',
      maxConcurrent: 20,
    }
  );

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configure Parallel Block</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Execute actions concurrently for faster processing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Parallel Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Parallel Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Count-based */}
              <button
                onClick={() => setConfig({ ...config, parallelType: 'count' })}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    config.parallelType === 'count'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Count-based</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Run a fixed number of parallel instances
                </p>
              </button>

              {/* Collection-based */}
              <button
                onClick={() => setConfig({ ...config, parallelType: 'collection' })}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    config.parallelType === 'collection'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <List className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Collection-based</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Process each item in a collection
                </p>
              </button>
            </div>
          </div>

          {/* Count Configuration */}
          {config.parallelType === 'count' && (
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Instances
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.count}
                onChange={(e) => setConfig({ ...config, count: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                placeholder="5"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Run the same actions <strong>{config.count}</strong> times concurrently
              </p>
            </div>
          )}

          {/* Collection Configuration */}
          {config.parallelType === 'collection' && (
            <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collection Expression
              </label>
              <textarea
                value={config.collection}
                onChange={(e) => setConfig({ ...config, collection: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm"
                placeholder='["item1", "item2", "item3"]'
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Array or object to distribute across parallel instances
              </p>
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Available variables inside parallel:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">parallel.currentItem</code> - Current item being processed</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">parallel.index</code> - Index of current instance (0-based)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">parallel.items</code> - Full collection</li>
                </ul>
              </div>
            </div>
          )}

          {/* Max Concurrent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Concurrent Executions
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.maxConcurrent}
              onChange={(e) =>
                setConfig({ ...config, maxConcurrent: Math.max(1, Math.min(20, parseInt(e.target.value) || 20)) })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
              placeholder="20"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Limit concurrent instances to prevent resource exhaustion (max: 20)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              How Parallel Blocks Work
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>All instances execute simultaneously (no guaranteed order)</li>
              <li>Each instance has isolated variable scope</li>
              <li>Results are collected in <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">parallel.results</code> array</li>
              <li>Use for independent operations that don't depend on each other</li>
              <li>Cannot nest parallel blocks or loops inside parallel blocks</li>
            </ul>
          </div>

          {/* Warning Box */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              ⚠️ Important Considerations
            </h4>
            <ul className="text-xs text-yellow-800 dark:text-yellow-400 space-y-1 list-disc list-inside">
              <li>Be mindful of API rate limits when making concurrent requests</li>
              <li>Memory usage increases with parallel instances</li>
              <li>Each instance should handle its own errors gracefully</li>
              <li>Operations should be independent (no shared state)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

