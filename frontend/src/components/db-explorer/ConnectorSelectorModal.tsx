import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Database, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import api from '@/lib/api';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  isActive: boolean;
  isAutoCreated?: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
  creator?: {
    firstName: string;
    lastName: string;
  };
}

interface ConnectorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnector: (connector: Connector) => void;
  onCreateNew?: () => void;
  currentConnectorId?: number;
  isAdmin?: boolean;
}

export const ConnectorSelectorModal: React.FC<ConnectorSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectConnector,
  onCreateNew,
  currentConnectorId,
  isAdmin = false,
}) => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<Record<number, 'testing' | 'success' | 'failed'>>({});

  useEffect(() => {
    if (isOpen) {
      loadConnectors();
    }
  }, [isOpen]);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/connectors', {
        params: { connectorType: 'database' },
      });
      setConnectors(response.data.connectors || []);
    } catch (error) {
      console.error('Failed to load connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (connectorId: number) => {
    setConnectionStatus(prev => ({ ...prev, [connectorId]: 'testing' }));
    
    try {
      const response = await api.post(`/connectors/${connectorId}/test`);
      setConnectionStatus(prev => ({ 
        ...prev, 
        [connectorId]: response.data.success ? 'success' : 'failed' 
      }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setConnectionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[connectorId];
          return newStatus;
        });
      }, 3000);
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [connectorId]: 'failed' }));
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setConnectionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[connectorId];
          return newStatus;
        });
      }, 3000);
    }
  };

  const filteredConnectors = connectors.filter(connector =>
    connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connector.config?.host?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connector.config?.database?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectConnector = (connector: Connector) => {
    onSelectConnector(connector);
    onClose();
  };

  const getConnectionStatusIcon = (connectorId: number) => {
    const status = connectionStatus[connectorId];
    
    switch (status) {
      case 'testing':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Select Database Connector
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose which database connection to use
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, host, or database..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
            
            {isAdmin && onCreateNew && (
              <Button
                variant="primary"
                onClick={() => {
                  onCreateNew();
                  onClose();
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Connector
              </Button>
            )}
          </div>
        </div>

        {/* Connector List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredConnectors.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery ? 'No connectors found' : 'No database connectors'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create your first database connector to get started'}
              </p>
              {isAdmin && onCreateNew && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onCreateNew();
                    onClose();
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Database Connector
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConnectors.map((connector) => {
                const isSelected = connector.id === currentConnectorId;
                const status = connectionStatus[connector.id];
                
                return (
                  <button
                    key={connector.id}
                    onClick={() => handleSelectConnector(connector)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {connector.name}
                            </h4>
                            {isSelected && (
                              <Badge variant="success">Current</Badge>
                            )}
                            {connector.isAutoCreated && (
                              <Badge variant="info">System</Badge>
                            )}
                            {!connector.isActive && (
                              <Badge variant="warning">Inactive</Badge>
                            )}
                          </div>

                          {/* Connection Details */}
                          <div className="space-y-1">
                            {connector.config?.host && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Host:</span> {connector.config.host}
                                {connector.config.port && `:${connector.config.port}`}
                              </p>
                            )}
                            {connector.config?.database && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Database:</span> {connector.config.database}
                              </p>
                            )}
                            {connector.config?.user && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">User:</span> {connector.config.user}
                              </p>
                            )}
                            {connector.creator && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Created by {connector.creator.firstName} {connector.creator.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        {getConnectionStatusIcon(connector.id) || (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              testConnection(connector.id);
                            }}
                            className="text-xs px-2 py-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                            disabled={status === 'testing'}
                          >
                            Test
                          </button>
                        )}
                        
                        {status && (
                          <span className={`text-xs ${
                            status === 'testing' ? 'text-blue-600 dark:text-blue-400' :
                            status === 'success' ? 'text-green-600 dark:text-green-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {status === 'testing' ? 'Testing...' :
                             status === 'success' ? 'Connected' :
                             'Failed'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredConnectors.length} connector{filteredConnectors.length !== 1 ? 's' : ''} available
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>
    </div>
  );
};

