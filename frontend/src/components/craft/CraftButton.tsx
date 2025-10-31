import React from 'react';
import { useNode } from '@craftjs/core';

interface CraftButtonProps {
  text?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  onClick?: () => void;
}

export const CraftButton: React.FC<CraftButtonProps> & { craft?: any } = ({
  text = 'Button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  paddingTop = 0,
  paddingRight = 0,
  paddingBottom = 0,
  paddingLeft = 0,
  onClick,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-600 dark:hover:bg-primary-700',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700',
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const defaultPadding = {
    sm: { x: 12, y: 6 },
    md: { x: 16, y: 8 },
    lg: { x: 24, y: 12 },
  };

  const customPadding = paddingTop > 0 || paddingRight > 0 || paddingBottom > 0 || paddingLeft > 0;

  return (
    <div
      style={{
        display: fullWidth ? 'block' : 'inline-block',
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      <button
        ref={(ref) => ref && connect(drag(ref))}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${
          variantClasses[variant]
        } ${sizeClasses[size]} ${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} ${
          fullWidth ? 'w-full' : ''
        }`}
        style={
          customPadding
            ? {
                paddingTop: `${paddingTop * 4}px`,
                paddingRight: `${paddingRight * 4}px`,
                paddingBottom: `${paddingBottom * 4}px`,
                paddingLeft: `${paddingLeft * 4}px`,
              }
            : {
                paddingLeft: `${defaultPadding[size].x}px`,
                paddingRight: `${defaultPadding[size].x}px`,
                paddingTop: `${defaultPadding[size].y}px`,
                paddingBottom: `${defaultPadding[size].y}px`,
              }
        }
        onClick={onClick}
      >
        {text}
      </button>
    </div>
  );
};

const ButtonSettings: React.FC = () => {
  const {
    actions: { setProp },
    text,
    variant,
    size,
    fullWidth,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
  } = useNode((node) => ({
    text: node.data.props.text,
    variant: node.data.props.variant,
    size: node.data.props.size,
    fullWidth: node.data.props.fullWidth,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
  }));

  return (
    <div className="space-y-6">
      {/* Button Content */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Content</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Button Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setProp((props: any) => (props.text = e.target.value))}
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
        </div>
      </div>

      {/* Style */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Style</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Variant
            </label>
            <select
              value={variant}
              onChange={(e) => setProp((props: any) => (props.variant = e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
              <option value="danger">Danger</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Size
            </label>
            <select
              value={size}
              onChange={(e) => setProp((props: any) => (props.size = e.target.value))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fullWidth}
                onChange={(e) => setProp((props: any) => (props.fullWidth = e.target.checked))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Full Width</span>
            </label>
          </div>
        </div>
      </div>

      {/* Margin */}
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
              <input
                type="range"
                min="0"
                max="100"
                value={marginTop}
                onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={marginRight}
                onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={marginBottom}
                onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={marginLeft}
                onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Padding */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Custom Padding <span className="text-xs font-normal text-gray-500">(optional, overrides size)</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={paddingTop}
                onChange={(e) => setProp((props: any) => (props.paddingTop = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={paddingRight}
                onChange={(e) => setProp((props: any) => (props.paddingRight = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{paddingTop * 4}px {paddingRight * 4}px</span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={paddingBottom}
                onChange={(e) => setProp((props: any) => (props.paddingBottom = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={paddingLeft}
                onChange={(e) => setProp((props: any) => (props.paddingLeft = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{paddingBottom * 4}px {paddingLeft * 4}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftButton.craft = {
  displayName: 'Button',
  props: {
    text: 'Button',
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  },
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: ButtonSettings,
  },
};

