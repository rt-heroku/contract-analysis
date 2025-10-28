import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/lib/api';

export const ActionCreator: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'custom',
    icon: 'Zap',
    color: '#6366f1',
    executorType: 'rest_api',
    
    // REST API config
    restConfig: {
      method: 'POST',
      url: '',
      headers: {},
      bodyTemplate: '',
    },
    
    // Script config
    scriptConfig: {
      code: '',
      timeout: 5000,
    },
    
    // Input/Output schemas
    inputSchema: {
      type: 'object',
      properties: {},
    },
    outputSchema: {
      type: 'object',
      properties: {},
    },
  });

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        actionType: 'user_defined',
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        executorType: formData.executorType,
        executorConfig: formData.executorType === 'rest_api' ? formData.restConfig : formData.scriptConfig,
        inputSchema: formData.inputSchema,
        outputSchema: formData.outputSchema,
        configSchema: {},
      };

      if (isEdit) {
        await api.put(`/actions/${id}`, payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Action updated successfully',
          type: 'success',
        });
      } else {
        await api.post('/actions', payload);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Action created successfully',
          type: 'success',
        });
      }

      setTimeout(() => navigate('/actions'), 1500);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save action',
        type: 'error',
      });
    }
  };

  const addHeaderField = () => {
    const key = prompt('Header name:');
    if (key) {
      setFormData({
        ...formData,
        restConfig: {
          ...formData.restConfig,
          headers: {
            ...formData.restConfig.headers,
            [key]: '',
          },
        },
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          onClick={() => navigate('/actions')}
          className="flex items-center space-x-2 mb-4 bg-gray-200 hover:bg-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Actions</span>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Action' : 'Create New Action'}
        </h1>
        <p className="text-gray-600 mt-1">
          Define a custom action that can be reused in processes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Basic Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Name (identifier) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="my_custom_action"
                pattern="[a-z0-9_]+"
                title="Lowercase letters, numbers, and underscores only"
              />
              <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="My Custom Action"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="What does this action do?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="custom">Custom</option>
                  <option value="api">API</option>
                  <option value="data">Data Processing</option>
                  <option value="storage">Storage</option>
                  <option value="notification">Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Execution Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Executor Type *
              </label>
              <select
                value={formData.executorType}
                onChange={(e) => setFormData({ ...formData, executorType: e.target.value as 'rest_api' | 'script' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rest_api">REST API Call</option>
                <option value="script">JavaScript Script</option>
              </select>
            </div>

            {formData.executorType === 'rest_api' && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
                    <select
                      value={formData.restConfig.method}
                      onChange={(e) => setFormData({
                        ...formData,
                        restConfig: { ...formData.restConfig, method: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                    <input
                      type="url"
                      required
                      value={formData.restConfig.url}
                      onChange={(e) => setFormData({
                        ...formData,
                        restConfig: { ...formData.restConfig, url: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://api.example.com/endpoint"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {`{{variable}}`} for dynamic values from input
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headers
                  </label>
                  <div className="space-y-2">
                    {Object.entries(formData.restConfig.headers).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <input
                          type="text"
                          value={key}
                          disabled
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => setFormData({
                            ...formData,
                            restConfig: {
                              ...formData.restConfig,
                              headers: { ...formData.restConfig.headers, [key]: e.target.value }
                            }
                          })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Header value"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const newHeaders = { ...formData.restConfig.headers } as Record<string, string>;
                            delete newHeaders[key];
                            setFormData({
                              ...formData,
                              restConfig: { ...formData.restConfig, headers: newHeaders }
                            });
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={addHeaderField}
                      className="bg-gray-200 hover:bg-gray-300"
                    >
                      Add Header
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Template (JSON)
                  </label>
                  <textarea
                    value={formData.restConfig.bodyTemplate}
                    onChange={(e) => setFormData({
                      ...formData,
                      restConfig: { ...formData.restConfig, bodyTemplate: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    rows={6}
                    placeholder={`{
  "key": "{{input.value}}",
  "data": "{{input.data}}"
}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {`{{variable}}`} for dynamic values. Leave empty to send entire input as body.
                  </p>
                </div>
              </>
            )}

            {formData.executorType === 'script' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    JavaScript Code *
                  </label>
                  <textarea
                    required
                    value={formData.scriptConfig.code}
                    onChange={(e) => setFormData({
                      ...formData,
                      scriptConfig: { ...formData.scriptConfig, code: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    rows={12}
                    placeholder={`// Access input data via 'input' variable
// Access context via 'context' variable
// Return your result

const result = {
  message: input.text.toUpperCase(),
  timestamp: new Date().toISOString()
};

return result;`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Runs in a sandboxed environment. Available: input, context, console, JSON, Math, Date
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.scriptConfig.timeout}
                    onChange={(e) => setFormData({
                      ...formData,
                      scriptConfig: { ...formData.scriptConfig, timeout: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="100"
                    max="30000"
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={() => navigate('/actions')}
            className="bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4" />
            <span>{isEdit ? 'Update Action' : 'Create Action'}</span>
          </Button>
        </div>
      </form>

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

