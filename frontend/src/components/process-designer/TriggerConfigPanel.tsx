import { useState, useEffect } from 'react';
import { X, Clock, Zap, Globe, Upload, User, Save } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { TriggerConfig } from './StartNode';

interface TriggerConfigPanelProps {
  isOpen: boolean;
  currentConfig?: TriggerConfig;
  onClose: () => void;
  onSave: (config: TriggerConfig) => void;
}

export const TriggerConfigPanel = ({
  isOpen,
  currentConfig,
  onClose,
  onSave,
}: TriggerConfigPanelProps) => {
  const [triggerType, setTriggerType] = useState<TriggerConfig['type']>(
    currentConfig?.type || 'none'
  );
  const [config, setConfig] = useState<any>(currentConfig?.config || {});

  useEffect(() => {
    if (currentConfig) {
      setTriggerType(currentConfig.type);
      setConfig(currentConfig.config || {});
    }
  }, [currentConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      type: triggerType,
      config: triggerType === 'none' ? undefined : config,
    });
    onClose();
  };

  const renderTriggerTypeSelector = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Trigger Type</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setTriggerType('manual')}
          className={`
            flex items-center space-x-2 p-3 rounded-lg border-2 transition-all
            ${
              triggerType === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Manual</span>
        </button>

        <button
          onClick={() => setTriggerType('schedule')}
          className={`
            flex items-center space-x-2 p-3 rounded-lg border-2 transition-all
            ${
              triggerType === 'schedule'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            }
          `}
        >
          <Clock className="w-5 h-5 text-orange-600" />
          <span className="font-medium">Schedule</span>
        </button>

        <button
          onClick={() => setTriggerType('event')}
          className={`
            flex items-center space-x-2 p-3 rounded-lg border-2 transition-all
            ${
              triggerType === 'event'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }
          `}
        >
          <Zap className="w-5 h-5 text-purple-600" />
          <span className="font-medium">Event</span>
        </button>

        <button
          onClick={() => setTriggerType('api')}
          className={`
            flex items-center space-x-2 p-3 rounded-lg border-2 transition-all
            ${
              triggerType === 'api'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }
          `}
        >
          <Globe className="w-5 h-5 text-blue-600" />
          <span className="font-medium">API</span>
        </button>

        <button
          onClick={() => setTriggerType('file')}
          className={`
            flex items-center space-x-2 p-3 rounded-lg border-2 transition-all
            ${
              triggerType === 'file'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }
          `}
        >
          <Upload className="w-5 h-5 text-green-600" />
          <span className="font-medium">File</span>
        </button>
      </div>
    </div>
  );

  const renderManualConfig = () => {
    // Generate menu URL if access from menu is selected
    const processId = window.location.pathname.split('/').pop();
    const menuUrl = processId ? `${window.location.origin}/process/execute/${processId}` : '';
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Manual Trigger:</strong> Process can be started manually by clicking a button,
            submitting a form, or accessing from the menu.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Execution Type
          </label>
          <select
            value={config.executionType || 'button'}
            onChange={(e) => setConfig({ ...config, executionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="button">Button Only (no form)</option>
            <option value="file-upload">File Upload</option>
            <option value="text-input">Text Input</option>
            <option value="custom">Custom Form Fields</option>
            <option value="menu">Access from Menu</option>
          </select>
        </div>

        {config.executionType === 'menu' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Menu Execution URL
            </label>
            <input
              type="text"
              value={menuUrl}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              This URL will be accessible from the application menu. Copy it to add to your menu configuration.
            </p>
          </div>
        )}

        {config.executionType !== 'menu' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
            <input
              type="text"
              value={config.buttonLabel || 'Start Process'}
              onChange={(e) => setConfig({ ...config, buttonLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Start Process"
            />
          </div>
        )}
      </div>
    );
  };

  const renderScheduleConfig = () => (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>Schedule Trigger:</strong> Process runs automatically on a schedule.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
        <select
          value={config.scheduleType || 'cron'}
          onChange={(e) => setConfig({ ...config, scheduleType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="cron">Cron Expression</option>
          <option value="interval">Interval</option>
        </select>
      </div>

      {config.scheduleType === 'cron' || !config.scheduleType ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cron Expression
          </label>
          <input
            type="text"
            value={config.cronExpression || ''}
            onChange={(e) => setConfig({ ...config, cronExpression: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            placeholder="0 9 * * *"
          />
          <p className="text-xs text-gray-500 mt-1">
            Examples: <code>0 9 * * *</code> (daily at 9 AM), <code>0 */4 * * *</code> (every 4
            hours)
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={config.intervalValue || 1}
              onChange={(e) =>
                setConfig({ ...config, intervalValue: parseInt(e.target.value) })
              }
              className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              min="1"
            />
            <select
              value={config.intervalUnit || 'hours'}
              onChange={(e) => setConfig({ ...config, intervalUnit: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="enabled"
          checked={config.enabled !== false}
          onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="enabled" className="text-sm text-gray-700">
          Enabled
        </label>
      </div>
    </div>
  );

  const renderEventConfig = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-sm text-purple-800">
          <strong>Event Trigger:</strong> Process starts when a specific event occurs.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
        <select
          value={config.eventType || 'webhook'}
          onChange={(e) => setConfig({ ...config, eventType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="webhook">Webhook</option>
          <option value="message-queue">Message Queue</option>
          <option value="redis-pubsub">Redis Pub/Sub</option>
          <option value="custom">Custom Event</option>
        </select>
      </div>

      {config.eventType === 'webhook' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Webhook Path (Optional)
          </label>
          <input
            type="text"
            value={config.webhookPath || ''}
            onChange={(e) => setConfig({ ...config, webhookPath: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            placeholder="/webhook/process-name"
          />
        </div>
      )}

      {config.eventType === 'redis-pubsub' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
          <input
            type="text"
            value={config.channel || ''}
            onChange={(e) => setConfig({ ...config, channel: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="process-events"
          />
        </div>
      )}

      {config.eventType === 'message-queue' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Queue Name</label>
          <input
            type="text"
            value={config.queueName || ''}
            onChange={(e) => setConfig({ ...config, queueName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="process-queue"
          />
        </div>
      )}
    </div>
  );

  const renderApiConfig = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>API Trigger:</strong> Process can be started via HTTP API call.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
        <select
          value={config.method || 'POST'}
          onChange={(e) => setConfig({ ...config, method: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Path (Optional)
        </label>
        <input
          type="text"
          value={config.customPath || ''}
          onChange={(e) => setConfig({ ...config, customPath: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
          placeholder="/api/process/custom-name"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use default: <code>/api/process/execute/:id</code>
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="requireAuth"
          checked={config.requireAuth !== false}
          onChange={(e) => setConfig({ ...config, requireAuth: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="requireAuth" className="text-sm text-gray-700">
          Require Authentication
        </label>
      </div>
    </div>
  );

  const renderFileConfig = () => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>File Trigger:</strong> Process starts when a file is uploaded or detected.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Mode</label>
        <select
          value={config.mode || 'upload'}
          onChange={(e) => setConfig({ ...config, mode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="upload">File Upload (UI)</option>
          <option value="watch">Watch Directory</option>
          <option value="s3">S3 Bucket Event</option>
        </select>
      </div>

      {config.mode === 'watch' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Directory Path</label>
          <input
            type="text"
            value={config.path || ''}
            onChange={(e) => setConfig({ ...config, path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
            placeholder="/uploads/incoming"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File Pattern (Optional)
        </label>
        <input
          type="text"
          value={config.filePattern || ''}
          onChange={(e) => setConfig({ ...config, filePattern: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
          placeholder="*.pdf, *.xlsx"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to accept all files. Use wildcards like <code>*.pdf</code>
        </p>
      </div>
    </div>
  );

  const renderConfigForm = () => {
    switch (triggerType) {
      case 'manual':
        return renderManualConfig();
      case 'schedule':
        return renderScheduleConfig();
      case 'event':
        return renderEventConfig();
      case 'api':
        return renderApiConfig();
      case 'file':
        return renderFileConfig();
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Select a trigger type to configure</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configure Trigger</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose how this process will be initiated
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {renderTriggerTypeSelector()}
          {triggerType !== 'none' && (
            <div className="border-t border-gray-200 pt-6">{renderConfigForm()}</div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button onClick={onClose} className="bg-gray-200 hover:bg-gray-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Trigger</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

