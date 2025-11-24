import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { Node } from 'reactflow';

interface FloatingPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: Node | null;
  processName: string;
  onEditNode: (node: Node) => void;
  onSaveNodeConfig?: (nodeId: string, config: any) => void;
  renderConfigurationForm?: (node: Node) => React.ReactNode;
}

export const FloatingPropertiesPanel: React.FC<FloatingPropertiesPanelProps> = ({
  isOpen,
  onClose,
  selectedNode,
  processName,
  renderConfigurationForm,
}) => {
  const [activeTab, setActiveTab] = useState<'configuration' | 'details'>('configuration');
  
  if (!isOpen) return null;

  // Show tabs for all nodes that have configuration
  const hasConfiguration = selectedNode && renderConfigurationForm;
  const showTabs = hasConfiguration;

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
            {/* Configuration Tab - Render the actual configuration form */}
            {hasConfiguration && activeTab === 'configuration' && renderConfigurationForm && (
              <div className="space-y-4">
                {renderConfigurationForm(selectedNode)}
              </div>
            )}

            {/* Details Tab or default view when no configuration */}
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

