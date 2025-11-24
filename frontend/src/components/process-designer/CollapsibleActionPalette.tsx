import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, X, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import api from '@/lib/api';
import { ActionSelectionModal } from './ActionSelectionModal';
import { ConnectorSelectionModal } from './ConnectorSelectionModal';

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
    'Containers': false,
    'Flow Control': false,
    'Error Handling': false,
    'Data': false,
    'AI Actions': false,
    'Execution': false,
    'Storage': false,
    'User': true,
    'Connections': true,
  });
  
  const [connectorCollapsed, setConnectorCollapsed] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showActionModal, setShowActionModal] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  
  // Selected action IDs (persisted in localStorage) - Only show selected
  const [selectedUserActionIds, setSelectedUserActionIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('selectedUserActions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedConnectorActionIds, setSelectedConnectorActionIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('selectedConnectorActions');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Fetch all connector actions for the modal
  const [allConnectorActions, setAllConnectorActions] = useState<Action[]>([]);
  
  useEffect(() => {
    const fetchConnectorActions = async () => {
      try {
        // Fetch all connectors
        const connectorsResponse = await api.get('/connectors');
        const connectors = connectorsResponse.data.connectors || [];
        
        // Fetch actions for each connector
        const allActions: Action[] = [];
        for (const connector of connectors) {
          try {
            const actionsResponse = await api.get(`/connectors/${connector.id}/actions`);
            const connectorActions = actionsResponse.data.actions || [];
            
            // Add connector info to each action
            const actionsWithConnector = connectorActions.map((action: any) => ({
              ...action,
              actionType: 'connector',
              connector: {
                id: connector.id,
                name: connector.name,
                connectorType: connector.connectorType,
                iconUrl: connector.iconUrl,
              },
            }));
            
            allActions.push(...actionsWithConnector);
          } catch (error) {
            console.error(`Error fetching actions for connector ${connector.id}:`, error);
          }
        }
        
        setAllConnectorActions(allActions);
      } catch (error) {
        console.error('Error fetching connector actions:', error);
      }
    };
    
    fetchConnectorActions();
  }, []);
  
  // Persist selections to localStorage (for future use)
  useEffect(() => {
    localStorage.setItem('selectedUserActions', JSON.stringify(selectedUserActionIds));
  }, [selectedUserActionIds]);

  useEffect(() => {
    localStorage.setItem('selectedConnectorActions', JSON.stringify(selectedConnectorActionIds));
  }, [selectedConnectorActionIds]);

  // Special container items (not from database)
  const containerItems: Action[] = [
    {
      id: -1, // Special ID
      name: 'loop_container',
      displayName: 'Loop Container',
      description: 'Visual container for loop logic with entry/exit points',
      actionType: 'system',
      category: 'container',
      icon: 'RefreshCw',
      color: '#3b82f6',
      configSchema: {},
      inputSchema: {},
      outputSchema: {},
      executorType: 'container',
      executorConfig: {},
      isActive: true,
      createdAt: '',
      updatedAt: '',
    } as Action,
  ];

  // Categorize actions
  const categories: Record<string, Action[]> = {
    'Containers': containerItems,
    'Flow Control': actions.filter(a =>
      a.category === 'control_flow' &&
      !a.name.toLowerCase().includes('error') &&
      !a.name.toLowerCase().includes('try') &&
      !a.name.toLowerCase().includes('catch') &&
      !a.name.toLowerCase().includes('raise')
    ),
    'Error Handling': actions.filter(a =>
      (a.category === 'error_handling' ||
      a.name.toLowerCase().includes('try') ||
      a.name.toLowerCase().includes('catch') ||
      a.name.toLowerCase().includes('raise') ||
      a.name.toLowerCase().includes('retry')) &&
      // Hide On Error for now
      !a.name.toLowerCase().includes('on_error') &&
      !a.name.toLowerCase().includes('onerror') &&
      // Hide old Try-Catch-Finally (replaced with separate blocks)
      a.name !== 'try_catch_finally'
    ),
    'Data': actions.filter(a =>
      a.category === 'data' ||
      a.name.toLowerCase().includes('transform') ||
      a.name.toLowerCase().includes('validate') ||
      a.name.toLowerCase().includes('merge') ||
      a.name.toLowerCase().includes('variable') ||
      a.name.toLowerCase().includes('payload')
    ),
    'AI Actions': actions.filter(a => a.category === 'ai' || a.category === 'llm'),
    'Execution': actions.filter(a =>
      a.category === 'execution' ||
      a.name.toLowerCase().includes('script') ||
      a.name.toLowerCase().includes('idp') ||
      a.name.toLowerCase().includes('call_process') ||
      a.name.toLowerCase().includes('parallel')
    ),
    'Storage': actions.filter(a =>
      (a.category === 'storage' ||
      a.name.toLowerCase().includes('load') ||
      a.name.toLowerCase().includes('store')) &&
      // Hide save file (should be connector)
      !a.name.toLowerCase().includes('save')
    ),
    'User': actions.filter(a => 
      a.actionType === 'user_defined' && 
      selectedUserActionIds.includes(a.id)
    ),
  };

  // Group connector actions by connector name (filtered by selection) - ONLY show selected
  // Use allConnectorActions (fetched from connectors API) instead of actions prop
  const connectorActions = allConnectorActions.filter(a => 
    selectedConnectorActionIds.includes(a.id)
  );
  const connectorGroups: Record<string, Action[]> = {};
  connectorActions.forEach(action => {
    const connectorName = action.connector?.name || 'Unknown Connector';
    if (!connectorGroups[connectorName]) {
      connectorGroups[connectorName] = [];
    }
    connectorGroups[connectorName].push(action);
  });
  
  // Get all available user actions for the modal (prepared for future integration)
  // const allUserActions = actions.filter(a => a.actionType === 'user_defined');
  
  // Get all available connector actions for the modal (prepared for future integration)
  // const allConnectorActions = actions.filter(a => a.actionType === 'connector');

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

  // Flow Markers (Start and Global Error) are always present in the process designer
  // and cannot be removed, so they are hidden from the actions toolbar

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
            {/* Flow Markers hidden - Start and Global Error are always present */}

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
                {categoryName === 'User' && (
                  <button
                    onClick={() => setShowActionModal(true)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add User Actions</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* User Actions Section (if empty) */}
        {!categories['User'].length && (
          <div className="mb-2">
            <button
              onClick={() => toggleCategory('User')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                {collapsed['User'] ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  User
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                0
              </span>
            </button>

            {!collapsed['User'] && (
              <div className="mt-1 space-y-1 pl-2">
                <button
                  onClick={() => setShowActionModal(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User Actions</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Connections Section with Nested Groups */}
        {Object.keys(connectorGroups).length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => toggleCategory('Connections')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                {collapsed['Connections'] ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Connections
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {connectorActions.length}
              </span>
            </button>

            {!collapsed['Connections'] && (
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
                
                <button
                  onClick={() => setShowConnectorModal(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg border border-dashed border-green-300 transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Connections</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Connections Section (if empty) */}
        {Object.keys(connectorGroups).length === 0 && (
          <div className="mb-2">
            <button
              onClick={() => toggleCategory('Connections')}
              className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center space-x-2">
                {collapsed['Connections'] ? (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Connections
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                0
              </span>
            </button>

            {!collapsed['Connections'] && (
              <div className="mt-1 space-y-1 pl-2">
                <button
                  onClick={() => setShowConnectorModal(true)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg border border-dashed border-green-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Connections</span>
                </button>
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
      
      {/* Action Selection Modal */}
      <ActionSelectionModal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        availableActions={actions.filter(a => a.actionType === 'user_defined')}
        selectedActionIds={selectedUserActionIds}
        onSelectionChange={(newSelectedIds) => {
          setSelectedUserActionIds(newSelectedIds);
          localStorage.setItem('selectedUserActions', JSON.stringify(newSelectedIds));
        }}
      />
      
      {/* Connector Selection Modal */}
      <ConnectorSelectionModal
        isOpen={showConnectorModal}
        onClose={() => setShowConnectorModal(false)}
        availableActions={allConnectorActions}
        selectedActionIds={selectedConnectorActionIds}
        onSelectionChange={(newSelectedIds) => {
          setSelectedConnectorActionIds(newSelectedIds);
          localStorage.setItem('selectedConnectorActions', JSON.stringify(newSelectedIds));
        }}
      />
    </div>
  );
};

