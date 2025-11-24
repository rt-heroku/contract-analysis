import { memo, useEffect } from 'react';
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
  layoutDirection?: 'vertical' | 'horizontal';
  onEdit?: () => void;
  onAddNext?: () => void;
  showPlusButton?: boolean;
  onAddBreak?: (position: { x: number; y: number }) => void;
  onAddContinue?: (position: { x: number; y: number }) => void;
}

export const LoopContainerNode = memo(({ data, selected }: NodeProps<LoopContainerNodeData>) => {
  console.log('🔄 LoopContainerNode - Rendering, selected:', selected);
  console.log('📋 LoopContainerNode - Data:', data);
  
  // Default layout direction to vertical if not set
  const layoutDirection = data.layoutDirection || 'vertical';
  
  // Track selection changes (when resize handles should appear)
  useEffect(() => {
    if (selected) {
      console.log('🎯 LoopContainerNode - Selected! Resize handles should be visible');
    } else {
      console.log('⚪ LoopContainerNode - Deselected, resize handles hidden');
    }
  }, [selected]);
  
  const handleDoubleClick = () => {
    console.log('🖱️ LoopContainerNode - Double click detected');
    if (data.onEdit) {
      console.log('✅ LoopContainerNode - Calling onEdit from double click');
      data.onEdit();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    console.log('✏️ LoopContainerNode - Edit button clicked');
    e.stopPropagation();
    e.preventDefault();
    if (data.onEdit) {
      console.log('✅ LoopContainerNode - Calling onEdit from edit button');
      data.onEdit();
    } else {
      console.log('❌ LoopContainerNode - No onEdit callback available');
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
    <div className="relative w-full h-full">
      {/* Node Resizer - Rendered conditionally when selected, below title bar */}
      {selected && (
        <NodeResizer
          minWidth={400}
          minHeight={300}
          isVisible={true}
          lineClassName="border-blue-500 border-2"
          handleClassName="w-6 h-6 bg-blue-500 border-2 border-white rounded-full"
        />
      )}
      
      {/* TITLE BAR - INSIDE CONTAINER at top with HIGHEST z-index */}
      <div 
        className="absolute top-2 left-2 right-2 flex items-center space-x-2"
        style={{ 
          pointerEvents: 'auto', 
          zIndex: 9999,
          position: 'absolute'
        }}
      >
        {/* Loop Label with Icon */}
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 border border-blue-200 dark:border-blue-600">
          <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-blue-900 dark:text-blue-300 text-sm">{loopLabel}</span>
        </div>

        {/* Edit Button */}
        {data.onEdit && (
          <button
            type="button"
            onClickCapture={(e) => {
              console.log('👆 LoopContainerNode - CAPTURE Click on edit button');
              e.stopPropagation();
              e.preventDefault();
              handleEditClick(e);
            }}
            onMouseDownCapture={(e) => {
              console.log('👆 LoopContainerNode - CAPTURE Mouse down on edit button');
              e.stopPropagation();
            }}
            className="w-8 h-8 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Edit loop conditions"
            style={{ zIndex: 1001, pointerEvents: 'all' }}
          >
            <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {/* Condition Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 border border-gray-200 dark:border-gray-700 max-w-xs">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{displayCondition}</span>
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
            ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10'}
          `}
          style={{ 
            width: '100%',
            height: '100%',
            minHeight: '300px',
            padding: '30px 20px 20px 20px', // Reduced top padding since title is outside
            pointerEvents: 'auto', // Re-enable for container content
          }}
        >

        {/* Internal Start Point - Below Title Bar */}
        <div 
          className="absolute flex flex-col items-center"
          style={{ top: '70px', left: '50%', transform: 'translateX(-50%)' }}
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

        {/* Break and Continue Buttons - Below Title Bar */}
        <div 
          className="absolute flex items-center space-x-3"
          style={{ top: '70px', right: '20px', pointerEvents: 'auto', zIndex: 10 }}
        >
          {/* Add Break Button */}
          {data.onAddBreak && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🟠 Break button clicked!');
                // Calculate position relative to container center
                const position = { x: 200, y: 150 };
                if (data.onAddBreak) {
                  data.onAddBreak(position);
                }
              }}
              className="flex items-center space-x-1 bg-orange-50 hover:bg-orange-100 rounded-lg shadow-md px-3 py-2 border border-orange-200 transition-colors cursor-pointer"
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('🟢 Continue button clicked!');
                // Calculate position relative to container center
                const position = { x: 200, y: 200 };
                if (data.onAddContinue) {
                  data.onAddContinue(position);
                }
              }}
              className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 rounded-lg shadow-md px-3 py-2 border border-green-200 transition-colors cursor-pointer"
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

      {/* EXTERNAL HANDLES - Position changes based on layout direction */}
      
      {/* Entry Point - Top (vertical) or Left (horizontal) */}
      <Handle
        type="target"
        position={layoutDirection === 'vertical' ? Position.Top : Position.Left}
        id="entry"
        className="w-4 h-4 !bg-blue-600 !border-2 !border-white"
        style={
          layoutDirection === 'vertical'
            ? { top: -8, left: '50%', transform: 'translateX(-50%)' }
            : { left: -8, top: '50%' }
        }
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-blue-300 whitespace-nowrap pointer-events-none"
        style={
          layoutDirection === 'vertical'
            ? { top: -30, left: '50%', transform: 'translateX(-50%)', color: '#2563eb' }
            : { left: -45, top: 'calc(50% - 10px)', color: '#2563eb' }
        }
      >
        entry
      </div>

      {/* Exit Point - Bottom (vertical) or Right (horizontal) */}
      <Handle
        type="source"
        position={layoutDirection === 'vertical' ? Position.Bottom : Position.Right}
        id="exit"
        className="w-4 h-4 !bg-green-600 !border-2 !border-white"
        style={
          layoutDirection === 'vertical'
            ? { bottom: -8, left: '50%', transform: 'translateX(-50%)' }
            : { right: -8, top: '50%' }
        }
      />
      <div
        className="absolute text-xs font-semibold px-2 py-0.5 bg-white rounded shadow-sm border border-green-300 whitespace-nowrap pointer-events-none"
        style={
          layoutDirection === 'vertical'
            ? { bottom: -30, left: '50%', transform: 'translateX(-50%)', color: '#16a34a' }
            : { right: -35, top: 'calc(50% - 10px)', color: '#16a34a' }
        }
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
    </div>
  );
});

LoopContainerNode.displayName = 'LoopContainerNode';

