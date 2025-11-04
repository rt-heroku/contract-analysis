import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { Plus, X } from 'lucide-react';

interface SelectProps {
  label?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const Select: React.FC<SelectProps> & { craft?: any } = ({
  label = 'Select Label',
  options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ],
  placeholder = 'Select an option...',
  required = false,
  width = '100%',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={selected ? 'ring-2 ring-primary-500 dark:ring-primary-400 rounded-lg' : ''}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const SelectSettings: React.FC = () => {
  const {
    actions: { setProp },
    label,
    options,
    placeholder,
    required,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    label: node.data.props.label,
    options: node.data.props.options,
    placeholder: node.data.props.placeholder,
    required: node.data.props.required,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const handleAddOption = () => {
    if (newOptionValue && newOptionLabel) {
      setProp((props: any) => {
        props.options = [...(props.options || []), { value: newOptionValue, label: newOptionLabel }];
      });
      setNewOptionValue('');
      setNewOptionLabel('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setProp((props: any) => {
      props.options = props.options.filter((_: any, i: number) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Content</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setProp((props: any) => (props.label = e.target.value))}
              placeholder="Select Label"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Placeholder</label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setProp((props: any) => (props.placeholder = e.target.value))}
              placeholder="Select an option..."
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setProp((props: any) => (props.required = e.target.checked))}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Required Field</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Options</h4>
        {options && options.length > 0 && (
          <div className="space-y-2 mb-3">
            {options.map((option: any, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Value: {option.value}</div>
                </div>
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Add Option</div>
          <input
            type="text"
            value={newOptionValue}
            onChange={(e) => setNewOptionValue(e.target.value)}
            placeholder="Value (e.g., option1)"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
          <input
            type="text"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="Label (e.g., Option 1)"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
          <button
            onClick={handleAddOption}
            disabled={!newOptionValue || !newOptionLabel}
            className="w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Option
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
          <input
            type="text"
            value={width}
            onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
            placeholder="100%"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Margin <span className="text-xs font-normal text-gray-500">{marginTop}px {marginRight}px {marginBottom}px {marginLeft}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginTop} onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginRight} onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="100" value={marginBottom} onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="100" value={marginLeft} onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Select.craft = {
  displayName: 'Select',
  props: {
    label: 'Select Label',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
    placeholder: 'Select an option...',
    required: false,
    width: '100%',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: SelectSettings,
  },
};

