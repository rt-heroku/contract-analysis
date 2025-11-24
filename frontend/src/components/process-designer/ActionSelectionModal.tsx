import { useState, useMemo } from 'react';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
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
}

interface ActionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableActions: Action[];
  selectedActionIds: number[];
  onSelectionChange: (actionIds: number[]) => void;
}

export const ActionSelectionModal: React.FC<ActionSelectionModalProps> = ({
  isOpen,
  onClose,
  availableActions,
  selectedActionIds,
  onSelectionChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get icon component
  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Box;
  };

  // Filter available actions
  const filteredAvailable = useMemo(() => {
    return availableActions.filter(action => {
      const matchesSearch = searchQuery.trim()
        ? action.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      return matchesSearch && !selectedActionIds.includes(action.id);
    });
  }, [availableActions, selectedActionIds, searchQuery]);

  // Get selected actions
  const selectedActions = useMemo(() => {
    return availableActions.filter(action => selectedActionIds.includes(action.id));
  }, [availableActions, selectedActionIds]);

  const handleAdd = (actionId: number) => {
    onSelectionChange([...selectedActionIds, actionId]);
  };

  const handleRemove = (actionId: number) => {
    onSelectionChange(selectedActionIds.filter(id => id !== actionId));
  };

  const renderActionItem = (action: Action, isSelected: boolean) => {
    const Icon = getIconComponent(action.icon);

    return (
      <div
        key={action.id}
        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: action.color || '#6366f1' }}
          >
            {action.actionType === 'user_defined' ? (
              <span className="text-white font-bold text-sm">
                {action.displayName.charAt(0)}
              </span>
            ) : (
              <Icon className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate text-sm">
              {action.displayName}
            </div>
            {action.description && (
              <div className="text-xs text-gray-500 truncate">
                {action.description}
              </div>
            )}
          </div>
        </div>
        
        {isSelected ? (
          <button
            onClick={() => handleRemove(action.id)}
            className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
            title="Remove from palette"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleAdd(action.id)}
            className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
            title="Add to palette"
          >
            <Plus className="w-4 h-4" />
          </button>
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
            <h2 className="text-2xl font-bold text-gray-900">Manage User Actions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add user-defined actions to your palette
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
          {/* Left Column - Available Actions */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Available Actions ({filteredAvailable.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actions..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailable.length > 0 ? (
                filteredAvailable.map(action => renderActionItem(action, false))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">
                    {searchQuery ? 'No actions match your search' : 'No available actions'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Selected Actions */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Added to Palette ({selectedActions.length})
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                These actions will appear in your action palette
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedActions.length > 0 ? (
                selectedActions.map(action => renderActionItem(action, true))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No actions added yet</p>
                  <p className="text-xs mt-1">Click the + button to add actions</p>
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

