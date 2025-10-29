import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircle, CheckCircle, Plus } from 'lucide-react';

interface StartNodeData {
  onAddNext?: () => void;
}

export const StartNode = memo(({ data, selected }: NodeProps<StartNodeData>) => {
  return (
    <div
      className={`
        bg-green-500 rounded-full p-4 shadow-lg border-4 transition-all duration-200 relative
        ${selected ? 'border-blue-500 shadow-xl scale-110' : 'border-white'}
      `}
      style={{ width: '80px', height: '80px' }}
    >
      <div className="flex items-center justify-center h-full">
        <PlayCircle className="w-10 h-10 text-white" />
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-600 !border-2 !border-white"
      />
      
      {/* Plus Button Below Start Node */}
      {data?.onAddNext && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: -50 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onAddNext) {
                data.onAddNext();
              }
            }}
            className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 border-2 border-white"
            title="Add first action"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 whitespace-nowrap">
        START
      </div>
    </div>
  );
});

StartNode.displayName = 'StartNode';

export const EndNode = memo(({ selected }: NodeProps) => {
  return (
    <div
      className={`
        bg-red-500 rounded-full p-4 shadow-lg border-4 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-xl scale-110' : 'border-white'}
      `}
      style={{ width: '80px', height: '80px' }}
    >
      <div className="flex items-center justify-center h-full">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-red-600 !border-2 !border-white"
      />
      
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 whitespace-nowrap">
        END
      </div>
    </div>
  );
});

EndNode.displayName = 'EndNode';

