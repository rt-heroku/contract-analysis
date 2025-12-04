import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Share2, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  TestTube
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ShareModal } from '@/components/common/ShareModal';

interface MulesoftApi {
  id: number;
  name: string;
  description?: string;
  baseUrl: string;
  authType: string;
  authConfig?: any;
  timeout: number;
  isActive: boolean;
  flowsStatus: string;
  flowsError?: string;
  lastFlowsSync?: string;
  createdBy: number;
  sharedWith: number[];
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  flows?: Array<{
    id: number;
    name: string;
    description?: string;
    url: string;
    method: string;
  }>;
}

export const MulesoftApis: React.FC = () => {
  useAuth();
  const [myApis, setMyApis] = useState<MulesoftApi[]>([]);
  const [sharedApis, setSharedApis] = useState<MulesoftApi[]>([]);
  const [allOtherApis, setAllOtherApis] = useState<MulesoftApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingApi, setEditingApi] = useState<MulesoftApi | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState<number | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseUrl: '',
    authType: 'none',
    timeout: 180000,
    // Auth configs
    username: '',
    password: '',
    token: '',
    apiKey: '',
    headerName: 'X-API-Key',
    clientId: '',
    clientSecret: '',
  });

  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mulesoft-apis');
      setMyApis(response.data.myApis || []);
      setSharedApis(response.data.sharedApis || []);
      setAllOtherApis(response.data.allOtherApis || []);
    } catch (error: any) {
      console.error('Error fetching MuleSoft APIs:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to fetch MuleSoft APIs',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.baseUrl) {
      setAlertDialog({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in required fields: Name and Base URL',
        type: 'warning',
      });
      return;
    }

    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        baseUrl: formData.baseUrl,
        authType: formData.authType,
        timeout: formData.timeout,
      };

      // Build auth config based on auth type
      if (formData.authType === 'basic') {
        payload.authConfig = {
          username: formData.username,
          password: formData.password,
        };
      } else if (formData.authType === 'bearer') {
        payload.authConfig = {
          token: formData.token,
        };
      } else if (formData.authType === 'api_key') {
        payload.authConfig = {
          apiKey: formData.apiKey,
          headerName: formData.headerName,
        };
      } else if (formData.authType === 'oauth2') {
        payload.authConfig = {
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
        };
      }

      if (editingApi) {
        // Update
        await api.put(`/mulesoft-apis/${editingApi.id}`, payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'MuleSoft API updated successfully',
          type: 'success',
        });
      } else {
        // Create
        const response = await api.post('/mulesoft-apis', payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'MuleSoft API created successfully',
          type: 'success',
        });

        // Auto-refresh flows after creation
        if (response.data.api?.id) {
          setTimeout(() => handleRefreshFlows(response.data.api.id), 1000);
        }
      }

      setShowForm(false);
      setEditingApi(null);
      resetForm();
      fetchApis();
    } catch (error: any) {
      console.error('Error saving MuleSoft API:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save MuleSoft API',
        type: 'error',
      });
    }
  };

  const handleEdit = (api: MulesoftApi) => {
    setEditingApi(api);
    setFormData({
      name: api.name,
      description: api.description || '',
      baseUrl: api.baseUrl,
      authType: api.authType,
      timeout: api.timeout,
      username: api.authConfig?.username || '',
      password: api.authConfig?.password || '',
      token: api.authConfig?.token || '',
      apiKey: api.authConfig?.apiKey || '',
      headerName: api.authConfig?.headerName || 'X-API-Key',
      clientId: api.authConfig?.clientId || '',
      clientSecret: api.authConfig?.clientSecret || '',
    });
    setShowForm(true);
  };

  const handleDelete = (apiId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete MuleSoft API',
      message: 'Are you sure you want to delete this API? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/mulesoft-apis/${apiId}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'MuleSoft API deleted successfully',
            type: 'success',
          });
          fetchApis();
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete MuleSoft API',
            type: 'error',
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleRefreshFlows = async (apiId: number) => {
    try {
      await api.post(`/mulesoft-apis/${apiId}/refresh-flows`);
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Flows refreshed successfully',
        type: 'success',
      });
      fetchApis();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to refresh flows',
        type: 'error',
      });
    }
  };

  const handleTestConnection = async (apiId: number) => {
    try {
      const response = await api.post(`/mulesoft-apis/${apiId}/test`);
      if (response.data.success) {
        setAlertDialog({
          isOpen: true,
          title: 'Connection Successful',
          message: `Connected successfully! Response time: ${response.data.responseTime}ms`,
          type: 'success',
        });
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Connection Failed',
          message: response.data.message || 'Failed to connect to API',
          type: 'error',
        });
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Connection Error',
        message: error.response?.data?.error || 'Failed to test connection',
        type: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      baseUrl: '',
      authType: 'none',
      timeout: 180000,
      username: '',
      password: '',
      token: '',
      apiKey: '',
      headerName: 'X-API-Key',
      clientId: '',
      clientSecret: '',
    });
  };

  const renderApiCard = (api: MulesoftApi, isOwner: boolean) => {
    const flowCount = api.flows?.length || 0;

    return (
      <Card key={api.id} className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
              {api.description && (
                <p className="text-sm text-gray-600 mt-1">{api.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">{api.baseUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              {api.flowsStatus === 'success' && (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {flowCount} flows
                </Badge>
              )}
              {api.flowsStatus === 'error' && (
                <Badge variant="error">
                  <XCircle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}
              {api.flowsStatus === 'pending' && (
                <Badge variant="warning">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          {api.flowsError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              Error: {api.flowsError}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <div>Auth: <span className="font-medium">{api.authType}</span></div>
            <div>•</div>
            <div>Timeout: <span className="font-medium">{api.timeout}ms</span></div>
            {api.lastFlowsSync && (
              <>
                <div>•</div>
                <div>Last sync: <span className="font-medium">{new Date(api.lastFlowsSync).toLocaleString()}</span></div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {isOwner && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(api)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRefreshFlows(api.id)}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh Flows
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedApiId(api.id);
                    setShareModalOpen(true);
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(api.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleTestConnection(api.id)}
            >
              <TestTube className="w-4 h-4 mr-1" />
              Test
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MuleSoft APIs</h1>
          <p className="text-gray-600 mt-1">Manage your MuleSoft API configurations</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            New API
          </Button>
        )}
      </div>

      {showForm && (
        <Card title={editingApi ? 'Edit MuleSoft API' : 'Create MuleSoft API'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://api.example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authentication Type
                </label>
                <select
                  value={formData.authType}
                  onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="none">None</option>
                  <option value="basic">Basic Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="api_key">API Key</option>
                  <option value="oauth2">OAuth2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {formData.authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {formData.authType === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bearer Token</label>
                <input
                  type="password"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {formData.authType === 'api_key' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header Name</label>
                  <input
                    type="text"
                    value={formData.headerName}
                    onChange={(e) => setFormData({ ...formData, headerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {formData.authType === 'oauth2' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit">
                {editingApi ? 'Update' : 'Create'} API
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingApi(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* My APIs */}
      {myApis.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">My APIs</h2>
          <div className="grid gap-4">
            {myApis.map((api) => renderApiCard(api, true))}
          </div>
        </div>
      )}

      {/* Shared APIs */}
      {sharedApis.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Shared with Me</h2>
          <div className="grid gap-4">
            {sharedApis.map((api) => renderApiCard(api, false))}
          </div>
        </div>
      )}

      {/* All Other APIs (Admin) */}
      {allOtherApis.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">All Other APIs</h2>
          <div className="grid gap-4">
            {allOtherApis.map((api) => renderApiCard(api, false))}
          </div>
        </div>
      )}

      {myApis.length === 0 && sharedApis.length === 0 && allOtherApis.length === 0 && !showForm && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No MuleSoft APIs configured yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First API
            </Button>
          </div>
        </Card>
      )}

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedApiId(null);
        }}
        resourceId={selectedApiId!}
        resourceType="idp-execution"
        onShareComplete={fetchApis}
      />

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
        type="danger"
      />
    </div>
  );
};

