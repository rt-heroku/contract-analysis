import { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { RefreshCw, Edit3, Plus, CornerUpLeft, CornerDownRight } from 'lucide-react';

interface ConditionalGroup {
  operator: 'AND' | 'OR';
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

interface LoopContainerNodeData {
  label?: string;
  loopType?: 'for_each' | 'while' | 'do_while' | 'times';
  condition?: string;
  conditions?: ConditionalGroup[];
  onEdit?: () => void;
  onAddNext?: () => void;
  showPlusButton?: boolean;
  onAddBreak?: (position: { x: number; y: number }) => void;
  onAddContinue?: (position: { x: number; y: number }) => void;
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

  const loopLabel = data.label || 'While';
  
  // Generate condition summary from ConditionalGroups
  const getConditionSummary = () => {
    if (!data.conditions || data.conditions.length === 0) {
      return 'Configure condition';
    }
    
    const firstGroup = data.conditions[0];
    if (!firstGroup.conditions || firstGroup.conditions.length === 0) {
      return 'Configure condition';
    }
    
    const firstCondition = firstGroup.conditions[0];
    const summary = `${firstCondition.field} ${firstCondition.operator} ${firstCondition.value}`;
    
    if (data.conditions.length > 1 || firstGroup.conditions.length > 1) {
      return `${summary} +${data.conditions.reduce((acc, g) => acc + g.conditions.length, 0) - 1} more`;
    }
    
    return summary;
  };

  const displayCondition = data.condition || getConditionSummary();

  return (
    <>
      {/* Node Resizer */}
      <NodeResizer
        minWidth={400}
        minHeight={300}
        isVisible={selected}
        lineClassName="border-blue-500"
        handleClassName="w-3 h-3 bg-blue-500 border-2 border-white rounded-full"
      />
      
      {/* TITLE BAR - OUTSIDE CONTAINER */}
      <div 
        className="absolute -top-12 left-0 flex items-center space-x-2 z-10"
        style={{ pointerEvents: 'all' }}
      >
        {/* Loop Label with Icon */}
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-md px-3 py-2 border border-blue-200">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900 text-sm">{loopLabel}</span>
        </div>

        {/* Edit Button */}
        {data.onEdit && (
          <button
            onClick={handleEditClick}
            className="w-8 h-8 bg-white hover:bg-gray-50 rounded-lg shadow-md border border-gray-200 flex items-center justify-center transition-colors"
            title="Edit loop conditions"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
          </button>
        )}

        {/* Condition Display */}
        <div className="bg-white rounded-lg shadow-md px-3 py-2 border border-gray-200 max-w-xs">
          <span className="text-xs text-gray-600 font-mono truncate">{displayCondition}</span>
        </div>
      </div>
      
      <div 
        className="relative group w-full h-full" 
        onDoubleClick={handleDoubleClick}
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
            minHeight: '300px',
            padding: '30px 20px 20px 20px', // Reduced top padding since title is outside
          }}
        >

        {/* Internal Start Point - Top Center */}
        <div 
          className="absolute flex flex-col items-center"
          style={{ top: '40px', left: '50%', transform: 'translateX(-50%)' }}
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

        {/* Break and Continue Buttons - Inside Blue Box */}
        <div 
          className="absolute flex items-center space-x-3"
          style={{ top: '20px', right: '20px', pointerEvents: 'all' }}
        >
          {/* Add Break Button */}
          {data.onAddBreak && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Calculate position relative to container center
                const position = { x: 200, y: 150 };
                data.onAddBreak?.(position);
              }}
              className="flex items-center space-x-1 bg-orange-50 hover:bg-orange-100 rounded-lg shadow-md px-3 py-2 border border-orange-200 transition-colors"
              title="Add Break"
            >
              <CornerUpLeft className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">break</span>
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
            </button>
          )}

          {/* Add Continue Button */}
          {data.onAddContinue && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Calculate position relative to container center
                const position = { x: 200, y: 200 };
                data.onAddContinue?.(position);
              }}
              className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 rounded-lg shadow-md px-3 py-2 border border-green-200 transition-colors"
              title="Add Continue"
            >
              <CornerDownRight className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700">continue</span>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </button>
          )}
        </div>

        {/* Instructions when empty */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ top: '90px' }}
        >
          <div className="text-center text-gray-400">
            <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Drop actions here or use break/continue buttons</p>
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
    </>
  );
});

LoopContainerNode.displayName = 'LoopContainerNode';

