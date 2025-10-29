import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { IconUpload } from '@/components/common/IconUpload';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface Connector {
  id: number;
  name: string;
  connectorType: string;
  config: any;
}

export const ActionCreator: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [outputTab, setOutputTab] = useState<'definition' | 'example'>('definition');

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: 'custom',
    icon: 'Zap',
    color: '#6366f1',
    iconUrl: null as string | null,
    executorType: 'rest_api',
    connectorId: null as number | null,
    
    // REST API config
    restConfig: {
      connectorId: null as number | null,
      method: 'POST',
      endpoint: '',
      queryParams: {} as Record<string, string>,
      pathParams: {} as Record<string, string>,
      headers: {} as Record<string, string>,
      contentType: 'application/json',
      accept: 'application/json',
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
    outputExample: '',
  });

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const response = await api.get('/connectors');
      setConnectors(response.data.connectors.filter((c: Connector) => c.connectorType === 'rest') || []);
    } catch (error) {
      console.error('Failed to load connectors:', error);
    }
  };

  const parseOutputExample = () => {
    if (!formData.outputExample.trim()) return;

    try {
      const parsed = JSON.parse(formData.outputExample);
      const schema = generateSchemaFromExample(parsed);
      setFormData({
        ...formData,
        outputSchema: schema,
      });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Output schema generated from example',
        type: 'success',
      });
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Invalid JSON format',
        type: 'error',
      });
    }
  };

  const generateSchemaFromExample = (obj: any): any => {
    if (obj === null) return { type: 'null' };
    if (Array.isArray(obj)) {
      return {
        type: 'array',
        items: obj.length > 0 ? generateSchemaFromExample(obj[0]) : { type: 'object' },
      };
    }
    if (typeof obj === 'object') {
      const properties: any = {};
      for (const key in obj) {
        properties[key] = generateSchemaFromExample(obj[key]);
      }
      return { type: 'object', properties };
    }
    return { type: typeof obj };
  };

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
        connectorId: formData.executorType === 'rest_api' ? formData.restConfig.connectorId : null,
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

  const addKeyValuePair = (type: 'queryParams' | 'pathParams' | 'headers') => {
    const key = prompt(`Enter ${type === 'queryParams' ? 'parameter' : type === 'pathParams' ? 'path parameter' : 'header'} name:`);
    if (key) {
      setFormData({
        ...formData,
        restConfig: {
          ...formData.restConfig,
          [type]: {
            ...formData.restConfig[type],
            [key]: '',
          },
        },
      });
    }
  };

  const removeKeyValuePair = (type: 'queryParams' | 'pathParams' | 'headers', key: string) => {
    const newObj = { ...formData.restConfig[type] } as Record<string, string>;
    delete newObj[key];
    setFormData({
      ...formData,
      restConfig: { ...formData.restConfig, [type]: newObj }
    });
  };

  const updateKeyValuePair = (type: 'queryParams' | 'pathParams' | 'headers', key: string, value: string) => {
    setFormData({
      ...formData,
      restConfig: {
        ...formData.restConfig,
        [type]: { ...formData.restConfig[type], [key]: value }
      }
    });
  };

  const getEndpointNote = () => {
    const endpoint = formData.restConfig.endpoint;
    if (!endpoint) return 'Full URL (http://...) or endpoint path (/api/...)';
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return '✓ Full URL detected';
    } else if (endpoint.startsWith('/')) {
      return '✓ Endpoint path detected (will use connector base URL)';
    } else {
      return '⚠ Should start with http://, https://, or /';
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
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => {
                  const displayName = e.target.value;
                  // Auto-generate action name from display name if not manually edited
                  const autoName = displayName
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .replace(/^[0-9]+/, ''); // Remove leading numbers
                  
                  setFormData({ 
                    ...formData, 
                    displayName,
                    name: autoName || formData.name
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="My Custom Action"
              />
            </div>

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
              <p className="text-xs text-gray-500 mt-1">Auto-generated from display name. You can edit if needed.</p>
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

            <IconUpload
              currentIcon={formData.iconUrl || undefined}
              onIconChange={(iconUrl) => setFormData({ ...formData, iconUrl })}
              label="Custom Icon (Optional)"
              helpText="Upload a custom icon for this action (PNG, JPG, SVG - max 512KB). If not provided, a default icon based on category will be used."
            />
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
                {/* Connector Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connector
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.restConfig.connectorId || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        restConfig: { ...formData.restConfig, connectorId: e.target.value ? parseInt(e.target.value) : null }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No Connector (standalone)</option>
                      {connectors.map((connector) => (
                        <option key={connector.id} value={connector.id}>
                          {connector.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      onClick={() => navigate('/connectors')}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white"
                      title="Create new connector"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New</span>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a connector to inherit base URL, authentication, and default headers. Or leave empty for a standalone action.
                  </p>
                </div>

                {/* HTTP Method and Endpoint */}
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
                      <option value="HEAD">HEAD</option>
                      <option value="OPTIONS">OPTIONS</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endpoint / URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.restConfig.endpoint}
                      onChange={(e) => setFormData({
                        ...formData,
                        restConfig: { ...formData.restConfig, endpoint: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="/api/users or https://api.example.com/users"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {getEndpointNote()}
                    </p>
                  </div>
                </div>

                {/* Path Parameters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Path Parameters
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Define path variables like <code className="bg-gray-100 px-1 rounded">{`{{userId}}`}</code> in your endpoint
                  </p>
                  <div className="space-y-2">
                    {Object.entries(formData.restConfig.pathParams).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <input
                          type="text"
                          value={key}
                          disabled
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          placeholder="paramName"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateKeyValuePair('pathParams', key, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="{{input.userId}} or static value"
                        />
                        <Button
                          type="button"
                          onClick={() => removeKeyValuePair('pathParams', key)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => addKeyValuePair('pathParams')}
                      className="bg-gray-200 hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Path Parameter
                    </Button>
                  </div>
                </div>

                {/* Query Parameters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Query Parameters
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Will be appended to the URL as <code className="bg-gray-100 px-1 rounded">?key=value</code>
                  </p>
                  <div className="space-y-2">
                    {Object.entries(formData.restConfig.queryParams).map(([key, value]) => (
                      <div key={key} className="flex space-x-2">
                        <input
                          type="text"
                          value={key}
                          disabled
                          className="w-1/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          placeholder="paramName"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateKeyValuePair('queryParams', key, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="{{input.search}} or static value"
                        />
                        <Button
                          type="button"
                          onClick={() => removeKeyValuePair('queryParams', key)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => addKeyValuePair('queryParams')}
                      className="bg-gray-200 hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Query Parameter
                    </Button>
                  </div>
                </div>

                {/* Content-Type and Accept */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content-Type
                    </label>
                    <select
                      value={formData.restConfig.contentType}
                      onChange={(e) => setFormData({
                        ...formData,
                        restConfig: { ...formData.restConfig, contentType: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="application/json">application/json</option>
                      <option value="application/xml">application/xml</option>
                      <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                      <option value="multipart/form-data">multipart/form-data</option>
                      <option value="text/plain">text/plain</option>
                      <option value="text/html">text/html</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accept
                    </label>
                    <select
                      value={formData.restConfig.accept}
                      onChange={(e) => setFormData({
                        ...formData,
                        restConfig: { ...formData.restConfig, accept: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="application/json">application/json</option>
                      <option value="application/xml">application/xml</option>
                      <option value="text/plain">text/plain</option>
                      <option value="text/html">text/html</option>
                      <option value="*/*">*/* (any)</option>
                    </select>
                  </div>
                </div>

                {/* Headers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Headers
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Additional headers beyond Content-Type and Accept
                  </p>
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
                          value={value}
                          onChange={(e) => updateKeyValuePair('headers', key, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Header value"
                        />
                        <Button
                          type="button"
                          onClick={() => removeKeyValuePair('headers', key)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => addKeyValuePair('headers')}
                      className="bg-gray-200 hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Header
                    </Button>
                  </div>
                </div>

                {/* Body Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Body Template
                  </label>
                  <textarea
                    value={formData.restConfig.bodyTemplate}
                    onChange={(e) => setFormData({
                      ...formData,
                      restConfig: { ...formData.restConfig, bodyTemplate: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    rows={8}
                    placeholder={`{
  "name": "{{input.name}}",
  "email": "{{input.email}}",
  "data": {{input.data}}
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

        {/* Input Metadata */}
        <Card title="Input Metadata">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Define the expected input structure for this action. This will be used to validate inputs and enable mapping from previous actions.
            </p>
            <textarea
              value={JSON.stringify(formData.inputSchema, null, 2)}
              onChange={(e) => {
                try {
                  setFormData({ ...formData, inputSchema: JSON.parse(e.target.value) });
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              rows={8}
              placeholder={`{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  },
  "required": ["name"]
}`}
            />
          </div>
        </Card>

        {/* Output Metadata */}
        <Card title="Output Metadata">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Define the output structure. You can provide an example JSON and auto-generate the schema.
            </p>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-300">
              <button
                type="button"
                onClick={() => setOutputTab('definition')}
                className={`px-4 py-2 font-medium ${
                  outputTab === 'definition'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Definition
              </button>
              <button
                type="button"
                onClick={() => setOutputTab('example')}
                className={`px-4 py-2 font-medium ${
                  outputTab === 'example'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Example
              </button>
            </div>

            {/* Definition Tab */}
            {outputTab === 'definition' && (
              <div>
                <textarea
                  value={JSON.stringify(formData.outputSchema, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, outputSchema: JSON.parse(e.target.value) });
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows={10}
                  placeholder={`{
  "type": "object",
  "properties": {
    "userId": { "type": "string" },
    "success": { "type": "boolean" }
  }
}`}
                />
              </div>
            )}

            {/* Example Tab */}
            {outputTab === 'example' && (
              <div className="space-y-2">
                <textarea
                  value={formData.outputExample}
                  onChange={(e) => setFormData({ ...formData, outputExample: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  rows={10}
                  placeholder={`{
  "userId": "12345",
  "name": "John Doe",
  "email": "john@example.com",
  "success": true
}`}
                />
                <Button
                  type="button"
                  onClick={parseOutputExample}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Generate Schema from Example
                </Button>
                <p className="text-xs text-gray-500">
                  Paste a sample JSON response and click the button to auto-generate the output schema
                </p>
              </div>
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
