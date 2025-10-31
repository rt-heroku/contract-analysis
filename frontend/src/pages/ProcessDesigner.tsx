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
  useUpdateNodeInternals,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Play, Save, Download, Search, Plus, Settings, ZoomIn, ZoomOut, RefreshCw, ArrowLeftRight, ArrowUpDown, DatabaseZap, MousePointerSquareDashed, Variable, FileUp, Edit2 } from 'lucide-react';
import { ActionNode } from '@/components/process-designer/ActionNode';
import { StartNode, TriggerConfig } from '@/components/process-designer/StartNode';
import { GlobalErrorNode } from '@/components/process-designer/GlobalErrorNode';
import { IfThenElseNode } from '@/components/process-designer/IfThenElseNode';
import { LoopContainerNode } from '@/components/process-designer/LoopContainerNode';
import { BreakNode } from '@/components/process-designer/BreakNode';
import { ContinueNode } from '@/components/process-designer/ContinueNode';
import { LoopConditionModal } from '@/components/process-designer/LoopConditionModal';
import { ConditionalGroup } from '@/components/process-designer/ConditionalEditor';
import { FloatingActionsModal } from '@/components/process-designer/FloatingActionsModal';
import { FloatingPropertiesPanel } from '@/components/process-designer/FloatingPropertiesPanel';
import { NodeContextMenu } from '@/components/process-designer/NodeContextMenu';
import { NodeEditModal } from '@/components/process-designer/NodeEditModal';
import { TriggerConfigPanel } from '@/components/process-designer/TriggerConfigPanel';
import { LabeledEdge } from '@/components/process-designer/LabeledEdge';
import { ProcessPropertiesModal, ProcessProperties } from '@/components/process-designer/ProcessPropertiesModal';
import { SaveProcessModal } from '@/components/process-designer/SaveProcessModal';
import { VariablesPanel, ProcessVariable } from '@/components/process-designer/VariablesPanel';

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
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Layout Configuration - Node Positions
  const LAYOUT_CONFIG = {
    START_POSITION: { x: 250, y: 210 },
    GLOBAL_ERROR_VERTICAL: { x: 800, y: 210 },   // To the right of Start in vertical layout
    GLOBAL_ERROR_HORIZONTAL: { x: 250, y: 645 }, // Below Start in horizontal layout
  };
  
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Ref to hold current layout direction (needed for onNodesChange callback)
  const layoutDirectionRef = useRef<'horizontal' | 'vertical'>('vertical');
  const [processName, setProcessName] = useState('Untitled Process');
  const [processDescription, setProcessDescription] = useState('');
  const [editingProcessName, setEditingProcessName] = useState(false);
  
  // Comprehensive process properties
  const [processProperties, setProcessProperties] = useState<ProcessProperties>({
    name: 'Untitled Process',
    version: 'v1.0',
    tags: [],
    status: 'draft',
    priority: 'medium',
    errorHandlingStrategy: 'stop',
    timeout: 1800,
    retryPolicy: {
      maxRetries: 3,
      retryInterval: 60,
      exponentialBackoff: false,
    },
    concurrency: {
      maxConcurrent: 5,
      queueBehavior: 'wait',
    },
    logging: {
      enabled: true,
      logLevel: 'info',
    },
    metricsEnabled: true,
    performanceSLA: {
      expectedDuration: 300,
      alertThreshold: 600,
    },
    environment: 'dev',
    backgroundPattern: 'dots', // New: Canvas background pattern
  });
  
  // Background pattern state
  const [backgroundPattern, setBackgroundPattern] = useState<'dots' | 'lines'>('dots');
  
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
  
  // Loop condition config state
  const [loopConditionModalOpen, setLoopConditionModalOpen] = useState(false);
  const [currentLoopNodeId, setCurrentLoopNodeId] = useState<string | null>(null);
  const [currentLoopConditions, setCurrentLoopConditions] = useState<ConditionalGroup[]>([]);
  
  // Process properties modal state
  const [processPropertiesOpen, setProcessPropertiesOpen] = useState(false);
  
  // Save process modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalAction, setSaveModalAction] = useState<'save' | 'publish'>('save');
  
  // UI state for panels
  const [selectedNodeForProps, setSelectedNodeForProps] = useState<Node | null>(null);
  
  // Floating modals state
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  
  // Zoom state
  const [currentZoom, setCurrentZoom] = useState(0.4);
  
  // Multiselect mode state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Layout direction state
  const [layoutDirection, setLayoutDirection] = useState<'horizontal' | 'vertical'>('vertical');
  
  // Sync layoutDirection ref
  useEffect(() => {
    layoutDirectionRef.current = layoutDirection;
  }, [layoutDirection]);
  
  // Custom onNodesChange that prevents deletion of Start and Global Error nodes
  // and saves position changes to the current layout
  const onNodesChange = useCallback((changes: any[]) => {
    // Filter out removal changes for protected node types
    const filteredChanges = changes.filter(change => {
      if (change.type === 'remove') {
        const node = nodes.find(n => n.id === change.id);
        if (node && (node.type === 'start' || node.type === 'globalError')) {
          // Show warning once
          setAlertDialog({
            isOpen: true,
            title: `Cannot Delete ${node.type === 'start' ? 'Start' : 'Global Error'}`,
            message: `The ${node.type === 'start' ? 'Start node' : 'Global Error handler'} is required and cannot be deleted.`,
            type: 'warning',
          });
          return false; // Filter out this change
        }
      }
      return true; // Allow all other changes
    });
    
    // Apply the filtered changes
    onNodesChangeRaw(filteredChanges);
    
    // Save position changes to current layout property
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.position && change.dragging === false
    );
    
    if (positionChanges.length > 0) {
      const currentLayout = layoutDirectionRef.current;
      setNodes((currentNodes) => 
        currentNodes.map(node => {
          const posChange = positionChanges.find(c => c.id === node.id);
          if (posChange && posChange.position) {
            // Save to current layout property
            return {
              ...node,
              data: {
                ...node.data,
                ...(currentLayout === 'vertical' 
                  ? { verticalPosition: posChange.position }
                  : { horizontalPosition: posChange.position }
                ),
              },
            };
          }
          return node;
        })
      );
    }
  }, [nodes, onNodesChangeRaw]);
  
  // Variables panel state
  const [variablesPanelOpen, setVariablesPanelOpen] = useState(false);
  const [processVariables, setProcessVariables] = useState<ProcessVariable[]>([
    // System variables - always present
    {
      id: 'sys-payload',
      name: 'payload',
      type: 'any',
      value: null,
      description: 'Main data payload passed through the process',
      isSystem: true,
      readonly: false,
    },
    {
      id: 'sys-attributes',
      name: 'attributes',
      type: 'object',
      value: {},
      description: 'Request attributes (query params, path params, headers, session)',
      isSystem: true,
      readonly: false,
    },
    {
      id: 'sys-processProperties',
      name: 'processProperties',
      type: 'object',
      value: {},
      description: 'Process configuration and metadata',
      isSystem: true,
      readonly: true,
    },
    {
      id: 'sys-jobId',
      name: 'jobId',
      type: 'string',
      value: '',
      description: 'Unique identifier for this process execution',
      isSystem: true,
      readonly: true,
    },
    {
      id: 'sys-trigger',
      name: 'trigger',
      type: 'object',
      value: {},
      description: 'Information about how the process was triggered',
      isSystem: true,
      readonly: true,
    },
  ]);
  
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

  // Define custom node types (including Start/GlobalError/IfThenElse/LoopContainer)
  const nodeTypes: NodeTypes = useMemo(() => ({
    actionNode: ActionNode,
    start: StartNode,
    globalError: GlobalErrorNode,
    ifThenElse: IfThenElseNode,
    loopContainer: LoopContainerNode,
    break: BreakNode,
    continue: ContinueNode,
  }), []);

  const edgeTypes: EdgeTypes = useMemo(() => ({
    labeled: LabeledEdge,
  }), []);

  // Cycle detection: Check if adding an edge would create a cycle
  const wouldCreateCycle = useCallback((sourceId: string, targetId: string, currentEdges: typeof edges): boolean => {
    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    
    currentEdges.forEach(edge => {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    });
    
    // Add the new potential edge
    if (!adjacencyList.has(sourceId)) {
      adjacencyList.set(sourceId, []);
    }
    adjacencyList.get(sourceId)!.push(targetId);
    
    // DFS to detect cycle
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }
      
      recStack.delete(nodeId);
      return false;
    };
    
    // Check from source node
    return hasCycle(sourceId);
  }, []);

  // Validation function for connections
  const isValidConnection = useCallback((connection: Connection): boolean => {
    const { source, target, sourceHandle, targetHandle } = connection;
    
    if (!source || !target) return false;
    
    // Cannot connect to self
    if (source === target) {
      console.log('❌ Invalid: Cannot connect node to itself');
      return false;
    }
    
    // Get source and target nodes for exemption checks
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    
    if (!sourceNode || !targetNode) return false;
    
    // Allow loop-internal connections (loop-start -> actions -> loop-end)
    // These are not cycles, they're the intended loop structure
    const isLoopInternalConnection = 
      sourceHandle === 'loop-start' || 
      targetHandle === 'loop-end' || 
      sourceHandle === 'loop-end' ||
      targetHandle === 'loop-start';
    
    // Connections to Break/Continue are valid loop exits, not cycles
    const isBreakOrContinueTarget = 
      targetNode.type === 'break' || 
      targetNode.type === 'continue';
    
    if (isBreakOrContinueTarget) {
      console.log('✅ Allowing connection to Break/Continue (valid loop exit)');
    }
    
    // Prevent cycles (except for loop-internal connections and break/continue exits)
    if (!isLoopInternalConnection && !isBreakOrContinueTarget && wouldCreateCycle(source, target, edges)) {
      console.log('❌ Invalid: Would create a cycle');
      setAlertDialog({
        isOpen: true,
        title: 'Invalid Connection',
        message: 'This connection would create a cycle in your process flow. Cycles are not allowed.',
        type: 'warning',
      });
      return false;
    }
    
    // Start node can only connect from its main output (not error)
    if (sourceNode.type === 'start' && sourceHandle === 'error') {
      console.log('❌ Invalid: Start node error handle should not be used');
      return false;
    }
    
    // Global Error can only have one input
    if (targetNode.type === 'globalError') {
      const existingConnections = edges.filter(e => e.target === target);
      if (existingConnections.length > 0) {
        console.log('❌ Invalid: Global Error already has an input');
        return false;
      }
    }
    
    // Try Block error handle must connect to Catch Block
    if (sourceNode.data?.actionName === 'try_block' && sourceHandle === 'error') {
      if (targetNode.data?.actionName !== 'catch_block') {
        console.log('❌ Invalid: Try Block error must connect to Catch Block');
        setAlertDialog({
          isOpen: true,
          title: 'Invalid Connection',
          message: 'Try Block error output must connect to a Catch Block.',
          type: 'warning',
        });
        return false;
      }
    }
    
    // Catch Block must connect to Finally Block
    if (sourceNode.data?.actionName === 'catch_block') {
      if (targetNode.data?.actionName !== 'finally_block') {
        console.log('❌ Invalid: Catch Block must connect to Finally Block');
        setAlertDialog({
          isOpen: true,
          title: 'Invalid Connection',
          message: 'Catch Block must connect to a Finally Block.',
          type: 'warning',
        });
        return false;
      }
    }
    
    console.log('✅ Valid connection');
    return true;
  }, [nodes, edges, wouldCreateCycle]);

  // Auto-arrange layout using dagre
  // Helper function to arrange nodes without fitView
  const arrangeNodesLayout = useCallback((shouldFitView: boolean = false, direction?: 'horizontal' | 'vertical') => {
    const useDirection = direction || layoutDirection;
    
    console.log('🔧 arrangeNodesLayout called with dagre');
    console.log('  - useDirection:', useDirection);
    console.log('  - nodes.length:', nodes.length);
    console.log('  - edges.length:', edges.length);
    
    // Standard node dimensions for layout calculation
    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 120;
    
    // Create a new dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure graph layout direction and spacing
    dagreGraph.setGraph({
      rankdir: useDirection === 'horizontal' ? 'LR' : 'TB', // LR = Left-to-Right, TB = Top-to-Bottom
      nodesep: useDirection === 'horizontal' ? 100 : 80,     // Space between nodes on same rank
      ranksep: useDirection === 'horizontal' ? 180 : 120,    // Space between ranks
      edgesep: 50,                                            // Space between edges
      marginx: 20,                                            // Graph margin
      marginy: 20,
    });
    
    // Add nodes to dagre graph (exclude Start and Global Error - they stay fixed)
    nodes.forEach((node) => {
      if (node.type !== 'start' && node.type !== 'globalError') {
        dagreGraph.setNode(node.id, { 
          width: NODE_WIDTH, 
          height: NODE_HEIGHT 
        });
      }
    });
    
    // Add edges to dagre graph (only between non-fixed nodes)
    edges.forEach((edge) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      // Only add edge if neither endpoint is Start or Global Error
      if (sourceNode?.type !== 'start' && 
          sourceNode?.type !== 'globalError' &&
          targetNode?.type !== 'start' && 
          targetNode?.type !== 'globalError') {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    });
    
    // Run dagre layout algorithm
    dagre.layout(dagreGraph);
    
    // Calculate offset to position dagre layout relative to Start node
    const startOffsetX = useDirection === 'horizontal' 
      ? LAYOUT_CONFIG.START_POSITION.x + 300  // Position action nodes to the right of Start
      : LAYOUT_CONFIG.START_POSITION.x - 200; // Offset left to align with Start (compensate for dagre centering)
    const startOffsetY = useDirection === 'horizontal'
      ? LAYOUT_CONFIG.START_POSITION.y - (NODE_HEIGHT / 2)  // Align vertically with Start center
      : LAYOUT_CONFIG.START_POSITION.y + 300; // Position action nodes below Start with proper spacing
    
    // Update node positions with dagre calculated positions + layoutDirection
    // and save them to the appropriate layout property
    const newNodes = nodes.map((node) => {
      let newPosition = node.position;
      
      // Fixed position for Start node
      if (node.type === 'start') {
        newPosition = LAYOUT_CONFIG.START_POSITION;
        console.log(`  - ${node.id}: START (fixed) at position=(${newPosition.x}, ${newPosition.y})`);
      }
      // Fixed position for Global Error node
      else if (node.type === 'globalError') {
        newPosition = useDirection === 'vertical'
          ? LAYOUT_CONFIG.GLOBAL_ERROR_VERTICAL
          : LAYOUT_CONFIG.GLOBAL_ERROR_HORIZONTAL;
        console.log(`  - ${node.id}: GLOBAL ERROR (fixed) at position=(${newPosition.x}, ${newPosition.y})`);
      }
      // Dagre-calculated position for action nodes
      else {
        const dagreNode = dagreGraph.node(node.id);
        if (dagreNode) {
          // Dagre returns center coordinates, adjust to top-left corner
          const x = startOffsetX + dagreNode.x - (NODE_WIDTH / 2);
          const y = startOffsetY + dagreNode.y - (NODE_HEIGHT / 2);
          newPosition = { x: Math.round(x), y: Math.round(y) };
          console.log(`  - ${node.id}: DAGRE position=(${newPosition.x}, ${newPosition.y})`);
        } else {
          console.warn(`  - ${node.id}: NO DAGRE NODE, keeping position`);
        }
      }
      
      // Update node with new position, layoutDirection, and save to layout-specific property
      return {
        ...node,
        position: newPosition,
        data: {
          ...node.data,
          layoutDirection: useDirection,
          // Save calculated position to current layout property
          ...(useDirection === 'vertical' 
            ? { verticalPosition: newPosition }
            : { horizontalPosition: newPosition }
          ),
        },
      };
    });
    
    // Apply all node updates in a single synchronous operation
    setNodes(newNodes);
    
    // Force ReactFlow to recalculate handle positions and edge paths
    setTimeout(() => {
      // Update node internals to recalculate handle positions
      // This is critical for handles to switch between top/bottom and left/right
      newNodes.forEach(node => {
        updateNodeInternals(node.id);
      });
      
      console.log('  - 🔄 Updated handle positions for all nodes');
      
      // Trigger viewport update to force edge recalculation
      if (reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport();
        reactFlowInstance.setViewport({ ...viewport });
        
        console.log('  - ✅ Layout complete, edges recalculated');
      }
    }, 10);
    
    // Only fit view if explicitly requested
    if (shouldFitView) {
      setTimeout(() => {
        reactFlowInstance?.fitView({ padding: 0.2, duration: 400 });
        // Update zoom state after fitView
        setTimeout(() => {
          if (reactFlowInstance) {
            setCurrentZoom(reactFlowInstance.getZoom());
          }
        }, 450);
      }, 50);
    }
  }, [nodes, edges, layoutDirection, setNodes, reactFlowInstance, updateNodeInternals]);

  // Auto-arrange with fitView
  const autoArrange = useCallback(() => {
    arrangeNodesLayout(true);
  }, [arrangeNodesLayout]);

  // Toggle layout direction
  const toggleLayout = useCallback(() => {
    console.log('🔀 toggleLayout called');
    
    // Calculate new direction
    const newDirection = layoutDirection === 'horizontal' ? 'vertical' : 'horizontal';
    console.log('  - Switching from', layoutDirection, 'to', newDirection);
    
    // SAVE current positions before switching
    setNodes((currentNodes) => {
      const savedNodes = currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          // Save current position to the current layout property
          ...(layoutDirection === 'vertical' 
            ? { verticalPosition: node.position }
            : { horizontalPosition: node.position }
          ),
        },
      }));
      
      console.log('  - 💾 Saved', layoutDirection, 'positions');
      
      // Now try to RESTORE positions for the new layout
      const restoredNodes = savedNodes.map(node => {
        const savedPosition = newDirection === 'vertical' 
          ? node.data.verticalPosition 
          : node.data.horizontalPosition;
        
        if (savedPosition) {
          console.log('  - 📍 Restoring saved position for', node.id);
          return {
            ...node,
            position: savedPosition,
            data: {
              ...node.data,
              layoutDirection: newDirection,
            },
          };
        }
        
        // No saved position for this layout, keep current and will recalculate
        return {
          ...node,
          data: {
            ...node.data,
            layoutDirection: newDirection,
          },
        };
      });
      
      // Check if all nodes have saved positions for new layout
      const allHaveSavedPositions = restoredNodes.every(node => 
        newDirection === 'vertical' 
          ? node.data.verticalPosition 
          : node.data.horizontalPosition
      );
      
      if (allHaveSavedPositions) {
        console.log('  - ✅ All nodes restored from saved positions');
        // Force React Flow to update handle positions
        setTimeout(() => {
          restoredNodes.forEach(node => updateNodeInternals(node.id));
        }, 0);
        return restoredNodes;
      } else {
        console.log('  - ⚠️ Some nodes missing saved positions, will recalculate');
        return restoredNodes;
      }
    });
    
    // Update layout direction state
    setLayoutDirection(newDirection);
    
    // Only recalculate if nodes don't have saved positions for new layout
    setTimeout(() => {
      setNodes((currentNodes) => {
        const needsRecalc = currentNodes.some(node => 
          !(newDirection === 'vertical' 
            ? node.data.verticalPosition 
            : node.data.horizontalPosition)
        );
        
        if (needsRecalc) {
          console.log('  - 🔄 Recalculating layout');
          arrangeNodesLayout(false, newDirection);
        }
        
        return currentNodes;
      });
    }, 50);
    
    console.log('  - ✅ Layout toggled');
  }, [layoutDirection, arrangeNodesLayout, updateNodeInternals]);

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
        console.log('🔷 Initializing nodes with layoutDirection:', layoutDirection);
        
        const startNode: Node = {
          id: 'start-1',
          type: 'start',
          position: LAYOUT_CONFIG.START_POSITION,
          data: {
            label: 'START',
            trigger: currentTriggerConfig,
            showPlusButton: true,
            layoutDirection: layoutDirection,
            onAddNext: () => {
              setTargetNodeForPlus('start-1');
              setShowActionSearch(true);
            },
            onConfigure: () => {
              setTriggerConfigOpen(true);
            },
          },
        };
        
        const globalErrorPosition = layoutDirection === 'vertical' 
          ? LAYOUT_CONFIG.GLOBAL_ERROR_VERTICAL
          : LAYOUT_CONFIG.GLOBAL_ERROR_HORIZONTAL;
        
        console.log('🔷 Global Error position:', globalErrorPosition);
        
        const globalErrorNode: Node = {
          id: 'global-error-1',
          type: 'globalError',
          position: globalErrorPosition,
          data: {
            label: 'GLOBAL ERROR',
            config: currentGlobalErrorConfig,
            showPlusButton: true,
            layoutDirection: layoutDirection,
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
        let nodesWithCallbacks = process.flowDefinition.nodes.map((node: Node) => {
          // Fix positions for Start and Global Error nodes
          let fixedPosition = node.position;
          
          if (node.type === 'start') {
            fixedPosition = LAYOUT_CONFIG.START_POSITION;
            console.log('🔷 Fixed Start node position to', fixedPosition);
          } else if (node.type === 'globalError') {
            fixedPosition = layoutDirection === 'vertical' 
              ? LAYOUT_CONFIG.GLOBAL_ERROR_VERTICAL
              : LAYOUT_CONFIG.GLOBAL_ERROR_HORIZONTAL;
            console.log('🔷 Fixed Global Error position to', fixedPosition, 'for', layoutDirection);
          }
          
          // Build node data with appropriate callbacks based on type
          const baseData = {
            ...node.data,
            layoutDirection: layoutDirection, // Always set to current layout direction
          };
          
          // Add type-specific callbacks
          if (node.type === 'loopContainer') {
            baseData.onEdit = () => handleEditLoopCondition(node.id);
            baseData.onAddBreak = (position: { x: number; y: number }) => handleAddBreakToLoop(node.id, position);
            baseData.onAddContinue = (position: { x: number; y: number }) => handleAddContinueToLoop(node.id, position);
            baseData.onAddNext = () => {
              setTargetNodeForPlus(node.id);
              setShowActionSearch(true);
            };
          } else if (node.type === 'actionNode' || node.type === 'ifThenElse') {
            baseData.onEdit = () => handleEditNode(node.id);
            baseData.onAddNext = () => {
              setTargetNodeForPlus(node.id);
              setShowActionSearch(true);
            };
          } else if (node.type === 'start') {
            baseData.onAddNext = () => {
              setTargetNodeForPlus(node.id);
              setShowActionSearch(true);
            };
            baseData.onConfigure = () => {
              setTriggerConfigOpen(true);
            };
          } else if (node.type === 'globalError') {
            baseData.onAddNext = () => {
              setTargetNodeForPlus(node.id);
              setShowActionSearch(true);
            };
            baseData.onConfigure = () => {
              setGlobalErrorConfigOpen(true);
            };
          } else if (node.type === 'break' || node.type === 'continue') {
            baseData.onEdit = () => handleEditNode(node.id);
          }
          
          return {
            ...node,
            position: fixedPosition,
            data: baseData,
          };
        });
        
        // Ensure Global Error node exists (for backward compatibility)
        const hasGlobalError = nodesWithCallbacks.some((n: Node) => n.type === 'globalError');
        if (!hasGlobalError) {
          const globalErrorNode: Node = {
            id: 'global-error-1',
            type: 'globalError',
            position: layoutDirection === 'vertical' 
              ? LAYOUT_CONFIG.GLOBAL_ERROR_VERTICAL
              : LAYOUT_CONFIG.GLOBAL_ERROR_HORIZONTAL,
            data: {
              label: 'GLOBAL ERROR',
              config: currentGlobalErrorConfig,
              showPlusButton: true,
              layoutDirection: layoutDirection,
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
    console.log('📝 ProcessDesigner - handleEditNode called for node:', nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    console.log('🔍 ProcessDesigner - Found node:', node);
    
    // Loop containers should use loop condition modal instead
    if (node && node.type === 'loopContainer') {
      console.log('⚠️ ProcessDesigner - Loop container detected, opening condition modal instead');
      setCurrentLoopNodeId(nodeId);
      setCurrentLoopConditions(node.data.conditions || []);
      setLoopConditionModalOpen(true);
      return;
    }
    
    if (node) {
      console.log('✅ ProcessDesigner - Opening NodeEditModal for node type:', node.type);
      setSelectedNode(node);
      setEditModalOpen(true);
    } else {
      console.log('❌ ProcessDesigner - Node not found');
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
        
        // Determine connection color and style based on type
        let edgeColor = '#10b981'; // Default: green for success path
        let markerColor = '#10b981';
        let isDashed = false;
        
        if (isErrorConnection) {
          // Error connections: red, dashed
          edgeColor = '#ef4444';
          markerColor = '#ef4444';
          isDashed = true;
        } else if (sourceNode?.data?.actionName) {
          const actionName = sourceNode.data.actionName.toLowerCase();
          
          // Conditional branches: blue
          if (actionName.includes('if_then_else') || actionName.includes('switch')) {
            edgeColor = '#3b82f6';
            markerColor = '#3b82f6';
          }
          // Loops: orange
          else if (actionName.includes('loop') || actionName.includes('while') || actionName.includes('for_each')) {
            edgeColor = '#f97316';
            markerColor = '#f97316';
          }
          // Try/Catch/Finally: purple
          else if (actionName.includes('try') || actionName.includes('catch') || actionName.includes('finally')) {
            edgeColor = '#a855f7';
            markerColor = '#a855f7';
          }
        }

        return addEdge({
          ...params,
          type: label ? 'labeled' : 'default',
          markerEnd: { 
            type: MarkerType.ArrowClosed,
            color: markerColor,
          },
          style: { 
            stroke: edgeColor, 
            strokeWidth: 2,
            strokeDasharray: isDashed ? '5,5' : 'none',
          },
          data: { 
            label: isErrorConnection ? 'error' : label,
            isError: isErrorConnection,
            color: edgeColor,
          },
        }, eds);
      });
    },
    [nodes, generateEdgeLabel]
  );

  // Handle loop condition editing
  const handleEditLoopCondition = useCallback((nodeId: string) => {
    console.log('🔵 ProcessDesigner - handleEditLoopCondition called for node:', nodeId);
    const node = nodes.find(n => n.id === nodeId);
    console.log('🔍 ProcessDesigner - Found node:', node);
    if (node && node.type === 'loopContainer') {
      console.log('✅ ProcessDesigner - Node is loopContainer, opening modal');
      console.log('📋 ProcessDesigner - Current conditions:', node.data.conditions);
      setCurrentLoopNodeId(nodeId);
      setCurrentLoopConditions(node.data.conditions || []);
      setLoopConditionModalOpen(true);
      console.log('🚀 ProcessDesigner - Modal state set to true');
    } else {
      console.log('❌ ProcessDesigner - Node is not loopContainer or not found');
    }
  }, [nodes]);

  // Handle saving loop conditions
  const handleSaveLoopConditions = useCallback((conditions: ConditionalGroup[]) => {
    console.log('💾 ProcessDesigner - handleSaveLoopConditions called');
    console.log('📝 ProcessDesigner - Conditions to save:', conditions);
    console.log('🎯 ProcessDesigner - Target node ID:', currentLoopNodeId);
    
    if (currentLoopNodeId) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === currentLoopNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  conditions: conditions,
                },
              }
            : node
        )
      );
      console.log('✅ ProcessDesigner - Nodes updated with new conditions');
    } else {
      console.log('⚠️ ProcessDesigner - No currentLoopNodeId, skipping update');
    }
  }, [currentLoopNodeId, setNodes]);

  // Handle adding break node to loop
  const handleAddBreakToLoop = useCallback((loopNodeId: string, relativePosition: { x: number; y: number }) => {
    const nodeId = `break-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: 'break',
      position: relativePosition,
      data: {
        label: 'Break',
        layoutDirection: layoutDirection,
        onEdit: () => handleEditNode(nodeId),
      },
      parentNode: loopNodeId,
      extent: 'parent' as const,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [layoutDirection, setNodes, handleEditNode]);

  // Handle adding continue node to loop
  const handleAddContinueToLoop = useCallback((loopNodeId: string, relativePosition: { x: number; y: number }) => {
    const nodeId = `continue-${Date.now()}`;
    const newNode: Node = {
      id: nodeId,
      type: 'continue',
      position: relativePosition,
      data: {
        label: 'Continue',
        layoutDirection: layoutDirection,
        onEdit: () => handleEditNode(nodeId),
        skipCount: 1,
      },
      parentNode: loopNodeId,
      extent: 'parent' as const,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [layoutDirection, setNodes, handleEditNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      // Handle regular action drops
      const actionData = event.dataTransfer.getData('application/json');
      if (!actionData) return;

      const action: Action = JSON.parse(actionData);
      
      // Use screenToFlowPosition to convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `node-${Date.now()}`;
      
      // Check if dropping inside a loop container
      let parentNodeId: string | undefined = undefined;
      let relativePosition = position;
      
      for (const node of nodes) {
        if (node.type === 'loopContainer') {
          const nodeWidth = typeof node.style?.width === 'number' ? node.style.width : 600;
          const nodeHeight = typeof node.style?.height === 'number' ? node.style.height : 400;
          
          // Check if drop position is within container bounds
          if (
            position.x >= node.position.x &&
            position.x <= node.position.x + nodeWidth &&
            position.y >= node.position.y &&
            position.y <= node.position.y + nodeHeight
          ) {
            parentNodeId = node.id;
            // Calculate position relative to parent
            relativePosition = {
              x: position.x - node.position.x,
              y: position.y - node.position.y,
            };
            break;
          }
        }
      }

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
          position: parentNodeId ? relativePosition : position,
          data: {
            label: 'START',
            trigger: currentTriggerConfig,
            showPlusButton: true, // Will be updated by effect
            layoutDirection: layoutDirection,
            onAddNext: () => {
              setTargetNodeForPlus(nodeId);
              setShowActionSearch(true);
            },
            onConfigure: () => {
              setTriggerConfigOpen(true);
            },
          },
          ...(parentNodeId && { 
            parentNode: parentNodeId,
            extent: 'parent' as const,
          }),
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
          position: parentNodeId ? relativePosition : position,
          data: {
            label: 'GLOBAL ERROR',
            config: currentGlobalErrorConfig,
            layoutDirection: layoutDirection,
            onConfigure: () => {
              setGlobalErrorConfigOpen(true);
            },
          },
          ...(parentNodeId && { 
            parentNode: parentNodeId,
            extent: 'parent' as const,
          }),
        };
        setNodes((nds) => nds.concat(newNode));
        return;
      }

      // Handle special node types
      let nodeType = 'actionNode';
      let nodeData: any = {
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
        layoutDirection: layoutDirection,
        onEdit: () => handleEditNode(nodeId),
        onAddNext: () => {
          setTargetNodeForPlus(nodeId);
          setShowActionSearch(true);
        },
      };

      // Special handling for IF THEN ELSE
      if (action.name.toLowerCase().includes('if_then_else')) {
        nodeType = 'ifThenElse';
      }
      
      // Special handling for Loop Container
      if (action.name === 'loop_container') {
        nodeType = 'loopContainer';
        nodeData = {
          label: 'While',
          loopType: 'while',
          conditions: [],
          layoutDirection: layoutDirection,
          onEdit: () => handleEditLoopCondition(nodeId),
          onAddNext: () => {
            setTargetNodeForPlus(nodeId);
            setShowActionSearch(true);
          },
          onAddBreak: (position: { x: number; y: number }) => handleAddBreakToLoop(nodeId, position),
          onAddContinue: (position: { x: number; y: number }) => handleAddContinueToLoop(nodeId, position),
          showPlusButton: true,
        };
      }
      
      const newNode: Node = {
        id: nodeId,
        type: nodeType,
        position: parentNodeId ? relativePosition : position,
        data: nodeData,
        // Loop containers are expandable parent nodes
        style: nodeType === 'loopContainer' ? {
          width: 600,
          height: 400,
          zIndex: -1, // Behind child nodes
        } : undefined,
        // Set parent-child relationship if dropped inside a container
        ...(parentNodeId && { 
          parentNode: parentNodeId,
          extent: 'parent' as const,
        }),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [handleEditNode, screenToFlowPosition, nodes]
  );

  const handleSave = async () => {
    // Check if process name is set
    if (!processName || processName.trim() === '' || processName === 'Untitled Process') {
      setSaveModalAction('save');
      setSaveModalOpen(true);
      return;
    }

    // If process is published (status is active or published), require version update
    if (processProperties.status === 'published' || processProperties.status === 'active') {
      setSaveModalAction('save');
      setSaveModalOpen(true);
      return;
    }

    // Proceed with save
    await performSave(processName, processProperties.version);
  };

  const handlePublish = () => {
    // Check if process name is set
    if (!processName || processName.trim() === '' || processName === 'Untitled Process') {
      setSaveModalAction('publish');
      setSaveModalOpen(true);
      return;
    }

    // Always require version update when publishing
    setSaveModalAction('publish');
    setSaveModalOpen(true);
  };

  const performSave = async (name: string, version: string) => {
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
        // Include all process properties first
        ...processProperties,
        // Override with specific values
        name: name,
        description: processDescription,
        version: version,
        status: saveModalAction === 'publish' ? 'published' : processProperties.status,
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
          message: saveModalAction === 'publish' 
            ? `Process published successfully (${version})` 
            : 'Process updated successfully',
          type: 'success',
        });
        
        // Update local state
        setProcessName(name);
        setProcessProperties(prev => ({
          ...prev,
          name: name,
          version: version,
          status: saveModalAction === 'publish' ? 'published' : prev.status,
        }));
      } else {
        const response = await api.post('/processes', processData);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: saveModalAction === 'publish'
            ? `Process published successfully (${version})`
            : 'Process created successfully',
          type: 'success',
        });
        navigate(`/process-designer/${response.data.process.id}`);
      }
      
      setSaveModalOpen(false);
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
    console.log('🖱️ ProcessDesigner - Node clicked, type:', node.type);
    
    // Don't open properties for loop containers (they have their own edit button)
    if (node.type === 'loopContainer') {
      console.log('⚠️ ProcessDesigner - Loop container clicked, ignoring for properties panel');
      return;
    }
    
    setSelectedNodeForProps(node);
    setPropertiesModalOpen(true); // Open floating properties modal
  }, []);
  
  // Handle canvas click to show process properties
  const onPaneClick = useCallback(() => {
    setSelectedNodeForProps(null); // Clear node selection
    setPropertiesModalOpen(false); // Close properties modal
  }, []);

  // Render configuration form for properties panel
  const renderConfigurationForm = useCallback((node: Node) => {
    // Start Node - Render trigger configuration
    if (node.type === 'start') {
      return (
        <TriggerConfigPanel
          isOpen={true}
          inline={true}
          currentConfig={node.data?.trigger}
          onClose={() => {}} // No close needed in inline view
          onSave={(config) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        trigger: config,
                      },
                    }
                  : n
              )
            );
          }}
        />
      );
    }

    // Global Error Node - Render error handler configuration
    if (node.type === 'globalError') {
      const config = node.data?.config || {};
      
      return (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-gray-700">
            <strong className="text-red-900">Global Error Handler:</strong> Catches all unhandled errors in the process.
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.logErrors !== false}
                onChange={(e) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              config: {
                                ...n.data?.config,
                                logErrors: e.target.checked,
                              },
                            },
                          }
                        : n
                    )
                  );
                }}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Log errors to activity logs</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.sendNotification === true}
                onChange={(e) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              config: {
                                ...n.data?.config,
                                sendNotification: e.target.checked,
                              },
                            },
                          }
                        : n
                    )
                  );
                }}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Send notification on error</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.continueProcess === true}
                onChange={(e) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            data: {
                              ...n.data,
                              config: {
                                ...n.data?.config,
                                continueProcess: e.target.checked,
                              },
                            },
                          }
                        : n
                    )
                  );
                }}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Continue process after error (don't stop)</span>
            </label>
          </div>
        </div>
      );
    }

    // Other nodes - Render edit modal content inline
    return (
      <NodeEditModal
        isOpen={true}
        node={node}
        allActions={actions}
        nodes={nodes}
        edges={edges}
        onClose={() => {}} // No close needed in inline view
        onSave={(nodeId, data) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      config: data,
                    },
                  }
                : n
            )
          );
        }}
        onDeleteEdge={(edgeId) => {
          setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        }}
      />
    );
  }, [nodes, edges, actions, setNodes, setEdges]);
  
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
    <div className="h-screen flex overflow-hidden bg-gray-50" onClick={closeCanvasContextMenu}>
        {/* Left Panel - Collapsible Action Palette */}
        {/* Left Panel Hidden - Now using Floating Actions Modal */}

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
                      position: LAYOUT_CONFIG.START_POSITION,
                      data: {
                        label: 'START',
                        trigger: currentTriggerConfig,
                        showPlusButton: true, // Will be updated by effect
                        layoutDirection: layoutDirection,
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
              {/* ReactFlow Canvas - Full height */}
              <div className="relative w-full h-full">
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
                  onMoveEnd={onMoveEnd}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  isValidConnection={isValidConnection}
                  connectOnClick={true}
                  connectionRadius={50}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                  minZoom={0.1}
                  maxZoom={2}
                  connectionLineType={ConnectionLineType.Bezier}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                  panOnScroll={false}
                  zoomOnScroll={true}
                  panOnDrag={!isMultiSelectMode}
                  selectNodesOnDrag={isMultiSelectMode}
                  selectionOnDrag={isMultiSelectMode}
                  deleteKeyCode="Delete"
                >
                  <Background 
                    variant={backgroundPattern === 'dots' ? BackgroundVariant.Dots : BackgroundVariant.Lines} 
                    gap={20} 
                    size={backgroundPattern === 'dots' ? 2 : 1} 
                    color="#e5e7eb"
                    style={{ backgroundColor: '#f9fafb' }}
                  />
                  {/* Controls positioned at top-left */}
                  <Controls 
                    position="top-left" 
                    className="bg-white shadow-lg rounded-lg border border-gray-200"
                  />
                  
                  {/* Actions Button */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '35px' }}>
                    <button
                      onClick={() => setActionsModalOpen(true)}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 px-2 py-2 h-10 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      title="Actions Library"
                    >
                      <DatabaseZap className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Actions</span>
                    </button>
                  </div>
                  
                  {/* Process Properties Button */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '135px' }}>
                    <button
                      onClick={() => setProcessPropertiesOpen(true)}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      title="Process Properties"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Variables Button */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '177px' }}>
                    <button
                      onClick={() => setVariablesPanelOpen(true)}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      title="Process Variables"
                    >
                      <Variable className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Multi-Select Mode Button */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '220px' }}>
                    <button
                      onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                      className={`bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center ${
                        isMultiSelectMode ? 'bg-blue-50 border-blue-400' : ''
                      }`}
                      title={isMultiSelectMode ? 'Disable Multi-Select' : 'Enable Multi-Select'}
                    >
                      <MousePointerSquareDashed className={`w-4 h-4 ${isMultiSelectMode ? 'text-blue-600' : 'text-gray-600'}`} />
                    </button>
                  </div>
                  
                  {/* Layout Toggle Button */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '262px' }}>
                    <button
                      onClick={toggleLayout}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      title={`Switch to ${layoutDirection === 'horizontal' ? 'Vertical' : 'Horizontal'} Layout`}
                    >
                      {layoutDirection === 'horizontal' ? (
                        <ArrowUpDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ArrowLeftRight className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* Auto-Arrange Button */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '305px' }}>
                    <button
                      onClick={autoArrange}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      title="Auto-Arrange Nodes"
                    >
                      <RefreshCw className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Zoom Percentage Display */}
                  <div className="absolute top-4 left-4 z-10" style={{ marginLeft: '350px' }}>
                    <div className="bg-white shadow-lg rounded-lg border border-gray-200 px-3 h-10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-700">
                        {Math.round(currentZoom * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Process Name/Description - Center */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                    {editingProcessName ? (
                      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3" style={{ minWidth: '300px' }}>
                        <input
                          type="text"
                          value={processName}
                          onChange={(e) => setProcessName(e.target.value)}
                          className="w-full text-lg font-bold border-none outline-none focus:ring-0 bg-transparent mb-2"
                          placeholder="Process Name"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={processDescription}
                          onChange={(e) => setProcessDescription(e.target.value)}
                          className="w-full text-sm text-gray-600 border-none outline-none focus:ring-0 bg-transparent"
                          placeholder="Add description..."
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => setEditingProcessName(false)}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingProcessName(true)}
                        className="bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-2 h-10 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        title="Edit Process Name"
                      >
                        <div className="text-left">
                          <div className="text-sm font-semibold text-gray-900">{processName}</div>
                          {processDescription && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{processDescription}</div>
                          )}
                        </div>
                        <Edit2 className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Right Side Buttons - Export, Save, Publish, Run */}
                  <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                    {/* Export Button */}
                    <button
                      onClick={handleExport}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      title="Export Process"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center ${
                        saving ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Save Process"
                    >
                      <Save className="w-4 h-4 text-blue-600" />
                    </button>

                    {/* Publish Button */}
                    <button
                      onClick={handlePublish}
                      disabled={saving}
                      className={`bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center ${
                        saving ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Publish Process"
                    >
                      <FileUp className="w-4 h-4 text-purple-600" />
                    </button>

                    {/* Run Button */}
                    <button
                      onClick={handleExecute}
                      className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 h-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      title="Run Process"
                    >
                      <Play className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                  
                  {/* MiniMap positioned at bottom-right */}
                  <MiniMap
                    position="bottom-right"
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
        
        {/* Right Panel Hidden - Now using Floating Properties Panel */}

      {/* Context Menu */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            const node = nodes.find((n) => n.id === contextMenu.nodeId);
            
            // Handle Start and Global Error nodes with their specific config panels
            if (node?.type === 'start') {
              setTriggerConfigOpen(true);
            } else if (node?.type === 'globalError') {
              setGlobalErrorConfigOpen(true);
            } else {
              handleEditNode(contextMenu.nodeId);
            }
            
            setContextMenu(null);
          }}
          onDelete={() => {
            const node = nodes.find((n) => n.id === contextMenu.nodeId);
            
            // Prevent deletion of Start and Global Error nodes
            if (node?.type === 'start' || node?.type === 'globalError') {
              setAlertDialog({
                isOpen: true,
                title: `Cannot Delete ${node.type === 'start' ? 'Start' : 'Global Error'}`,
                message: `The ${node.type === 'start' ? 'Start node' : 'Global Error handler'} is required and cannot be deleted.`,
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
            className="w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600"
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
          console.log('🚪 ProcessDesigner - NodeEditModal onClose called');
          console.log('📊 Current state - editModalOpen:', editModalOpen);
          setEditModalOpen(false);
          setSelectedNode(null);
          console.log('✅ ProcessDesigner - NodeEditModal state set to false');
        }}
        onSave={(nodeId, newConfig, newOutputSchema, newInputSchema) => {
          console.log('💾 ProcessDesigner - NodeEditModal onSave called');
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
          console.log('✅ ProcessDesigner - NodeEditModal closed after save');
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
      <ProcessPropertiesModal
        isOpen={processPropertiesOpen}
        properties={processProperties}
        onClose={() => setProcessPropertiesOpen(false)}
        onSave={(updatedProperties) => {
          setProcessProperties(updatedProperties);
          setProcessName(updatedProperties.name);
          setProcessDescription(updatedProperties.description || '');
          setBackgroundPattern(updatedProperties.backgroundPattern || 'dots');
        }}
      />

      {/* Save Process Modal */}
      <SaveProcessModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={(name, version) => {
          performSave(name, version);
        }}
        currentName={processName}
        currentVersion={processProperties.version}
        isPublished={processProperties.status === 'published' || processProperties.status === 'active'}
        requireVersionUpdate={saveModalAction === 'publish' || processProperties.status === 'published' || processProperties.status === 'active'}
      />

      {/* Loop Condition Modal */}
      <LoopConditionModal
        isOpen={loopConditionModalOpen}
        currentConditions={currentLoopConditions}
        onClose={() => {
          console.log('🚪 ProcessDesigner - Modal onClose called, setting state to false');
          setLoopConditionModalOpen(false);
        }}
        onSave={handleSaveLoopConditions}
      />

      {/* Variables Panel */}
      <VariablesPanel
        isOpen={variablesPanelOpen}
        onClose={() => setVariablesPanelOpen(false)}
        variables={processVariables}
        onSave={(variables) => setProcessVariables(variables)}
      />

      {/* Floating Actions Modal */}
      <FloatingActionsModal
        isOpen={actionsModalOpen}
        onClose={() => setActionsModalOpen(false)}
        actions={actions}
        connectors={[]} // TODO: Fetch actual connectors with their actions
        onDragStart={(event, action) => {
          event.dataTransfer.setData('application/json', JSON.stringify(action));
          event.dataTransfer.effectAllowed = 'move';
        }}
      />

      {/* Floating Properties Panel */}
      <FloatingPropertiesPanel
        isOpen={propertiesModalOpen}
        onClose={() => setPropertiesModalOpen(false)}
        selectedNode={selectedNodeForProps}
        processName={processName}
        onEditNode={(node) => {
          setSelectedNode(node);
          setEditModalOpen(true);
        }}
        renderConfigurationForm={renderConfigurationForm}
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

                        // Determine node type and data
                        let nodeType = 'actionNode';
                        let nodeData: any = {
                          label: action.displayName,
                          description: action.description,
                          category: action.category,
                          icon: action.icon,
                          color: action.color,
                          actionType: action.actionType,
                          actionId: action.id,
                          actionName: action.name,
                          config: {},
                          showPlusButton: true,
                          layoutDirection: layoutDirection,
                          onEdit: () => handleEditNode(nodeId),
                          onAddNext: () => {
                            setTargetNodeForPlus(nodeId);
                            setShowActionSearch(true);
                          },
                        };

                        // Special handling for IF THEN ELSE
                        if (action.name.toLowerCase().includes('if_then_else')) {
                          nodeType = 'ifThenElse';
                        }
                        
                        // Special handling for Loop Container
                        if (action.name === 'loop_container') {
                          nodeType = 'loopContainer';
                          nodeData = {
                            label: 'While',
                            loopType: 'while',
                            conditions: [],
                            layoutDirection: layoutDirection,
                            onEdit: () => handleEditLoopCondition(nodeId),
                            onAddNext: () => {
                              setTargetNodeForPlus(nodeId);
                              setShowActionSearch(true);
                            },
                            onAddBreak: (position: { x: number; y: number }) => handleAddBreakToLoop(nodeId, position),
                            onAddContinue: (position: { x: number; y: number }) => handleAddContinueToLoop(nodeId, position),
                            showPlusButton: true,
                          };
                        }

                        const newNode: Node = {
                          id: nodeId,
                          type: nodeType,
                          position,
                          data: nodeData,
                          // Loop containers are expandable parent nodes
                          style: nodeType === 'loopContainer' ? {
                            width: 600,
                            height: 400,
                            zIndex: -1,
                          } : undefined,
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
