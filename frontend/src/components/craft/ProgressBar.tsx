import React from 'react';
import { useNode } from '@craftjs/core';

interface ProgressBarProps {
  value?: number;
  max?: number;
  showPercentage?: boolean;
  color?: string;
  height?: number;
  animated?: boolean;
  label?: string;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> & { craft?: any } = ({
  value = 50,
  max = 100,
  showPercentage = true,
  color = '#3b82f6',
  height = 8,
  animated = true,
  label = '',
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

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={selected ? 'ring-2 ring-primary-500 dark:ring-primary-400 rounded-lg p-2' : 'p-2'}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
      }}
    >
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

const ProgressBarSettings: React.FC = () => {
  const {
    actions: { setProp },
    value,
    max,
    showPercentage,
    color,
    height,
    animated,
    label,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
  } = useNode((node) => ({
    value: node.data.props.value,
    max: node.data.props.max,
    showPercentage: node.data.props.showPercentage,
    color: node.data.props.color,
    height: node.data.props.height,
    animated: node.data.props.animated,
    label: node.data.props.label,
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
              placeholder="Optional label"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Progress</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Value: {value}
            </label>
            <input
              type="range"
              min="0"
              max={max}
              value={value}
              onChange={(e) => setProp((props: any) => (props.value = parseInt(e.target.value)))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum</label>
            <input
              type="number"
              min="1"
              value={max}
              onChange={(e) => setProp((props: any) => (props.max = parseInt(e.target.value) || 100))}
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Appearance</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setProp((props: any) => (props.color = e.target.value))}
              placeholder="#3b82f6"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Height: {height}px
            </label>
            <input
              type="range"
              min="4"
              max="32"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = parseInt(e.target.value)))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Options</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPercentage}
              onChange={(e) => setProp((props: any) => (props.showPercentage = e.target.checked))}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Show Percentage</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={animated}
              onChange={(e) => setProp((props: any) => (props.animated = e.target.checked))}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Animated</span>
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

ProgressBar.craft = {
  displayName: 'Progress Bar',
  props: {
    value: 50,
    max: 100,
    showPercentage: true,
    color: '#3b82f6',
    height: 8,
    animated: true,
    label: '',
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
    settings: ProgressBarSettings,
  },
};

