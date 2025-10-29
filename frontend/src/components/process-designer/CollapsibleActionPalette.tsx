import { useState } from 'react';
import { ChevronDown, ChevronRight, PlayCircle, XCircle, Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType?: string;
  connector?: {
    id: number;
    name: string;
    connectorType: string;
    iconUrl?: string;
  };
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
    'Flow Markers': true,
    'Flow Control': false,
    'Error Handling': false,
    'Data': false,
    'Execution': false,
    'Storage': false,
    'API': false,
    'User': true,
    'Connectors': true,
  });
  
  const [connectorCollapsed, setConnectorCollapsed] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Categorize actions
  const categories: Record<string, Action[]> = {
    'Flow Control': actions.filter(a =>
      a.category === 'control_flow' &&
      !a.name.toLowerCase().includes('error') &&
      !a.name.toLowerCase().includes('try') &&
      !a.name.toLowerCase().includes('catch') &&
      !a.name.toLowerCase().includes('raise')
    ),
    'Error Handling': actions.filter(a =>
      a.category === 'error_handling' ||
      a.name.toLowerCase().includes('error') ||
      a.name.toLowerCase().includes('try') ||
      a.name.toLowerCase().includes('catch') ||
      a.name.toLowerCase().includes('raise') ||
      a.name.toLowerCase().includes('retry')
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
      (a.name.toLowerCase().includes('rest') && a.actionType !== 'connector') ||
      (a.name.toLowerCase().includes('api') && a.actionType !== 'connector')
    ),
    'User': actions.filter(a => a.actionType === 'user_defined'),
  };

  // Group connector actions by connector name
  const connectorActions = actions.filter(a => a.actionType === 'connector');
  const connectorGroups: Record<string, Action[]> = {};
  connectorActions.forEach(action => {
    const connectorName = action.connector?.name || 'Unknown Connector';
    if (!connectorGroups[connectorName]) {
      connectorGroups[connectorName] = [];
    }
    connectorGroups[connectorName].push(action);
  });

  // Filter actions based on search
  const filteredActions = searchQuery.trim()
    ? actions.filter(action =>
        action.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : actions;

  // Filter out empty categories
  const nonEmptyCategories = Object.entries(categories).filter(([_, actions]) => actions.length > 0);

  const toggleCategory = (categoryName: string) => {
    setCollapsed(prev => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };
  
  const toggleConnector = (connectorName: string) => {
    setConnectorCollapsed(prev => ({ ...prev, [connectorName]: !prev[connectorName] }));
  };

  // Helper to get icon component
  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Box;
  };

  const renderStartEndNodes = () => (
    <div className="mb-2">
      <button
        onClick={() => toggleCategory('Flow Markers')}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
      >
        <div className="flex items-center space-x-2">
          {collapsed['Flow Markers'] ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Flow Markers
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          2
        </span>
      </button>

      {!collapsed['Flow Markers'] && (
        <div className="mt-1 grid grid-cols-2 gap-2 px-2">
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

          {/* Global Error Node */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                id: 0,
                name: 'global_error',
                displayName: 'Global Error',
                description: 'Default error handler for entire flow',
                category: 'error_handling',
                icon: 'XCircle',
                color: '#ef4444',
                actionType: 'global_error',
              }));
            }}
            className="flex flex-col items-center p-2 rounded cursor-move hover:bg-red-50 border border-red-200"
          >
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-1">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Global Error</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderActionItem = (action: Action) => {
    const Icon = getIconComponent(action.icon);
    const hasConnectorIcon = action.connector?.iconUrl;
    
    return (
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
            {hasConnectorIcon ? (
              <img
                src={action.connector!.iconUrl}
                alt={action.displayName}
                className="w-4 h-4 object-contain"
              />
            ) : action.actionType === 'user_defined' && !action.connector ? (
              <span className="text-white font-bold">
                {action.displayName.charAt(0)}
              </span>
            ) : (
              <Icon className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">
              {action.displayName}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) {
                setSearchQuery('');
              }
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={searchOpen ? 'Close search' : 'Search actions'}
          >
            {searchOpen ? (
              <X className="w-4 h-4 text-gray-600" />
            ) : (
              <Search className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
        {searchOpen ? (
          <div className="mt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-1">Drag to add to canvas</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {searchQuery.trim() ? (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-gray-600 px-2 py-1">
              Search Results ({filteredActions.length})
            </div>
            {filteredActions.length > 0 ? (
              filteredActions.map(action => renderActionItem(action))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xs">No actions found</p>
              </div>
            )}
          </div>
        ) : (
          <>
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

        {/* Connectors Section with Nested Groups */}
        {Object.keys(connectorGroups).length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => toggleCategory('Connectors')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                {collapsed['Connectors'] ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Connectors
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {connectorActions.length}
              </span>
            </button>

            {!collapsed['Connectors'] && (
              <div className="mt-1 space-y-1 pl-2">
                {Object.entries(connectorGroups).map(([connectorName, actions]) => (
                  <div key={connectorName}>
                    <button
                      onClick={() => toggleConnector(connectorName)}
                      className="w-full flex items-center justify-between px-2 py-1 hover:bg-gray-50 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {connectorCollapsed[connectorName] ? (
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        )}
                        <span className="text-xs font-medium text-gray-600">
                          {connectorName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                        {actions.length}
                      </span>
                    </button>

                    {!connectorCollapsed[connectorName] && (
                      <div className="mt-1 space-y-1 pl-4">
                        {actions.map(action => renderActionItem(action))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

            {nonEmptyCategories.length === 0 && Object.keys(connectorGroups).length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>No actions available</p>
                <p className="text-xs mt-1">Create actions to get started</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

