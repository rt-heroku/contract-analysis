import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { MarkdownMonacoEditor } from '@/components/common/MonacoEditor';

export interface ProcessProperties {
  // General
  name: string;
  processKey?: string;
  description?: string;
  version: string;
  tags: string[];
  category?: string;
  owner?: string;
  createdBy?: string;
  createdAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  status: 'draft' | 'published' | 'active' | 'deprecated' | 'archived';
  
  // Execution
  timeout?: number; // in seconds
  retryPolicy?: {
    maxRetries: number;
    retryInterval: number; // in seconds
    exponentialBackoff: boolean;
  };
  concurrency?: {
    maxConcurrent: number;
    queueBehavior: 'wait' | 'reject' | 'replace';
  };
  priority: 'high' | 'medium' | 'low';
  errorHandlingStrategy: 'continue' | 'stop' | 'custom';
  
  // Variables
  inputParameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  environmentVariables?: Record<string, string>;
  globalConstants?: Record<string, any>;
  outputVariables?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  
  // Security
  permissions?: {
    view: string[]; // user IDs or roles
    edit: string[];
    execute: string[];
    delete: string[];
  };
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  complianceTags?: string[];
  
  // Notifications
  notifications?: {
    onSuccess: boolean;
    onFailure: boolean;
    onApprovalNeeded: boolean;
    channels: string[];
    recipients: string[];
  };
  
  // Performance & Monitoring
  logging?: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  metricsEnabled?: boolean;
  performanceSLA?: {
    expectedDuration: number; // in seconds
    alertThreshold: number; // in seconds
  };
  
  // Documentation
  documentation?: string; // markdown
  changelog?: string;
  relatedProcesses?: string[];
  referenceUrls?: string[];
  
  // Deployment
  environment?: 'dev' | 'staging' | 'production';
  deploymentStatus?: string;
  
  // UI/Canvas
  backgroundPattern?: 'dots' | 'lines';
}

interface ProcessPropertiesModalProps {
  isOpen: boolean;
  properties: ProcessProperties;
  onClose: () => void;
  onSave: (properties: ProcessProperties) => void;
}

