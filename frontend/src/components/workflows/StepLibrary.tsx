import React from 'react';
import { getAllStepTypes, StepTypeConfig } from '../../config/stepTypes';
import { GripVertical } from 'lucide-react';

interface StepLibraryProps {
  onStepDragStart: (stepType: StepTypeConfig) => void;
}

/**
 * Step Library Component
 * 
 * Left sidebar showing draggable preset step types
 */
export const StepLibrary: React.FC<StepLibraryProps> = ({ onStepDragStart }) => {
  const stepTypes = getAllStepTypes();

  // Group by category
  const categories = {
    input: stepTypes.filter(st => st.category === 'input'),
    processing: stepTypes.filter(st => st.category === 'processing'),
    review: stepTypes.filter(st => st.category === 'review'),
    integration: stepTypes.filter(st => st.category === 'integration'),
    output: stepTypes.filter(st => st.category === 'output'),
  };

  const handleDragStart = (e: React.DragEvent, stepType: StepTypeConfig) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(stepType));
    onStepDragStart(stepType);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Step Library</h2>
        <p className="text-sm text-gray-500 mt-1">Drag steps to build your workflow</p>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(categories).map(([categoryName, steps]) => (
          steps.length > 0 && (
            <div key={categoryName}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {categoryName}
              </h3>
              <div className="space-y-2">
                {steps.map(stepType => {
                  const Icon = stepType.icon;
                  return (
                    <div
                      key={stepType.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, stepType)}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 hover:border-gray-300 transition-colors"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className={`w-8 h-8 ${stepType.color} rounded flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {stepType.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {stepType.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

