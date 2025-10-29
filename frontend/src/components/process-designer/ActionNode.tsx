import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import * as LucideIcons from 'lucide-react';
import { Edit3, Plus } from 'lucide-react';

// Helper to get icon component dynamically
const getIconComponent = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.Box;
};

interface ActionNodeData {
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  actionType?: 'system' | 'user_defined' | 'connector';
  actionName?: string;
  onEdit?: () => void;
  onAddNext?: () => void;
  showPlusButton?: boolean;
}

export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  const IconComponent = getIconComponent(data.icon || 'Zap');
  const bgColor = data.color || '#6366f1';
  
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
  
  // Determine badge color based on action type
  const getBadgeClass = () => {
    switch (data.actionType) {
      case 'system':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'user_defined':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'connector':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = () => {
    switch (data.actionType) {
      case 'system':
        return 'System';
      case 'user_defined':
        return 'User';
      case 'connector':
        return 'Connector';
      default:
        return '';
    }
  };

  // Determine output handles based on action type
  const getOutputHandles = () => {
    const actionName = data.actionName?.toLowerCase() || '';
    
    // IF THEN ELSE: 2 handles (if, else)
    if (actionName.includes('if_then_else')) {
      return [
        { id: 'if', label: 'if', position: 'left', color: '#22c55e' },
        { id: 'else', label: 'else', position: 'right', color: '#ef4444' },
      ];
    }
    
    // Try Catch Finally: 3 handles (try, catch, finally)
    if (actionName.includes('try_catch_finally')) {
      return [
        { id: 'try', label: 'try', position: 'left', color: '#22c55e' },
        { id: 'catch', label: 'catch', position: 'bottom', color: '#ef4444' },
        { id: 'finally', label: 'finally', position: 'right', color: '#f59e0b' },
      ];
    }
    
    // On Error: 2 handles (no-error left/green, error right/red)
    if (actionName.includes('on_error')) {
      return [
        { id: 'no-error', label: '', position: 'left', color: '#22c55e' },
        { id: 'error', label: 'error', position: 'right', color: '#ef4444' },
      ];
    }
    
    // Switch Case: multiple handles (we'll show just bottom for now, connections determine cases)
    if (actionName.includes('switch_case')) {
      return [
        { id: 'default', label: 'default', position: 'bottom', color: '#6366f1' },
      ];
    }
    
    // For Each: 2 handles (item, after)
    if (actionName.includes('for_each')) {
      return [
        { id: 'item', label: 'item', position: 'bottom', color: '#8b5cf6' },
        { id: 'after', label: 'after', position: 'right', color: '#6366f1' },
      ];
    }
    
    // While Loop: 2 handles (loop, after)
    if (actionName.includes('while')) {
      return [
        { id: 'loop', label: 'loop', position: 'bottom', color: '#8b5cf6' },
        { id: 'after', label: 'after', position: 'right', color: '#6366f1' },
      ];
    }
    
    // Default: single bottom handle
    return [
      { id: 'default', label: '', position: 'bottom', color: '#22c55e' },
    ];
  };

  const outputHandles = getOutputHandles();

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`
        bg-white rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200 hover:border-blue-300'}
        cursor-pointer relative
      `}
      style={{ minWidth: '240px', maxWidth: '280px' }}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: -6 }}
      />

      {/* Edit Button (top-right corner) */}
      {data.onEdit && (
        <button
          onClick={handleEditClick}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors z-10 border border-gray-200"
          title="Edit action"
        >
          <Edit3 className="w-3.5 h-3.5 text-gray-600" />
        </button>
      )}

      {/* Header with Icon */}
      <div
        className="flex items-center space-x-2 p-3 rounded-t-lg"
        style={{ backgroundColor: `${bgColor}20` }}
      >
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate text-sm">
            {data.label}
          </h3>
        </div>
      </div>

      {/* Footer with Badge */}
      <div className="px-3 py-2 bg-gray-50 rounded-b-lg border-t border-gray-100">
        {data.actionType && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getBadgeClass()}`}>
            {getTypeLabel()}
          </span>
        )}
      </div>

      {/* Dynamic Output Handles */}
      {outputHandles.map((handle, index) => {
        const positionMap: Record<string, any> = {
          bottom: { position: Position.Bottom, style: { bottom: -6, left: `${(index + 1) * (100 / (outputHandles.length + 1))}%` } },
          left: { position: Position.Left, style: { left: -6, top: '50%' } },
          right: { position: Position.Right, style: { right: -6, top: '50%' } },
          top: { position: Position.Top, style: { top: -6, left: '50%' } },
        };

        const { position, style } = positionMap[handle.position] || positionMap.bottom;
        
        return (
          <div key={handle.id}>
            <Handle
              type="source"
              position={position}
              id={handle.id}
              className="w-3 h-3 !border-2 !border-white"
              style={{ ...style, backgroundColor: handle.color }}
            />
            {handle.label && (
              <div
                className="absolute text-xs font-medium px-2 py-0.5 bg-white rounded shadow-sm border border-gray-300 whitespace-nowrap pointer-events-none"
                style={{
                  ...(handle.position === 'left' && { left: -50, top: 'calc(50% - 10px)' }),
                  ...(handle.position === 'right' && { right: -50, top: 'calc(50% - 10px)' }),
                  ...(handle.position === 'bottom' && { 
                    bottom: -30, 
                    left: `${(index + 1) * (100 / (outputHandles.length + 1))}%`,
                    transform: 'translateX(-50%)'
                  }),
                  color: handle.color,
                }}
              >
                {handle.label}
              </div>
            )}
          </div>
        );
      })}

      {/* Plus Button Below Node - Only show if not connected or if multi-branch action */}
      {data.onAddNext && data.showPlusButton && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: -40 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onAddNext) {
                data.onAddNext();
              }
            }}
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 border-2 border-white"
            title="Add next action"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

ActionNode.displayName = 'ActionNode';


