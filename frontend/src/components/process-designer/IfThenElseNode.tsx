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
  layoutDirection?: 'horizontal' | 'vertical';
}

export const IfThenElseNode = memo(({ data, selected }: NodeProps<IfThenElseNodeData>) => {
  const layoutDirection = data.layoutDirection || 'horizontal';
  
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

      {/* Input Handle - Dynamic position */}
      <Handle
        type="target"
        position={layoutDirection === 'horizontal' ? Position.Left : Position.Top}
        id="input"
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={
          layoutDirection === 'horizontal'
            ? { left: -6, top: '50%', transform: 'translateY(-50%)' }
            : { top: -6, left: '50%', transform: 'translateX(-50%)' }
        }
      />

      {/* IF Output Handle - Green */}
      <Handle
        type="source"
        position={layoutDirection === 'horizontal' ? Position.Right : Position.Bottom}
        id="if"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={
          layoutDirection === 'horizontal'
            ? { right: -6, top: '33%', transform: 'translateY(-50%)' }
            : { bottom: -6, left: '33%', transform: 'translateX(-50%)' }
        }
      />

      {/* ELSE Output Handle - Red */}
      <Handle
        type="source"
        position={layoutDirection === 'horizontal' ? Position.Right : Position.Bottom}
        id="else"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
        style={
          layoutDirection === 'horizontal'
            ? { right: -6, top: '67%', transform: 'translateY(-50%)' }
            : { bottom: -6, left: '67%', transform: 'translateX(-50%)' }
        }
      />

      {/* Plus Button - Dynamic position */}
      {data.showPlusButton && data.onAddNext && (
        <div
          className="absolute"
          style={
            layoutDirection === 'horizontal'
              ? { right: -40, top: '50%', transform: 'translateY(-50%)' }
              : { bottom: -40, left: '50%', transform: 'translateX(-50%)' }
          }
        >
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

