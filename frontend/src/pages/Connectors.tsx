import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit, Trash2, TestTube, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  authType: string | null;
  isActive: boolean;
  config: any;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

export const Connectors: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    connectorType: 'rest',
    authType: 'none',
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
      setEditingConnector(null);
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
      config: connector.config,
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

  const handleTestConnection = async (id: number, name: string) => {
    try {
      await api.post(`/connectors/${id}/test`);
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Connection test successful for "${name}"`,
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
        // Send spec as raw string (JSON or YAML) - backend will parse it
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
      
      // Reload connectors to show updated data
      loadConnectors();
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
      config: {
        baseUrl: '',
        username: '',
        password: '',
        token: '',
        apiKey: '',
        timeout: 30000,
      },
    });
  };

  const toggleSecrets = (id: number) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading connectors...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connectors</h1>
          <p className="text-gray-600 mt-1">Manage external service connections</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingConnector(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-5 h-5" />
          <span>New Connector</span>
        </Button>
      </div>

      {connectors.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No connectors yet</h3>
            <p className="text-gray-600 mb-4">Create your first connector to connect to external services</p>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Connector
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {connectors.map((connector) => (
            <Card key={connector.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{connector.name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">{connector.connectorType.toUpperCase()}</Badge>
                    {connector.authType && (
                      <Badge variant="info">{connector.authType}</Badge>
                    )}
                  </div>
                </div>
                <Badge variant={connector.isActive ? 'success' : 'default'}>
                  {connector.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {connector.connectorType === 'rest' && connector.config.baseUrl && (
                  <div>
                    <span className="font-medium">Base URL:</span>{' '}
                    <span className="text-xs">{connector.config.baseUrl}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Created by:</span>
                  <span>{connector.creator.firstName} {connector.creator.lastName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Secrets:</span>
                  <button
                    onClick={() => toggleSecrets(connector.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showSecrets[connector.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {showSecrets[connector.id] && connector.config && (
                  <div className="text-xs bg-gray-50 p-2 rounded mt-2">
                    {connector.authType === 'basic' && (
                      <>
                        <div>Username: {connector.config.username || 'N/A'}</div>
                        <div>Password: ••••••••</div>
                      </>
                    )}
                    {connector.authType === 'bearer' && (
                      <div>Token: {connector.config.token?.substring(0, 20)}...</div>
                    )}
                    {connector.authType === 'api_key' && (
                      <div>API Key: {connector.config.apiKey?.substring(0, 20)}...</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleTestConnection(connector.id, connector.name)}
                  className="flex-1 flex items-center justify-center space-x-1 text-sm py-2"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Test</span>
                </Button>
                {connector.connectorType === 'rest' && (
                  <Button
                    onClick={() => openImportModal(connector)}
                    className="flex-1 flex items-center justify-center space-x-1 text-sm py-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Import OpenAPI</span>
                  </Button>
                )}
                <Button
                  onClick={() => handleEdit(connector)}
                  className="flex items-center justify-center px-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(connector)}
                  className="flex items-center justify-center px-3 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingConnector ? 'Edit Connector' : 'Create Connector'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connector Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My REST API"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connector Type *
                  </label>
                  <select
                    value={formData.connectorType}
                    onChange={(e) => setFormData({ ...formData, connectorType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rest">REST API</option>
                    <option value="database">Database</option>
                    <option value="s3">S3</option>
                    <option value="ftp">FTP</option>
                    <option value="file">File System</option>
                  </select>
                </div>

                {formData.connectorType === 'rest' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.config.baseUrl}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, baseUrl: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://api.example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Authentication Type
                      </label>
                      <select
                        value={formData.authType}
                        onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                            onChange={(e) => setFormData({
                              ...formData,
                              config: { ...formData.config, username: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="password"
                            value={formData.config.password}
                            onChange={(e) => setFormData({
                              ...formData,
                              config: { ...formData.config, password: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </>
                    )}

                    {formData.authType === 'bearer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
                        <input
                          type="text"
                          value={formData.config.token}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, token: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    {formData.authType === 'api_key' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="text"
                          value={formData.config.apiKey}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, apiKey: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout (ms)
                      </label>
                      <input
                        type="number"
                        value={formData.config.timeout}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, timeout: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingConnector(null);
                      resetForm();
                    }}
                    className="bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingConnector ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
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

      {/* OpenAPI Import Modal */}
      {showOpenApiModal && selectedConnector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    placeholder='{ "openapi": "3.0.0", "info": { ... }, "paths": { ... } }'
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste your OpenAPI 3.0 specification here
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
                  disabled={importingOpenApi}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportOpenApi}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={importingOpenApi || (!openApiUrl && !openApiSpec)}
                >
                  {importingOpenApi ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

