import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Share2, 
  Key, 
  Globe,
  Copy,
  X,
  ExternalLink,
  Users as UsersIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ShareModal } from '@/components/common/ShareModal';

interface IdpExecution {
  id: number;
  userId: number;
  name: string;
  description?: string;
  protocol: string;
  host: string;
  basePath: string;
  orgId: string;
  actionId: string;
  actionVersion: string;
  authClientId: string;
  authClientSecret: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const IdpExecutions: React.FC = () => {
  const { user } = useAuth();
  const [myExecutions, setMyExecutions] = useState<IdpExecution[]>([]);
  const [sharedExecutions, setSharedExecutions] = useState<IdpExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExecution, setEditingExecution] = useState<IdpExecution | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(null);
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'confirm';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    protocol: 'HTTPS',
    host: '',
    basePath: '',
    orgId: '',
    actionId: '',
    actionVersion: '',
    authClientId: '',
    authClientSecret: '',
  });

  const [parsing, setParsing] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/idp-executions');
      setMyExecutions(response.data.myExecutions || []);
      setSharedExecutions(response.data.sharedExecutions || []);
    } catch (error: any) {
      console.error('Error fetching IDP executions:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to fetch IDP executions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParseUrl = async () => {
    if (!formData.url.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please enter a URL to parse',
        type: 'warning',
      });
      return;
    }

    try {
      setParsing(true);
      const response = await api.post('/idp-executions/parse-url', { url: formData.url });
      const parsed = response.data.parsed;
      
      setFormData(prev => ({
        ...prev,
        protocol: parsed.protocol,
        host: parsed.host,
        basePath: parsed.basePath,
        orgId: parsed.orgId,
        actionId: parsed.actionId,
        actionVersion: parsed.actionVersion,
      }));

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'URL parsed successfully!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error parsing URL:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Parse Error',
        message: error.response?.data?.error || 'Failed to parse URL. Please check the format.',
        type: 'error',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.protocol || !formData.host || !formData.orgId || 
        !formData.actionId || !formData.actionVersion || !formData.authClientId || !formData.authClientSecret) {
      setAlertDialog({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please fill in all required fields',
        type: 'warning',
      });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        protocol: formData.protocol,
        host: formData.host,
        basePath: formData.basePath || '/api/v1/organizations/',
        orgId: formData.orgId,
        actionId: formData.actionId,
        actionVersion: formData.actionVersion,
        authClientId: formData.authClientId,
        authClientSecret: formData.authClientSecret,
      };

      if (editingExecution) {
        await api.put(`/idp-executions/${editingExecution.id}`, payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'IDP Execution updated successfully',
          type: 'success',
        });
      } else {
        await api.post('/idp-executions', payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'IDP Execution created successfully',
          type: 'success',
        });
      }

      handleCloseForm();
      fetchExecutions();
    } catch (error: any) {
      console.error('Error saving IDP execution:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save IDP execution',
        type: 'error',
      });
    }
  };

  const handleEdit = async (execution: IdpExecution) => {
    try {
      // Fetch the full details with decrypted credentials
      const response = await api.get(`/idp-executions/${execution.id}`);
      const fullExecution = response.data.execution;

      setEditingExecution(fullExecution);
      setFormData({
        name: fullExecution.name,
        description: fullExecution.description || '',
        url: '',
        protocol: fullExecution.protocol,
        host: fullExecution.host,
        basePath: fullExecution.basePath,
        orgId: fullExecution.orgId,
        actionId: fullExecution.actionId,
        actionVersion: fullExecution.actionVersion,
        authClientId: fullExecution.authClientId,
        authClientSecret: fullExecution.authClientSecret,
      });
      setShowForm(true);
    } catch (error: any) {
      console.error('Error fetching execution details:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load execution details',
        type: 'error',
      });
    }
  };

  const handleDelete = (execution: IdpExecution) => {
    setAlertDialog({
      isOpen: true,
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete "${execution.name}"? This action cannot be undone.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/idp-executions/${execution.id}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'IDP Execution deleted successfully',
            type: 'success',
          });
          fetchExecutions();
        } catch (error: any) {
          console.error('Error deleting execution:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete IDP execution',
            type: 'error',
          });
        }
      },
    });
  };

  const handleShare = (executionId: number) => {
    setSelectedExecutionId(executionId);
    setShareModalOpen(true);
  };

  const handleShareComplete = () => {
    setShareModalOpen(false);
    setSelectedExecutionId(null);
    fetchExecutions();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExecution(null);
    setFormData({
      name: '',
      description: '',
      url: '',
      protocol: 'HTTPS',
      host: '',
      basePath: '',
      orgId: '',
      actionId: '',
      actionVersion: '',
      authClientId: '',
      authClientSecret: '',
    });
  };

  const buildFullUrl = (execution: IdpExecution) => {
    return `${execution.protocol.toLowerCase()}://${execution.host}${execution.basePath}${execution.orgId}/actions/${execution.actionId}/versions/${execution.actionVersion}/executions`;
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ExecutionCard = ({ execution, isShared }: { execution: IdpExecution; isShared: boolean }) => {
    const isOwner = execution.userId === user?.id;
    const secretVisibleKey = `${execution.id}-secret`;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{execution.name}</h3>
              {isShared && (
                <Badge variant="info">
                  <UsersIcon className="w-3 h-3 mr-1" />
                  Shared with me
                </Badge>
              )}
            </div>

            {execution.description && (
              <p className="text-sm text-gray-600 mb-3">{execution.description}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 font-medium">URL:</span>
                <a 
                  href={buildFullUrl(execution)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 truncate"
                >
                  <span className="truncate">{execution.host}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Protocol:</span>
                  <span className="ml-2 font-medium">{execution.protocol}</span>
                </div>
                <div>
                  <span className="text-gray-500">Version:</span>
                  <span className="ml-2 font-medium">{execution.actionVersion}</span>
                </div>
              </div>

              {/* Credentials - masked for shared executions */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">Credentials:</span>
                </div>
                <div className="space-y-1 pl-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Client ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {execution.authClientId}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Client Secret:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {execution.authClientSecret}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {execution.user && isShared && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Owned by: {execution.user.firstName} {execution.user.lastName} ({execution.user.email})
              </div>
            )}
          </div>

          {/* Action buttons - only for owned executions */}
          {isOwner && (
            <div className="flex flex-col gap-2 ml-4">
              <Button
                onClick={() => handleEdit(execution)}
                variant="outline"
                className="flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                onClick={() => handleShare(execution.id)}
                variant="outline"
                className="flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                onClick={() => handleDelete(execution)}
                variant="outline"
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IDP Executions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IDP Executions</h1>
          <p className="text-gray-600 mt-1">
            Manage your MuleSoft IDP execution configurations
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Execution
        </Button>
      </div>

      {/* My IDP Executions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My IDP Executions</h2>
        {myExecutions.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p>No IDP executions yet. Create your first one!</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {myExecutions.map((execution) => (
              <ExecutionCard key={execution.id} execution={execution} isShared={false} />
            ))}
          </div>
        )}
      </div>

      {/* Shared with Me */}
      {sharedExecutions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shared with Me</h2>
          <div className="grid gap-4">
            {sharedExecutions.map((execution) => (
              <ExecutionCard key={execution.id} execution={execution} isShared={true} />
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingExecution ? 'Edit IDP Execution' : 'New IDP Execution'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* URL Parser */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parse from URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://idp-rt.us-east-1.anypoint.mulesoft.com/api/v1/organizations/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <Button
                    type="button"
                    onClick={handleParseUrl}
                    disabled={parsing}
                    variant="outline"
                  >
                    {parsing ? 'Parsing...' : 'Parse'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full MuleSoft IDP URL to auto-fill the fields below
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4"></div>

              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Connection Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protocol <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.protocol}
                    onChange={(e) => setFormData(prev => ({ ...prev, protocol: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="HTTPS">HTTPS</option>
                    <option value="HTTP">HTTP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="idp-rt.us-east-1.anypoint.mulesoft.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Path
                </label>
                <input
                  type="text"
                  value={formData.basePath}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePath: e.target.value }))}
                  placeholder="/api/v1/organizations/"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* IDP Details */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.orgId}
                    onChange={(e) => setFormData(prev => ({ ...prev, orgId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.actionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Version <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.actionVersion}
                    onChange={(e) => setFormData(prev => ({ ...prev, actionVersion: e.target.value }))}
                    placeholder="1.3.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Authentication */}
              <div className="border-t border-gray-200 pt-4"></div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Authentication Credentials
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.authClientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, authClientId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Secret <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecrets['form-secret'] ? 'text' : 'password'}
                    required
                    value={formData.authClientSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, authClientSecret: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretVisibility('form-secret')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecrets['form-secret'] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Credentials are encrypted and stored securely
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700">
                  {editingExecution ? 'Update Execution' : 'Create Execution'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCloseForm}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedExecutionId && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          resourceId={selectedExecutionId}
          resourceType="idp-execution"
          onShareComplete={handleShareComplete}
        />
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onConfirm={alertDialog.onConfirm}
      />
    </div>
  );
};

