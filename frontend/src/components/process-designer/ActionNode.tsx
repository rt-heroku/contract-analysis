import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Network, Save, GitBranch, RefreshCw, Zap, FileText, 
  Database, Box, Code, CheckCircle, Filter, Layers
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Network, Save, GitBranch, RefreshCw, Zap, FileText,
  Database, Box, Code, CheckCircle, Filter, Layers,
};

interface ActionNodeData {
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  actionType?: 'system' | 'user_defined' | 'connector';
}

export const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  const IconComponent = iconMap[data.icon || 'Zap'] || Zap;
  const bgColor = data.color || '#6366f1';
  
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

  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200 hover:border-blue-300'}
      `}
      style={{ minWidth: '280px', maxWidth: '320px' }}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: -6 }}
      />

      {/* Header with Icon */}
      <div
        className="flex items-center space-x-3 p-4 rounded-t-lg"
        style={{ backgroundColor: `${bgColor}20` }}
      >
        <div
          className="p-3 rounded-lg flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate text-base">
            {data.label}
          </h3>
          {data.category && (
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {data.category}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            {data.description}
          </p>
        </div>
      )}

      {/* Footer with Badge */}
      <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-100 flex items-center justify-between">
        {data.actionType && (
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getBadgeClass()}`}>
            {getTypeLabel()}
          </span>
        )}
        <div className="text-xs text-gray-400">
          Drag to connect
        </div>
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={{ bottom: -6 }}
      />

      {/* Left Handle (for branching) */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-yellow-500 !border-2 !border-white"
        style={{ left: -6, top: '50%' }}
      />

      {/* Right Handle (for branching) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-yellow-500 !border-2 !border-white"
        style={{ right: -6, top: '50%' }}
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';

