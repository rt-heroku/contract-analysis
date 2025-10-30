import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { XCircle, Settings, Plus } from 'lucide-react';

interface GlobalErrorNodeData {
  label: string;
  config?: {
    logError?: boolean;
    notifyOnError?: boolean;
    continueOnError?: boolean;
  };
  showPlusButton?: boolean;
  onConfigure?: () => void;
  onAddNext?: () => void;
  layoutDirection?: 'horizontal' | 'vertical';
}

export const GlobalErrorNode = memo(({ data, selected }: NodeProps<GlobalErrorNodeData>) => {
  const config = data.config || {};
  const hasConfig = config.logError || config.notifyOnError;
  const layoutDirection = data.layoutDirection || 'horizontal';
  const handlePosition = layoutDirection === 'horizontal' ? Position.Left : Position.Top;

  const getSummary = (): string => {
    const parts = [];
    if (config.logError) parts.push('Log errors');
    if (config.notifyOnError) parts.push('Send notifications');
    if (config.continueOnError) parts.push('Continue flow');
    
    return parts.length > 0 ? parts.join(' • ') : 'No configuration';
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border-2 transition-all duration-200 relative
        ${selected ? 'border-red-500 shadow-xl scale-105' : 'border-red-300 hover:border-red-400'}
      `}
      style={{ minWidth: '200px' }}
    >
      {/* Configure Button */}
      {data.onConfigure && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (data.onConfigure) {
              data.onConfigure();
            }
          }}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors z-10 border border-gray-200"
          title="Configure global error handler"
        >
          <Settings className="w-3.5 h-3.5 text-gray-600" />
        </button>
      )}

      {/* Input Handle (invisible - errors come from anywhere) */}
      <Handle
        type="target"
        position={handlePosition}
        className="w-3 h-3 !bg-red-500 !border-2 !border-white opacity-0"
        style={
          layoutDirection === 'horizontal'
            ? { left: -6, top: '50%', transform: 'translateY(-50%)' }
            : { top: -6, left: '50%', transform: 'translateX(-50%)' }
        }
      />

      {/* Main Content */}
      <div className="p-4">
        {/* Icon Circle */}
        <div className="flex justify-center mb-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-red-500"
          >
            <XCircle className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Label */}
        <div className="text-center mb-2">
          <h3 className="font-bold text-gray-900 text-lg">{data.label}</h3>
        </div>

        {/* Configuration Summary */}
        <div className="text-center">
          <div
            className={`
              text-xs px-3 py-1.5 rounded-full inline-block
              ${hasConfig ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}
            `}
          >
            {getSummary()}
          </div>
        </div>

        {/* Configure Hint */}
        {!hasConfig && data.onConfigure && (
          <div className="text-center mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (data.onConfigure) {
                  data.onConfigure();
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 underline"
            >
              Configure handler
            </button>
          </div>
        )}
      </div>

      {/* Bottom Handle - only output */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-red-500 !border-2 !border-white"
        style={{ bottom: -6 }}
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
            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white"
            title="Add error handling action"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

GlobalErrorNode.displayName = 'GlobalErrorNode';

