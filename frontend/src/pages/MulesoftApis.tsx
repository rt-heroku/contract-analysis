import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
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
  const [flowsModalOpen, setFlowsModalOpen] = useState(false);
  const [selectedApiForFlows, setSelectedApiForFlows] = useState<MulesoftApi | null>(null);
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [showFlowForm, setShowFlowForm] = useState(false);
  const [flowFormData, setFlowFormData] = useState({
    name: '',
    description: '',
    url: '',
    method: 'POST',
    vars: [] as Array<{ name: string; type: string; mandatory: boolean }>,
  });

  // Import flow state
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [importMethod, setImportMethod] = useState<'paste' | 'upload' | 'url'>('paste');
  const [specInput, setSpecInput] = useState('');
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [parsedFlows, setParsedFlows] = useState<any[]>([]);
  const [selectedFlows, setSelectedFlows] = useState<Set<string>>(new Set());
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'cancel'>('skip');
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);

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

  const handleManageFlows = (api: MulesoftApi) => {
    setSelectedApiForFlows(api);
    setFlowsModalOpen(true);
  };

  const handleAddFlow = () => {
    setEditingFlow(null);
    setFlowFormData({
      name: '',
      description: '',
      url: '',
      method: 'POST',
      vars: [],
    });
    setShowFlowForm(true);
  };

  const handleEditFlow = (flow: any) => {
    setEditingFlow(flow);
    setFlowFormData({
      name: flow.name,
      description: flow.description || '',
      url: flow.url,
      method: flow.method,
      vars: flow.vars || [],
    });
    setShowFlowForm(true);
  };

  const handleSaveFlow = async () => {
    if (!selectedApiForFlows) return;

    try {
      const endpoint = editingFlow
        ? `/mulesoft-apis/${selectedApiForFlows.id}/flows/${editingFlow.id}`
        : `/mulesoft-apis/${selectedApiForFlows.id}/flows`;

      const method = editingFlow ? 'put' : 'post';

      await api[method](endpoint, flowFormData);

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Flow ${editingFlow ? 'updated' : 'created'} successfully`,
        type: 'success',
      });

      setShowFlowForm(false);
      setEditingFlow(null);
      fetchApis();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || `Failed to ${editingFlow ? 'update' : 'create'} flow`,
        type: 'error',
      });
    }
  };

  const handleDeleteFlow = async (flowId: number) => {
    if (!selectedApiForFlows) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Flow',
      message: 'Are you sure you want to delete this flow?',
      onConfirm: async () => {
        try {
          await api.delete(`/mulesoft-apis/${selectedApiForFlows.id}/flows/${flowId}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Flow deleted successfully',
            type: 'success',
          });
          fetchApis();
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete flow',
            type: 'error',
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const addFlowVariable = () => {
    setFlowFormData({
      ...flowFormData,
      vars: [...flowFormData.vars, { name: '', type: 'json', mandatory: false }],
    });
  };

  const updateFlowVariable = (index: number, field: string, value: any) => {
    const newVars = [...flowFormData.vars];
    newVars[index] = { ...newVars[index], [field]: value };
    setFlowFormData({ ...flowFormData, vars: newVars });
  };

  const removeFlowVariable = (index: number) => {
    const newVars = flowFormData.vars.filter((_, i) => i !== index);
    setFlowFormData({ ...flowFormData, vars: newVars });
  };

  // Import flow helper functions
  const resetImportForm = () => {
    setSpecInput('');
    setSpecFile(null);
    setParsedFlows([]);
    setSelectedFlows(new Set<string>());
    setDuplicates([]);
    setDuplicateAction('skip');
    setParsing(false);
    setImporting(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSpecInput(content);
    };
    reader.readAsText(file);
    setSpecFile(file);
  };

  const handleSpecParse = async () => {
    if (!selectedApiForFlows) return;

    try {
      setParsing(true);

      let payload: any = {};

      if (importMethod === 'url') {
        if (!specInput.trim()) {
          setAlertDialog({
            isOpen: true,
            title: 'Validation Error',
            message: 'Please enter a URL',
            type: 'warning',
          });
          return;
        }
        payload.url = specInput.trim();
      } else {
        // paste or upload
        if (!specInput.trim()) {
          setAlertDialog({
            isOpen: true,
            title: 'Validation Error',
            message: 'Please provide an API specification',
            type: 'warning',
          });
          return;
        }
        payload.openApiSpec = specInput;
      }

      const response = await api.post(`/mulesoft-apis/${selectedApiForFlows.id}/parse-flow-spec`, payload);
      
      setParsedFlows(response.data.flows);
      setDuplicates(response.data.duplicates);
      
      // Auto-select all flows
      const allFlowNames = new Set<string>(response.data.flows.map((f: any) => f.name));
      setSelectedFlows(allFlowNames);

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Parsed ${response.data.flows.length} flows from specification`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error parsing spec:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Parse Error',
        message: error.response?.data?.error || 'Failed to parse API specification',
        type: 'error',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleToggleFlow = (flowName: string) => {
    const newSelected = new Set(selectedFlows);
    if (newSelected.has(flowName)) {
      newSelected.delete(flowName);
    } else {
      newSelected.add(flowName);
    }
    setSelectedFlows(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedFlows.size === parsedFlows.length) {
      setSelectedFlows(new Set<string>());
    } else {
      const allNames = new Set<string>(parsedFlows.map(f => f.name));
      setSelectedFlows(allNames);
    }
  };

  const handleImportFlows = async () => {
    if (!selectedApiForFlows) return;

    if (selectedFlows.size === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please select at least one flow to import',
        type: 'warning',
      });
      return;
    }

    try {
      setImporting(true);

      const flowsToImport = parsedFlows.filter(f => selectedFlows.has(f.name));

      const response = await api.post(`/mulesoft-apis/${selectedApiForFlows.id}/bulk-create-flows`, {
        flows: flowsToImport,
        duplicateAction,
      });

      const { created, updated, skipped } = response.data;
      
      let message = '';
      if (created > 0) message += `${created} flow(s) created. `;
      if (updated > 0) message += `${updated} flow(s) updated. `;
      if (skipped > 0) message += `${skipped} flow(s) skipped.`;

      setAlertDialog({
        isOpen: true,
        title: 'Import Complete',
        message: message || 'No flows were imported',
        type: 'success',
      });

      // Reset import form and switch back to manual tab
      resetImportForm();
      setActiveTab('manual');
      
      // Refresh APIs to show new flows
      fetchApis();
    } catch (error: any) {
      console.error('Error importing flows:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Import Error',
        message: error.response?.data?.error || 'Failed to import flows',
        type: 'error',
      });
    } finally {
      setImporting(false);
    }
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

          <div className="flex gap-2 pt-2 flex-wrap">
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
                  onClick={() => handleManageFlows(api)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Manage Flows
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

      {/* Flows Management Modal */}
      <Modal
        isOpen={flowsModalOpen}
        onClose={() => {
          setFlowsModalOpen(false);
          setSelectedApiForFlows(null);
          setShowFlowForm(false);
          setEditingFlow(null);
          resetImportForm();
          setActiveTab('manual');
        }}
        title={`Manage Flows - ${selectedApiForFlows?.name || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Tab Navigation */}
          {!showFlowForm && (
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Import from Spec
              </button>
            </div>
          )}

          {/* Manual Tab Content */}
          {activeTab === 'manual' && !showFlowForm && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {selectedApiForFlows?.flowsStatus === 'error' ? (
                    <span className="text-orange-600">
                      ⚠️ Auto-refresh failed. You can manually add flows below.
                    </span>
                  ) : (
                    `${selectedApiForFlows?.flows?.length || 0} flows configured`
                  )}
                </p>
                <Button onClick={handleAddFlow}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Flow
                </Button>
              </div>

              {selectedApiForFlows?.flows && selectedApiForFlows.flows.length > 0 ? (
                <div className="space-y-2">
                  {selectedApiForFlows.flows.map((flow: any) => (
                    <Card key={flow.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{flow.name}</h4>
                          {flow.description && (
                            <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span className="font-mono">{flow.method}</span>
                            <span className="font-mono">{flow.url}</span>
                          </div>
                          {flow.vars && flow.vars.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Variables: </span>
                              {flow.vars.map((v: any, i: number) => (
                                <Badge key={i} variant="default">
                                  {v.name} ({v.type})
                                  {v.mandatory && ' *'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditFlow(flow)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteFlow(flow.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No flows configured yet.</p>
                  <p className="text-sm mt-1">
                    Click "Add Flow" to manually add a flow, or use "Refresh Flows" to auto-discover.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Import Tab Content */}
          {activeTab === 'import' && !showFlowForm && (
            <div className="space-y-4">
              {/* Input Method Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Method
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="paste"
                      checked={importMethod === 'paste'}
                      onChange={(e) => setImportMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    Paste Spec
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="upload"
                      checked={importMethod === 'upload'}
                      onChange={(e) => setImportMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    Upload File
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="url"
                      checked={importMethod === 'url'}
                      onChange={(e) => setImportMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    URL
                  </label>
                </div>
              </div>

              {/* Input Area */}
              {importMethod === 'paste' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste OpenAPI/RAML Specification (YAML or JSON)
                  </label>
                  <textarea
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    placeholder="Paste your API specification here..."
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              {importMethod === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Specification File
                  </label>
                  <input
                    type="file"
                    accept=".yaml,.yml,.json,.raml"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {specFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {specFile.name}
                    </p>
                  )}
                </div>
              )}

              {importMethod === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specification URL
                  </label>
                  <Input
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    placeholder="https://api.example.com/openapi.json"
                  />
                </div>
              )}

              {/* Parse Button */}
              {parsedFlows.length === 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleSpecParse}
                    disabled={parsing || !specInput.trim()}
                  >
                    {parsing ? 'Parsing...' : 'Parse Specification'}
                  </Button>
                </div>
              )}

              {/* Preview Section */}
              {parsedFlows.length > 0 && (
                <>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium">Preview ({parsedFlows.length} flows)</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleToggleAll}
                        >
                          {selectedFlows.size === parsedFlows.length ? 'Deselect All' : 'Select All'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={resetImportForm}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    {/* Duplicate Warning */}
                    {duplicates.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                          ⚠️ {duplicates.length} duplicate flow(s) detected
                        </p>
                        <div className="space-y-1">
                          <label className="flex items-center text-sm">
                            <input
                              type="radio"
                              value="skip"
                              checked={duplicateAction === 'skip'}
                              onChange={(e) => setDuplicateAction(e.target.value as any)}
                              className="mr-2"
                            />
                            Skip duplicates (create only new flows)
                          </label>
                          <label className="flex items-center text-sm">
                            <input
                              type="radio"
                              value="update"
                              checked={duplicateAction === 'update'}
                              onChange={(e) => setDuplicateAction(e.target.value as any)}
                              className="mr-2"
                            />
                            Update existing flows with new data
                          </label>
                          <label className="flex items-center text-sm">
                            <input
                              type="radio"
                              value="cancel"
                              checked={duplicateAction === 'cancel'}
                              onChange={(e) => setDuplicateAction(e.target.value as any)}
                              className="mr-2"
                            />
                            Cancel import if duplicates exist
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Flow Preview Table */}
                    <div className="max-h-96 overflow-y-auto border rounded">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              <input
                                type="checkbox"
                                checked={selectedFlows.size === parsedFlows.length}
                                onChange={handleToggleAll}
                              />
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Path</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variables</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parsedFlows.map((flow, index) => {
                            const isDuplicate = duplicates.includes(flow.name);
                            return (
                              <tr
                                key={index}
                                className={isDuplicate ? 'bg-yellow-50' : ''}
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedFlows.has(flow.name)}
                                    onChange={() => handleToggleFlow(flow.name)}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {flow.name}
                                  {isDuplicate && (
                                    <span className="ml-2">
                                      <Badge variant="warning">Duplicate</Badge>
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-sm font-mono">{flow.method}</td>
                                <td className="px-3 py-2 text-sm font-mono">{flow.url}</td>
                                <td className="px-3 py-2 text-sm">
                                  {flow.vars && flow.vars.length > 0 ? (
                                    <span className="text-gray-600">{flow.vars.length} var(s)</span>
                                  ) : (
                                    <span className="text-gray-400">None</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Import Button */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="secondary"
                        onClick={resetImportForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleImportFlows}
                        disabled={importing || selectedFlows.size === 0}
                      >
                        {importing ? 'Importing...' : `Import ${selectedFlows.size} Flow(s)`}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Manual Flow Form (when adding/editing) */}
          {showFlowForm && (
            <div className="space-y-4">
              <Input
                label="Flow Name"
                value={flowFormData.name}
                onChange={(e) => setFlowFormData({ ...flowFormData, name: e.target.value })}
                placeholder="e.g., Process Document"
                required
              />

              <Input
                label="Description"
                value={flowFormData.description}
                onChange={(e) => setFlowFormData({ ...flowFormData, description: e.target.value })}
                placeholder="Optional description"
              />

              <Input
                label="URL Path"
                value={flowFormData.url}
                onChange={(e) => setFlowFormData({ ...flowFormData, url: e.target.value })}
                placeholder="/analyze"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTTP Method
                </label>
                <select
                  value={flowFormData.method}
                  onChange={(e) => setFlowFormData({ ...flowFormData, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Variables (Optional)
                  </label>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addFlowVariable}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Variable
                  </Button>
                </div>

                {flowFormData.vars.length > 0 && (
                  <div className="space-y-2">
                    {flowFormData.vars.map((variable, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded">
                        <Input
                          value={variable.name}
                          onChange={(e) => updateFlowVariable(index, 'name', e.target.value)}
                          placeholder="Variable name"
                          className="flex-1"
                        />
                        <select
                          value={variable.type}
                          onChange={(e) => updateFlowVariable(index, 'type', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="json">JSON</option>
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                        </select>
                        <label className="flex items-center gap-1 px-3 py-2">
                          <input
                            type="checkbox"
                            checked={variable.mandatory}
                            onChange={(e) => updateFlowVariable(index, 'mandatory', e.target.checked)}
                          />
                          <span className="text-sm">Required</span>
                        </label>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeFlowVariable(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowFlowForm(false);
                    setEditingFlow(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveFlow}>
                  {editingFlow ? 'Update Flow' : 'Create Flow'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

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

