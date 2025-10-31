import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircle, Clock, Zap, Globe, Upload, User, Settings } from 'lucide-react';

export interface TriggerConfig {
  type: 'manual' | 'schedule' | 'event' | 'api' | 'file' | 'none';
  config?: any;
}

interface StartNodeData {
  label: string;
  trigger?: TriggerConfig;
  onConfigure?: () => void;
  onAddNext?: () => void;
  showPlusButton?: boolean;
  layoutDirection?: 'horizontal' | 'vertical';
}

const getTriggerIcon = (triggerType: string) => {
  switch (triggerType) {
    case 'schedule':
      return Clock;
    case 'event':
      return Zap;
    case 'api':
      return Globe;
    case 'file':
      return Upload;
    case 'manual':
      return User;
    default:
      return PlayCircle;
  }
};

const getTriggerColor = (triggerType: string) => {
  switch (triggerType) {
    case 'schedule':
      return '#f59e0b';
    case 'event':
      return '#8b5cf6';
    case 'api':
      return '#3b82f6';
    case 'file':
      return '#10b981';
    case 'manual':
      return '#6366f1';
    default:
      return '#22c55e';
  }
};

const getTriggerSummary = (trigger?: TriggerConfig): string => {
  if (!trigger || trigger.type === 'none') {
    return 'No trigger configured';
  }

  switch (trigger.type) {
    case 'manual':
      return 'Manual trigger';
    case 'schedule':
      if (trigger.config?.cronExpression) {
        return `Schedule: ${trigger.config.cronExpression}`;
      }
      if (trigger.config?.interval) {
        return `Every ${trigger.config.interval}`;
      }
      return 'Scheduled trigger';
    case 'event':
      return trigger.config?.eventType ? `Event: ${trigger.config.eventType}` : 'Event trigger';
    case 'api':
      return trigger.config?.method ? `${trigger.config.method} /process` : 'API endpoint';
    case 'file':
      return trigger.config?.path ? `Watch: ${trigger.config.path}` : 'File upload';
    default:
      return 'Trigger configured';
  }
};

export const StartNode = memo(({ data, selected }: NodeProps<StartNodeData>) => {
  const triggerType = data.trigger?.type || 'none';
  const TriggerIcon = getTriggerIcon(triggerType);
  const triggerColor = getTriggerColor(triggerType);
  const summary = getTriggerSummary(data.trigger);
  const hasConfig = triggerType !== 'none';
  const layoutDirection = data.layoutDirection || 'horizontal';
  const handlePosition = layoutDirection === 'horizontal' ? Position.Right : Position.Bottom;

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all duration-200 relative
        ${selected ? 'border-green-500 shadow-xl scale-105' : 'border-green-300 dark:border-green-600 hover:border-green-400'}
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
          className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors z-10 border border-gray-200 dark:border-gray-600"
          title="Configure trigger"
        >
          <Settings className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white opacity-0"
        style={{ top: -6 }}
      />

      {/* Main Content */}
      <div className="p-4">
        {/* Icon Circle */}
        <div className="flex justify-center mb-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: triggerColor }}
          >
            <TriggerIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Label */}
        <div className="text-center mb-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{data.label}</h3>
        </div>

        {/* Trigger Summary */}
        <div className="text-center">
          <div
            className={`
              text-xs px-3 py-1.5 rounded-full inline-block
              ${hasConfig ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
            `}
          >
            {summary}
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
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              Configure trigger
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Handle */}
      <Handle
        type="source"
        position={handlePosition}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
        style={
          layoutDirection === 'horizontal'
            ? { right: -6, top: '50%', transform: 'translateY(-50%)' }
            : { bottom: -6, left: '50%', transform: 'translateX(-50%)' }
        }
      />

      {/* Plus Button */}
      {data.onAddNext && data.showPlusButton && (
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
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 border-2 border-white"
            title="Add next action"
          >
            <PlayCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

StartNode.displayName = 'StartNode';

