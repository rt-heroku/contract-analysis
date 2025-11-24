import React from 'react';
import { useNode } from '@craftjs/core';

interface FormInputProps {
  label?: string;
  placeholder?: string;
  inputType?: 'text' | 'email' | 'number' | 'tel' | 'password' | 'url' | 'date';
  required?: boolean;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const FormInput: React.FC<FormInputProps> & { craft?: any } = ({
  label = 'Input Label',
  placeholder = 'Enter text...',
  inputType = 'text',
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
      <input
        type={inputType}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </div>
  );
};

const FormInputSettings: React.FC = () => {
  const {
    actions: { setProp },
    label,
    placeholder,
    inputType,
    required,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    label: node.data.props.label,
    placeholder: node.data.props.placeholder,
    inputType: node.data.props.inputType,
    required: node.data.props.required,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
  }));

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
              placeholder="Input Label"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Placeholder</label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setProp((props: any) => (props.placeholder = e.target.value))}
              placeholder="Enter text..."
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Type</h4>
        <div className="space-y-2">
          <select
            value={inputType}
            onChange={(e) => setProp((props: any) => (props.inputType = e.target.value))}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="number">Number</option>
            <option value="tel">Telephone</option>
            <option value="password">Password</option>
            <option value="url">URL</option>
            <option value="date">Date</option>
          </select>
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

FormInput.craft = {
  displayName: 'Form Input',
  props: {
    label: 'Input Label',
    placeholder: 'Enter text...',
    inputType: 'text',
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
    settings: FormInputSettings,
  },
};

