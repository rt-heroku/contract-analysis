import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { Zap, Edit3 } from 'lucide-react';

interface ParallelContainerNodeProps {
  data: {
    label: string;
    parallelType?: 'count' | 'collection';
    count?: number;
    collection?: string;
    maxConcurrent?: number;
    onEdit?: () => void;
  };
  selected: boolean;
  isHorizontal?: boolean;
}

export const ParallelContainerNode: React.FC<ParallelContainerNodeProps> = ({ data, selected, isHorizontal = false }) => {
  const parallelType = data.parallelType || 'count';
  const count = data.count || 5;
  const collection = data.collection || '[]';
  const maxConcurrent = data.maxConcurrent || 20;

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onEdit) {
      data.onEdit();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (data.onEdit) {
      data.onEdit();
    }
  };

  const getParallelLabel = () => {
    if (parallelType === 'count') {
      return `Parallel × ${count}`;
    } else {
      return `Parallel over Collection`;
    }
  };

  const getDisplayCondition = () => {
    if (parallelType === 'count') {
      return `Count: ${count} instances`;
    } else {
      return `Collection: ${collection}`;
    }
  };

  const parallelLabel = getParallelLabel();
  const displayCondition = getDisplayCondition();

  return (
    <>
      {/* Title Bar - Outside the container, at the top */}
      <div 
        className="absolute top-2 left-2 right-2 flex items-center space-x-2"
        style={{ 
          pointerEvents: 'auto', 
          zIndex: 9999,
          position: 'absolute'
        }}
      >
        {/* Parallel Label with Icon */}
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 border border-purple-200 dark:border-purple-600">
          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-purple-900 dark:text-purple-300 text-sm">{parallelLabel}</span>
        </div>

        {/* Edit Button */}
        {data.onEdit && (
          <button
            type="button"
            onClickCapture={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleEditClick(e);
            }}
            onMouseDownCapture={(e) => {
              e.stopPropagation();
            }}
            className="w-8 h-8 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Edit parallel configuration"
            style={{ zIndex: 1001, pointerEvents: 'all' }}
          >
            <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </button>
        )}

        {/* Configuration Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 border border-gray-200 dark:border-gray-700 max-w-xs">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{displayCondition}</span>
        </div>

        {/* Max Concurrent Badge */}
        <div className="bg-purple-100 dark:bg-purple-900 rounded-lg shadow-md px-3 py-1 border border-purple-200 dark:border-purple-600">
          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">Max: {maxConcurrent}</span>
        </div>
      </div>

      <div 
        className="relative group w-full h-full"
        onDoubleClick={handleDoubleClick}
      >
        {/* Node Resizer */}
        <NodeResizer
          color={selected ? '#9333ea' : '#d8b4fe'}
          isVisible={selected}
          minWidth={350}
          minHeight={300}
        />

        {/* Input Handle */}
        <Handle
          type="target"
          position={isHorizontal ? Position.Left : Position.Top}
          className="w-4 h-4 !bg-purple-500 !border-2 !border-white dark:!border-gray-800"
          style={{ 
            zIndex: 10,
            left: isHorizontal ? '-8px' : '50%',
            top: isHorizontal ? '50%' : '-8px',
          }}
        />

        {/* Output Handle */}
        <Handle
          type="source"
          position={isHorizontal ? Position.Right : Position.Bottom}
          className="w-4 h-4 !bg-purple-500 !border-2 !border-white dark:!border-gray-800"
          style={{ 
            zIndex: 10,
            right: isHorizontal ? '-8px' : 'auto',
            left: isHorizontal ? 'auto' : '50%',
            bottom: isHorizontal ? 'auto' : '-8px',
          }}
        />

        {/* Container Box with Dashed Border */}
        <div 
          className={`
            rounded-lg border-2 border-dashed transition-all duration-200 relative
            ${selected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/10'}
          `}
          style={{ 
            width: '100%',
            height: '100%',
            minHeight: '300px',
            padding: '60px 20px 20px 20px', // Extra top padding for title bar
            pointerEvents: 'auto',
          }}
        >
          {/* Helper text when empty */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="text-center">
              <Zap className="w-12 h-12 text-purple-400 dark:text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Drag actions here to execute in parallel
              </p>
              <p className="text-xs text-purple-500 dark:text-purple-500 mt-1">
                All actions will run concurrently
              </p>
            </div>
          </div>

          {/* Children will be rendered here by ReactFlow */}
        </div>
      </div>
    </>
  );
};

