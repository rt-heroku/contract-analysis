import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CornerUpLeft, Edit3 } from 'lucide-react';

interface BreakNodeData {
  label?: string;
  returnValue?: any;
  onEdit?: () => void;
  layoutDirection?: 'horizontal' | 'vertical';
}

export const BreakNode = memo(({ data, selected }: NodeProps<BreakNodeData>) => {
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
        relative bg-white rounded-lg shadow-lg transition-all duration-200
        ${selected ? 'ring-4 ring-orange-300' : 'hover:shadow-xl'}
      `}
      style={{ 
        width: '200px',
        minHeight: '80px',
        padding: '12px',
        borderLeft: '4px solid #ea580c',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={isHorizontal ? Position.Left : Position.Top}
        className="w-3 h-3 !bg-orange-500 !border-2 !border-white"
      />

      {/* Orange Dot at Top */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-md" />

      {/* Content */}
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <CornerUpLeft className="w-6 h-6 text-orange-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Break</h3>
            
            {data.onEdit && (
              <button
                onClick={handleEditClick}
                className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
                title="Edit break"
              >
                <Edit3 className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-0.5">Exit loop</p>
          
          {data.returnValue && (
            <div className="mt-2 px-2 py-1 bg-orange-50 rounded text-xs text-orange-700 font-mono truncate">
              Return: {JSON.stringify(data.returnValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BreakNode.displayName = 'BreakNode';

