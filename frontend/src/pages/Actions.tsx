import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { 
  FileText, Network, Save, GitBranch, RefreshCw, ChevronDown, ChevronRight,
  Box, User, Plug, Zap, Plus, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType: string;
  isSystem: boolean;
  isActive: boolean;
  connectorId?: number;
}

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  version: string;
  isActive: boolean;
}

const iconMap: Record<string, any> = {
  FileText,
  Network,
  Save,
  GitBranch,
  RefreshCw,
  Box,
  User,
  Plug,
  Zap,
};

interface GroupedActions {
  system: Action[];
  user: Action[];
  connector: Map<number, { connector: Connector; actions: Action[] }>;
}

export const Actions: React.FC = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Collapsed state for each group
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    system: false,
    user: false,
    connectors: false,
  });

  // Collapsed state for individual connectors
  const [connectorCollapsed, setConnectorCollapsed] = useState<Record<number, boolean>>({});
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actionsRes, connectorsRes] = await Promise.all([
        api.get('/actions'),
        api.get('/connectors'),
      ]);
      setActions(actionsRes.data.actions || []);
      setConnectors(connectorsRes.data.connectors || []);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleConnector = (connectorId: number) => {
    setConnectorCollapsed(prev => ({ ...prev, [connectorId]: !prev[connectorId] }));
  };

  // Group actions
  const groupedActions: GroupedActions = React.useMemo(() => {
    const grouped: GroupedActions = {
      system: [],
      user: [],
      connector: new Map(),
    };

    actions.forEach(action => {
      if (action.actionType === 'system') {
        grouped.system.push(action);
      } else if (action.actionType === 'user_defined') {
        grouped.user.push(action);
      } else if (action.actionType === 'connector' && action.connectorId) {
        const connector = connectors.find(c => c.id === action.connectorId);
        if (connector) {
          if (!grouped.connector.has(action.connectorId)) {
            grouped.connector.set(action.connectorId, { connector, actions: [] });
          }
          grouped.connector.get(action.connectorId)!.actions.push(action);
        }
      }
    });

    return grouped;
  }, [actions, connectors]);

  // Filter by search
  const filterActions = (actionList: Action[]) => {
    if (!searchTerm) return actionList;
    return actionList.filter(action =>
      action.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderActionCard = (action: Action) => {
    const IconComponent = iconMap[action.icon] || Box;
    
    return (
      <div
        key={action.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: action.color || '#3b82f6' }}
          >
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {action.displayName}
            </h3>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {action.description}
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <div>
                <Badge variant="default">
                  {action.category}
                </Badge>
              </div>
              {action.isSystem && (
                <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                  System
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading actions...</div>
      </div>
    );
  }

  const systemActions = filterActions(groupedActions.system);
  const userActions = filterActions(groupedActions.user);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Action Library</h1>
          <p className="text-gray-600 mt-1">
            {actions.length} actions available • {groupedActions.system.length} system • {groupedActions.user.length} user • {groupedActions.connector.size} connectors
          </p>
        </div>
        <Button
          onClick={() => navigate('/actions/new')}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Create Action</span>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* System Actions Group */}
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
            onClick={() => toggleGroup('system')}
          >
            <div className="flex items-center space-x-3">
              {collapsed.system ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
              <Box className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">System Actions</h2>
                <p className="text-sm text-gray-500">{systemActions.length} built-in actions</p>
              </div>
            </div>
            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
              {systemActions.length}
            </div>
          </div>
          {!collapsed.system && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemActions.length > 0 ? (
                systemActions.map(renderActionCard)
              ) : (
                <p className="text-gray-500 col-span-full text-center py-8">
                  No system actions found
                </p>
              )}
            </div>
          )}
        </Card>

        {/* User Actions Group */}
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
            onClick={() => toggleGroup('user')}
          >
            <div className="flex items-center space-x-3">
              {collapsed.user ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Actions</h2>
                <p className="text-sm text-gray-500">{userActions.length} custom actions</p>
              </div>
            </div>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {userActions.length}
            </div>
          </div>
          {!collapsed.user && (
            <div className="p-4">
              {userActions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userActions.map(renderActionCard)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No user actions yet</p>
                  <Button
                    onClick={() => navigate('/actions/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Create Your First Action
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Connector Actions Group */}
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
            onClick={() => toggleGroup('connectors')}
          >
            <div className="flex items-center space-x-3">
              {collapsed.connectors ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
              <Plug className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Connector Actions</h2>
                <p className="text-sm text-gray-500">
                  {groupedActions.connector.size} connectors with actions
                </p>
              </div>
            </div>
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              {groupedActions.connector.size}
            </div>
          </div>
          {!collapsed.connectors && (
            <div className="p-4 space-y-3">
              {groupedActions.connector.size > 0 ? (
                Array.from(groupedActions.connector.values()).map(({ connector, actions: connectorActions }) => {
                  const filteredConnectorActions = filterActions(connectorActions);
                  if (filteredConnectorActions.length === 0 && searchTerm) return null;

                  return (
                    <div key={connector.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleConnector(connector.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {connectorCollapsed[connector.id] ? (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                          <Plug className="w-5 h-5 text-green-600" />
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {connector.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {connector.connectorType.toUpperCase()} • v{connector.version} • {filteredConnectorActions.length} actions
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                          {filteredConnectorActions.length}
                        </div>
                      </div>
                      {!connectorCollapsed[connector.id] && (
                        <div className="p-3 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredConnectorActions.map(renderActionCard)}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No connector actions yet</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Create connectors and import OpenAPI specs to generate actions
                  </p>
                  <Button
                    onClick={() => navigate('/connectors')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Go to Connectors
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
};
