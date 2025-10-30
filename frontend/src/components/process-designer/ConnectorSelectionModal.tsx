import { useState, useMemo } from 'react';
import { X, Search, Plus, Trash2, ChevronDown, ChevronRight, Database, Globe, HardDrive, FolderOpen, Server } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType?: string;
  connectorId?: number;
  connector?: {
    id: number;
    name: string;
    connectorType: string;
    iconUrl?: string;
  };
}

interface ConnectorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableActions: Action[]; // All connector actions
  selectedActionIds: number[];
  onSelectionChange: (actionIds: number[]) => void;
}

const connectorIcons: Record<string, any> = {
  rest: Globe,
  database: Database,
  s3: HardDrive,
  ftp: FolderOpen,
  file: Server,
};

export const ConnectorSelectionModal: React.FC<ConnectorSelectionModalProps> = ({
  isOpen,
  onClose,
  availableActions,
  selectedActionIds,
  onSelectionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedConnectors, setExpandedConnectors] = useState<Set<number>>(new Set());

  // Group actions by connector
  const groupedByConnector = useMemo(() => {
    const groups: Record<number, { connector: any; actions: Action[] }> = {};
    
    availableActions.forEach(action => {
      if (action.connector) {
        if (!groups[action.connector.id]) {
          groups[action.connector.id] = {
            connector: action.connector,
            actions: [],
          };
        }
        groups[action.connector.id].actions.push(action);
      }
    });
    
    return groups;
  }, [availableActions]);

  // Filter connectors and actions by search
  const filteredConnectors = useMemo(() => {
    if (!searchQuery.trim()) {
      return Object.values(groupedByConnector);
    }

    return Object.values(groupedByConnector).filter(group => {
      const connectorMatch = group.connector.name.toLowerCase().includes(searchQuery.toLowerCase());
      const actionMatch = group.actions.some(action =>
        action.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return connectorMatch || actionMatch;
    });
  }, [groupedByConnector, searchQuery]);

  // Get selected actions
  const selectedActions = useMemo(() => {
    return availableActions.filter(action => selectedActionIds.includes(action.id));
  }, [availableActions, selectedActionIds]);

  // Group selected actions by connector
  const selectedByConnector = useMemo(() => {
    const groups: Record<number, { connector: any; actions: Action[] }> = {};
    
    selectedActions.forEach(action => {
      if (action.connector) {
        if (!groups[action.connector.id]) {
          groups[action.connector.id] = {
            connector: action.connector,
            actions: [],
          };
        }
        groups[action.connector.id].actions.push(action);
      }
    });
    
    return Object.values(groups);
  }, [selectedActions]);

  const toggleConnector = (connectorId: number) => {
    const newExpanded = new Set(expandedConnectors);
    if (newExpanded.has(connectorId)) {
      newExpanded.delete(connectorId);
    } else {
      newExpanded.add(connectorId);
    }
    setExpandedConnectors(newExpanded);
  };

  const handleAddAction = (actionId: number) => {
    onSelectionChange([...selectedActionIds, actionId]);
  };

  const handleRemoveAction = (actionId: number) => {
    onSelectionChange(selectedActionIds.filter(id => id !== actionId));
  };

  const handleAddAllConnectorActions = (connectorId: number) => {
    const connectorActions = groupedByConnector[connectorId]?.actions || [];
    const newActionIds = connectorActions.map(a => a.id).filter(id => !selectedActionIds.includes(id));
    onSelectionChange([...selectedActionIds, ...newActionIds]);
  };

  const handleRemoveAllConnectorActions = (connectorId: number) => {
    const connectorActions = groupedByConnector[connectorId]?.actions || [];
    const idsToRemove = new Set(connectorActions.map(a => a.id));
    onSelectionChange(selectedActionIds.filter(id => !idsToRemove.has(id)));
  };

  const renderActionItem = (action: Action, isSelected: boolean) => {
    const Icon = connectorIcons[action.connector?.connectorType || 'rest'] || Globe;

    return (
      <div
        key={action.id}
        className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded hover:border-blue-300 transition-colors ml-6"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: action.color || '#6366f1' }}
          >
            {action.connector?.iconUrl ? (
              <img
                src={action.connector.iconUrl}
                alt={action.displayName}
                className="w-4 h-4 object-contain"
              />
            ) : (
              <Icon className="w-3 h-3 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate text-xs">
              {action.displayName}
            </div>
          </div>
        </div>
        
        {isSelected ? (
          <button
            onClick={() => handleRemoveAction(action.id)}
            className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
            title="Remove action"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => handleAddAction(action.id)}
            className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
            title="Add action"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  const renderConnectorGroup = (group: { connector: any; actions: Action[] }, isAvailable: boolean) => {
    const isExpanded = expandedConnectors.has(group.connector.id);
    const Icon = connectorIcons[group.connector.connectorType] || Globe;

    return (
      <div key={group.connector.id} className="mb-2">
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
          <div className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer" onClick={() => toggleConnector(group.connector.id)}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            )}
            <div
              className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: '#3b82f620' }}
            >
              {group.connector.iconUrl ? (
                <img
                  src={group.connector.iconUrl}
                  alt={group.connector.name}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <Icon className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate text-sm">
                {group.connector.name}
              </div>
              <div className="text-xs text-gray-500">
                {group.actions.length} action{group.actions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {isAvailable ? (
            <button
              onClick={() => handleAddAllConnectorActions(group.connector.id)}
              className="ml-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
              title="Add all actions"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleRemoveAllConnectorActions(group.connector.id)}
              className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
              title="Remove all actions"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-1 space-y-1">
            {group.actions.map(action => renderActionItem(action, !isAvailable))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Connectors</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add connector actions to your palette
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Two Columns */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Available Connectors */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Available Connectors ({filteredConnectors.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search connectors or actions..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {filteredConnectors.length > 0 ? (
                filteredConnectors.map(group => renderConnectorGroup(group, true))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">
                    {searchQuery ? 'No connectors match your search' : 'No available connectors'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Selected Connectors/Actions */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Added to Palette ({selectedActions.length} actions)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                These connector actions will appear in your palette
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedByConnector.length > 0 ? (
                selectedByConnector.map(group => renderConnectorGroup(group, false))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No connector actions added yet</p>
                  <p className="text-xs mt-1">Click + to add actions or entire connectors</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

