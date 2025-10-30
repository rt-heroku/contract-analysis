import React, { useState } from 'react';
import { X, Settings, PlayCircle, AlertOctagon, Clock, Zap, Globe, Upload, User } from 'lucide-react';
import { Node } from 'reactflow';

interface FloatingPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: Node | null;
  processName: string;
  onEditNode: (node: Node) => void;
}

// Helper to get trigger icon
const getTriggerIcon = (triggerType?: string) => {
  switch (triggerType) {
    case 'schedule': return Clock;
    case 'event': return Zap;
    case 'api': return Globe;
    case 'file': return Upload;
    case 'manual': return User;
    default: return PlayCircle;
  }
};

// Helper to get trigger summary
const getTriggerSummary = (trigger?: any): string => {
  if (!trigger || trigger.type === 'none') {
    return 'No trigger configured';
  }

  switch (trigger.type) {
    case 'manual':
      return trigger.config?.executionType === 'menu' ? 'Manual trigger (Menu Access)' : 'Manual trigger (UI Form)';
    case 'schedule':
      if (trigger.config?.cronExpression) {
        return `Schedule: ${trigger.config.cronExpression}`;
      }
      if (trigger.config?.interval) {
        return `Every ${trigger.config.interval}`;
      }
      return 'Scheduled trigger';
    case 'event':
      return trigger.config?.eventType ? `Event: ${trigger.config.eventType}` : 'Event trigger';
    case 'api':
      return trigger.config?.method ? `${trigger.config.method} /process` : 'API endpoint';
    case 'file':
      return trigger.config?.path ? `Watch: ${trigger.config.path}` : 'File upload';
    default:
      return 'Trigger configured';
  }
};

export const FloatingPropertiesPanel: React.FC<FloatingPropertiesPanelProps> = ({
  isOpen,
  onClose,
  selectedNode,
  processName,
  onEditNode,
}) => {
  const [activeTab, setActiveTab] = useState<'configuration' | 'details'>('configuration');
  
  if (!isOpen) return null;

  // Determine if this is a special node that needs config view
  const isStartNode = selectedNode?.type === 'start';
  const isGlobalErrorNode = selectedNode?.type === 'globalError';
  const showTabs = isStartNode || isGlobalErrorNode;

  return (
    <div className="fixed right-0 top-0 h-full bg-white shadow-2xl w-80 flex flex-col z-40 border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Properties</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs (if applicable) */}
      {showTabs && selectedNode && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('configuration')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'configuration'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Details
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNode ? (
          <div className="space-y-4">
            {/* Configuration Tab for Start Node */}
            {isStartNode && activeTab === 'configuration' && (
              <>
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-3">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#22c55e' }}
                    >
                      {React.createElement(getTriggerIcon(selectedNode.data?.trigger?.type), {
                        className: 'w-8 h-8 text-white',
                      })}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Start Node</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Trigger Type
                  </label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      {selectedNode.data?.trigger?.type || 'None'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Trigger Summary
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {getTriggerSummary(selectedNode.data?.trigger)}
                    </p>
                  </div>
                </div>

                {selectedNode.data?.trigger?.config && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Configuration
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedNode.data.trigger.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onEditNode(selectedNode)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Configure Trigger
                </button>
              </>
            )}

            {/* Configuration Tab for Global Error Node */}
            {isGlobalErrorNode && activeTab === 'configuration' && (
              <>
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-3">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      <AlertOctagon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Global Error Handler</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Purpose
                  </label>
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-gray-700">
                      Catches unhandled errors from the entire process flow
                    </p>
                  </div>
                </div>

                {selectedNode.data?.config && Object.keys(selectedNode.data.config).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Configuration
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedNode.data.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onEditNode(selectedNode)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Configure Error Handler
                </button>
              </>
            )}

            {/* Details Tab or default view for other nodes */}
            {(!showTabs || activeTab === 'details') && (
              <>
                {/* Node Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Type
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedNode.data?.actionName || selectedNode.type || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Node Label/Name */}
                {selectedNode.data?.label && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Name
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedNode.data.label}
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedNode.data?.description && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Description
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600">
                        {selectedNode.data.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Node ID */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Node ID
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs font-mono text-gray-600 break-all">
                      {selectedNode.id}
                    </p>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500">X</p>
                      <p className="text-sm font-mono text-gray-900">
                        {Math.round(selectedNode.position.x)}
                      </p>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500">Y</p>
                      <p className="text-sm font-mono text-gray-900">
                        {Math.round(selectedNode.position.y)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Preview */}
                {selectedNode.data?.config && Object.keys(selectedNode.data.config).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Configuration
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedNode.data.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Edit Button */}
                {!isStartNode && !isGlobalErrorNode && (
                  <button
                    onClick={() => onEditNode(selectedNode)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Edit Configuration
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Selection
            </h3>
            <p className="text-sm text-gray-500">
              Select a node on the canvas to view and edit its properties
            </p>
          </div>
        )}
      </div>

      {/* Footer - Process Info */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <span className="font-medium">Process:</span> {processName}
        </div>
      </div>
    </div>
  );
};

