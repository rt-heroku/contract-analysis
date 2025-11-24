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
    console.log('✅ LoopConditionModal - handleConfirm called', conditions);
    onSave(conditions);
    onClose();
  };

  const handleCancel = () => {
    console.log('❌ LoopConditionModal - handleCancel called');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    console.log('🖱️ LoopConditionModal - backdrop clicked');
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) {
    console.log('🚫 LoopConditionModal - not open, returning null');
    return null;
  }

  console.log('✨ LoopConditionModal - rendering with conditions:', currentConditions);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configure Loop Condition</h2>
          <button
            type="button"
            onClick={(e) => {
              console.log('❌ LoopConditionModal - X button clicked');
              e.stopPropagation();
              e.preventDefault();
              handleCancel();
            }}
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

