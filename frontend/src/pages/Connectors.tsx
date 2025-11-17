import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { IconUpload } from '@/components/common/IconUpload';
import { 
  Plus, Edit, Trash2, TestTube, Eye, Database, Globe, 
  HardDrive, FolderOpen, Server, Code, X
} from 'lucide-react';
import api from '@/lib/api';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  authType: string | null;
  isActive: boolean;
  config: any;
  openApiSpec?: any;
  version?: string;
  iconUrl?: string;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  _count?: {
    connectorActions: number;
  };
}

interface ConnectorAction {
  id: number;
  operation: string;
  operationId: string | null;
  displayName: string;
  description: string | null;
  method: string;
  path: string;
  parameters: any;
}

const connectorIcons = {
  rest: { icon: Globe, color: '#3b82f6' },
  database: { icon: Database, color: '#10b981' },
  s3: { icon: HardDrive, color: '#f59e0b' },
  ftp: { icon: FolderOpen, color: '#8b5cf6' },
  file: { icon: Server, color: '#6366f1' },
};

export const Connectors: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  
  // Connector Detail View
  const [viewingConnector, setViewingConnector] = useState<Connector | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'specification' | 'actions' | 'stores'>('details');
  const [connectorActions, setConnectorActions] = useState<ConnectorAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [connectorStores, setConnectorStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    connectorType: 'rest',
    authType: 'none',
    iconUrl: null as string | null,
    config: {
      baseUrl: '',
      username: '',
      password: '',
      token: '',
      apiKey: '',
      timeout: 30000,
    },
  });

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [showOpenApiModal, setShowOpenApiModal] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState('');
  const [openApiUrl, setOpenApiUrl] = useState('');
  const [importingOpenApi, setImportingOpenApi] = useState(false);

  useEffect(() => {
    loadConnectors();
  }, []);

  useEffect(() => {
    if (viewingConnector && activeTab === 'stores') {
      loadConnectorStores(viewingConnector.id);
    }
  }, [viewingConnector, activeTab]);

  useEffect(() => {
    if (viewingConnector && activeTab === 'actions') {
      loadConnectorActions(viewingConnector.id);
    }
  }, [viewingConnector, activeTab]);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/connectors');
      setConnectors(response.data.connectors || []);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load connectors',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConnectorActions = async (connectorId: number) => {
    try {
      setLoadingActions(true);
      const response = await api.get(`/connectors/${connectorId}/actions`);
      setConnectorActions(response.data.actions || []);
    } catch (error: any) {
      console.error('Error loading connector actions:', error);
      setConnectorActions([]);
    } finally {
      setLoadingActions(false);
    }
  };

  const loadConnectorStores = async (connectorId: number) => {
    try {
      setLoadingStores(true);
      const response = await api.get(`/stores?connectorId=${connectorId}`);
      setConnectorStores(response.data.stores || []);
    } catch (error: any) {
      console.error('Error loading connector stores:', error);
      setConnectorStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingConnector) {
        await api.put(`/connectors/${editingConnector.id}`, formData);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Connector updated successfully',
          type: 'success',
        });
      } else {
        await api.post('/connectors', formData);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Connector created successfully',
          type: 'success',
        });
      }
      
      setShowModal(false);
      resetForm();
      loadConnectors();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save connector',
        type: 'error',
      });
    }
  };

  const handleEdit = (connector: Connector) => {
    setEditingConnector(connector);
    setFormData({
      name: connector.name,
      connectorType: connector.connectorType,
      authType: connector.authType || 'none',
      iconUrl: connector.iconUrl || null,
      config: connector.config || {},
    });
    setShowModal(true);
  };

  const handleDelete = (connector: Connector) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Connector',
      message: `Are you sure you want to delete "${connector.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Close confirm dialog immediately
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          await api.delete(`/connectors/${connector.id}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Connector deleted successfully',
            type: 'success',
          });
          loadConnectors();
        } catch (error: any) {
          // Close confirm dialog on error too
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete connector',
            type: 'error',
          });
        }
      },
    });
  };

  const handleTest = async (connector: Connector) => {
    try {
      await api.post(`/connectors/${connector.id}/test`);
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Connection test successful',
        type: 'success',
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Connection test failed',
        type: 'error',
      });
    }
  };

  const handleImportOpenApi = async () => {
    if (!selectedConnector) return;

    try {
      setImportingOpenApi(true);
      
      const payload: any = {};
      if (openApiUrl) {
        payload.url = openApiUrl;
      } else if (openApiSpec) {
        payload.openApiSpec = openApiSpec.trim();
        console.log('Sending OpenAPI spec to backend:', payload.openApiSpec.substring(0, 200) + '...');
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Error',
          message: 'Please provide either an OpenAPI spec or URL',
          type: 'error',
        });
        return;
      }

      console.log('Importing OpenAPI spec for connector:', selectedConnector.id);
      const response = await api.post(`/connectors/${selectedConnector.id}/import-openapi`, payload);
      console.log('OpenAPI import response:', response.data);
      
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Successfully imported OpenAPI spec. Created ${response.data.actionsCreated} connector actions.`,
        type: 'success',
      });
      
      setShowOpenApiModal(false);
      setOpenApiSpec('');
      setOpenApiUrl('');
      setSelectedConnector(null);
      
      loadConnectors();
      
      // If we're viewing this connector, refresh the actions
      if (viewingConnector?.id === selectedConnector.id) {
        loadConnectorActions(selectedConnector.id);
      }
    } catch (error: any) {
      console.error('Error importing OpenAPI spec:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to import OpenAPI spec';
      
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setImportingOpenApi(false);
    }
  };

  const openImportModal = (connector: Connector) => {
    setSelectedConnector(connector);
    setShowOpenApiModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      connectorType: 'rest',
      authType: 'none',
      iconUrl: null,
      config: {
        baseUrl: '',
        username: '',
        password: '',
        token: '',
        apiKey: '',
        timeout: 30000,
      },
    });
    setEditingConnector(null);
  };

  const getConnectorIcon = (type: string) => {
    const iconData = connectorIcons[type as keyof typeof connectorIcons] || connectorIcons.rest;
    const IconComponent = iconData.icon;
    return { IconComponent, color: iconData.color };
  };

  const renderConnectorCard = (connector: Connector) => {
    const { IconComponent, color } = getConnectorIcon(connector.connectorType);
    
    return (
      <div
        key={connector.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 relative"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        {/* Edit and Delete icons in top-right corner */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => handleEdit(connector)}
            className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            title="Edit connector"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(connector)}
            className="p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            title="Delete connector"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start space-x-4 mb-4">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <IconComponent className="w-8 h-8" style={{ color }} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1 pr-20">{connector.name}</h3>
            <div className="flex items-center space-x-2">
              <Badge variant={connector.isActive ? 'success' : 'default'}>
                {connector.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-gray-500 uppercase">{connector.connectorType}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {connector.connectorType === 'rest' && connector.config?.baseUrl && (
            <div>
              <span className="font-medium">Base URL:</span> {connector.config.baseUrl}
            </div>
          )}
          {connector.authType && connector.authType !== 'none' && (
            <div>
              <span className="font-medium">Auth:</span> {connector.authType}
            </div>
          )}
          <div>
            <span className="font-medium">Created by:</span> {connector.creator.firstName} {connector.creator.lastName}
          </div>
          {connector._count?.connectorActions !== undefined && (
            <div>
              <span className="font-medium">Actions:</span> {connector._count.connectorActions}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setViewingConnector(connector);
              setActiveTab('details');
            }}
            className="flex-1 flex items-center justify-center space-x-1 text-sm py-2 bg-gray-600 hover:bg-gray-700"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </Button>
          <Button
            onClick={() => handleTest(connector)}
            className="flex items-center justify-center px-4 text-sm py-2 bg-green-600 hover:bg-green-700"
            title="Test connection"
          >
            <TestTube className="w-4 h-4" />
          </Button>
          {connector.connectorType === 'rest' && (
            <Button
              onClick={() => openImportModal(connector)}
              className="flex items-center justify-center px-4 text-sm py-2 bg-purple-600 hover:bg-purple-700"
              title="Import OpenAPI"
            >
              <Code className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsTab = () => {
    if (!viewingConnector) return null;

    const { IconComponent, color } = getConnectorIcon(viewingConnector.connectorType);

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <IconComponent className="w-12 h-12" style={{ color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{viewingConnector.name}</h2>
            <p className="text-gray-600 capitalize">{viewingConnector.connectorType} Connector</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Badge variant={viewingConnector.isActive ? 'success' : 'default'}>
              {viewingConnector.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
            <p className="text-gray-900">{viewingConnector.authType || 'None'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <p className="text-gray-900">{viewingConnector.creator.firstName} {viewingConnector.creator.lastName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
            <p className="text-gray-900">{new Date(viewingConnector.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {viewingConnector.connectorType === 'rest' && viewingConnector.config?.baseUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{viewingConnector.config.baseUrl}</p>
          </div>
        )}

        {viewingConnector.version && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <p className="text-gray-900">{viewingConnector.version}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSpecificationTab = () => {
    if (!viewingConnector) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">OpenAPI Specification</h3>
          <Button
            onClick={() => openImportModal(viewingConnector)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Import/Update Spec</span>
          </Button>
        </div>

        {viewingConnector.openApiSpec ? (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    API Title: {viewingConnector.openApiSpec.info?.title || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Version: {viewingConnector.openApiSpec.openapi || viewingConnector.openApiSpec.swagger || 'N/A'}
                  </p>
                </div>
              </div>
              <pre className="bg-white p-4 rounded border border-gray-200 overflow-auto max-h-96 text-xs">
                {JSON.stringify(viewingConnector.openApiSpec, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Code className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No OpenAPI specification imported yet</p>
            <Button
              onClick={() => openImportModal(viewingConnector)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Import OpenAPI Spec
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderActionsTab = () => {
    if (!viewingConnector) return null;

    if (loadingActions) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading actions...</p>
        </div>
      );
    }

    if (connectorActions.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No actions available for this connector</p>
          {viewingConnector.connectorType === 'rest' && (
            <Button
              onClick={() => openImportModal(viewingConnector)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Import OpenAPI to Generate Actions
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Connector Actions ({connectorActions.length})
          </h3>
        </div>
        <div className="grid gap-4">
          {connectorActions.map((action) => (
            <div
              key={action.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{action.displayName}</h4>
                  <div className="flex items-center space-x-3 text-sm mb-2">
                    <div className="bg-blue-100 text-blue-700 border-blue-200 border px-2 py-1 rounded text-xs font-medium">
                      {action.method}
                    </div>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{action.path}</code>
                  </div>
                  {action.description && (
                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                  )}
                  {action.operationId && (
                    <p className="text-xs text-gray-500">Operation ID: {action.operationId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStoresTab = () => {
    if (!viewingConnector) return null;

    if (loadingStores) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading stores...</p>
        </div>
      );
    }

    if (connectorStores.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No stores configured for this connector</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Stores represent specific data access points within this connector (e.g., tables, buckets, folders)
          </p>
          <Button
            onClick={() => {
              // Navigate to stores page with pre-selected connector
              window.location.href = `/stores?connectorId=${viewingConnector.id}`;
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Store
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Stores ({connectorStores.length})
          </h3>
          <Button
            onClick={() => {
              window.location.href = `/stores?connectorId=${viewingConnector.id}`;
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Store
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {connectorStores.map((store: any) => (
            <div
              key={store.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{store.name}</h4>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {store.storeType.toUpperCase()}
                    </span>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      {store.dataType.toUpperCase()}
                    </span>
                    {store.isDefault && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded">
                        DEFAULT
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  store.isActive 
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {store.storeType === 'database' && store.config.host && (
                  <div><span className="font-medium">Host:</span> {store.config.host}:{store.config.port}</div>
                )}
                {store.storeType === 's3' && store.config.bucket && (
                  <div><span className="font-medium">Bucket:</span> {store.config.bucket}</div>
                )}
                {store.storeType === 'redis' && store.config.url && (
                  <div><span className="font-medium">URL:</span> {store.config.url.split('@')[1] || 'Redis'}</div>
                )}
                {store.storeType === 'local_file' && store.config.basePath && (
                  <div><span className="font-medium">Path:</span> {store.config.basePath}</div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Created: {new Date(store.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading connectors...</p>
      </div>
    );
  }

  // Viewing connector details
  if (viewingConnector) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Button
            onClick={() => setViewingConnector(null)}
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Back to Connectors</span>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Details
              </button>
              {viewingConnector.connectorType === 'rest' && (
                <button
                  onClick={() => setActiveTab('specification')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'specification'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Specification
                </button>
              )}
              <button
                onClick={() => setActiveTab('actions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'actions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Actions
                {viewingConnector._count?.connectorActions !== undefined && (
                  <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {viewingConnector._count.connectorActions}
                  </span>
                )}
              </button>
              {/* Stores Tab - for all non-REST connectors */}
              {viewingConnector.connectorType !== 'rest' && (
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stores'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Stores
                  {connectorStores.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                      {connectorStores.length}
                    </span>
                  )}
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'specification' && renderSpecificationTab()}
          {activeTab === 'actions' && renderActionsTab()}
          {activeTab === 'stores' && renderStoresTab()}
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
  }

  // Connectors list view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Connectors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage external service connections</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-5 h-5" />
          <span>New Connector</span>
        </Button>
      </div>

      {connectors.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 mb-4">No connectors found. Create your first connector to get started.</p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Connector
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map(renderConnectorCard)}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingConnector ? 'Edit Connector' : 'Create New Connector'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Connector Type</label>
                  <select
                    value={formData.connectorType}
                    onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rest">REST API</option>
                    <option value="database">Database</option>
                    <option value="s3">S3 Storage</option>
                    <option value="ftp">FTP/SFTP</option>
                    <option value="file">File System</option>
                  </select>
                </div>

                <IconUpload
                  currentIcon={formData.iconUrl || undefined}
                  onIconChange={(iconUrl) => setFormData({ ...formData, iconUrl })}
                  label="Custom Icon (Optional)"
                  helpText="Upload a custom icon for this connector (PNG, JPG, SVG - max 512KB)"
                />

                {formData.connectorType === 'rest' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                      <input
                        type="text"
                        value={formData.config.baseUrl}
                        onChange={(e) => setFormData({ ...formData, config: { ...formData.config, baseUrl: e.target.value } })}
                        placeholder="https://api.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Type</label>
                      <select
                        value={formData.authType}
                        onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="basic">Basic Auth</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="api_key">API Key</option>
                      </select>
                    </div>

                    {formData.authType === 'basic' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <input
                            type="text"
                            value={formData.config.username}
                            onChange={(e) => setFormData({ ...formData, config: { ...formData.config, username: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="password"
                            value={formData.config.password}
                            onChange={(e) => setFormData({ ...formData, config: { ...formData.config, password: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {formData.authType === 'bearer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
                        <input
                          type="password"
                          value={formData.config.token}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, token: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {formData.authType === 'api_key' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="password"
                          value={formData.config.apiKey}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, apiKey: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingConnector ? 'Update' : 'Create'} Connector
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OpenAPI Import Modal */}
      {showOpenApiModal && selectedConnector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                Import OpenAPI Spec for {selectedConnector.name}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAPI Spec URL
                  </label>
                  <input
                    type="text"
                    value={openApiUrl}
                    onChange={(e) => setOpenApiUrl(e.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a URL to fetch the OpenAPI spec from
                  </p>
                </div>

                <div className="text-center text-gray-500 font-medium">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste OpenAPI Spec (JSON/YAML)
                  </label>
                  <textarea
                    value={openApiSpec}
                    onChange={(e) => setOpenApiSpec(e.target.value)}
                    placeholder="Paste your OpenAPI 3.0 specification here..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste your OpenAPI 3.0 specification here (JSON or YAML format supported)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => {
                    setShowOpenApiModal(false);
                    setOpenApiSpec('');
                    setOpenApiUrl('');
                    setSelectedConnector(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportOpenApi}
                  disabled={importingOpenApi}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {importingOpenApi ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};
