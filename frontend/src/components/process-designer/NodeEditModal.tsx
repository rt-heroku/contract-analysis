import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { X, Plus, Trash2, ArrowRight, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/Tabs';
import { ConditionalEditor, ConditionalGroup } from './ConditionalEditor';

interface NodeEditModalProps {
  isOpen: boolean;
  node: any;
  allActions: any[];
  nodes: any[];
  edges: any[];
  onClose: () => void;
  onSave: (nodeId: string, data: any, outputSchema?: any, inputSchema?: any) => void;
  onDeleteEdge?: (edgeId: string) => void;
}

export const NodeEditModal = ({ isOpen, node, allActions: _allActions, nodes, edges, onClose, onSave, onDeleteEdge }: NodeEditModalProps) => {
  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('configuration');
  const [showConditionalEditor, setShowConditionalEditor] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData(node.data.config || {});
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, formData);
    onClose();
  };

  // Get incoming calls (edges that target this node)
  const getIncomingCalls = () => {
    return edges.filter(edge => edge.target === node.id).map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      return {
        edgeId: edge.id,
        sourceNodeId: edge.source,
        sourceNode: sourceNode,
        handleId: edge.sourceHandle,
        label: edge.data?.label,
      };
    });
  };

  const incomingCalls = getIncomingCalls();

  const renderFieldsByActionType = () => {
    const actionName = node.data.actionName?.toLowerCase() || '';

    // REST API Call
    if (actionName.includes('rest') || actionName.includes('api')) {
      return renderRestApiFields();
    }

    // Script
    if (actionName.includes('script')) {
      return renderScriptFields();
    }

    // IDP Extract
    if (actionName.includes('idp')) {
      return renderIdpFields();
    }

    // If Then Else
    if (actionName.includes('if')) {
      return renderIfThenElseFields();
    }

    // For Each
    if (actionName.includes('foreach') || actionName.includes('for_each')) {
      return renderForEachFields();
    }

    // While Loop
    if (actionName.includes('while')) {
      return renderWhileFields();
    }

    // Delay
    if (actionName.includes('delay')) {
      return renderDelayFields();
    }

    // Notify
    if (actionName.includes('notify')) {
      return renderNotifyFields();
    }

    // Smart Router (AI)
    if (actionName.includes('smart_router') || actionName.includes('router')) {
      return renderSmartRouterFields();
    }

    // Call Process / Workflow
    if (actionName.includes('call_process') || actionName.includes('workflow')) {
      return renderCallProcessFields();
    }

    // Transform
    if (actionName.includes('transform')) {
      return renderTransformFields();
    }

    // Validate
    if (actionName.includes('validate')) {
      return renderValidateFields();
    }

    // Set Variable / Set Payload
    if (actionName.includes('variable') || actionName.includes('payload')) {
      return renderVariableFields();
    }

    // Default generic fields
    return renderGenericFields();
  };

  const renderRestApiFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
          <select
            value={formData.method || 'GET'}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">URL / Endpoint</label>
          <input
            type="text"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://api.example.com/endpoint or /api/users"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Headers</label>
        {Object.entries(formData.headers || {}).map(([key, value]) => (
          <div key={key} className="flex space-x-2 mb-2">
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
                headers: { ...formData.headers, [key]: e.target.value }
              })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <Button
              onClick={() => {
                const newHeaders = { ...formData.headers };
                delete newHeaders[key];
                setFormData({ ...formData, headers: newHeaders });
              }}
              className="px-3 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          onClick={() => {
            const key = prompt('Header name:');
            if (key) {
              setFormData({
                ...formData,
                headers: { ...(formData.headers || {}), [key]: '' }
              });
            }
          }}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Header
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Request Body</label>
        <textarea
          value={formData.body || ''}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={6}
          placeholder='{"key": "{{input.value}}"}'
        />
      </div>
    </div>
  );

  const renderScriptFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">JavaScript Code</label>
        <textarea
          value={formData.code || ''}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={12}
          placeholder={`// Available: input, context, console\nconst result = input.value * 2;\nreturn { output: result };`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
        <input
          type="number"
          value={formData.timeout || 5000}
          onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="100"
          max="30000"
        />
      </div>
    </div>
  );

  const renderIdpFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">IDP Execution ID</label>
        <input
          type="number"
          value={formData.idpExecutionId || ''}
          onChange={(e) => setFormData({ ...formData, idpExecutionId: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
        <input
          type="text"
          value={formData.documentType || 'contract'}
          onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="contract, invoice, etc."
        />
      </div>
    </div>
  );

  const renderIfThenElseFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
        <button
          type="button"
          onClick={() => setShowConditionalEditor(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">
            {formData.conditions?.length > 0 ? 'Edit Conditions' : 'Configure Conditions'}
          </span>
        </button>
        {formData.conditions?.length > 0 && (
          <p className="text-xs text-green-600 mt-1">
            ✓ {formData.conditions.reduce((acc: number, g: any) => acc + g.conditions.length, 0)} condition(s) configured
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Legacy simple condition string (backward compatibility):
        </p>
        <input
          type="text"
          value={formData.condition || ''}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
          placeholder="{{input.value}} > 100"
        />
      </div>
    </div>
  );

  const renderForEachFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Array</label>
        <input
          type="text"
          value={formData.array || ''}
          onChange={(e) => setFormData({ ...formData, array: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="{{input.items}}"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Item Variable Name</label>
        <input
          type="text"
          value={formData.itemVar || 'item'}
          onChange={(e) => setFormData({ ...formData, itemVar: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="item"
        />
      </div>
    </div>
  );

  const renderWhileFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <input
          type="text"
          value={formData.condition || ''}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="{{context.counter}} < 10"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Iterations</label>
        <input
          type="number"
          value={formData.maxIterations || 100}
          onChange={(e) => setFormData({ ...formData, maxIterations: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="1"
          max="1000"
        />
      </div>
    </div>
  );

  const renderDelayFields = () => {
    const delayType = formData.delayType || 'fixed';
    
    return (
      <div className="space-y-6">
        {/* Delay Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> Delay Type
          </label>
          <select
            value={delayType}
            onChange={(e) => setFormData({ ...formData, delayType: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Delay Type...</option>
            <option value="fixed">⏱️ Fixed Delay</option>
            <option value="dynamic">⚡ Dynamic Delay</option>
            <option value="conditional">🔄 Conditional Delay</option>
            <option value="until">📅 Until Specific Date/Time</option>
          </select>
        </div>

        {/* General Information (collapsible) */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">General Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Title
              </label>
              <input
                type="text"
                value={formData.title || 'Delay'}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Delay"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Status
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">🟢 Active</option>
                <option value="inactive">⚫ Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> Description
              </label>
              <textarea
                value={formData.description || 'Pause the workflow'}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Pause the workflow"
              />
            </div>
          </div>
        </div>

        {/* Duration Section - type-specific */}
        {delayType && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Duration</h3>
            
            {/* Fixed Delay */}
            {delayType === 'fixed' && (
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Units:</label>
                    <select
                      value={formData.timeUnits || 'seconds'}
                      onChange={(e) => setFormData({ ...formData, timeUnits: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Delay Amount:
                  </label>
                  <input
                    type="number"
                    value={formData.delayAmount || 3}
                    onChange={(e) => setFormData({ ...formData, delayAmount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="3"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Delay */}
            {delayType === 'dynamic' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration Expression</label>
                  <input
                    type="text"
                    value={formData.durationExpression || ''}
                    onChange={(e) => setFormData({ ...formData, durationExpression: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="order.processing_time * 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Expression that evaluates to delay duration in milliseconds
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Wait Time:</label>
                  <select
                    value={formData.maxWaitTime || '24 hours'}
                    onChange={(e) => setFormData({ ...formData, maxWaitTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1 hour">1 hour</option>
                    <option value="6 hours">6 hours</option>
                    <option value="12 hours">12 hours</option>
                    <option value="24 hours">24 hours</option>
                    <option value="3 days">3 days</option>
                    <option value="7 days">7 days</option>
                  </select>
                </div>
              </div>
            )}

            {/* Conditional Delay */}
            {delayType === 'conditional' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
                  <button
                    type="button"
                    onClick={() => setShowConditionalEditor(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formData.conditions?.length > 0 ? 'Edit Conditions' : 'Configure Conditions'}
                    </span>
                  </button>
                  {formData.conditions?.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {formData.conditions.reduce((acc: number, g: any) => acc + g.conditions.length, 0)} condition(s) configured
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Interval (seconds)</label>
                  <input
                    type="number"
                    value={formData.checkInterval || 60}
                    onChange={(e) => setFormData({ ...formData, checkInterval: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    placeholder="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How often to check if conditions are met
                  </p>
                </div>
              </div>
            )}

            {/* Until Specific Date/Time */}
            {delayType === 'until' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500">*</span> Target Date/Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.targetDateTime || ''}
                    onChange={(e) => setFormData({ ...formData, targetDateTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Or use an expression: {`{{order.delivery_date}}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                  <select
                    value={formData.timeZone || 'UTC'}
                    onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Asia/Shanghai">Asia/Shanghai</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNotifyFields = () => {
    const notificationType = formData.notificationType || 'email';
    
    return (
      <div className="space-y-6">
        {/* Notification Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Notification Type
          </label>
          <select
            value={notificationType}
            onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Notification Type</option>
            <option value="email">✉️ Email</option>
            <option value="sms">💬 SMS</option>
            <option value="push">🔔 Push Notification</option>
            <option value="webhook">🔗 Webhook</option>
            <option value="slack">💼 Slack Message</option>
          </select>
        </div>

        {/* General Information */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">General Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || 'Notification'}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">🟢 Active</option>
                <option value="inactive">⚫ Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || 'Send alerts or notifications'}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Send alerts or notifications"
              />
            </div>
          </div>
        </div>

        {/* Type-specific Settings */}
        {notificationType && (
          <div className="border-t pt-4">
            {/* Email Settings */}
            {notificationType === 'email' && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                    <input
                      type="email"
                      value={formData.emailTo || ''}
                      onChange={(e) => setFormData({ ...formData, emailTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CC / BCC</label>
                    <input
                      type="text"
                      value={formData.emailCc || ''}
                      onChange={(e) => setFormData({ ...formData, emailCc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="manager@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={formData.emailSubject || ''}
                      onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Type your subject here..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                    <textarea
                      value={formData.emailBody || ''}
                      onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={5}
                      placeholder="Type your message here..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.emailPriority || 'normal'}
                      onChange={(e) => setFormData({ ...formData, emailPriority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Retry on Failure:</label>
                    <input
                      type="checkbox"
                      checked={formData.retryOnFailure || false}
                      onChange={(e) => setFormData({ ...formData, retryOnFailure: e.target.checked })}
                      className="w-10 h-5 rounded-full"
                    />
                  </div>
                  {formData.retryOnFailure && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of retries</label>
                      <input
                        type="number"
                        value={formData.numberOfRetries || 3}
                        onChange={(e) => setFormData({ ...formData, numberOfRetries: parseInt(e.target.value) || 3 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="10"
                        placeholder="3"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SMS Settings */}
            {notificationType === 'sms' && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">SMS Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.smsTo || ''}
                      onChange={(e) => setFormData({ ...formData, smsTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={formData.smsMessage || ''}
                      onChange={(e) => setFormData({ ...formData, smsMessage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Your SMS message here..."
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(formData.smsMessage || '').length}/160 characters
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Push Notification Settings */}
            {notificationType === 'push' && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Push Notification Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.pushTitle || ''}
                      onChange={(e) => setFormData({ ...formData, pushTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Notification title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                    <textarea
                      value={formData.pushBody || ''}
                      onChange={(e) => setFormData({ ...formData, pushBody: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Notification message"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Data (JSON)</label>
                    <textarea
                      value={typeof formData.pushData === 'string' ? formData.pushData : JSON.stringify(formData.pushData || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({ ...formData, pushData: JSON.parse(e.target.value) });
                        } catch {
                          setFormData({ ...formData, pushData: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder='{"action": "view", "itemId": 123}'
                    />
                  </div>
                </div>
              </>
            )}

            {/* Webhook Settings */}
            {notificationType === 'webhook' && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Webhook Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={formData.webhookUrl || ''}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <select
                      value={formData.webhookMethod || 'POST'}
                      onChange={(e) => setFormData({ ...formData, webhookMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payload (JSON)</label>
                    <textarea
                      value={typeof formData.webhookPayload === 'string' ? formData.webhookPayload : JSON.stringify(formData.webhookPayload || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({ ...formData, webhookPayload: JSON.parse(e.target.value) });
                        } catch {
                          setFormData({ ...formData, webhookPayload: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={5}
                      placeholder='{"event": "notification", "data": {}}'
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Headers (JSON)</label>
                    <textarea
                      value={typeof formData.webhookHeaders === 'string' ? formData.webhookHeaders : JSON.stringify(formData.webhookHeaders || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({ ...formData, webhookHeaders: JSON.parse(e.target.value) });
                        } catch {
                          setFormData({ ...formData, webhookHeaders: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder='{"Authorization": "Bearer token"}'
                    />
                  </div>
                </div>
              </>
            )}

            {/* Slack Settings */}
            {notificationType === 'slack' && (
              <>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Slack Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Channel / User</label>
                    <input
                      type="text"
                      value={formData.slackChannel || ''}
                      onChange={(e) => setFormData({ ...formData, slackChannel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#general or @username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={formData.slackMessage || ''}
                      onChange={(e) => setFormData({ ...formData, slackMessage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Your Slack message here..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (JSON Array)</label>
                    <textarea
                      value={typeof formData.slackAttachments === 'string' ? formData.slackAttachments : JSON.stringify(formData.slackAttachments || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setFormData({ ...formData, slackAttachments: JSON.parse(e.target.value) });
                        } catch {
                          setFormData({ ...formData, slackAttachments: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={5}
                      placeholder='[{"color": "good", "text": "Success!"}]'
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSmartRouterFields = () => {
    return (
      <div className="space-y-6">
        {/* LLM Connector Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> LLM Connector
          </label>
          <select
            value={formData.connectorId || ''}
            onChange={(e) => setFormData({ ...formData, connectorId: parseInt(e.target.value) || undefined })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select LLM Connector...</option>
            <option value="1">OpenAI (GPT)</option>
            <option value="2">Anthropic (Claude)</option>
            <option value="3">Google (Gemini)</option>
            <option value="4">AWS Bedrock</option>
            <option value="5">Azure OpenAI</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            LLM connectors need to be configured in the Connections page
          </p>
        </div>

        {/* Model Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> Model
          </label>
          <select
            value={formData.model || ''}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Model...</option>
            <optgroup label="OpenAI">
              <option value="gpt-4o">gpt-4o (Recommended)</option>
              <option value="gpt-4o-mini">gpt-4o-mini (Fast & Affordable)</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </optgroup>
            <optgroup label="Anthropic">
              <option value="claude-3-opus-20240229">Claude 3 Opus (Most Capable)</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Balanced)</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
            </optgroup>
            <optgroup label="Google">
              <option value="gemini-pro">Gemini Pro</option>
              <option value="gemini-pro-vision">Gemini Pro Vision</option>
            </optgroup>
          </select>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> Prompt
          </label>
          <textarea
            value={formData.prompt || ''}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            rows={6}
            placeholder="Route to the correct block based on the input...

Analyze the following data and determine the most appropriate route:
- If the order is urgent, route to 'urgent_processing'
- If the order is standard, route to 'standard_processing'  
- If the order needs approval, route to 'approval_workflow'

Consider: priority, amount, customer tier, and special requirements."
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe the routing logic. The AI will analyze input data and select the appropriate route.
          </p>
        </div>

        {/* Routes Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Available Routes</label>
          <div className="space-y-2">
            {(formData.routes || []).map((route: any, index: number) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={route.name || ''}
                  onChange={(e) => {
                    const newRoutes = [...(formData.routes || [])];
                    newRoutes[index] = { ...route, name: e.target.value };
                    setFormData({ ...formData, routes: newRoutes });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Route name"
                />
                <input
                  type="text"
                  value={route.description || ''}
                  onChange={(e) => {
                    const newRoutes = [...(formData.routes || [])];
                    newRoutes[index] = { ...route, description: e.target.value };
                    setFormData({ ...formData, routes: newRoutes });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Route description"
                />
                <button
                  onClick={() => {
                    const newRoutes = [...(formData.routes || [])];
                    newRoutes.splice(index, 1);
                    setFormData({ ...formData, routes: newRoutes });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  routes: [...(formData.routes || []), { name: '', description: '' }],
                });
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Route</span>
            </button>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Advanced Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {formData.temperature ?? 0.0}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature ?? 0.0}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Deterministic (0)</span>
                <span>Creative (2)</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
              <input
                type="number"
                value={formData.maxTokens || 150}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 150 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="50"
                max="4000"
                placeholder="150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Route</label>
              <input
                type="text"
                value={formData.fallbackRoute || ''}
                onChange={(e) => setFormData({ ...formData, fallbackRoute: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="default"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used when AI cannot confidently determine a route
              </p>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Include AI Reasoning:</label>
              <input
                type="checkbox"
                checked={formData.includeReasoning ?? true}
                onChange={(e) => setFormData({ ...formData, includeReasoning: e.target.checked })}
                className="w-10 h-5 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCallProcessFields = () => {
    // TODO: Fetch available processes from API (excluding current process)
    const availableProcesses = [
      { id: '1', name: 'bold-temple', hasInputTrigger: true, inputFields: ['orderId', 'priority', 'customerEmail'] },
      { id: '2', name: 'order-processing', hasInputTrigger: false, inputFields: [] },
      { id: '3', name: 'approval-workflow', hasInputTrigger: true, inputFields: ['amount', 'requestor'] },
    ];

    const selectedProcess = availableProcesses.find(p => p.id === formData.processId);

    return (
      <div className="space-y-6">
        {/* Workflow Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-red-500">*</span> Select Workflow
          </label>
          <select
            value={formData.processId || ''}
            onChange={(e) => {
              const process = availableProcesses.find(p => p.id === e.target.value);
              setFormData({ 
                ...formData, 
                processId: e.target.value,
                processName: process?.name || '',
                inputMapping: {}, // Reset input mapping when workflow changes
              });
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a workflow...</option>
            {availableProcesses.map(process => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input Mapping Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <span>Input Mapping</span>
            <div className="relative group">
              <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center text-gray-400 text-xs cursor-help">
                i
              </div>
              <div className="absolute left-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                Map parent variables to child workflow input fields. The mapped values are what the child receives.
              </div>
            </div>
          </label>

          {!formData.processId ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Select a workflow first</p>
              <p className="text-xs text-gray-400 mt-1">Choose a workflow above to configure input mapping</p>
            </div>
          ) : !selectedProcess?.hasInputTrigger || selectedProcess.inputFields.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No input fields defined</p>
              <p className="text-xs text-gray-400 mt-1">The selected workflow needs an Input Trigger with defined fields</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProcess.inputFields.map((field) => (
                <div key={field} className="flex items-center space-x-3">
                  <label className="w-1/3 text-sm font-medium text-gray-700">
                    {field}
                  </label>
                  <input
                    type="text"
                    value={formData.inputMapping?.[field] || ''}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        inputMapping: {
                          ...formData.inputMapping,
                          [field]: e.target.value,
                        },
                      });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`{{parent.${field}}}`}
                  />
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                Use {`{{variable}}`} to reference parent workflow variables
              </p>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        {formData.processId && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Advanced Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Wait for Completion</label>
                  <p className="text-xs text-gray-500">Block until child workflow finishes</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.waitForCompletion ?? true}
                  onChange={(e) => setFormData({ ...formData, waitForCompletion: e.target.checked })}
                  className="w-10 h-5 rounded-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
                <input
                  type="number"
                  value={formData.timeoutMs || 300000}
                  onChange={(e) => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) || 300000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1000"
                  step="1000"
                  placeholder="300000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 5 minutes (300000ms)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Output Information */}
        {formData.processId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Output Variables</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <div><code className="bg-blue-100 px-1 py-0.5 rounded">result</code> – The child workflow's final response</div>
              <div><code className="bg-blue-100 px-1 py-0.5 rounded">success</code> – Whether it ran without errors</div>
              <div><code className="bg-blue-100 px-1 py-0.5 rounded">error</code> – Message when the run fails</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransformFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transformation Script</label>
        <textarea
          value={formData.transform || ''}
          onChange={(e) => setFormData({ ...formData, transform: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={8}
          placeholder={`// Transform input data\nreturn {\n  fullName: input.firstName + " " + input.lastName,\n  age: parseInt(input.age)\n};`}
        />
      </div>
    </div>
  );

  const renderValidateFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">JSON Schema</label>
        <textarea
          value={formData.schema || ''}
          onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={10}
          placeholder={`{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number" }\n  },\n  "required": ["name"]\n}`}
        />
      </div>
    </div>
  );

  const renderVariableFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Variable Name</label>
        <input
          type="text"
          value={formData.variableName || ''}
          onChange={(e) => setFormData({ ...formData, variableName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="myVariable"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
        <textarea
          value={formData.value || ''}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
          placeholder="{{input.data}} or static value"
        />
      </div>
    </div>
  );

  const renderGenericFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
        <textarea
          value={JSON.stringify(formData, null, 2)}
          onChange={(e) => {
            try {
              setFormData(JSON.parse(e.target.value));
            } catch (err) {
              // Invalid JSON, ignore
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={10}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Action</h2>
            <p className="text-sm text-gray-600 mt-1">{node.data.label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="calls">
                Calls {incomingCalls.length > 0 && `(${incomingCalls.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="configuration" className="mt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Node Label</label>
                <input
                  type="text"
                  value={formData.nodeLabel || node.data.label}
                  onChange={(e) => setFormData({ ...formData, nodeLabel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Custom label for this node"
                />
              </div>

              {renderFieldsByActionType()}
            </TabsContent>

            <TabsContent value="calls" className="mt-4">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  Actions that call this node:
                </div>

                {incomingCalls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No incoming connections</p>
                    <p className="text-xs mt-1">This action is not being called by any other actions</p>
                  </div>
                ) : (
                  incomingCalls.map((call) => (
                    <div
                      key={call.edgeId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${call.sourceNode?.data?.color || '#6366f1'}20` }}
                        >
                          <div className="w-4 h-4" style={{ color: call.sourceNode?.data?.color || '#6366f1' }}>●</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {call.sourceNode?.data?.label || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2">
                            <span>{call.sourceNode?.type === 'start' ? 'Start Node' : call.sourceNode?.data?.category}</span>
                            {call.label && (
                              <>
                                <ArrowRight className="w-3 h-3" />
                                <span className="font-medium text-blue-600">{call.label}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {onDeleteEdge && (
                        <button
                          onClick={() => {
                            if (confirm('Delete this connection?')) {
                              onDeleteEdge(call.edgeId);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete connection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button onClick={onClose} className="bg-gray-200 hover:bg-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Conditional Editor Modal */}
      {showConditionalEditor && (
        <ConditionalEditor
          title="Configure Conditions"
          initialConditions={formData.conditions || []}
          onConfirm={(conditions: ConditionalGroup[]) => {
            setFormData({ ...formData, conditions });
            setShowConditionalEditor(false);
          }}
          onCancel={() => setShowConditionalEditor(false)}
        />
      )}
    </div>
  );
};

