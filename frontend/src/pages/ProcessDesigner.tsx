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
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Play, Save, Download, ArrowLeft } from 'lucide-react';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
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
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

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
        setNodes(process.flowDefinition.nodes);
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

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'default',
        position,
        data: {
          label: action.displayName,
          actionId: action.id,
          actionName: action.name,
          config: {},
        },
        style: {
          background: action.color || '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    []
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const processData = {
        name: processName,
        description: processDescription,
        flowDefinition: {
          nodes,
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
        {/* Action Palette */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="space-y-2">
            {actions.map((action) => (
              <div
                key={action.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/json', JSON.stringify(action));
                  event.dataTransfer.effectAllowed = 'move';
                }}
                className="p-3 rounded-lg cursor-move hover:shadow-md transition-shadow border"
                style={{ borderLeft: `4px solid ${action.color}`, backgroundColor: '#f9fafb' }}
              >
                <div className="font-medium text-sm">{action.displayName}</div>
                <div className="text-xs text-gray-500 mt-1">{action.category}</div>
              </div>
            ))}
          </div>
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
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls />
            <MiniMap
              nodeColor={(node) => node.style?.background as string || '#3b82f6'}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </div>
      </div>

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

