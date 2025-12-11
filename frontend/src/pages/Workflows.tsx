import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Save, ArrowLeft } from 'lucide-react';
import { StepLibrary } from '../components/workflows/StepLibrary';
import { WorkflowCanvas } from '../components/workflows/WorkflowCanvas';
import { StepConfigModal } from '../components/workflows/StepConfigModal';
import { ExecutionModal } from '../components/workflows/ExecutionModal';
import api from '../lib/api';

/**
 * Workflows Page
 * 
 * Main page for the Step Builder system
 */
export const Workflows: React.FC = () => {
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<string | undefined>();
  const [editingStep, setEditingStep] = useState<any>(null);
  
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<any>(null);
  
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Load workflow if editing existing one
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workflowId = params.get('id');
    
    if (workflowId) {
      loadWorkflow(parseInt(workflowId));
    }
  }, []);

  const loadWorkflow = async (id: number) => {
    try {
      const response = await api.get(`/workflows/${id}`);
      setWorkflow(response.data);
      setWorkflowName(response.data.name);
      setSteps(response.data.steps || []);
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };

  const handleSaveWorkflow = async () => {
    setSaving(true);
    try {
      if (workflow?.id) {
        // Update existing
        await api.put(`/workflows/${workflow.id}`, {
          name: workflowName,
        });
      } else {
        // Create new
        const response = await api.post('/workflows', {
          name: workflowName,
          description: '',
          category: 'document_processing',
        });
        setWorkflow(response.data);
      }
      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleStepAdd = async (stepType: string) => {
    if (!workflow?.id) {
      alert('Please save the workflow first');
      return;
    }

    setSelectedStepType(stepType);
    setEditingStep(null);
    setConfigModalOpen(true);
  };

  const handleStepEdit = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      setSelectedStepType(step.stepType);
      setEditingStep(step);
      setConfigModalOpen(true);
    }
  };

  const handleStepDelete = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
      await api.delete(`/workflows/${workflow.id}/steps/${stepId}`);
      setSteps(steps.filter(s => s.id !== stepId));
    } catch (error) {
      console.error('Error deleting step:', error);
      alert('Failed to delete step');
    }
  };

  const handleStepReorder = async (stepId: string, newOrder: number) => {
    try {
      // Reorder locally first
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      const oldOrder = step.stepOrder;
      const reorderedSteps = steps.map(s => {
        if (s.id === stepId) {
          return { ...s, stepOrder: newOrder };
        }
        if (oldOrder < newOrder) {
          // Moving down
          if (s.stepOrder > oldOrder && s.stepOrder <= newOrder) {
            return { ...s, stepOrder: s.stepOrder - 1 };
          }
        } else {
          // Moving up
          if (s.stepOrder >= newOrder && s.stepOrder < oldOrder) {
            return { ...s, stepOrder: s.stepOrder + 1 };
          }
        }
        return s;
      });

      reorderedSteps.sort((a, b) => a.stepOrder - b.stepOrder);
      setSteps(reorderedSteps);

      // Send to backend
      const stepOrders = reorderedSteps.map(s => ({
        stepId: s.id,
        newOrder: s.stepOrder,
      }));
      await api.put(`/workflows/${workflow.id}/steps/reorder`, { stepOrders });
    } catch (error) {
      console.error('Error reordering steps:', error);
      alert('Failed to reorder steps');
    }
  };

  const handleStepSave = async (stepData: any) => {
    try {
      if (editingStep) {
        // Update existing step
        const response = await api.put(
          `/workflows/${workflow.id}/steps/${editingStep.id}`,
          stepData
        );
        setSteps(steps.map(s => s.id === editingStep.id ? response.data : s));
      } else {
        // Add new step
        const response = await api.post(`/workflows/${workflow.id}/steps`, stepData);
        setSteps([...steps, response.data].sort((a, b) => a.stepOrder - b.stepOrder));
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Failed to save step');
    }
  };

  const handleExecuteWorkflow = async () => {
    if (!workflow?.id) {
      alert('Please save the workflow first');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    setExecuting(true);
    try {
      const response = await api.post(`/workflows/${workflow.id}/execute`, {
        initialData: {},
      });

      setCurrentExecution(response.data);
      setExecutionModalOpen(true);

      // Poll for execution status
      pollExecutionStatus(response.data.executionId);
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow');
    } finally {
      setExecuting(false);
    }
  };

  const pollExecutionStatus = async (executionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/workflows/executions/${executionId}`);
        setCurrentExecution(response.data);

        if (['completed', 'failed', 'cancelled'].includes(response.data.status)) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleResumeExecution = async (userInput: any) => {
    if (!currentExecution) return;

    try {
      const response = await api.post(
        `/workflows/executions/${currentExecution.executionId}/resume`,
        { userInput }
      );

      setCurrentExecution(response.data);

      // Continue polling if still running
      if (response.data.status === 'running') {
        pollExecutionStatus(currentExecution.executionId);
      }
    } catch (error) {
      console.error('Error resuming execution:', error);
      alert('Failed to resume execution');
    }
  };

  const handleCancelExecution = async () => {
    if (!currentExecution) return;

    if (!confirm('Are you sure you want to cancel this execution?')) return;

    try {
      await api.post(`/workflows/executions/${currentExecution.executionId}/cancel`);
      setCurrentExecution({ ...currentExecution, status: 'cancelled' });
    } catch (error) {
      console.error('Error cancelling execution:', error);
      alert('Failed to cancel execution');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {isEditingName ? (
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                autoFocus
                className="text-xl font-semibold border-b-2 border-blue-500 focus:outline-none"
              />
            ) : (
              <h1
                onClick={() => setIsEditingName(true)}
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
              >
                {workflowName}
              </h1>
            )}

            <span className="text-sm text-gray-500">
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveWorkflow}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleExecuteWorkflow}
              disabled={executing || !workflow?.id || steps.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {executing ? 'Running...' : 'Run Workflow'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Step Library */}
        <StepLibrary onStepDragStart={(stepType) => setSelectedStepType(stepType.id)} />

        {/* Center: Workflow Canvas */}
        <WorkflowCanvas
          steps={steps}
          onStepAdd={handleStepAdd}
          onStepEdit={handleStepEdit}
          onStepDelete={handleStepDelete}
          onStepReorder={handleStepReorder}
        />
      </div>

      {/* Modals */}
      <StepConfigModal
        isOpen={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedStepType(undefined);
          setEditingStep(null);
        }}
        onSave={handleStepSave}
        stepType={selectedStepType}
        existingStep={editingStep}
      />

      <ExecutionModal
        isOpen={executionModalOpen}
        onClose={() => setExecutionModalOpen(false)}
        execution={currentExecution}
        onResumeWithInput={handleResumeExecution}
        onCancel={handleCancelExecution}
      />
    </div>
  );
};

