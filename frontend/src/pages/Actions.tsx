import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import { 
  FileText, Network, Save, GitBranch, RefreshCw, ChevronDown, ChevronRight,
  Box, User, Plug, Zap, Plus, Search, Send, Inbox
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
  connector?: {
    id: number;
    name: string;
    connectorType: string;
    iconUrl?: string;
  };
}

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  version: string;
  isActive: boolean;
  iconUrl?: string;
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
  Send,
  Inbox,
};

interface GroupedActions {
  system: Map<string, Action[]>; // Grouped by category
  user: Action[];
  connector: Map<number, { connector: Connector; actions: Action[] }>;
}

const categoryNames: Record<string, string> = {
  control_flow: 'Control Flow',
  data: 'Data',
  api: 'API',
  storage: 'Storage',
  idp: 'IDP',
  messaging: 'Messaging',
  custom: 'Custom',
};

export const Actions: React.FC = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'user' | 'system' | 'connectors'>('user');
  
  // Collapsed state for system action categories
  const [categoryCollapsed, setCategoryCollapsed] = useState<Record<string, boolean>>({});

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

  const toggleCategory = (category: string) => {
    setCategoryCollapsed(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleConnector = (connectorId: number) => {
    setConnectorCollapsed(prev => ({ ...prev, [connectorId]: !prev[connectorId] }));
  };

  // Group actions
  const groupedActions: GroupedActions = React.useMemo(() => {
    const grouped: GroupedActions = {
      system: new Map(),
      user: [],
      connector: new Map(),
    };

    actions.forEach(action => {
      if (action.actionType === 'system') {
        const category = action.category || 'custom';
        if (!grouped.system.has(category)) {
          grouped.system.set(category, []);
        }
        grouped.system.get(category)!.push(action);
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
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          // System actions are read-only, don't navigate
          if (action.isSystem) {
            setAlertDialog({
              isOpen: true,
              title: 'System Action',
              message: 'System actions are read-only and cannot be edited.',
              type: 'info',
            });
          } else {
            navigate(`/actions/edit/${action.id}`);
          }
        }}
      >
        <div className="flex items-start space-x-3">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${action.color}20` }}
          >
            <IconComponent className="w-5 h-5" style={{ color: action.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{action.displayName}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{action.description || 'No description'}</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {action.category}
              </div>
              {action.isSystem && (
                <Badge variant="default">System</Badge>
              )}
              {action.connector && (
                <Badge variant="success">{action.connector.name}</Badge>
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
        <p>Loading actions...</p>
      </div>
    );
  }

  const userActions = filterActions(groupedActions.user);
  const systemActionCount = Array.from(groupedActions.system.values()).reduce((sum, actions) => sum + actions.length, 0);
  const connectorActionCount = Array.from(groupedActions.connector.values()).reduce((sum, { actions }) => sum + actions.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Action Library</h1>
          <p className="text-gray-600 mt-1">
            {actions.length} actions available • {userActions.length} user • {systemActionCount} system • {connectorActionCount} connector
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'user' | 'system' | 'connectors')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="user" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>User Actions ({userActions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Box className="w-4 h-4" />
            <span>System Actions ({systemActionCount})</span>
          </TabsTrigger>
          <TabsTrigger value="connectors" className="flex items-center space-x-2">
            <Plug className="w-4 h-4" />
            <span>Connectors ({groupedActions.connector.size})</span>
          </TabsTrigger>
        </TabsList>

        {/* User Actions Tab */}
        <TabsContent value="user">
          <Card>
            {userActions.length > 0 ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userActions.map(renderActionCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No user actions yet</p>
                <Button
                  onClick={() => navigate('/actions/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Your First Action
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* System Actions Tab - Grouped by Category */}
        <TabsContent value="system">
          <div className="space-y-4">
            {groupedActions.system.size > 0 ? (
              Array.from(groupedActions.system.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, categoryActions]) => {
                  const filteredActions = filterActions(categoryActions);
                  if (filteredActions.length === 0 && searchTerm) return null;

                  return (
                    <Card key={category} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center space-x-3">
                          {categoryCollapsed[category] ? (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {categoryNames[category] || category}
                            </h3>
                            <p className="text-sm text-gray-500">{filteredActions.length} actions</p>
                          </div>
                        </div>
                        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {filteredActions.length}
                        </div>
                      </div>
                      {!categoryCollapsed[category] && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredActions.map(renderActionCard)}
                        </div>
                      )}
                    </Card>
                  );
                })
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No system actions found</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Connector Actions Tab - One Collapsible per Connector */}
        <TabsContent value="connectors">
          <div className="space-y-4">
            {groupedActions.connector.size > 0 ? (
              Array.from(groupedActions.connector.values()).map(({ connector, actions: connectorActions }) => {
                const filteredConnectorActions = filterActions(connectorActions);
                if (filteredConnectorActions.length === 0 && searchTerm) return null;

                return (
                  <Card key={connector.id} className="overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => toggleConnector(connector.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {connectorCollapsed[connector.id] ? (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                        <Plug className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{connector.name}</h3>
                          <p className="text-sm text-gray-500">
                            {filteredConnectorActions.length} actions • {connector.connectorType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {filteredConnectorActions.length}
                        </div>
                        <Badge variant="default">{connector.version}</Badge>
                      </div>
                    </div>
                    {!connectorCollapsed[connector.id] && (
                      <div className="p-4">
                        {filteredConnectorActions.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredConnectorActions.map(renderActionCard)}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">
                            No actions found for this connector
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Plug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No connector actions yet</p>
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
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
