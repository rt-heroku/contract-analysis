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
  EdgeTypes,
  ConnectionLineType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Play, Save, Download, ArrowLeft, Search, Plus, Settings, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { ActionNode } from '@/components/process-designer/ActionNode';
import { StartNode, TriggerConfig } from '@/components/process-designer/StartNode';
import { GlobalErrorNode } from '@/components/process-designer/GlobalErrorNode';
import { CollapsibleActionPalette } from '@/components/process-designer/CollapsibleActionPalette';
import { NodeContextMenu } from '@/components/process-designer/NodeContextMenu';
import { NodeEditModal } from '@/components/process-designer/NodeEditModal';
import { TriggerConfigPanel } from '@/components/process-designer/TriggerConfigPanel';
import { LabeledEdge } from '@/components/process-designer/LabeledEdge';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType?: 'system' | 'user_defined' | 'connector' | 'start' | 'end' | 'global_error';
}

const ProcessDesignerInner: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
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
  
  // Trigger config state
  const [triggerConfigOpen, setTriggerConfigOpen] = useState(false);
  const [currentTriggerConfig, setCurrentTriggerConfig] = useState<TriggerConfig>({
    type: 'none',
  });
  
  // Global error config state
  const [globalErrorConfigOpen, setGlobalErrorConfigOpen] = useState(false);
  const [currentGlobalErrorConfig, setCurrentGlobalErrorConfig] = useState<any>({
    logError: true,
    notifyOnError: false,
    continueOnError: false,
  });
  
  // Process properties modal state
  const [processPropertiesOpen, setProcessPropertiesOpen] = useState(false);
  
  // UI state for panels
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [selectedNodeForProps, setSelectedNodeForProps] = useState<Node | null>(null);
  
  // Zoom state
  const [currentZoom, setCurrentZoom] = useState(0.4);
  
  // Canvas context menu
  const [canvasContextMenu, setCanvasContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({ x: 0, y: 0, visible: false });
  
  // Get ReactFlow instance for zoom control
  const reactFlowInstance = useReactFlow();
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Define custom node types (including Start/GlobalError)
  const nodeTypes: NodeTypes = useMemo(() => ({
    actionNode: ActionNode,
    start: StartNode,
    globalError: GlobalErrorNode,
  }), []);

  const edgeTypes: EdgeTypes = useMemo(() => ({
    labeled: LabeledEdge,
  }), []);

  // Helper to check if a node supports multiple connections (control flow actions)
  const isMultiBranchAction = useCallback((node: Node): boolean => {
    if (node.type !== 'actionNode') return false;
    
    const actionName = node.data?.actionName?.toLowerCase() || '';
    const multiBranchActions = [
      'if_then_else',
      'switch_case',
      'try_catch_finally',
      'on_error',
      'for_each',
      'while_loop',
      'do_loop',
      'parallel',
      'retry',
    ];
    
    return multiBranchActions.some(name => actionName.includes(name));
  }, []);

    // Helper to get max branches allowed for a node
    const getMaxBranches = useCallback((node: Node): number => {
      if (node.type !== 'actionNode') return 1;
      
      const actionName = node.data?.actionName?.toLowerCase() || '';
      
      // IF THEN ELSE: exactly 2 branches (if + else)
      if (actionName.includes('if_then_else')) return 2;
      
      // Try Catch Finally: exactly 3 branches (try + catch + finally)
      if (actionName.includes('try_catch_finally')) return 3;
      
      // On Error: 2 branches (error + no-error)
      if (actionName.includes('on_error')) return 2;
      
      // Retry: 1 branch (action to retry)
      if (actionName.includes('retry')) return 1;
      
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
      // Initialize with a start node and global error node if creating new process
      if (nodes.length === 0) {
        const startNode: Node = {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 100 },
          data: {
            label: 'START',
            trigger: currentTriggerConfig,
            showPlusButton: true,
            onAddNext: () => {
              setTargetNodeForPlus('start-1');
              setShowActionSearch(true);
            },
            onConfigure: () => {
              setTriggerConfigOpen(true);
            },
          },
        };
        
        const globalErrorNode: Node = {
          id: 'global-error-1',
          type: 'globalError',
          position: { x: 550, y: 100 },
          data: {
            label: 'GLOBAL ERROR',
            config: currentGlobalErrorConfig,
            showPlusButton: true,
            onAddNext: () => {
              setTargetNodeForPlus('global-error-1');
              setShowActionSearch(true);
            },
            onConfigure: () => {
              setGlobalErrorConfigOpen(true);
            },
          },
        };
        
        setNodes([startNode, globalErrorNode]);
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
      
      // Load trigger config if exists
      if (process.flowDefinition?.triggerConfig) {
        setCurrentTriggerConfig(process.flowDefinition.triggerConfig);
      }
      
      if (process.flowDefinition?.nodes) {
        // Re-wire onEdit and onAddNext callbacks when loading nodes
        let nodesWithCallbacks = process.flowDefinition.nodes.map((node: Node) => ({
          ...node,
          data: {
            ...node.data,
            onEdit: node.type === 'actionNode' ? () => handleEditNode(node.id) : undefined,
            onAddNext: (node.type === 'actionNode' || node.type === 'start' || node.type === 'globalError') ? () => {
              setTargetNodeForPlus(node.id);
              setShowActionSearch(true);
            } : undefined,
            onConfigure: node.type === 'start' ? () => {
              setTriggerConfigOpen(true);
            } : node.type === 'globalError' ? () => {
              setGlobalErrorConfigOpen(true);
            } : undefined,
          },
        }));
        
        // Ensure Global Error node exists (for backward compatibility)
        const hasGlobalError = nodesWithCallbacks.some((n: Node) => n.type === 'globalError');
        if (!hasGlobalError) {
          const globalErrorNode: Node = {
            id: 'global-error-1',
            type: 'globalError',
            position: { x: 550, y: 100 },
            data: {
              label: 'GLOBAL ERROR',
              config: currentGlobalErrorConfig,
              showPlusButton: true,
              onAddNext: () => {
                setTargetNodeForPlus('global-error-1');
                setShowActionSearch(true);
              },
              onConfigure: () => {
                setGlobalErrorConfigOpen(true);
              },
            },
          };
          nodesWithCallbacks.push(globalErrorNode);
        }
        
        setNodes(nodesWithCallbacks);
      }
      if (process.flowDefinition?.edges) {
        // Ensure edges have correct type based on whether they have labels
        const edgesWithTypes = process.flowDefinition.edges.map((edge: any) => ({
          ...edge,
          type: edge.data?.label ? 'labeled' : (edge.type || 'default'),
        }));
        setEdges(edgesWithTypes);
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

    /**
     * Generate edge label based on source node type and connection index
     */
    const generateEdgeLabel = useCallback((sourceNode: Node | undefined, connectionIndex: number): string | undefined => {
      if (!sourceNode) return undefined;

      const actionName = sourceNode.data?.actionName?.toLowerCase() || '';

      // IF THEN ELSE: "if" for first connection, "else" for second
      if (actionName.includes('if_then_else')) {
        return connectionIndex === 0 ? 'if' : 'else';
      }

      // Try Catch Finally: "try", "catch", "finally"
      if (actionName.includes('try_catch_finally')) {
        const labels = ['try', 'catch', 'finally'];
        return labels[connectionIndex] || 'branch';
      }

      // On Error: nothing for first (green/no-error), "error" for second
      if (actionName.includes('on_error')) {
        return connectionIndex === 1 ? 'error' : undefined;
      }

      // Switch Case: "case N" or "default" for last
      if (actionName.includes('switch_case')) {
        return connectionIndex === 0 ? 'default' : `case ${connectionIndex}`;
      }

      // For Each: "item" for first, "after" for second
      if (actionName.includes('for_each')) {
        return connectionIndex === 0 ? 'item' : 'after';
      }

      // While Loop: "loop" for first, "after" for second
      if (actionName.includes('while')) {
        return connectionIndex === 0 ? 'loop' : 'after';
      }

      // No label for other actions
      return undefined;
    }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        // Find the source node
        const sourceNode = nodes.find(n => n.id === params.source);
        
        // Check if this is an error connection
        const isErrorConnection = params.sourceHandle === 'error';
        
        // Count existing connections from this source
        const existingConnections = eds.filter(e => e.source === params.source).length;
        
        // Generate label
        const label = generateEdgeLabel(sourceNode, existingConnections);

        return addEdge({
          ...params,
          type: label ? 'labeled' : 'default',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { 
            stroke: isErrorConnection ? '#ef4444' : '#64748b', 
            strokeWidth: 2,
            strokeDasharray: isErrorConnection ? '5,5' : 'none',
          },
          data: { 
            label: isErrorConnection ? 'error' : label,
            isError: isErrorConnection,
          },
        }, eds);
      });
    },
    [nodes, generateEdgeLabel]
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

      const action: Action = JSON.parse(actionData);
      
      // Use screenToFlowPosition to convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
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
            label: 'START',
            trigger: currentTriggerConfig,
            showPlusButton: true, // Will be updated by effect
            onAddNext: () => {
              setTargetNodeForPlus(nodeId);
              setShowActionSearch(true);
            },
            onConfigure: () => {
              setTriggerConfigOpen(true);
            },
          },
        };
        setNodes((nds) => nds.concat(newNode));
        return;
      }

      // Handle Global Error node - only allow one
      if (action.actionType === 'global_error' || action.name === 'global_error') {
        const hasGlobalError = nodes.some(node => node.type === 'globalError');
        if (hasGlobalError) {
          setAlertDialog({
            isOpen: true,
            title: 'Global Error Already Exists',
            message: 'Only one global error handler is allowed per process. Please use the existing one.',
            type: 'warning',
          });
          return;
        }

        const newNode: Node = {
          id: nodeId,
          type: 'globalError',
          position,
          data: {
            label: 'GLOBAL ERROR',
            config: currentGlobalErrorConfig,
            onConfigure: () => {
              setGlobalErrorConfigOpen(true);
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
    [handleEditNode, screenToFlowPosition, nodes]
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Remove onEdit, onAddNext, and onConfigure callbacks before saving (they're functions and can't be serialized)
      const nodesToSave = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: undefined,
          onAddNext: undefined,
          onConfigure: undefined,
        },
      }));

      const processData = {
        name: processName,
        description: processDescription,
        flowDefinition: {
          nodes: nodesToSave,
          edges,
          triggerConfig: currentTriggerConfig,
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
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
    // Use setTimeout to ensure zoom has been applied
    setTimeout(() => {
      setCurrentZoom(reactFlowInstance.getZoom());
    }, 50);
  }, [reactFlowInstance]);
  
  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
    // Use setTimeout to ensure zoom has been applied
    setTimeout(() => {
      setCurrentZoom(reactFlowInstance.getZoom());
    }, 50);
  }, [reactFlowInstance]);
  
  // Update zoom state when viewport changes
  const onMoveEnd = useCallback(() => {
    setCurrentZoom(reactFlowInstance.getZoom());
  }, [reactFlowInstance]);
  
  // Initialize zoom on mount and set to 70% - only once
  const hasSetInitialZoom = useRef(false);
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0 && !hasSetInitialZoom.current) {
      // Set zoom to 70% explicitly - only on first load
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 0.7 });
      setCurrentZoom(0.7);
      hasSetInitialZoom.current = true;
    }
  }, [reactFlowInstance, nodes.length]);
  
  // Handle node selection for right properties panel
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeForProps(node);
  }, []);
  
  // Handle canvas click to show process properties
  const onPaneClick = useCallback(() => {
    setSelectedNodeForProps(null); // Clear node selection
    if (rightPanelOpen) {
      // If right panel is open, show process properties there
      // For now, just clear the selected node
    }
  }, [rightPanelOpen]);
  
  // Handle node deletion (keyboard Delete key)
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    // Check if any node to delete is Global Error
    const hasGlobalError = nodesToDelete.some(node => node.type === 'globalError');
    
    if (hasGlobalError) {
      setAlertDialog({
        isOpen: true,
        title: 'Cannot Delete Global Error',
        message: 'The Global Error handler is required and cannot be deleted. It serves as a fallback for unhandled errors in your process.',
        type: 'warning',
      });
      
      // Filter out Global Error nodes from deletion
      const allowedDeletions = nodesToDelete.filter(node => node.type !== 'globalError');
      
      if (allowedDeletions.length > 0) {
        // Delete only the allowed nodes
        setNodes((nds) => nds.filter((n) => !allowedDeletions.some(d => d.id === n.id)));
        setEdges((eds) => eds.filter((e) => 
          !allowedDeletions.some(d => d.id === e.source || d.id === e.target)
        ));
      }
      
      return; // Prevent default deletion
    }
  }, []);
  
  // Canvas context menu handlers
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setCanvasContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true,
    });
  }, []);
  
  const closeCanvasContextMenu = useCallback(() => {
    setCanvasContextMenu({ x: 0, y: 0, visible: false });
  }, []);
  
  // Handle canvas context menu actions
  const handleCanvasMenuAction = (action: string) => {
    closeCanvasContextMenu();
    
    switch(action) {
      case 'add-action':
        setShowActionSearch(true);
        setTargetNodeForPlus(null);
        break;
      case 'refresh-metadata':
        console.log('Refresh metadata');
        break;
      case 'view-connectors':
        navigate('/connectors');
        break;
      case 'view-user-actions':
        navigate('/actions');
        break;
      case 'zoom-in':
        handleZoomIn();
        break;
      case 'zoom-out':
        handleZoomOut();
        break;
      case 'run':
        handleExecute();
        break;
      case 'save':
        handleSave();
        break;
      case 'validate':
        console.log('Validate process');
        break;
      case 'export':
        handleExport();
        break;
      case 'properties':
        setProcessPropertiesOpen(true);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading process...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
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

      <div className="flex-1 flex overflow-hidden" onClick={closeCanvasContextMenu}>
        {/* Left Panel - Collapsible Action Palette */}
        {!leftPanelCollapsed && (
          <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r shadow-sm">
            <CollapsibleActionPalette
              actions={actions}
              onDragStart={(event, action) => {
                event.dataTransfer.setData('application/json', JSON.stringify(action));
                event.dataTransfer.effectAllowed = 'move';
              }}
            />
          </div>
        )}
        
        {/* Left Panel Collapse Toggle */}
        <button
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="w-3 flex-shrink-0 bg-gray-100 hover:bg-gray-200 border-r border-gray-300 flex items-center justify-center transition-colors"
          title={leftPanelCollapsed ? 'Show actions panel' : 'Hide actions panel'}
        >
          {leftPanelCollapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>

        {/* Canvas - Fill remaining space */}
        <div className="flex-1 flex flex-col min-w-0" ref={reactFlowWrapper}>
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
                        label: 'START',
                        trigger: currentTriggerConfig,
                        showPlusButton: true, // Will be updated by effect
                        onAddNext: () => {
                          setTargetNodeForPlus('start-1');
                          setShowActionSearch(true);
                        },
                        onConfigure: () => {
                          setTriggerConfigOpen(true);
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
            <>
              {/* Controls Bar - Top of canvas */}
              <div className="bg-white border-b px-3 py-1.5 flex items-center justify-between shadow-sm z-10">
                <div className="text-sm text-gray-600">
                  {nodes.length} nodes, {edges.length} connections
                </div>
                <div className="text-xs text-gray-500">
                  Scroll to zoom • Drag to pan • Right-click for options
                </div>
              </div>

              {/* ReactFlow Canvas */}
              <div className="flex-1 w-full h-full">
                <ReactFlow
                  style={{ width: '100%', height: '100%' }}
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onNodeContextMenu={onNodeContextMenu}
                  onPaneContextMenu={onPaneContextMenu}
                  onNodesDelete={onNodesDelete}
                  onMoveEnd={onMoveEnd}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                  minZoom={0.1}
                  maxZoom={2}
                  connectionLineType={ConnectionLineType.Bezier}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                  panOnScroll={false}
                  zoomOnScroll={true}
                  panOnDrag={true}
                  selectNodesOnDrag={false}
                  deleteKeyCode="Delete"
                >
                  <Background 
                    variant={BackgroundVariant.Lines} 
                    gap={20} 
                    size={1} 
                    color="#e5e7eb"
                    style={{ backgroundColor: '#f9fafb' }}
                  />
                  {/* Controls positioned at top-left */}
                  <Controls 
                    position="top-left" 
                    className="bg-white shadow-lg rounded-lg border border-gray-200"
                  />
                  
                  {/* Process Properties Button - Next to Controls */}
                  <div className="absolute top-4 left-4" style={{ marginLeft: '52px' }}>
                    <button
                      onClick={() => setProcessPropertiesOpen(true)}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                      title="Process Properties"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Zoom Percentage Display */}
                  <div className="absolute top-4 left-4" style={{ marginLeft: '104px' }}>
                    <div className="bg-white shadow-lg rounded-lg border border-gray-200 px-3 py-2 flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {Math.round(currentZoom * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* MiniMap positioned at top-right */}
                  <MiniMap
                    position="top-right"
                    nodeColor={(node) => {
                      if (node.type === 'start') return '#22c55e';
                      if (node.type === 'end') return '#ef4444';
                      return node.data?.color as string || '#3b82f6';
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                    className="bg-white shadow-lg rounded-lg border border-gray-200"
                    style={{ width: 120, height: 80 }}
                    pannable={false}
                    zoomable={false}
                  />
                </ReactFlow>
              </div>
            </>
          )}
        </div>
        
        {/* Right Panel Collapse Toggle */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="w-3 flex-shrink-0 bg-gray-100 hover:bg-gray-200 border-l border-gray-300 flex items-center justify-center transition-colors"
          title={rightPanelOpen ? 'Hide properties panel' : 'Show properties panel'}
        >
          {rightPanelOpen ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>
        
        {/* Right Properties Panel */}
        {rightPanelOpen && (
          <div className="w-80 flex-shrink-0 bg-white border-l shadow-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
              <p className="text-xs text-gray-500 mt-1">Quick edit panel</p>
            </div>
            
            {selectedNodeForProps ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Node ID
                    </label>
                    <input
                      type="text"
                      value={selectedNodeForProps.id}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={selectedNodeForProps.data?.displayName || ''}
                      onChange={(e) => {
                        const updatedNode = {
                          ...selectedNodeForProps,
                          data: { ...selectedNodeForProps.data, displayName: e.target.value }
                        };
                        setSelectedNodeForProps(updatedNode);
                        setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      value={selectedNodeForProps.type || ''}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                    />
                  </div>
                  
                  <Button
                    onClick={() => {
                      setEditModalOpen(true);
                      setSelectedNode(selectedNodeForProps);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Open Full Editor
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium text-gray-900 mb-2">Process Properties</p>
                    <p className="text-xs">Configure the process settings</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Process Name
                    </label>
                    <input
                      type="text"
                      value={processName}
                      onChange={(e) => setProcessName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter process name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={processDescription}
                      onChange={(e) => setProcessDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Add description..."
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Statistics</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Nodes</p>
                        <p className="text-lg font-semibold text-gray-900">{nodes.length}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Connections</p>
                        <p className="text-lg font-semibold text-gray-900">{edges.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setProcessPropertiesOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                  >
                    Full Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
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
            const node = nodes.find((n) => n.id === contextMenu.nodeId);
            
            // Prevent deletion of Global Error nodes
            if (node?.type === 'globalError') {
              setAlertDialog({
                isOpen: true,
                title: 'Cannot Delete Global Error',
                message: 'The Global Error handler is required and cannot be deleted. It serves as a fallback for unhandled errors in your process.',
                type: 'warning',
              });
              setContextMenu(null);
              return;
            }
            
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
      
      {/* Canvas Context Menu */}
      {canvasContextMenu.visible && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[200px]"
          style={{
            left: `${canvasContextMenu.x}px`,
            top: `${canvasContextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
            Canvas Actions
          </div>
          
          <button
            onClick={() => handleCanvasMenuAction('add-action')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Action</span>
          </button>
          
          <button
            onClick={() => handleCanvasMenuAction('refresh-metadata')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Metadata</span>
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={() => handleCanvasMenuAction('view-connectors')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600"
          >
            View Connectors
          </button>
          
          <button
            onClick={() => handleCanvasMenuAction('view-user-actions')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600"
          >
            View User Actions
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={() => handleCanvasMenuAction('zoom-in')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center space-x-2"
          >
            <ZoomIn className="w-4 h-4" />
            <span>Zoom In</span>
          </button>
          
          <button
            onClick={() => handleCanvasMenuAction('zoom-out')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center space-x-2"
          >
            <ZoomOut className="w-4 h-4" />
            <span>Zoom Out</span>
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={() => handleCanvasMenuAction('run')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-gray-700 hover:text-green-600 flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
          
          <button
            onClick={() => handleCanvasMenuAction('save')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button
            onClick={() => handleCanvasMenuAction('validate')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600"
          >
            Validate
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={() => handleCanvasMenuAction('export')}
            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 hover:text-blue-600 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={() => handleCanvasMenuAction('properties')}
            disabled={rightPanelOpen}
            className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
              rightPanelOpen
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Properties</span>
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <NodeEditModal
        isOpen={editModalOpen}
        node={selectedNode}
        allActions={actions}
        nodes={nodes}
        edges={edges}
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
        onDeleteEdge={(edgeId) => {
          setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        }}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Trigger Configuration Panel */}
      <TriggerConfigPanel
        isOpen={triggerConfigOpen}
        currentConfig={currentTriggerConfig}
        onClose={() => setTriggerConfigOpen(false)}
        onSave={(config) => {
          setCurrentTriggerConfig(config);
          // Update all start nodes with new trigger config
          setNodes((nds) =>
            nds.map((node) =>
              node.type === 'start'
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      trigger: config,
                    },
                  }
                : node
            )
          );
          setTriggerConfigOpen(false);
        }}
      />

      {/* Global Error Configuration Modal */}
      {globalErrorConfigOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configure Global Error Handler</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Set how errors are handled across the entire process
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Global Error Handler:</strong> Catches all unhandled errors in the process.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="logError"
                  checked={currentGlobalErrorConfig.logError !== false}
                  onChange={(e) => setCurrentGlobalErrorConfig({ ...currentGlobalErrorConfig, logError: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="logError" className="text-sm text-gray-700">
                  Log errors to activity logs
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyOnError"
                  checked={currentGlobalErrorConfig.notifyOnError}
                  onChange={(e) => setCurrentGlobalErrorConfig({ ...currentGlobalErrorConfig, notifyOnError: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="notifyOnError" className="text-sm text-gray-700">
                  Send notification on error
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="continueOnError"
                  checked={currentGlobalErrorConfig.continueOnError}
                  onChange={(e) => setCurrentGlobalErrorConfig({ ...currentGlobalErrorConfig, continueOnError: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="continueOnError" className="text-sm text-gray-700">
                  Continue process after error (don't stop)
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button onClick={() => setGlobalErrorConfigOpen(false)} className="bg-gray-200 hover:bg-gray-300">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Update all global error nodes with new config
                  setNodes((nds) =>
                    nds.map((node) =>
                      node.type === 'globalError'
                        ? {
                            ...node,
                            data: {
                              ...node.data,
                              config: currentGlobalErrorConfig,
                            },
                          }
                        : node
                    )
                  );
                  setGlobalErrorConfigOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Process Properties Modal */}
      {processPropertiesOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Process Properties</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure process settings and metadata
                </p>
              </div>
              <button
                onClick={() => setProcessPropertiesOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Process Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Process Name *
                </label>
                <input
                  type="text"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter process name"
                />
              </div>

              {/* Process Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={processDescription}
                  onChange={(e) => setProcessDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a description for this process..."
                />
              </div>

              {/* Process Statistics (read-only) */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Process Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Total Nodes</div>
                    <div className="text-lg font-semibold text-gray-900">{nodes.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Total Connections</div>
                    <div className="text-lg font-semibold text-gray-900">{edges.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Trigger Type</div>
                    <div className="text-sm font-medium text-gray-900">
                      {currentTriggerConfig.type === 'none' ? 'Not configured' : 
                       currentTriggerConfig.type.charAt(0).toUpperCase() + currentTriggerConfig.type.slice(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="text-sm font-medium text-green-600">
                      {nodes.length > 0 ? 'Active' : 'Empty'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grid Settings
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show grid</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Snap to grid</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                onClick={() => setProcessPropertiesOpen(false)}
                className="bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setProcessPropertiesOpen(false);
                  // Properties are already updated via state binding
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

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
                          setEdges((eds) => {
                            // Find the source node
                            const sourceNode = nodes.find(n => n.id === targetNodeForPlus);
                            
                            // Count existing connections from this source
                            const existingConnections = eds.filter(e => e.source === targetNodeForPlus).length;
                            
                            // Generate label
                            const label = generateEdgeLabel(sourceNode, existingConnections);

                            return addEdge({
                              id: `edge-${Date.now()}`,
                              source: targetNodeForPlus,
                              target: nodeId,
                              type: label ? 'labeled' : 'default',
                              markerEnd: { type: MarkerType.ArrowClosed },
                              style: { stroke: '#64748b', strokeWidth: 2 },
                              data: { label },
                            }, eds);
                          });
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