export const ProcessPropertiesModal: React.FC<ProcessPropertiesModalProps> = ({
  isOpen,
  properties,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'execution' | 'security' | 'notifications' | 'variables' | 'advanced' | 'documentation'>('general');
  const [formData, setFormData] = useState<ProcessProperties>(properties);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const updateField = (field: keyof ProcessProperties, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: keyof ProcessProperties, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter(t => t !== tag));
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Process Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Process Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter process name"
          required
        />
      </div>

      {/* Process Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Process Key
          <span className="text-gray-500 text-xs ml-2">(auto-generated, editable)</span>
        </label>
        <input
          type="text"
          value={formData.processKey || ''}
          onChange={(e) => updateField('processKey', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., order_processing_v1"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Describe what this process does"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.category || ''}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select category</option>
            <option value="general">General</option>
            <optgroup label="Business Functions">
              <option value="sales">Sales & Orders</option>
              <option value="finance">Finance</option>
              <option value="hr">Human Resources</option>
              <option value="operations">Operations</option>
              <option value="customer_service">Customer Service</option>
              <option value="marketing">Marketing</option>
              <option value="it">IT & Infrastructure</option>
            </optgroup>
            <optgroup label="Trigger Types">
              <option value="manual">Manual</option>
              <option value="ui_form">UI Form</option>
              <option value="api">API</option>
              <option value="schedule">Schedule</option>
              <option value="event">Event</option>
              <option value="webhook">Webhook</option>
              <option value="pubsub">Pub/Sub</option>
              <option value="stream">Stream</option>
              <option value="listener">Listener</option>
            </optgroup>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">⚪ Draft</option>
            <option value="published">🔵 Published</option>
            <option value="active">🟢 Active</option>
            <option value="deprecated">🟡 Deprecated</option>
            <option value="archived">⚫ Archived</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type a tag and press Enter"
        />
      </div>

      {/* Version & Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <div>
          <span className="font-medium">Version:</span> {formData.version}
        </div>
        <div>
          <span className="font-medium">Owner:</span> {formData.owner || 'Not set'}
        </div>
        <div>
          <span className="font-medium">Created:</span> {formData.createdAt || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Modified:</span> {formData.lastModifiedAt || 'N/A'}
        </div>
      </div>
    </div>
  );

  const renderExecutionTab = () => (
    <div className="space-y-6">
      {/* Timeout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timeout (seconds)
        </label>
        <input
          type="number"
          value={formData.timeout || 1800}
          onChange={(e) => updateField('timeout', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1800"
        />
        <p className="text-xs text-gray-500 mt-1">Maximum execution time (default: 30 minutes)</p>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={formData.priority}
          onChange={(e) => updateField('priority', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
      </div>

      {/* Retry Policy */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Retry Policy</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Retries
            </label>
            <input
              type="number"
              value={formData.retryPolicy?.maxRetries || 3}
              onChange={(e) => updateNestedField('retryPolicy', 'maxRetries', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retry Interval (seconds)
            </label>
            <input
              type="number"
              value={formData.retryPolicy?.retryInterval || 60}
              onChange={(e) => updateNestedField('retryPolicy', 'retryInterval', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
        </div>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.retryPolicy?.exponentialBackoff || false}
            onChange={(e) => updateNestedField('retryPolicy', 'exponentialBackoff', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enable Exponential Backoff</span>
        </label>
      </div>

      {/* Concurrency */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Concurrency</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Concurrent Executions
          </label>
          <input
            type="number"
            value={formData.concurrency?.maxConcurrent || 5}
            onChange={(e) => updateNestedField('concurrency', 'maxConcurrent', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Queue Behavior
          </label>
          <select
            value={formData.concurrency?.queueBehavior || 'wait'}
            onChange={(e) => updateNestedField('concurrency', 'queueBehavior', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="wait">Wait in queue</option>
            <option value="reject">Reject new requests</option>
            <option value="replace">Replace oldest</option>
          </select>
        </div>
      </div>

      {/* Error Handling Strategy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Error Handling Strategy
        </label>
        <select
          value={formData.errorHandlingStrategy}
          onChange={(e) => updateField('errorHandlingStrategy', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="stop">Stop on error</option>
          <option value="continue">Continue on error</option>
          <option value="custom">Custom error handler</option>
        </select>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Data Classification */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Classification
        </label>
        <select
          value={formData.dataClassification || 'internal'}
          onChange={(e) => updateField('dataClassification', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="public">🌐 Public</option>
          <option value="internal">🏢 Internal</option>
          <option value="confidential">🔒 Confidential</option>
          <option value="restricted">🚫 Restricted</option>
        </select>
      </div>

      {/* Compliance Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Compliance Tags
        </label>
        <div className="space-y-2">
          {['GDPR', 'HIPAA', 'SOC2', 'PCI-DSS', 'ISO27001'].map(tag => (
            <label key={tag} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.complianceTags?.includes(tag) || false}
                onChange={(e) => {
                  const current = formData.complianceTags || [];
                  if (e.target.checked) {
                    updateField('complianceTags', [...current, tag]);
                  } else {
                    updateField('complianceTags', current.filter(t => t !== tag));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Permissions */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Permissions</h4>
        <p className="text-xs text-gray-500">Configure who can access this process</p>
        
        {['view', 'edit', 'execute', 'delete'].map(permission => (
          <div key={permission}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              Who can {permission}
            </label>
            <input
              type="text"
              placeholder="Enter user IDs or roles (comma-separated)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* When to Notify */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Send Notifications
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.notifications?.onSuccess || false}
            onChange={(e) => updateNestedField('notifications', 'onSuccess', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">On successful completion</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.notifications?.onFailure || false}
            onChange={(e) => updateNestedField('notifications', 'onFailure', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">On failure</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.notifications?.onApprovalNeeded || false}
            onChange={(e) => updateNestedField('notifications', 'onApprovalNeeded', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">When approval is needed</span>
        </label>
      </div>

      {/* Notification Channels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification Channels
        </label>
        <div className="space-y-2">
          {['Email', 'Slack', 'Microsoft Teams', 'Webhook', 'SMS'].map(channel => (
            <label key={channel} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{channel}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipients
        </label>
        <textarea
          placeholder="Enter email addresses or user IDs (one per line)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
        />
      </div>
    </div>
  );

  const renderVariablesTab = () => (
    <div className="space-y-6">
      {/* Input Parameters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Input Parameters
          </label>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            + Add Parameter
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No input parameters defined yet
          </p>
        </div>
      </div>

      {/* Environment Variables */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Environment Variables
          </label>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            + Add Variable
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No environment variables defined yet
          </p>
        </div>
      </div>

      {/* Output Variables */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Output Variables
          </label>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            + Add Output
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No output variables defined yet
          </p>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* Logging */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Logging</h4>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.logging?.enabled || true}
            onChange={(e) => updateNestedField('logging', 'enabled', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enable logging</span>
        </label>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Log Level
          </label>
          <select
            value={formData.logging?.logLevel || 'info'}
            onChange={(e) => updateNestedField('logging', 'logLevel', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.metricsEnabled || true}
            onChange={(e) => updateField('metricsEnabled', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enable metrics collection</span>
        </label>
      </div>

      {/* Performance SLA */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Performance SLA</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.performanceSLA?.expectedDuration || 300}
              onChange={(e) => updateNestedField('performanceSLA', 'expectedDuration', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Threshold (seconds)
            </label>
            <input
              type="number"
              value={formData.performanceSLA?.alertThreshold || 600}
              onChange={(e) => updateNestedField('performanceSLA', 'alertThreshold', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Environment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deployment Environment
        </label>
        <select
          value={formData.environment || 'dev'}
          onChange={(e) => updateField('environment', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="dev">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>

      {/* Canvas Background Pattern */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Canvas Background Pattern
        </label>
        <select
          value={formData.backgroundPattern || 'dots'}
          onChange={(e) => updateField('backgroundPattern', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="dots">● Dots (Default)</option>
          <option value="lines">▦ Grid Lines</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Choose the background pattern for the process canvas</p>
      </div>
    </div>
  );

  const renderDocumentationTab = () => (
    <div className="space-y-6">
      {/* Process Documentation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Process Documentation
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <MarkdownMonacoEditor
            value={formData.documentation || ''}
            onChange={(value) => updateField('documentation', value || '')}
            height="400px"
            theme="light"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Supports Markdown formatting</p>
      </div>

      {/* Changelog */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Changelog
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <MarkdownMonacoEditor
            value={formData.changelog || ''}
            onChange={(value) => updateField('changelog', value || '')}
            height="200px"
            theme="light"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Version history and changes</p>
      </div>

      {/* Reference URLs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Reference Documentation URLs
          </label>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            + Add URL
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500 text-center">
            No reference URLs added yet
          </p>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'execution', label: 'Execution' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'variables', label: 'Variables' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'documentation', label: 'Documentation' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Process Properties</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure process settings and metadata
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'execution' && renderExecutionTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'variables' && renderVariablesTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
          {activeTab === 'documentation' && renderDocumentationTab()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

