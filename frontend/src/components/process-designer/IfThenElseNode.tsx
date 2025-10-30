import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Edit3, Plus } from 'lucide-react';

interface IfThenElseNodeData {
  label: string;
  description?: string;
  actionName?: string;
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

  return (
    <div 
      className="relative group" 
      onDoubleClick={handleDoubleClick}
      style={{ minWidth: '180px' }}
    >
      {/* Diamond Shape Container */}
      <div className="relative flex items-center justify-center" style={{ height: '140px', width: '180px' }}>
        {/* Diamond SVG Background */}
        <svg 
          width="180" 
          height="140" 
          className="absolute top-0 left-0"
          style={{ filter: selected ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
        >
          <defs>
            <linearGradient id="ifGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Diamond path */}
          <path
            d="M 90 10 L 170 70 L 90 130 L 10 70 Z"
            fill="url(#ifGradient)"
            stroke={selected ? '#3b82f6' : '#2563eb'}
            strokeWidth={selected ? '3' : '2'}
            className="transition-all duration-200"
          />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-4">
          {/* Icon */}
          <div className="mb-2">
            <GitBranch className="w-8 h-8 text-white" />
          </div>
          
          {/* Label */}
          <div className="text-sm font-semibold text-white mb-1 leading-tight">
            {data.label || 'IF THEN ELSE'}
          </div>
          
          {/* Type Badge */}
          <div className="text-xs bg-blue-900 bg-opacity-50 text-white px-2 py-0.5 rounded-full">
            Condition
          </div>
        </div>

        {/* Edit Button - appears on hover */}
        {data.onEdit && (
          <button
            onClick={handleEditClick}
            className="absolute top-2 right-2 w-6 h-6 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-20"
            title="Edit condition"
          >
            <Edit3 className="w-3 h-3 text-blue-600" />
          </button>
        )}
      </div>

      {/* Input Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: 10 }}
      />

      {/* IF Output Handle (Left) - Green */}
      <Handle
        type="source"
        position={Position.Left}
        id="if"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={{ left: 30, top: '50%' }}
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-green-300 whitespace-nowrap pointer-events-none"
        style={{ left: -20, top: 'calc(50% - 10px)', color: '#22c55e' }}
      >
        if
      </div>

      {/* ELSE Output Handle (Right) - Red */}
      <Handle
        type="source"
        position={Position.Right}
        id="else"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
        style={{ right: 30, top: '50%' }}
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-red-300 whitespace-nowrap pointer-events-none"
        style={{ right: -25, top: 'calc(50% - 10px)', color: '#ef4444' }}
      >
        else
      </div>

      {/* Plus Button - only show if both handles have no connections OR if action supports multiple connections */}
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

