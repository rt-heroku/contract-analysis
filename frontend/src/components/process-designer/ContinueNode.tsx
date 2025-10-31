import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CornerDownRight, Edit3 } from 'lucide-react';

interface ContinueNodeData {
  label?: string;
  skipCount?: number;
  onEdit?: () => void;
  layoutDirection?: 'horizontal' | 'vertical';
}

export const ContinueNode = memo(({ data, selected }: NodeProps<ContinueNodeData>) => {
  const handleDoubleClick = () => {
    if (data.onEdit) {
      data.onEdit();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onEdit) {
      data.onEdit();
    }
  };

  const isHorizontal = data.layoutDirection === 'horizontal';

  return (
    <div 
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-200
        ${selected ? 'ring-4 ring-green-300 dark:ring-green-500' : 'hover:shadow-xl'}
      `}
      style={{ 
        width: '200px',
        minHeight: '80px',
        padding: '12px',
        borderLeft: '4px solid #22c55e',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />

      {/* Green Dot at Top */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />

      {/* Content */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <CornerDownRight className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Continue</h3>
            
            {data.onEdit && (
              <button
                onClick={handleEditClick}
                className="w-6 h-6 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center justify-center transition-colors"
                title="Edit continue"
              >
                <Edit3 className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Skip to next iteration</p>
          
          {data.skipCount && data.skipCount > 1 && (
            <div className="mt-2 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded text-xs text-green-700 dark:text-green-300 font-mono">
              Skip: {data.skipCount} iterations
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ContinueNode.displayName = 'ContinueNode';

