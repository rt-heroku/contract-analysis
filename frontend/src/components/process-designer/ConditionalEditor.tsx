import React, { useState } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface ConditionalGroup {
  conditions: Condition[];
  logicOperator: 'and' | 'or'; // Operator before this group
}

interface ConditionalEditorProps {
  title?: string;
  initialConditions?: ConditionalGroup[];
  onConfirm: (conditions: ConditionalGroup[]) => void;
  onCancel: () => void;
}

const OPERATORS = [
  { value: 'equals', label: 'is equal to' },
  { value: 'not_equals', label: 'is not equal to' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'greater_or_equal', label: 'is greater than or equal to' },
  { value: 'less_or_equal', label: 'is less than or equal to' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'is_true', label: 'is true' },
  { value: 'is_false', label: 'is false' },
];

export const ConditionalEditor: React.FC<ConditionalEditorProps> = ({
  title = 'Conditional Editor',
  initialConditions = [],
  onConfirm,
  onCancel,
}) => {
  const [conditionGroups, setConditionGroups] = useState<ConditionalGroup[]>(() => {
    if (initialConditions.length === 0) {
      // Default: one condition
      return [{
        conditions: [{
          id: `cond-${Date.now()}`,
          field: '',
          operator: 'equals',
          value: '',
        }],
        logicOperator: 'and',
      }];
    }
    return initialConditions;
  });

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
    };

    setConditionGroups(prev => {
      const newGroups = [...prev];
      // Add to the last group
      const lastGroup = newGroups[newGroups.length - 1];
      lastGroup.conditions.push(newCondition);
      return newGroups;
    });
  };

  const updateCondition = (groupIndex: number, conditionIndex: number, field: keyof Condition, value: string) => {
    setConditionGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].conditions[conditionIndex][field] = value;
      return newGroups;
    });
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    setConditionGroups(prev => {
      const newGroups = [...prev];
      const group = newGroups[groupIndex];
      
      // Remove the condition
      group.conditions.splice(conditionIndex, 1);
      
      // If group is now empty, remove the group
      if (group.conditions.length === 0) {
        newGroups.splice(groupIndex, 1);
      }
      
      // If all groups removed, add a default one
      if (newGroups.length === 0) {
        return [{
          conditions: [{
            id: `cond-${Date.now()}`,
            field: '',
            operator: 'equals',
            value: '',
          }],
          logicOperator: 'and',
        }];
      }
      
      return newGroups;
    });
  };

  const toggleLogicOperator = (groupIndex: number) => {
    setConditionGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].logicOperator = 
        newGroups[groupIndex].logicOperator === 'and' ? 'or' : 'and';
      return newGroups;
    });
  };

  const handleConfirm = () => {
    onConfirm(conditionGroups);
  };

  // Flatten groups for display (showing operator buttons between conditions)
  const flatConditions: Array<{ type: 'condition' | 'operator'; groupIndex: number; conditionIndex?: number; operator?: 'and' | 'or' }> = [];
  
  conditionGroups.forEach((group, groupIndex) => {
    group.conditions.forEach((_condition, conditionIndex) => {
      // Add condition
      flatConditions.push({
        type: 'condition',
        groupIndex,
        conditionIndex,
      });
      
      // Add operator after condition (except last one)
      const isLastConditionInGroup = conditionIndex === group.conditions.length - 1;
      const isLastGroup = groupIndex === conditionGroups.length - 1;
      
      if (!isLastGroup || !isLastConditionInGroup) {
        flatConditions.push({
          type: 'operator',
          groupIndex: isLastConditionInGroup ? groupIndex + 1 : groupIndex,
          operator: group.logicOperator,
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {flatConditions.map((item, index) => {
            if (item.type === 'operator') {
              return (
                <div key={`op-${index}`} className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => item.groupIndex !== undefined && toggleLogicOperator(item.groupIndex)}
                    className={`px-4 py-1 rounded font-medium text-sm transition-colors ${
                      item.operator === 'and'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    and
                  </button>
                  <span className="text-gray-500 text-sm">or</span>
                  <button
                    onClick={() => item.groupIndex !== undefined && toggleLogicOperator(item.groupIndex)}
                    className={`px-4 py-1 rounded font-medium text-sm transition-colors ${
                      item.operator === 'or'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    or
                  </button>
                </div>
              );
            }

            // Condition row
            const { groupIndex, conditionIndex } = item;
            if (groupIndex === undefined || conditionIndex === undefined) return null;

            const condition = conditionGroups[groupIndex]?.conditions[conditionIndex];
            if (!condition) return null;

            return (
              <div key={condition.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-start space-x-2">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 mt-2 text-gray-400 cursor-move">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Condition Fields */}
                  <div className="flex-1 space-y-2">
                    {/* Field Input */}
                    <input
                      type="text"
                      placeholder="Variable or field name"
                      value={condition.field}
                      onChange={(e) => updateCondition(groupIndex, conditionIndex, 'field', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />

                    {/* Operator Dropdown */}
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(groupIndex, conditionIndex, 'operator', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* Value Input (only if operator needs it) */}
                    {!['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(condition.operator) && (
                      <input
                        type="text"
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeCondition(groupIndex, conditionIndex)}
                    className="flex-shrink-0 mt-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Condition Button */}
          <button
            onClick={addCondition}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Add Condition</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

