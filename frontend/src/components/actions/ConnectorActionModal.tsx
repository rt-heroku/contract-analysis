import React from 'react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { X, ExternalLink, Code } from 'lucide-react';

interface ConnectorActionModalProps {
  isOpen: boolean;
  action: any;
  onClose: () => void;
}

export const ConnectorActionModal: React.FC<ConnectorActionModalProps> = ({ isOpen, action, onClose }) => {
  if (!isOpen || !action) return null;

  const executorConfig = action?.executorConfig || {};
  const parameters = executorConfig?.parameters || {};
  const requestBody = executorConfig?.requestBody;
  const responses = action?.outputSchema?.properties || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${action?.color || '#3B82F6'}20` }}
            >
              <Code className="w-6 h-6" style={{ color: action?.color || '#3B82F6' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{action?.displayName || 'Connector Action'}</h2>
              <p className="text-sm text-gray-500">{action?.description || 'No description available'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connector</label>
              <div className="flex items-center space-x-2">
                {action?.connector ? (
                  <>
                    <Badge variant="success">{action.connector.name}</Badge>
                    <span className="text-sm text-gray-500">({action.connector.connectorType})</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">No connector</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Badge variant="default">{action?.category || 'Uncategorized'}</Badge>
            </div>
          </div>

          {/* HTTP Method & Path */}
          {executorConfig.method && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="font-mono font-bold">
                  <Badge 
                    variant={executorConfig.method === 'GET' ? 'success' : 
                            executorConfig.method === 'POST' ? 'default' : 
                            executorConfig.method === 'PUT' ? 'warning' : 
                            executorConfig.method === 'DELETE' ? 'error' : 'default'}
                  >
                    {executorConfig.method}
                  </Badge>
                </div>
                <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-300 font-mono">
                  {executorConfig.path || '/'}
                </code>
              </div>
            </div>
          )}

          {/* Operation ID */}
          {action?.connectorOperation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operation ID</label>
              <code className="text-sm bg-gray-100 px-3 py-2 rounded border border-gray-300 font-mono block">
                {action.connectorOperation}
              </code>
            </div>
          )}

          {/* Parameters */}
          {Object.keys(parameters).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Parameters</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(parameters)
                      .filter(([_, param]) => param !== null && param !== undefined)
                      .map(([name, param]: [string, any]) => (
                        <tr key={name}>
                          <td className="px-4 py-2 font-mono text-sm text-gray-900">{name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            <Badge variant="default">{param?.type || param?.schema?.type || 'any'}</Badge>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {param?.required ? (
                              <Badge variant="error">Required</Badge>
                            ) : (
                              <span className="text-gray-400">Optional</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{param?.description || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {requestBody && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Body</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(requestBody, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Response Schema */}
          {Object.keys(responses).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Schema</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(responses, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Configuration Schema */}
          {action?.configSchema && Object.keys(action.configSchema?.properties || {}).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration Schema</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(action.configSchema, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Action Type:</span>{' '}
                <span className="font-medium text-gray-900">{action?.actionType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Executor Type:</span>{' '}
                <span className="font-medium text-gray-900">{action?.executorType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                {action?.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Inactive</Badge>
                )}
              </div>
              {action?.connector && (
                <div>
                  <span className="text-gray-500">Connector ID:</span>{' '}
                  <span className="font-mono text-sm text-gray-900">{action.connectorId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-medium">Read-Only:</span> This action was auto-generated from an OpenAPI specification
          </div>
          <div className="flex space-x-2">
            {action?.connector && (
              <Button
                variant="outline"
                onClick={() => window.location.href = `/connectors`}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Connector</span>
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

