import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ConnectorTypeSelectionModal } from '@/components/connectors/ConnectorTypeSelectionModal';
import { DatabaseConnectorConfigModal } from '@/components/connectors/DatabaseConnectorConfigModal';
import { 
  Plus, Edit, Trash2, TestTube, Database, Globe, 
  HardDrive, FolderOpen, Server, Sparkles, Lock,
  ChevronRight, CheckCircle, XCircle, Loader, AlertCircle, X
} from 'lucide-react';
import api from '@/lib/api';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  authType: string | null;
  isActive: boolean;
  isAutoCreated?: boolean;
  category?: string;
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

const connectorIcons = {
  rest: { icon: Globe, color: '#3b82f6', label: 'REST API' },
  database: { icon: Database, color: '#10b981', label: 'Database' },
  inference: { icon: Sparkles, color: '#ec4899', label: 'AI / Inference' },
  s3: { icon: HardDrive, color: '#f59e0b', label: 'Storage' },
  ftp: { icon: FolderOpen, color: '#8b5cf6', label: 'FTP' },
  file: { icon: Server, color: '#6366f1', label: 'File System' },
};

export const Connectors: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnectors, setTestingConnectors] = useState<Set<number>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<Record<number, 'success' | 'error' | null>>({});
  
  // Modals
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
  const [showDatabaseConfigModal, setShowDatabaseConfigModal] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  const [viewingConnector, setViewingConnector] = useState<Connector | null>(null);
  
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

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const response = await api.get('/connectors');
      // Ensure we always set an array
      const data = Array.isArray(response.data) ? response.data : [];
      setConnectors(data);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load connectors',
        type: 'error',
      });
      // Set empty array on error
      setConnectors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnector = () => {
    setEditingConnector(null);
    setShowTypeSelectionModal(true);
  };

  const handleTypeSelected = (type: string) => {
    setShowTypeSelectionModal(false);
    if (type === 'database') {
      setShowDatabaseConfigModal(true);
    } else {
      // For other types, show appropriate config modal (future implementation)
      setAlertDialog({
        isOpen: true,
        title: 'Coming Soon',
        message: `Configuration for ${type} connectors is not yet implemented.`,
        type: 'info',
      });
    }
  };

  const handleEdit = (connector: Connector) => {
    if (connector.isAutoCreated || connector.category === 'System') {
      setAlertDialog({
        isOpen: true,
        title: 'Cannot Edit',
        message: 'System connectors are read-only and cannot be edited.',
        type: 'warning',
      });
      return;
    }
    
    setEditingConnector(connector);
    
    if (connector.connectorType === 'database') {
      setShowDatabaseConfigModal(true);
    } else {
      // For other types, show appropriate config modal
      setAlertDialog({
        isOpen: true,
        title: 'Not Implemented',
        message: `Editing ${connector.connectorType} connectors is not yet implemented.`,
        type: 'info',
      });
    }
  };

  const handleDelete = (connector: Connector) => {
    if (connector.isAutoCreated || connector.category === 'System') {
      setAlertDialog({
        isOpen: true,
        title: 'Cannot Delete',
        message: 'System connectors cannot be deleted. They are managed automatically.',
        type: 'warning',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Connector',
      message: `Are you sure you want to delete "${connector.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.delete(`/connectors/${connector.id}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Connector deleted successfully',
            type: 'success',
          });
          loadConnectors();
        } catch (error: any) {
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

  const testConnection = async (connector: Connector) => {
    setTestingConnectors(prev => new Set(prev).add(connector.id));
    setConnectionStatus(prev => ({ ...prev, [connector.id]: null }));

    try {
      const response = await api.post(`/connectors/test/${connector.id}`);
      setConnectionStatus(prev => ({ 
        ...prev, 
        [connector.id]: response.data.success ? 'success' : 'error' 
      }));
      
      if (!response.data.success) {
        setAlertDialog({
          isOpen: true,
          title: 'Connection Failed',
          message: response.data.error || 'Failed to connect',
          type: 'error',
        });
      }
    } catch (error: any) {
      setConnectionStatus(prev => ({ ...prev, [connector.id]: 'error' }));
      setAlertDialog({
        isOpen: true,
        title: 'Connection Error',
        message: error.response?.data?.error || 'Failed to test connection',
        type: 'error',
      });
    } finally {
      setTestingConnectors(prev => {
        const next = new Set(prev);
        next.delete(connector.id);
        return next;
      });
    }
  };

  const getConnectorIcon = (type: string) => {
    const config = connectorIcons[type as keyof typeof connectorIcons] || connectorIcons.rest;
    return config;
  };

  // Safely group connectors by type
  const groupedConnectors = Array.isArray(connectors) 
    ? connectors.reduce((acc, connector) => {
        const type = connector.connectorType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(connector);
        return acc;
      }, {} as Record<string, Connector[]>)
    : {};

  const renderConnectionStatus = (connectorId: number) => {
    if (testingConnectors.has(connectorId)) {
      return (
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs">
          <Loader className="w-3.5 h-3.5 animate-spin" />
          <span>Testing...</span>
        </div>
      );
    }
    
    const status = connectionStatus[connectorId];
    if (status === 'success') {
      return (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Connected</span>
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs">
          <XCircle className="w-3.5 h-3.5" />
          <span>Failed</span>
        </div>
      );
    }
    
    return null;
  };

  const renderConnectorRow = (connector: Connector) => {
    const { icon: IconComponent, color } = getConnectorIcon(connector.connectorType);
    const isReadOnly = connector.isAutoCreated || connector.category === 'System';
    
    return (
      <div
        key={connector.id}
        className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        {/* Colored accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
        
        <div className="flex items-center gap-4 p-4 pl-6">
          {/* Icon */}
          <div 
            className="flex-shrink-0 p-2.5 rounded-lg" 
            style={{ backgroundColor: `${color}15` }}
          >
            <IconComponent className="w-5 h-5" style={{ color }} />
          </div>
          
          {/* Connector Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => setViewingConnector(connector)}
                className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left truncate"
              >
                {connector.name}
              </button>
              
              {isReadOnly && (
                <Badge variant="default">
                  <Lock className="w-3 h-3 mr-1" />
                  System
                </Badge>
              )}
              
              <Badge variant={connector.isActive ? 'success' : 'default'}>
                {connector.isActive ? 'Active' : 'Inactive'}
              </Badge>
              
              {connector._count?.connectorActions !== undefined && connector._count.connectorActions > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {connector._count.connectorActions} action{connector._count.connectorActions !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {/* Connection details based on type */}
              {connector.connectorType === 'database' && connector.config?.host && (
                <span className="truncate">
                  {connector.config.host}:{connector.config.port || 5432} / {connector.config.database}
                </span>
              )}
              {connector.connectorType === 'rest' && connector.config?.baseUrl && (
                <span className="truncate">{connector.config.baseUrl}</span>
              )}
              {connector.connectorType === 'inference' && connector.config?.baseUrl && (
                <span className="truncate">{connector.config.modelId || 'AI Model'}</span>
              )}
              
              {renderConnectionStatus(connector.id)}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => testConnection(connector)}
              disabled={testingConnectors.has(connector.id)}
              className="flex items-center gap-1.5"
            >
              <TestTube className="w-4 h-4" />
              Test
            </Button>
            
            {!isReadOnly && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(connector)}
                  className="flex items-center gap-1.5"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(connector)}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
            
            <button
              onClick={() => setViewingConnector(connector)}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading connectors...</p>
        </div>
      </div>
    );
  }

  // Viewing connector details
  if (viewingConnector) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            onClick={() => setViewingConnector(null)}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Back to Connectors
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg" 
                style={{ backgroundColor: `${getConnectorIcon(viewingConnector.connectorType).color}15` }}
              >
                {React.createElement(getConnectorIcon(viewingConnector.connectorType).icon, {
                  className: "w-8 h-8",
                  style: { color: getConnectorIcon(viewingConnector.connectorType).color }
                })}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {viewingConnector.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={viewingConnector.isActive ? 'success' : 'default'}>
                    {viewingConnector.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getConnectorIcon(viewingConnector.connectorType).label}
                  </span>
                </div>
              </div>
            </div>
            
            {!(viewingConnector.isAutoCreated || viewingConnector.category === 'System') && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(viewingConnector)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(viewingConnector)}
                  variant="ghost"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Connector Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-gray-900 dark:text-gray-100 capitalize">{viewingConnector.connectorType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {viewingConnector.creator.firstName} {viewingConnector.creator.lastName}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(viewingConnector.createdAt).toLocaleString()}
                </p>
              </div>
              
              {viewingConnector._count?.connectorActions !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Actions</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {viewingConnector._count.connectorActions} configured
                  </p>
                </div>
              )}
            </div>

            {/* Configuration Details */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Configuration</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                {viewingConnector.connectorType === 'database' && (
                  <>
                    {viewingConnector.config?.host && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Host:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {viewingConnector.config.host}:{viewingConnector.config.port || 5432}
                        </span>
                      </div>
                    )}
                    {viewingConnector.config?.database && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{viewingConnector.config.database}</span>
                      </div>
                    )}
                    {viewingConnector.config?.username && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Username:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{viewingConnector.config.username}</span>
                      </div>
                    )}
                    {viewingConnector.config?.ssl !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SSL:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {viewingConnector.config.ssl ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {viewingConnector.connectorType === 'rest' && viewingConnector.config?.baseUrl && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Base URL:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{viewingConnector.config.baseUrl}</span>
                  </div>
                )}
                
                {viewingConnector.connectorType === 'inference' && (
                  <>
                    {viewingConnector.config?.baseUrl && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Base URL:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{viewingConnector.config.baseUrl}</span>
                      </div>
                    )}
                    {viewingConnector.config?.modelId && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Model ID:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{viewingConnector.config.modelId}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main connectors list view
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Connectors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage connections to external services and databases
          </p>
        </div>
        <Button
          onClick={handleCreateConnector}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-5 h-5" />
          New Connector
        </Button>
      </div>

      {connectors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No connectors found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first connector to connect to external services
          </p>
          <Button
            onClick={handleCreateConnector}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Connector
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedConnectors).map(([type, typeConnectors]) => {
            const { icon: IconComponent, color, label } = getConnectorIcon(type);
            
            return (
              <div key={type}>
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color }} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                  </h2>
                  <Badge variant="default">{typeConnectors.length}</Badge>
                </div>
                
                {/* Connectors List */}
                <div className="space-y-2">
                  {typeConnectors.map(renderConnectorRow)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Type Selection Modal */}
      <ConnectorTypeSelectionModal
        isOpen={showTypeSelectionModal}
        onClose={() => setShowTypeSelectionModal(false)}
        onSelectType={handleTypeSelected}
      />

      {/* Database Config Modal */}
      <DatabaseConnectorConfigModal
        isOpen={showDatabaseConfigModal}
        onClose={() => {
          setShowDatabaseConfigModal(false);
          setEditingConnector(null);
        }}
        onSave={() => {
          setShowDatabaseConfigModal(false);
          setEditingConnector(null);
          loadConnectors();
        }}
        editingConnector={editingConnector}
      />

      {/* Dialogs */}
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
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};
