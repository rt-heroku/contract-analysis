import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RefreshCw, Edit3, Plus } from 'lucide-react';

interface LoopContainerNodeData {
  label?: string;
  loopType?: 'for_each' | 'while' | 'do_while' | 'times';
  condition?: string;
  onEdit?: () => void;
  onAddNext?: () => void;
  showPlusButton?: boolean;
}

export const LoopContainerNode = memo(({ data, selected }: NodeProps<LoopContainerNodeData>) => {
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

  const loopLabel = data.label || 'Loop';
  const displayCondition = data.condition || 'Configure loop condition';

  return (
    <div 
      className="relative group" 
      onDoubleClick={handleDoubleClick}
      style={{ minWidth: '600px', minHeight: '400px' }}
    >
      {/* Container Box with Dashed Border */}
      <div 
        className={`
          rounded-lg border-2 border-dashed transition-all duration-200 relative
          ${selected ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-blue-50'}
        `}
        style={{ 
          width: '100%',
          height: '100%',
          minHeight: '400px',
          padding: '60px 20px 20px 20px',
        }}
      >
        {/* Header Label */}
        <div className="absolute top-4 left-4 flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-md px-3 py-2 border border-blue-200">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900 text-sm">{loopLabel}</span>
            
            {/* Edit Button */}
            {data.onEdit && (
              <button
                onClick={handleEditClick}
                className="ml-2 w-5 h-5 bg-blue-100 hover:bg-blue-200 rounded flex items-center justify-center transition-colors"
                title="Edit loop"
              >
                <Edit3 className="w-3 h-3 text-blue-600" />
              </button>
            )}
          </div>

          {/* Condition Display */}
          {data.condition && (
            <div className="bg-white rounded-lg shadow-sm px-3 py-1.5 border border-gray-200">
              <span className="text-xs text-gray-600 font-mono">{displayCondition}</span>
            </div>
          )}
        </div>

        {/* Internal Start Point - Top Center */}
        <div 
          className="absolute flex flex-col items-center"
          style={{ top: '80px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="loop-start"
            className="w-3 h-3 !bg-green-500 !border-2 !border-white"
            style={{ position: 'relative', top: '4px' }}
          />
          <div className="text-xs font-medium text-green-600 mt-1">Start</div>
        </div>

        {/* Instructions when empty */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ top: '120px' }}
        >
          <div className="text-center text-gray-400">
            <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Drop actions here to add to loop</p>
          </div>
        </div>

        {/* Internal End Point - Bottom Center */}
        <div 
          className="absolute flex flex-col items-center"
          style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="text-xs font-medium text-blue-600 mb-1">Loop End</div>
          <Handle
            type="target"
            position={Position.Top}
            id="loop-end"
            className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
            style={{ position: 'relative', bottom: '4px' }}
          />
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* EXTERNAL HANDLES */}
      
      {/* Entry Point - Left Side */}
      <Handle
        type="target"
        position={Position.Left}
        id="entry"
        className="w-4 h-4 !bg-blue-600 !border-2 !border-white"
        style={{ left: -8, top: '50%' }}
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-blue-300 whitespace-nowrap pointer-events-none"
        style={{ left: -45, top: 'calc(50% - 10px)', color: '#2563eb' }}
      >
        entry
      </div>

      {/* Exit Point - Right Side */}
      <Handle
        type="source"
        position={Position.Right}
        id="exit"
        className="w-4 h-4 !bg-green-600 !border-2 !border-white"
        style={{ right: -8, top: '50%' }}
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-green-300 whitespace-nowrap pointer-events-none"
        style={{ right: -35, top: 'calc(50% - 10px)', color: '#16a34a' }}
      >
        exit
      </div>

      {/* Break Point - Bottom (optional early exit) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="break"
        className="w-3 h-3 !bg-orange-500 !border-2 !border-white"
        style={{ bottom: -6, left: '80%' }}
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-orange-300 whitespace-nowrap pointer-events-none"
        style={{ bottom: -28, left: '80%', transform: 'translateX(-50%)', color: '#ea580c' }}
      >
        break
      </div>

      {/* Plus Button for adding next action after loop */}
      {data.onAddNext && data.showPlusButton && (
        <div className="absolute -right-5" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onAddNext) {
                data.onAddNext();
              }
            }}
            className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white"
            title="Add next action"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

LoopContainerNode.displayName = 'LoopContainerNode';

