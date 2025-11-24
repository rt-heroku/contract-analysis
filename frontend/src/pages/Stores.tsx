import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit, Trash2, TestTube, Star, StarOff } from 'lucide-react';
import api from '@/lib/api';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
}

interface Store {
  id: number;
  connectorId: number;
  name: string;
  storeType: string;
  dataType: string;
  isDefault: boolean;
  isActive: boolean;
  config: any;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  connector: Connector;
}

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConnectors, setLoadingConnectors] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  
  const [formData, setFormData] = useState({
    connectorId: 0,
    name: '',
    storeType: 'database',
    dataType: 'structured',
    isDefault: false,
    config: {
      // Store-specific metadata (not connection details)
      tableName: '',
      schemaName: '',
      viewName: '',
      procedureName: '',
      bucketPrefix: '',
      folderPath: '',
      description: '',
    },
  });

  const [sampleData, setSampleData] = useState('');

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
    loadStores();
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      setLoadingConnectors(true);
      const response = await api.get('/connectors');
      setConnectors(response.data.connectors || []);
    } catch (error: any) {
      console.error('Failed to load connectors:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Warning',
        message: 'Failed to load connectors. You may need to create a connector first.',
        type: 'warning',
      });
    } finally {
      setLoadingConnectors(false);
    }
  };

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stores');
      setStores(response.data.stores || []);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load stores',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Add sample data to config before submitting
      const payload = {
        ...formData,
        config: {
          ...formData.config,
          sampleData: sampleData || undefined,
        },
      };

      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Store updated successfully',
          type: 'success',
        });
      } else {
        await api.post('/stores', payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Store created successfully',
          type: 'success',
        });
      }
      
      setShowModal(false);
      setEditingStore(null);
      resetForm();
      loadStores();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save store',
        type: 'error',
      });
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      connectorId: store.connectorId,
      name: store.name,
      storeType: store.storeType,
      dataType: store.dataType,
      isDefault: store.isDefault,
      config: store.config,
    });
    setSampleData(store.config?.sampleData || '');
    setShowModal(true);
  };

  const handleDelete = (store: Store) => {
    if (store.isDefault) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Cannot delete the default store',
        type: 'error',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Store',
      message: `Are you sure you want to delete "${store.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.delete(`/stores/${store.id}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Store deleted successfully',
            type: 'success',
          });
          loadStores();
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete store',
            type: 'error',
          });
        }
      },
    });
  };

  const handleSetDefault = async (id: number, name: string) => {
    try {
      await api.put(`/stores/${id}`, { isDefault: true });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `"${name}" set as default store`,
        type: 'success',
      });
      loadStores();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to set default store',
        type: 'error',
      });
    }
  };

  const handleTestConnection = async (id: number, name: string) => {
    try {
      await api.post(`/stores/${id}/test`);
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

  const resetForm = () => {
    setFormData({
      connectorId: 0,
      name: '',
      storeType: 'database',
      dataType: 'structured',
      isDefault: false,
      config: {
        tableName: '',
        schemaName: '',
        viewName: '',
        procedureName: '',
        bucketPrefix: '',
        folderPath: '',
        description: '',
      },
    });
    setSampleData('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading stores...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Storage Stores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage data storage backends</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingStore(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-5 h-5" />
          <span>New Store</span>
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No stores configured</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first storage backend</p>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Store
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{store.name}</h3>
                    {store.isDefault && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                  </div>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    <Badge variant="default">{store.storeType.toUpperCase()}</Badge>
                    <Badge variant="info">{store.dataType.toUpperCase()}</Badge>
                  </div>
                  {store.connector && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      📡 Connector: <span className="font-medium">{store.connector.name}</span>
                    </p>
                  )}
                </div>
                <Badge variant={store.isActive ? 'success' : 'default'}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                {/* Database Store Metadata */}
                {store.storeType === 'database' && (
                  <>
                    {store.config.tableName && (
                      <div><span className="font-medium">Table:</span> {store.config.tableName}</div>
                    )}
                    {store.config.schemaName && (
                      <div><span className="font-medium">Schema:</span> {store.config.schemaName}</div>
                    )}
                    {store.config.viewName && (
                      <div><span className="font-medium">View:</span> {store.config.viewName}</div>
                    )}
                    {store.config.procedureName && (
                      <div><span className="font-medium">Procedure:</span> {store.config.procedureName}</div>
                    )}
                  </>
                )}
                {/* S3 Store Metadata */}
                {store.storeType === 's3' && store.config.bucketPrefix && (
                  <div><span className="font-medium">Path:</span> {store.config.bucketPrefix}</div>
                )}
                {/* File Store Metadata */}
                {store.storeType === 'local_file' && store.config.folderPath && (
                  <div><span className="font-medium">Folder:</span> {store.config.folderPath}</div>
                )}
                {/* Description */}
                {store.config.description && (
                  <div className="text-xs italic pt-2">{store.config.description}</div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Created by:</span>
                  <span>{store.creator.firstName} {store.creator.lastName}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                {!store.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(store.id, store.name)}
                    className="flex-1 flex items-center justify-center space-x-1 text-sm py-2"
                    title="Set as default"
                  >
                    <StarOff className="w-4 h-4" />
                    <span>Set Default</span>
                  </Button>
                )}
                <Button
                  onClick={() => handleTestConnection(store.id, store.name)}
                  className="flex-1 flex items-center justify-center space-x-1 text-sm py-2"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Test</span>
                </Button>
                <Button
                  onClick={() => handleEdit(store)}
                  className="flex items-center justify-center px-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(store)}
                  className="flex items-center justify-center px-3 bg-red-600 hover:bg-red-700 text-white"
                  disabled={store.isDefault}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {editingStore ? 'Edit Store' : 'Create Store'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Connector Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connector *
                  </label>
                  <select
                    required
                    value={formData.connectorId}
                    onChange={(e) => {
                      const selectedConnectorId = parseInt(e.target.value);
                      const selectedConnector = connectors.find(c => c.id === selectedConnectorId);
                      setFormData({ 
                        ...formData, 
                        connectorId: selectedConnectorId,
                        storeType: selectedConnector?.connectorType || formData.storeType
                      });
                    }}
                    disabled={editingStore !== null || loadingConnectors}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <option value={0}>Select a Connector</option>
                    {connectors.map(connector => (
                      <option key={connector.id} value={connector.id}>
                        {connector.name} ({connector.connectorType})
                      </option>
                    ))}
                  </select>
                  {connectors.length === 0 && !loadingConnectors && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ No connectors available. Please create a connector first.
                    </p>
                  )}
                  {editingStore && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Connector cannot be changed when editing a store.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My Database Store"
                  />
                </div>

                {/* Store Type - Auto-assigned from Connector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Store Type *
                  </label>
                  <input
                    type="text"
                    value={formData.storeType.toUpperCase()}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Automatically set from connector type
                  </p>
                </div>

                {/* Data Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data Type *
                  </label>
                  <select
                    required
                    value={formData.dataType}
                    onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="structured">Structured (Tables/Relations)</option>
                    <option value="jsonb">JSONB (JSON Documents)</option>
                    <option value="text">Text (Unstructured)</option>
                    <option value="blob">Blob (Binary/Files)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    How data is organized
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Set as default store
                  </label>
                </div>

                {/* Store Metadata - Connection details are in the Connector */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Store Metadata
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Define what this store accesses (e.g., table name, bucket prefix, folder path)
                  </p>

                  {/* Database Store Metadata */}
                  {formData.storeType === 'database' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Table Name
                        </label>
                        <input
                          type="text"
                          value={formData.config.tableName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, tableName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                          placeholder="customers"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Schema Name
                        </label>
                        <input
                          type="text"
                          value={formData.config.schemaName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, schemaName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                          placeholder="public"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          View Name
                        </label>
                        <input
                          type="text"
                          value={formData.config.viewName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, viewName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                          placeholder="customer_view"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Procedure Name
                        </label>
                        <input
                          type="text"
                          value={formData.config.procedureName || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, procedureName: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                          placeholder="get_customer_data"
                        />
                      </div>
                    </div>
                  )}

                  {/* S3 Store Metadata */}
                  {formData.storeType === 's3' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bucket Prefix / Folder Path
                      </label>
                      <input
                        type="text"
                        value={formData.config.bucketPrefix || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, bucketPrefix: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                        placeholder="uploads/documents/"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Path within the bucket (e.g., "2024/invoices/")
                      </p>
                    </div>
                  )}

                  {/* File System Store Metadata */}
                  {formData.storeType === 'local_file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Folder Path
                      </label>
                      <input
                        type="text"
                        value={formData.config.folderPath || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, folderPath: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                        placeholder="documents/contracts"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Relative path within the base path configured in connector
                      </p>
                    </div>
                  )}

                  {/* Description (all store types) */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.config.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, description: e.target.value }
                      })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md"
                      placeholder="Describe what this store contains..."
                    />
                  </div>
                </div>

                {/* Sample Data / Example */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Sample Data / Example
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Paste example data (JSON, XML, SQL, CSV, etc.) to document the data structure
                  </p>
                  <textarea
                    value={sampleData}
                    onChange={(e) => setSampleData(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm"
                    placeholder={`Example for ${formData.storeType === 'database' ? 'database' : formData.storeType}:

${formData.storeType === 'database' ? `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}

Or SQL:
SELECT * FROM customers WHERE status = 'active';` : formData.storeType === 's3' ? `{
  "files": [
    {"name": "invoice_001.pdf", "size": 245678},
    {"name": "contract_123.pdf", "size": 567890}
  ]
}` : `Paste your example data here...`}`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Tip: This helps document the expected data format for developers
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingStore(null);
                      resetForm();
                    }}
                    className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingStore ? 'Update' : 'Create'}
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
    </div>
  );
};

