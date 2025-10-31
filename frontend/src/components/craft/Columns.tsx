import React from 'react';
import { useNode } from '@craftjs/core';

interface ColumnsProps {
  children?: React.ReactNode;
  // Layout
  numColumns?: number;
  gap?: number;
  // Dimensions
  width?: string;
  fullWidth?: boolean;
  // Colors
  background?: string;
  // Padding
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Decoration
  borderRadius?: number;
  // Alignment
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export const Columns: React.FC<ColumnsProps> & { craft?: any } = ({
  children,
  numColumns = 2,
  gap = 4,
  width = 'auto',
  fullWidth = false,
  background = 'transparent',
  paddingTop = 4,
  paddingRight = 4,
  paddingBottom = 4,
  paddingLeft = 4,
  borderRadius = 0,
  alignItems = 'stretch',
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
      className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
        gap: `${gap * 4}px`,
        width: fullWidth ? '100%' : width,
        background,
        paddingTop: `${paddingTop * 4}px`,
        paddingRight: `${paddingRight * 4}px`,
        paddingBottom: `${paddingBottom * 4}px`,
        paddingLeft: `${paddingLeft * 4}px`,
        borderRadius: `${borderRadius}px`,
        alignItems,
        minHeight: '100px',
      }}
    >
      {children}
    </div>
  );
};

const ColumnsSettings: React.FC = () => {
  const {
    actions: { setProp },
    numColumns,
    gap,
    width,
    fullWidth,
    background,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderRadius,
    alignItems,
  } = useNode((node) => ({
    numColumns: node.data.props.numColumns,
    gap: node.data.props.gap,
    width: node.data.props.width,
    fullWidth: node.data.props.fullWidth,
    background: node.data.props.background,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    borderRadius: node.data.props.borderRadius,
    alignItems: node.data.props.alignItems,
  }));

  return (
    <div className="space-y-6">
      {/* Layout */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Layout</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Number of Columns
            </label>
            <input
              type="range"
              min="1"
              max="6"
              value={numColumns}
              onChange={(e) => setProp((props: any) => (props.numColumns = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{numColumns} columns</span>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Gap</label>
            <input
              type="range"
              min="0"
              max="10"
              value={gap}
              onChange={(e) => setProp((props: any) => (props.gap = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{gap * 4}px</span>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fullWidth}
              onChange={(e) => setProp((props: any) => (props.fullWidth = e.target.checked))}
              className="text-primary-600"
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">Full Width (100%)</span>
          </label>
          
          {!fullWidth && (
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Width</label>
              <input
                type="text"
                value={width}
                onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
                placeholder="auto"
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Colors</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Background</label>
          <input
            type="text"
            value={background}
            onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
            placeholder="transparent"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
        </div>
      </div>

      {/* Padding */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Padding <span className="text-xs font-normal text-gray-500">{paddingTop * 4}px {paddingRight * 4}px {paddingBottom * 4}px {paddingLeft * 4}px</span>
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
          </div>
        </div>
      </div>

      {/* Decoration */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Decoration</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Radius</label>
          <input
            type="range"
            min="0"
            max="50"
            value={borderRadius}
            onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value)))}
            className="w-full"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{borderRadius}px</span>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Column Alignment</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Align Items</label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="alignItems"
                value="flex-start"
                checked={alignItems === 'flex-start'}
                onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Top</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="alignItems"
                value="center"
                checked={alignItems === 'center'}
                onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Center</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="alignItems"
                value="flex-end"
                checked={alignItems === 'flex-end'}
                onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Bottom</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="alignItems"
                value="stretch"
                checked={alignItems === 'stretch'}
                onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Stretch</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

Columns.craft = {
  displayName: 'Columns',
  props: {
    numColumns: 2,
    gap: 4,
    width: 'auto',
    fullWidth: false,
    background: 'transparent',
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    borderRadius: 0,
    alignItems: 'stretch',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ColumnsSettings,
  },
};
