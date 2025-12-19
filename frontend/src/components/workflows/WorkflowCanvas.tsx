import React, { useState } from 'react';
import { getStepType } from '../../config/stepTypes';
import { GripVertical, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkflowStep {
  id: string;
  stepOrder: number;
  stepType: string;
  name: string;
  description?: string;
  config: any;
  inputSource?: string;
  outputVariable?: string;
}

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  onStepAdd: (stepType: string, position: number) => void;
  onStepEdit: (stepId: string) => void;
  onStepDelete: (stepId: string) => void;
  onStepReorder: (stepId: string, newOrder: number) => void;
}

/**
 * Workflow Canvas Component
 * 
 * Center panel showing workflow steps in a list
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  steps,
  onStepAdd,
  onStepEdit,
  onStepDelete,
  onStepReorder,
}) => {
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    
    if (data) {
      try {
        const stepType = JSON.parse(data);
        // Add new step at drop position
        const position = dragOverIndex !== null ? dragOverIndex : steps.length;
        onStepAdd(stepType.id, position);
      } catch (error) {
        console.error('Error parsing dropped data:', error);
      }
    }
    
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleStepDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStepDragEnd = () => {
    setDraggedStepId(null);
    setDragOverIndex(null);
  };

  const handleStepDrop = (e: React.DragEvent, targetIndex: number) => {
    e.stopPropagation();
    
    if (draggedStepId) {
      const draggedStep = steps.find(s => s.id === draggedStepId);
      if (draggedStep && draggedStep.stepOrder !== targetIndex + 1) {
        onStepReorder(draggedStepId, targetIndex + 1);
      }
    }
    
    setDraggedStepId(null);
    setDragOverIndex(null);
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const currentOrder = step.stepOrder;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    if (newOrder < 1 || newOrder > steps.length) return;

    onStepReorder(stepId, newOrder);
  };

  return (
    <div 
      className="flex-1 bg-gray-50 overflow-y-auto p-6"
      onDrop={handleDrop}
      onDragOver={(e) => handleDragOver(e, steps.length)}
      onDragLeave={handleDragLeave}
    >
      {steps.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <GripVertical className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No steps yet
            </h3>
            <p className="text-gray-500">
              Drag steps from the library to build your workflow
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-3">
          {steps.map((step, index) => {
            const stepTypeConfig = getStepType(step.stepType);
            if (!stepTypeConfig) return null;

            const Icon = stepTypeConfig.icon;
            const isDragging = draggedStepId === step.id;
            const isDropTarget = dragOverIndex === index;

            return (
              <div key={step.id}>
                {isDropTarget && (
                  <div className="h-2 bg-blue-400 rounded mb-2 animate-pulse" />
                )}
                
                <div
                  draggable
                  onDragStart={(e) => handleStepDragStart(e, step.id)}
                  onDragEnd={handleStepDragEnd}
                  onDrop={(e) => handleStepDrop(e, index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={`bg-white border rounded-lg p-4 transition-all ${
                    isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  } ${isDropTarget ? 'ring-2 ring-blue-400' : 'border-gray-200'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="cursor-move pt-1">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-700">
                      {step.stepOrder}
                    </div>

                    {/* Step Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 ${stepTypeConfig.color} rounded flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {step.name}
                        </h3>
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          {stepTypeConfig.name}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {step.inputSource && (
                          <div>
                            <span className="font-medium">Input:</span> {step.inputSource}
                          </div>
                        )}
                        {step.outputVariable && (
                          <div>
                            <span className="font-medium">Output:</span> {step.outputVariable}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveStep(step.id, 'up')}
                        disabled={step.stepOrder === 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(step.id, 'down')}
                        disabled={step.stepOrder === steps.length}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStepEdit(step.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit step"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onStepDelete(step.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {dragOverIndex === steps.length && (
            <div className="h-2 bg-blue-400 rounded animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};





