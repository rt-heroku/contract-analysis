import React from 'react';
import { X } from 'lucide-react';
import { ConditionalEditor, ConditionalGroup } from './ConditionalEditor';

interface LoopConditionModalProps {
  isOpen: boolean;
  currentConditions?: ConditionalGroup[];
  onClose: () => void;
  onSave: (conditions: ConditionalGroup[]) => void;
}

export const LoopConditionModal: React.FC<LoopConditionModalProps> = ({
  isOpen,
  currentConditions = [],
  onClose,
  onSave,
}) => {
  const handleConfirm = (conditions: ConditionalGroup[]) => {
    onSave(conditions);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configure Loop Condition</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Define the condition that must be true for the loop to continue executing.
            </p>
          </div>

          <ConditionalEditor
            initialConditions={currentConditions}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

