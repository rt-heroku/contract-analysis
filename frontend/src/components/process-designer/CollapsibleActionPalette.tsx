import { useState } from 'react';
import { ChevronDown, ChevronRight, PlayCircle, CheckCircle } from 'lucide-react';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType?: string;
}

interface CollapsibleActionPaletteProps {
  actions: Action[];
  onDragStart: (event: React.DragEvent, action: Action) => void;
}

export const CollapsibleActionPalette = ({
  actions,
  onDragStart,
}: CollapsibleActionPaletteProps) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    'Flow Control': false,
    'Data': false,
    'Execution': false,
    'Storage': false,
    'User': true,
    'Connectors': true,
  });

  // Categorize actions
  const categories: Record<string, Action[]> = {
    'Flow Control': actions.filter(a =>
      a.category === 'control_flow' ||
      a.name.toLowerCase().includes('if') ||
      a.name.toLowerCase().includes('foreach') ||
      a.name.toLowerCase().includes('while') ||
      a.name.toLowerCase().includes('parallel') ||
      a.name.toLowerCase().includes('wait')
    ),
    'Data': actions.filter(a =>
      a.category === 'data' ||
      a.name.toLowerCase().includes('transform') ||
      a.name.toLowerCase().includes('validate') ||
      a.name.toLowerCase().includes('merge') ||
      a.name.toLowerCase().includes('variable') ||
      a.name.toLowerCase().includes('payload')
    ),
    'Execution': actions.filter(a =>
      a.category === 'execution' ||
      a.name.toLowerCase().includes('script') ||
      a.name.toLowerCase().includes('idp')
    ),
    'Storage': actions.filter(a =>
      a.category === 'storage' ||
      a.name.toLowerCase().includes('save') ||
      a.name.toLowerCase().includes('load') ||
      a.name.toLowerCase().includes('store')
    ),
    'API': actions.filter(a =>
      a.category === 'api' ||
      a.name.toLowerCase().includes('rest') ||
      a.name.toLowerCase().includes('api')
    ),
    'User': actions.filter(a => a.actionType === 'user_defined'),
    'Connectors': actions.filter(a => a.actionType === 'connector'),
  };

  // Filter out empty categories
  const nonEmptyCategories = Object.entries(categories).filter(([_, actions]) => actions.length > 0);

  const toggleCategory = (categoryName: string) => {
    setCollapsed(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };

  const renderStartEndNodes = () => (
    <div className="mb-4 pb-4 border-b border-gray-200">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
        Flow Markers
      </div>
      <div className="grid grid-cols-2 gap-2">
        {/* Start Node */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
              id: 0,
              name: 'start_node',
              displayName: 'Start',
              description: 'Flow start point',
              category: 'flow',
              icon: 'PlayCircle',
              color: '#22c55e',
              actionType: 'start',
            }));
          }}
          className="flex flex-col items-center p-2 rounded cursor-move hover:bg-green-50 border border-green-200"
        >
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-1">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">Start</span>
        </div>

        {/* End Node */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({
              id: 0,
              name: 'end_node',
              displayName: 'End',
              description: 'Flow end point',
              category: 'flow',
              icon: 'CheckCircle',
              color: '#ef4444',
              actionType: 'end',
            }));
          }}
          className="flex flex-col items-center p-2 rounded cursor-move hover:bg-red-50 border border-red-200"
        >
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-1">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-medium text-gray-700">End</span>
        </div>
      </div>
    </div>
  );

  const renderActionItem = (action: Action) => (
    <div
      key={action.id}
      draggable
      onDragStart={(event) => onDragStart(event, action)}
      className="px-2 py-2 rounded cursor-move hover:bg-gray-100 border border-gray-200 transition-colors mb-1"
    >
      <div className="flex items-center space-x-2">
        <div
          className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs"
          style={{ backgroundColor: action.color || '#6366f1' }}
        >
          <span className="text-white font-bold">
            {action.displayName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-900 truncate">
            {action.displayName}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
        <p className="text-xs text-gray-500 mt-1">Drag to add to canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {renderStartEndNodes()}

        {nonEmptyCategories.map(([categoryName, categoryActions]) => (
          <div key={categoryName} className="mb-2">
            <button
              onClick={() => toggleCategory(categoryName)}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                {collapsed[categoryName] ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {categoryName}
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {categoryActions.length}
              </span>
            </button>

            {!collapsed[categoryName] && (
              <div className="mt-1 space-y-1 pl-2">
                {categoryActions.map(action => renderActionItem(action))}
              </div>
            )}
          </div>
        ))}

        {nonEmptyCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <p>No actions available</p>
            <p className="text-xs mt-1">Create actions to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

