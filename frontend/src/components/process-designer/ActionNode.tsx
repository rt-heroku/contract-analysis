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
  iconUrl?: string; // Base64 image for custom icons
  color?: string;
  actionType?: 'system' | 'user_defined' | 'connector';
  actionName?: string;
  connectorName?: string; // For connector actions
  metadata?: string; // Additional metadata (e.g., "gpt-4o CHAT")
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
        ${selected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-blue-300'}
        cursor-pointer relative
      `}
      style={{ minWidth: '240px', maxWidth: '300px' }}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: -6 }}
      />

      {/* Card Content */}
      <div className="p-3">
        {/* Header Row: Icon + Title + Edit */}
        <div className="flex items-center space-x-3 mb-2">
          {/* Icon/Avatar */}
          <div className="flex-shrink-0">
            {data.iconUrl ? (
              <img 
                src={data.iconUrl} 
                alt={data.label}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${bgColor}` }}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {data.label}
            </h3>
          </div>

          {/* Edit Button */}
          {data.onEdit && (
            <button
              onClick={handleEditClick}
              className="flex-shrink-0 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center transition-colors"
              title="Edit action"
            >
              <Edit3 className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>

        {/* Metadata Row (if exists) */}
        {(data.metadata || data.connectorName) && (
          <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded-md">
            <LucideIcons.Zap className="w-3 h-3 text-gray-400" />
            <span className="truncate">
              {data.metadata || data.connectorName}
            </span>
            {data.actionType === 'connector' && (
              <LucideIcons.Eye className="w-3 h-3 text-gray-400 ml-auto" />
            )}
          </div>
        )}

        {/* Type Badge (if no metadata) */}
        {!data.metadata && !data.connectorName && data.actionType && (
          <div className="mt-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getBadgeClass()}`}>
              {getTypeLabel()}
            </span>
          </div>
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

      {/* Error Handle - Only for actions that can fail */}
      {(() => {
        const actionName = data.actionName?.toLowerCase() || '';
        // Actions that should NOT have error connections
        const noErrorActions = [
          'if_then_else',
          'log',
          'for_each',
          'switch_case',
          'while',
          'set_variable',
          'set_payload',
          'try_catch_finally', // Old deprecated action
          'try_block', // Has special error handle, not regular error connection
          'catch_block', // Already IS the error handler
          'finally_block', // Convergence point, no error output
        ];
        
        const shouldShowError = !noErrorActions.some(name => actionName.includes(name));
        
        return shouldShowError ? (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="error"
              className="w-3 h-3 !bg-red-500 !border-2 !border-white"
              style={{ right: -6, top: '75%' }}
            />
            <div
              className="absolute text-xs font-medium px-2 py-0.5 bg-white rounded shadow-sm border border-red-300 whitespace-nowrap pointer-events-none"
              style={{ right: -50, top: 'calc(75% - 10px)', color: '#ef4444' }}
            >
              error
            </div>
          </>
        ) : null;
      })()}

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


