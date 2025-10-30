import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Database } from 'lucide-react';
import { Button } from '@/components/common/Button';

export type VariableType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null' | 'any';

export interface ProcessVariable {
  id: string;
  name: string;
  type: VariableType;
  value?: any;
  description?: string;
  isSystem?: boolean;
  readonly?: boolean;
}

interface VariablesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  variables: ProcessVariable[];
  onSave: (variables: ProcessVariable[]) => void;
}

const VARIABLE_TYPES: { value: VariableType; label: string; icon: string }[] = [
  { value: 'string', label: 'String', icon: 'Abc' },
  { value: 'number', label: 'Number', icon: '123' },
  { value: 'boolean', label: 'Boolean', icon: 'T/F' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'object', label: 'Object', icon: '{}' },
  { value: 'array', label: 'Array', icon: '[]' },
  { value: 'null', label: 'Null', icon: '∅' },
  { value: 'any', label: 'Any', icon: '*' },
];

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  isOpen,
  onClose,
  variables,
  onSave,
}) => {
  const [localVariables, setLocalVariables] = useState<ProcessVariable[]>(variables);
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const addVariable = () => {
    const newVar: ProcessVariable = {
      id: `var-${Date.now()}`,
      name: `variable${localVariables.filter(v => !v.isSystem).length + 1}`,
      type: 'string',
      value: '',
      description: '',
      isSystem: false,
      readonly: false,
    };
    setLocalVariables([...localVariables, newVar]);
  };

  const updateVariable = (id: string, field: keyof ProcessVariable, value: any) => {
    setLocalVariables(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const deleteVariable = (id: string) => {
    setLocalVariables(prev => prev.filter(v => v.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpandedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    onSave(localVariables);
    onClose();
  };

  const systemVariables = localVariables.filter(v => v.isSystem);
  const userVariables = localVariables.filter(v => !v.isSystem);

  const renderVariableValue = (variable: ProcessVariable) => {
    if (variable.type === 'boolean') {
      return (
        <select
          value={variable.value?.toString() || 'false'}
          onChange={(e) => updateVariable(variable.id, 'value', e.target.value === 'true')}
          disabled={variable.readonly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    if (variable.type === 'date') {
      return (
        <input
          type="datetime-local"
          value={variable.value || ''}
          onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
          disabled={variable.readonly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      );
    }

    if (variable.type === 'object' || variable.type === 'array') {
      return (
        <textarea
          value={typeof variable.value === 'string' ? variable.value : JSON.stringify(variable.value, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              updateVariable(variable.id, 'value', parsed);
            } catch {
              updateVariable(variable.id, 'value', e.target.value);
            }
          }}
          disabled={variable.readonly}
          placeholder={variable.type === 'object' ? '{ "key": "value" }' : '[ "item1", "item2" ]'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
          rows={4}
        />
      );
    }

    if (variable.type === 'number') {
      return (
        <input
          type="number"
          value={variable.value || ''}
          onChange={(e) => updateVariable(variable.id, 'value', parseFloat(e.target.value) || 0)}
          disabled={variable.readonly}
          placeholder="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      );
    }

    // Default: string or any
    return (
      <input
        type="text"
        value={variable.value || ''}
        onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
        disabled={variable.readonly}
        placeholder="Enter value"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Process Variables</h2>
              <p className="text-sm text-gray-600">Manage variables accessible throughout the process</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* System Variables Section */}
          {systemVariables.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  System Variables
                </h3>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {systemVariables.length} variables
                </span>
              </div>
              <div className="space-y-3">
                {systemVariables.map((variable) => (
                  <div
                    key={variable.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-semibold text-blue-900">
                          {variable.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {variable.type}
                        </span>
                        <span className="text-xs text-blue-600">
                          {variable.readonly ? '🔒 Read-only' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleExpand(variable.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        {expandedVariables.has(variable.id) ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    {variable.description && (
                      <p className="text-xs text-blue-700 mb-2">{variable.description}</p>
                    )}
                    {expandedVariables.has(variable.id) && (
                      <div className="mt-3">
                        {renderVariableValue(variable)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Variables Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Custom Variables
              </h3>
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {userVariables.length} variables
              </span>
            </div>

            {userVariables.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Database className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500 font-medium">No custom variables defined</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Variable" to create a new one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userVariables.map((variable) => (
                  <div
                    key={variable.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-12 gap-3 mb-3">
                      {/* Variable Name */}
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={variable.name}
                          onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                          placeholder="variableName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                        />
                      </div>

                      {/* Variable Type */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={variable.type}
                          onChange={(e) => updateVariable(variable.id, 'type', e.target.value as VariableType)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          {VARIABLE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-4 flex items-end justify-end">
                        <button
                          onClick={() => deleteVariable(variable.id)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Variable Description */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        value={variable.description || ''}
                        onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                        placeholder="Describe this variable's purpose"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    {/* Variable Value */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Default Value</label>
                      {renderVariableValue(variable)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Variable Button */}
            <button
              onClick={addVariable}
              className="w-full mt-3 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add Variable</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            Variables can be accessed in scripts, actions, and conditions
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Variables
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

