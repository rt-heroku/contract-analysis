import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getStepType, ConfigField } from '../../config/stepTypes';

interface StepConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stepData: any) => void;
  stepType?: string;
  existingStep?: any;
}

/**
 * Step Configuration Modal
 * 
 * Dynamic form based on step type configuration
 */
export const StepConfigModal: React.FC<StepConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stepType,
  existingStep,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepTypeConfig = stepType ? getStepType(stepType) : null;

  useEffect(() => {
    if (existingStep) {
      setFormData({
        name: existingStep.name,
        description: existingStep.description || '',
        outputVariable: existingStep.outputVariable || '',
        ...existingStep.config,
      });
    } else if (stepTypeConfig) {
      // Set default values
      const defaults: any = {
        name: stepTypeConfig.name,
        description: '',
        outputVariable: `${stepTypeConfig.id}_output`,
      };

      stepTypeConfig.configFields.forEach(field => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });

      setFormData(defaults);
    }
  }, [existingStep, stepTypeConfig]);

  if (!isOpen || !stepTypeConfig) return null;

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Step name is required';
    }

    stepTypeConfig.configFields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const { name, description, outputVariable, ...config } = formData;

    const stepData = {
      stepType: stepTypeConfig.id,
      name,
      description,
      outputVariable,
      config,
      requiresUserInput: stepTypeConfig.requiresUserInput,
      pageComponent: stepTypeConfig.modalComponent,
    };

    onSave(stepData);
    onClose();
  };

  const renderField = (field: ConfigField) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(field.name, parseFloat(e.target.value))}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValue, opt.value]
                      : currentValue.filter(v => v !== opt.value);
                    handleChange(field.name, newValue);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(field.name, parsed);
              } catch {
                handleChange(field.name, e.target.value);
              }
            }}
            placeholder={field.placeholder || '{}'}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {existingStep ? 'Edit Step' : 'Configure Step'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{stepTypeConfig.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Common Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Variable Name
              </label>
              <input
                type="text"
                value={formData.outputVariable || ''}
                onChange={(e) => handleChange('outputVariable', e.target.value)}
                placeholder="step_output"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This variable will store the step's output for use in later steps
              </p>
            </div>

            {/* Step-specific Fields */}
            {stepTypeConfig.configFields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
                {errors[field.name] && (
                  <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {existingStep ? 'Update Step' : 'Add Step'}
          </button>
        </div>
      </div>
    </div>
  );
};








