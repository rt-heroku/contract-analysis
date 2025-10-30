import React, { useState } from 'react';
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType?: 'system' | 'user_defined' | 'connector' | 'start' | 'end' | 'global_error';
  connector?: {
    id: number;
    name: string;
    iconUrl?: string;
  };
}

interface Connector {
  id: number;
  name: string;
  displayName: string;
  actions: Action[];
  iconUrl?: string;
}

interface FloatingActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Action[];
  connectors: Connector[];
  onDragStart: (event: React.DragEvent, action: Action) => void;
}

export const FloatingActionsModal: React.FC<FloatingActionsModalProps> = ({
  isOpen,
  onClose,
  actions,
  connectors,
  onDragStart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
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

  if (!isOpen) return null;

  const toggleCollapse = (category: string) => {
    setCollapsed(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Box;
  };

  // Filter actions by search query
  const filteredActions = actions.filter(action =>
    action.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize actions
  const containerItems = [
    {
      id: 999999,
      name: 'loop_container',
      displayName: 'Loop Container',
      description: 'Visual container for loop logic',
      category: 'containers',
      icon: 'RotateCw',
      color: '#8b5cf6',
      actionType: 'system' as const,
    },
  ];

  const categories: Record<string, Action[]> = {
    'Containers': containerItems,
    'Flow Control': filteredActions.filter(a =>
      a.category === 'control_flow' &&
      !a.name.toLowerCase().includes('error') &&
      !a.name.toLowerCase().includes('try') &&
      !a.name.toLowerCase().includes('catch') &&
      !a.name.toLowerCase().includes('raise')
    ),
    'Error Handling': filteredActions.filter(a =>
      a.category === 'error_handling' ||
      a.name.toLowerCase().includes('error') ||
      a.name.toLowerCase().includes('try') ||
      a.name.toLowerCase().includes('catch') ||
      a.name.toLowerCase().includes('raise')
    ),
    'Data': filteredActions.filter(a =>
      a.category === 'data_transform' ||
      a.name.toLowerCase().includes('transform') ||
      a.name.toLowerCase().includes('set_variable') ||
      a.name.toLowerCase().includes('set_payload')
    ),
    'AI Actions': filteredActions.filter(a => a.category === 'ai'),
    'Execution': filteredActions.filter(a =>
      a.category === 'execution' ||
      a.name.toLowerCase().includes('script') ||
      a.name.toLowerCase().includes('idp') ||
      a.name.toLowerCase().includes('call_process') ||
      a.name.toLowerCase().includes('parallel')
    ),
    'Storage': filteredActions.filter(a =>
      a.category === 'storage' ||
      a.name.toLowerCase().includes('store')
    ),
    'User': filteredActions.filter(a => a.actionType === 'user_defined'),
    'Connections': [], // Will be populated by connectors
  };

  const renderActionItem = (action: Action) => {
    const Icon = getIconComponent(action.icon);
    const hasConnectorIcon = action.connector?.iconUrl;

    return (
      <div
        key={action.id}
        draggable
        onDragStart={(event) => onDragStart(event, action)}
        className="px-3 py-2 rounded cursor-move hover:bg-gray-100 border border-gray-200 transition-colors mb-1"
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
            <div className="text-sm font-medium text-gray-900 truncate">
              {action.displayName}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {action.description}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed left-0 top-0 h-full z-50">
      <div className="bg-white shadow-2xl w-80 h-full flex flex-col border-r-2 border-gray-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Nodes Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {Object.entries(categories).map(([categoryName, categoryActions]) => {
            if (categoryName === 'Connections') return null; // Handle separately
            if (categoryActions.length === 0) return null;

            const isCollapsed = collapsed[categoryName];

            return (
              <div key={categoryName} className="mb-4">
                <button
                  onClick={() => toggleCollapse(categoryName)}
                  className="flex items-center justify-between w-full px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <span>{categoryName}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {!isCollapsed && (
                  <div className="mt-2 space-y-1">
                    {categoryActions.map(action => renderActionItem(action))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Connectors Section */}
          {connectors.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => toggleCollapse('Connections')}
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <span>Connections</span>
                {collapsed['Connections'] ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {!collapsed['Connections'] && (
                <div className="mt-2 space-y-2">
                  {connectors.map(connector => (
                    <div key={connector.id}>
                      <button
                        onClick={() => toggleCollapse(`connector-${connector.id}`)}
                        className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {connector.iconUrl && (
                            <img src={connector.iconUrl} alt={connector.displayName} className="w-4 h-4" />
                          )}
                          <span>{connector.displayName}</span>
                        </div>
                        {collapsed[`connector-${connector.id}`] ? (
                          <ChevronRight className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      {!collapsed[`connector-${connector.id}`] && (
                        <div className="mt-1 ml-2 space-y-1">
                          {connector.actions.map(action => renderActionItem(action))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            Drag actions to the canvas
          </div>
        </div>
      </div>
    </div>
  );
};

