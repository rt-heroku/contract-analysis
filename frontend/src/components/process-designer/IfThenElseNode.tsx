import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Edit3, Plus } from 'lucide-react';

interface IfThenElseNodeData {
  label: string;
  description?: string;
  actionName?: string;
  config?: any;
  onEdit?: () => void;
  onAddNext?: () => void;
  showPlusButton?: boolean;
}

export const IfThenElseNode = memo(({ data, selected }: NodeProps<IfThenElseNodeData>) => {
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

  // Extract condition info from config
  const condition = data.config?.condition || 'condition not set';
  const displayCondition = condition.length > 30 ? condition.substring(0, 27) + '...' : condition;

  return (
    <div 
      className="relative group" 
      onDoubleClick={handleDoubleClick}
      style={{ minWidth: '280px' }}
    >
      {/* Card Container */}
      <div 
        className={`
          bg-white rounded-lg shadow-lg border-2 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-xl' : 'border-gray-200'}
        `}
        style={{ 
          minHeight: '90px',
          position: 'relative',
        }}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          {/* Left: Icon + Title */}
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {data.label || 'IF THEN ELSE'}
              </div>
            </div>
          </div>

          {/* Edit Button */}
          {data.onEdit && (
            <button
              onClick={handleEditClick}
              className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 ml-2"
              title="Edit condition"
            >
              <Edit3 className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>

        {/* Condition Display */}
        <div className="px-3 py-2 bg-gray-50">
          <div className="text-xs text-gray-500 font-mono truncate">
            {displayCondition}
          </div>
        </div>

        {/* IF/ELSE Labels Row */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center space-x-1">
            <div className="text-xs font-bold text-green-600">IF</div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="text-xs font-bold text-red-600">ELSE</div>
          </div>
        </div>
      </div>

      {/* Input Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: -6 }}
      />

      {/* IF Output Handle (Left) - Green */}
      <Handle
        type="source"
        position={Position.Left}
        id="if"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={{ left: -6, top: '75%' }}
      />

      {/* ELSE Output Handle (Right) - Red */}
      <Handle
        type="source"
        position={Position.Right}
        id="else"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
        style={{ right: -6, top: '75%' }}
      />

      {/* Plus Button */}
      {data.showPlusButton && data.onAddNext && (
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onAddNext) {
                data.onAddNext();
              }
            }}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white"
            title="Add next action"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

IfThenElseNode.displayName = 'IfThenElseNode';

