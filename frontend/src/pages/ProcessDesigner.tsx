import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  MarkerType,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Play, Save, Download, ArrowLeft } from 'lucide-react';
import { ActionNode } from '@/components/process-designer/ActionNode';
import { StartNode } from '@/components/process-designer/StartEndNodes';
import { CollapsibleActionPalette } from '@/components/process-designer/CollapsibleActionPalette';
import { NodeContextMenu } from '@/components/process-designer/NodeContextMenu';
import { NodeEditModal } from '@/components/process-designer/NodeEditModal';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType?: 'system' | 'user_defined' | 'connector' | 'start' | 'end';
}

export const ProcessDesigner: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [processName, setProcessName] = useState('Untitled Process');
  const [processDescription, setProcessDescription] = useState('');
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Define custom node types (including Start/End)
  const nodeTypes: NodeTypes = useMemo(() => ({
    actionNode: ActionNode,
    start: StartNode,
  }), []);

  useEffect(() => {
    loadActions();
    if (id) {
      loadProcess();
    }
  }, [id]);

  const loadActions = async () => {
    try {
      const response = await api.get('/actions');
      setActions(response.data.actions || []);
    } catch (error: any) {
      console.error('Error loading actions:', error);
    }
  };

  const loadProcess = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/processes/${id}`);
      const process = response.data.process;
      
      setProcessName(process.name);
      setProcessDescription(process.description || '');
      
      if (process.flowDefinition?.nodes) {
        // Re-wire onEdit callbacks when loading nodes
        const nodesWithCallbacks = process.flowDefinition.nodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onEdit: node.type === 'actionNode' ? () => handleEditNode(node.id) : undefined,
          },
        }));
        setNodes(nodesWithCallbacks);
      }
      if (process.flowDefinition?.edges) {
        setEdges(process.flowDefinition.edges);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load process',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle node editing
  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      setEditModalOpen(true);
    }
  }, [nodes]);

  // Handle context menu
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#64748b', strokeWidth: 2 },
    }, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const actionData = event.dataTransfer.getData('application/json');
      if (!actionData) return;

      const action: Action = JSON.parse(actionData);
      const position = {
        x: event.clientX - 250,
        y: event.clientY - 150,
      };

      const nodeId = `node-${Date.now()}`;

      // Handle Start node
      if (action.actionType === 'start' || action.name === 'start_node') {
        const newNode: Node = {
          id: nodeId,
          type: 'start',
          position,
          data: {},
        };
        setNodes((nds) => nds.concat(newNode));
        return;
      }

      // Handle End node
      if (action.actionType === 'end' || action.name === 'end_node') {
        const newNode: Node = {
          id: nodeId,
          type: 'end',
          position,
          data: {},
        };
        setNodes((nds) => nds.concat(newNode));
        return;
      }

      // Handle regular action nodes
      const newNode: Node = {
        id: nodeId,
        type: 'actionNode',
        position,
        data: {
          label: action.displayName,
          description: action.description,
          category: action.category,
          icon: action.icon,
          color: action.color,
          actionType: action.actionType,
          actionId: action.id,
          actionName: action.name,
          config: {},
          onEdit: () => handleEditNode(nodeId), // Wire up edit callback
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [handleEditNode]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Remove onEdit callbacks before saving (they're functions and can't be serialized)
      const nodesToSave = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: undefined,
        },
      }));

      const processData = {
        name: processName,
        description: processDescription,
        flowDefinition: {
          nodes: nodesToSave,
          edges,
          executionMode: 'sequential',
        },
      };

      if (id) {
        await api.put(`/processes/${id}`, processData);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Process updated successfully',
          type: 'success',
        });
      } else {
        const response = await api.post('/processes', processData);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Process created successfully',
          type: 'success',
        });
        navigate(`/process-designer/${response.data.process.id}`);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save process',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!id) {
      setAlertDialog({
        isOpen: true,
        title: 'Warning',
        message: 'Please save the process before executing',
        type: 'warning',
      });
      return;
    }

    try {
      const response = await api.post(`/processes/${id}/execute`, {});
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Process execution started. Execution ID: ${response.data.executionId}`,
        type: 'success',
      });
      
      setTimeout(() => navigate('/executions'), 2000);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to execute process',
        type: 'error',
      });
    }
  };

  const handleExport = () => {
    const exportData = {
      version: '1.0.0',
      metadata: {
        name: processName,
        description: processDescription,
        exportedAt: new Date().toISOString(),
      },
      flowDefinition: { nodes, edges },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${processName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading process...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/processes')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          
          <div>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              className="text-2xl font-bold border-none outline-none focus:ring-0 bg-transparent"
              placeholder="Process Name"
            />
            <input
              type="text"
              value={processDescription}
              onChange={(e) => setProcessDescription(e.target.value)}
              className="text-sm text-gray-600 border-none outline-none focus:ring-0 bg-transparent mt-1"
              placeholder="Add description..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </Button>
          <Button onClick={handleExecute} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white">
            <Play className="w-4 h-4" />
            <span>Run</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Collapsible Action Palette */}
        <div className="w-64">
          <CollapsibleActionPalette
            actions={actions}
            onDragStart={(event, action) => {
              event.dataTransfer.setData('application/json', JSON.stringify(action));
              event.dataTransfer.effectAllowed = 'move';
            }}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'start') return '#22c55e';
                if (node.type === 'end') return '#ef4444';
                return node.data?.color as string || '#3b82f6';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            handleEditNode(contextMenu.nodeId);
            setContextMenu(null);
          }}
          onDelete={() => {
            setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId));
            setContextMenu(null);
          }}
          onDuplicate={() => {
            const node = nodes.find((n) => n.id === contextMenu.nodeId);
            if (node) {
              const newNodeId = `node-${Date.now()}`;
              const newNode = {
                ...node,
                id: newNodeId,
                position: {
                  x: node.position.x + 50,
                  y: node.position.y + 50,
                },
                data: {
                  ...node.data,
                  onEdit: node.type === 'actionNode' ? () => handleEditNode(newNodeId) : undefined,
                },
              };
              setNodes((nds) => nds.concat(newNode));
            }
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Edit Modal */}
      <NodeEditModal
        isOpen={editModalOpen}
        node={selectedNode}
        allActions={actions}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedNode(null);
        }}
        onSave={(nodeId, newConfig, newOutputSchema, newInputSchema) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      config: newConfig,
                      outputSchema: newOutputSchema || n.data.outputSchema,
                      inputSchema: newInputSchema || n.data.inputSchema,
                      label: newConfig.nodeLabel || n.data.label,
                    },
                  }
                : n
            )
          );
          setEditModalOpen(false);
          setSelectedNode(null);
        }}
      />

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
