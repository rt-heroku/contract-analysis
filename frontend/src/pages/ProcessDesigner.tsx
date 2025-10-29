import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Play, Save, Download, ArrowLeft, Search, Plus } from 'lucide-react';
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

const ProcessDesignerInner: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [processName, setProcessName] = useState('Untitled Process');
  const [processDescription, setProcessDescription] = useState('');
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showActionSearch, setShowActionSearch] = useState(false);
  const [actionSearchQuery, setActionSearchQuery] = useState('');
  const [targetNodeForPlus, setTargetNodeForPlus] = useState<string | null>(null);
  
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

  // Helper to check if a node supports multiple connections (control flow actions)
  const isMultiBranchAction = useCallback((node: Node): boolean => {
    if (node.type !== 'actionNode') return false;
    
    const actionName = node.data?.actionName?.toLowerCase() || '';
    const multiBranchActions = [
      'if_then_else',
      'switch_case',
      'for_each',
      'while_loop',
      'do_loop',
      'parallel',
      'try_catch',
    ];
    
    return multiBranchActions.some(name => actionName.includes(name));
  }, []);

  // Helper to get max branches allowed for a node
  const getMaxBranches = useCallback((node: Node): number => {
    if (node.type !== 'actionNode') return 1;
    
    const actionName = node.data?.actionName?.toLowerCase() || '';
    
    // IF THEN ELSE: exactly 2 branches (if + else)
    if (actionName.includes('if_then_else')) return 2;
    
    // Switch Case: unlimited branches (-1)
    if (actionName.includes('switch_case')) return -1;
    
    // Other multi-branch actions: unlimited
    if (isMultiBranchAction(node)) return -1;
    
    // Regular actions: single connection
    return 1;
  }, [isMultiBranchAction]);

  // Helper to count outgoing connections from a node
  const getOutgoingConnectionCount = useCallback((nodeId: string): number => {
    return edges.filter(edge => edge.source === nodeId).length;
  }, [edges]);

  // Helper to check if a node has outgoing connections
  const hasOutgoingConnection = useCallback((nodeId: string): boolean => {
    return edges.some(edge => edge.source === nodeId);
  }, [edges]);

  // Helper to determine if plus button should be shown
  const shouldShowPlusButton = useCallback((node: Node): boolean => {
    const maxBranches = getMaxBranches(node);
    const currentConnections = getOutgoingConnectionCount(node.id);
    
    // If max branches is -1 (unlimited), always show plus button
    if (maxBranches === -1) return true;
    
    // If max branches is > 1 (multi-branch), show plus until limit reached
    if (maxBranches > 1) {
      return currentConnections < maxBranches;
    }
    
    // For single-branch actions (maxBranches === 1), only show if not connected
    return !hasOutgoingConnection(node.id);
  }, [getMaxBranches, getOutgoingConnectionCount, hasOutgoingConnection]);

  useEffect(() => {
    loadActions();
    if (id) {
      loadProcess();
    } else {
      // Initialize with a start node if creating new process
      if (nodes.length === 0) {
        const startNode: Node = {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 100 },
          data: {
            showPlusButton: true,
            onAddNext: () => {
              setTargetNodeForPlus('start-1');
              setShowActionSearch(true);
            },
          },
        };
        setNodes([startNode]);
      }
    }
  }, [id]);

  // Update nodes with showPlusButton flag based on connections
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          showPlusButton: shouldShowPlusButton(node),
        },
      }))
    );
  }, [edges, shouldShowPlusButton]);

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
        // Re-wire onEdit and onAddNext callbacks when loading nodes
        const nodesWithCallbacks = process.flowDefinition.nodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onEdit: node.type === 'actionNode' ? () => handleEditNode(node.id) : undefined,
            onAddNext: (node.type === 'actionNode' || node.type === 'start') ? () => {
              setTargetNodeForPlus(node.id);
              setShowActionSearch(true);
            } : undefined,
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

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const action: Action = JSON.parse(actionData);
      
      // Use project to convert screen coordinates to flow coordinates
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeId = `node-${Date.now()}`;

      // Handle Start node - only allow one
      if (action.actionType === 'start' || action.name === 'start_node') {
        const hasStartNode = nodes.some(node => node.type === 'start');
        if (hasStartNode) {
          setAlertDialog({
            isOpen: true,
            title: 'Start Node Already Exists',
            message: 'Only one start node is allowed per process. Please use the existing start node.',
            type: 'warning',
          });
          return;
        }

        const newNode: Node = {
          id: nodeId,
          type: 'start',
          position,
          data: {
            showPlusButton: true, // Will be updated by effect
            onAddNext: () => {
              setTargetNodeForPlus(nodeId);
              setShowActionSearch(true);
            },
          },
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
          showPlusButton: true, // Will be updated by effect
          onEdit: () => handleEditNode(nodeId),
          onAddNext: () => {
            setTargetNodeForPlus(nodeId);
            setShowActionSearch(true);
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [handleEditNode, project, nodes]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Remove onEdit and onAddNext callbacks before saving (they're functions and can't be serialized)
      const nodesToSave = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: undefined,
          onAddNext: undefined,
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
        <div className="flex-1" ref={reactFlowWrapper}>
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Empty Process Canvas</h3>
                <p className="text-gray-500 mb-4">Add a start node to begin building your process</p>
                <Button
                  onClick={() => {
                    const startNode: Node = {
                      id: 'start-1',
                      type: 'start',
                      position: { x: 250, y: 100 },
                      data: {
                        showPlusButton: true, // Will be updated by effect
                        onAddNext: () => {
                          setTargetNodeForPlus('start-1');
                          setShowActionSearch(true);
                        },
                      },
                    };
                    setNodes([startNode]);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Start Node
                </Button>
              </div>
            </div>
          ) : (
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
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
              <Background 
                variant={BackgroundVariant.Lines} 
                gap={20} 
                size={1} 
                color="#e5e7eb"
                style={{ backgroundColor: '#f9fafb' }}
              />
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
          )}
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
                  showPlusButton: true, // Will be updated by effect
                  onEdit: node.type === 'actionNode' ? () => handleEditNode(newNodeId) : undefined,
                  onAddNext: (node.type === 'actionNode' || node.type === 'start') ? () => {
                    setTargetNodeForPlus(newNodeId);
                    setShowActionSearch(true);
                  } : undefined,
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

      {/* Action Search Modal */}
      {showActionSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Select Action</h3>
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={actionSearchQuery}
                  onChange={(e) => setActionSearchQuery(e.target.value)}
                  placeholder="Search actions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {actions
                  .filter(action => 
                    action.displayName.toLowerCase().includes(actionSearchQuery.toLowerCase()) ||
                    action.description?.toLowerCase().includes(actionSearchQuery.toLowerCase())
                  )
                  .map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        const nodeId = `node-${Date.now()}`;
                        const targetNode = nodes.find(n => n.id === targetNodeForPlus);
                        const position = targetNode 
                          ? { x: targetNode.position.x, y: targetNode.position.y + 120 }
                          : { x: 250, y: 200 };

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
                            showPlusButton: true, // Will be updated by effect
                            onEdit: () => handleEditNode(nodeId),
                            onAddNext: () => {
                              setTargetNodeForPlus(nodeId);
                              setShowActionSearch(true);
                            },
                          },
                        };

                        setNodes((nds) => nds.concat(newNode));

                        // Auto-connect if there's a target node
                        if (targetNodeForPlus) {
                          setEdges((eds) => addEdge({
                            id: `edge-${Date.now()}`,
                            source: targetNodeForPlus,
                            target: nodeId,
                            markerEnd: { type: MarkerType.ArrowClosed },
                            style: { stroke: '#64748b', strokeWidth: 2 },
                          }, eds));
                        }

                        setShowActionSearch(false);
                        setActionSearchQuery('');
                        setTargetNodeForPlus(null);
                      }}
                      className="w-full flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${action.color}20` }}
                      >
                        <div className="w-5 h-5" style={{ color: action.color }}>●</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{action.displayName}</h4>
                        <p className="text-sm text-gray-500 truncate">{action.description}</p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {action.category}
                          </span>
                          {action.actionType && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                              {action.actionType}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button
                onClick={() => {
                  setShowActionSearch(false);
                  setActionSearchQuery('');
                  setTargetNodeForPlus(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const ProcessDesigner: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ProcessDesignerInner />
    </ReactFlowProvider>
  );
};
