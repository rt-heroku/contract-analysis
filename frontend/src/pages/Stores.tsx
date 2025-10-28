import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit, Trash2, TestTube, Star, StarOff } from 'lucide-react';
import api from '@/lib/api';

interface Store {
  id: number;
  name: string;
  storeType: string;
  isDefault: boolean;
  isActive: boolean;
  config: any;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    storeType: 'database',
    isDefault: false,
    config: {
      // Database
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      
      // S3
      region: '',
      bucket: '',
      accessKeyId: '',
      secretAccessKey: '',
      
      // Redis
      url: '',
      
      // File
      basePath: '',
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

  useEffect(() => {
    loadStores();
  }, []);

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
      if (editingStore) {
        await api.put(`/stores/${editingStore.id}`, formData);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Store updated successfully',
          type: 'success',
        });
      } else {
        await api.post('/stores', formData);
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
      name: store.name,
      storeType: store.storeType,
      isDefault: store.isDefault,
      config: store.config,
    });
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
      name: '',
      storeType: 'database',
      isDefault: false,
      config: {
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: '',
        region: '',
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
        url: '',
        basePath: '',
      },
    });
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
          <h1 className="text-3xl font-bold text-gray-900">Storage Stores</h1>
          <p className="text-gray-600 mt-1">Manage data storage backends</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores configured</h3>
            <p className="text-gray-600 mb-4">Create your first storage backend</p>
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
                    <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
                    {store.isDefault && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                  </div>
                  <div className="mt-1">
                    <Badge variant="default">{store.storeType.toUpperCase()}</Badge>
                  </div>
                </div>
                <Badge variant={store.isActive ? 'success' : 'default'}>
                  {store.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {store.storeType === 'database' && store.config.host && (
                  <div>
                    <span className="font-medium">Host:</span> {store.config.host}:{store.config.port}
                  </div>
                )}
                {store.storeType === 's3' && store.config.bucket && (
                  <div>
                    <span className="font-medium">Bucket:</span> {store.config.bucket}
                  </div>
                )}
                {store.storeType === 'redis' && store.config.url && (
                  <div>
                    <span className="font-medium">URL:</span> {store.config.url.split('@')[1] || 'Redis'}
                  </div>
                )}
                {store.storeType === 'local_file' && store.config.basePath && (
                  <div>
                    <span className="font-medium">Path:</span> {store.config.basePath}
                  </div>
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingStore ? 'Edit Store' : 'Create Store'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My Database Store"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Type *
                  </label>
                  <select
                    value={formData.storeType}
                    onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="database">Database (PostgreSQL)</option>
                    <option value="s3">Amazon S3</option>
                    <option value="ftp">FTP/SFTP</option>
                    <option value="local_file">Local File System</option>
                    <option value="redis">Redis</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                    Set as default store
                  </label>
                </div>

                {/* Database Configuration */}
                {formData.storeType === 'database' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
                      <input
                        type="text"
                        required
                        value={formData.config.host}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, host: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="localhost"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
                        <input
                          type="number"
                          required
                          value={formData.config.port}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, port: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Database *</label>
                        <input
                          type="text"
                          required
                          value={formData.config.database}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, database: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  </>
                )}

                {/* S3 Configuration */}
                {formData.storeType === 's3' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                        <input
                          type="text"
                          required
                          value={formData.config.region}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, region: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="us-east-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bucket *</label>
                        <input
                          type="text"
                          required
                          value={formData.config.bucket}
                          onChange={(e) => setFormData({
                            ...formData,
                            config: { ...formData.config, bucket: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access Key ID *</label>
                      <input
                        type="text"
                        required
                        value={formData.config.accessKeyId}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, accessKeyId: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Secret Access Key *</label>
                      <input
                        type="password"
                        required
                        value={formData.config.secretAccessKey}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, secretAccessKey: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}

                {/* Redis Configuration */}
                {formData.storeType === 'redis' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Redis URL *</label>
                    <input
                      type="text"
                      required
                      value={formData.config.url}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, url: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="redis://localhost:6379"
                    />
                  </div>
                )}

                {/* File System Configuration */}
                {formData.storeType === 'local_file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Path *</label>
                    <input
                      type="text"
                      required
                      value={formData.config.basePath}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, basePath: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="/var/data/uploads"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingStore(null);
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

