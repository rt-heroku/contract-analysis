import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Save, Upload, Download, Trash2 } from 'lucide-react';

interface SavedFlow {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  flowData: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

// Node types configuration
const nodeTypes = [
  { type: 'action', label: 'Action', color: '#3b82f6', icon: '⚡' },
  { type: 'prompt', label: 'Prompt', color: '#8b5cf6', icon: '💬' },
  { type: 'variable', label: 'Variable', color: '#10b981', icon: '📊' },
  { type: 'decision', label: 'Decision', color: '#f59e0b', icon: '❓' },
  { type: 'api', label: 'API Call', color: '#ef4444', icon: '🔗' },
  { type: 'transform', label: 'Transform', color: '#06b6d4', icon: '🔄' },
];

export const Flows: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [flowDescription, setFlowDescription] = useState('');
  const [flowCategory, setFlowCategory] = useState('');
  const [currentFlowId, setCurrentFlowId] = useState<number | undefined>();
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [showFlowList, setShowFlowList] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await api.get('/flow-editor');
      setSavedFlows(response.data.flows || []);
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (nodeType: string) => {
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      data: { 
        label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} Node`,
        nodeType: nodeType,
      },
      style: {
        background: nodeTypes.find(t => t.type === nodeType)?.color || '#64748b',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const clearFlow = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear Flow',
      message: 'Are you sure you want to clear the current flow? All unsaved changes will be lost.',
      type: 'warning',
      onConfirm: () => {
        setNodes([]);
        setEdges([]);
        setFlowName('Untitled Flow');
        setFlowDescription('');
        setFlowCategory('');
        setCurrentFlowId(undefined);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const saveFlow = async () => {
    try {
      setSaving(true);

      if (currentFlowId) {
        // Update existing flow
        await api.put(`/flow-editor/${currentFlowId}`, {
          name: flowName,
          description: flowDescription,
          category: flowCategory,
          flowData: JSON.stringify({ nodes, edges }),
        });
        setAlertDialog({
          isOpen: true,
          title: 'Flow Updated',
          message: 'Your flow has been updated successfully.',
          type: 'success',
        });
      } else {
        // Create new flow
        const response = await api.post('/flow-editor', {
          name: flowName,
          description: flowDescription,
          category: flowCategory,
          flowData: JSON.stringify({ nodes, edges }),
        });
        setCurrentFlowId(response.data.flow.id);
        setAlertDialog({
          isOpen: true,
          title: 'Flow Saved',
          message: 'Your flow has been saved successfully.',
          type: 'success',
        });
      }
      fetchFlows();
    } catch (error: any) {
      console.error('Failed to save flow:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save flow. Please try again.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const loadFlow = async (flow: SavedFlow) => {
    try {
      const flowData = JSON.parse(flow.flowData);
      setNodes(flowData.nodes || []);
      setEdges(flowData.edges || []);
      setFlowName(flow.name);
      setFlowDescription(flow.description || '');
      setFlowCategory(flow.category || '');
      setCurrentFlowId(flow.id);
      setShowFlowList(false);
    } catch (error) {
      console.error('Failed to load flow:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Load Failed',
        message: 'Failed to load flow. The flow data may be corrupted.',
        type: 'error',
      });
    }
  };

  const deleteFlow = (flowId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Flow',
      message: 'Are you sure you want to delete this flow? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          await api.delete(`/flow-editor/${flowId}`);
          fetchFlows();
          if (currentFlowId === flowId) {
            setNodes([]);
            setEdges([]);
            setFlowName('Untitled Flow');
            setFlowDescription('');
            setFlowCategory('');
            setCurrentFlowId(undefined);
          }
          setAlertDialog({
            isOpen: true,
            title: 'Flow Deleted',
            message: 'The flow has been successfully deleted.',
            type: 'success',
          });
        } catch (error) {
          console.error('Failed to delete flow:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Delete Failed',
            message: 'Failed to delete flow. Please try again.',
            type: 'error',
          });
        }
      },
    });
  };

  const exportFlow = () => {
    const flowData = {
      name: flowName,
      description: flowDescription,
      category: flowCategory,
      nodes,
      edges,
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${flowName.replace(/[^a-z0-9]/gi, '_')}_flow.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const flowData = JSON.parse(event.target.result);
          setNodes(flowData.nodes || []);
          setEdges(flowData.edges || []);
          setFlowName(flowData.name || 'Imported Flow');
          setFlowDescription(flowData.description || '');
          setFlowCategory(flowData.category || '');
          setCurrentFlowId(undefined);
          setAlertDialog({
            isOpen: true,
            title: 'Flow Imported',
            message: 'Your flow has been imported successfully.',
            type: 'success',
          });
        } catch (error) {
          console.error('Failed to import flow:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Import Failed',
            message: 'Invalid flow file. Please select a valid JSON file.',
            type: 'error',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <Input
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="max-w-xs font-semibold"
            placeholder="Flow Name"
          />
          <Input
            value={flowDescription}
            onChange={(e) => setFlowDescription(e.target.value)}
            className="max-w-md"
            placeholder="Description"
          />
          <Input
            value={flowCategory}
            onChange={(e) => setFlowCategory(e.target.value)}
            className="max-w-xs"
            placeholder="Category"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFlowList(!showFlowList)}
            variant="outline"
            size="sm"
          >
            My Flows ({savedFlows.length})
          </Button>
          <Button onClick={importFlow} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
          <Button onClick={exportFlow} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button onClick={clearFlow} variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button 
            onClick={saveFlow} 
            disabled={saving}
            className="bg-primary-600 hover:bg-primary-700"
            size="sm"
          >
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
          <h3 className="font-semibold text-gray-900 mb-3">Node Types</h3>
          <div className="space-y-2">
            {nodeTypes.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => addNode(nodeType.type)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-white transition-colors flex items-center gap-2"
                style={{ borderLeftWidth: '4px', borderLeftColor: nodeType.color }}
              >
                <span className="text-xl">{nodeType.icon}</span>
                <span className="text-sm font-medium text-gray-700">{nodeType.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">How to use:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Click nodes to add them</li>
              <li>• Drag to position</li>
              <li>• Connect by dragging from edges</li>
              <li>• Double-click to edit</li>
            </ul>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-md">
              <div className="text-xs text-gray-600">
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Saved Flows Sidebar */}
        {showFlowList && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Saved Flows</h3>
              <Button onClick={() => setShowFlowList(false)} variant="outline" size="sm">
                Close
              </Button>
            </div>
            <div className="space-y-2">
              {savedFlows.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No saved flows yet</p>
              ) : (
                savedFlows.map((flow) => (
                  <Card key={flow.id} className="p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900">{flow.name}</h4>
                        {flow.description && (
                          <p className="text-xs text-gray-600 mt-1">{flow.description}</p>
                        )}
                        {flow.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {flow.category}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Updated {new Date(flow.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button onClick={() => loadFlow(flow)} size="sm" variant="outline">
                          Load
                        </Button>
                        <Button 
                          onClick={() => deleteFlow(flow.id)} 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      {/* Alert Dialog */}
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
