import React from 'react';
import { useNode } from '@craftjs/core';

interface ColumnProps {
  children?: React.ReactNode;
  // Dimensions
  width?: string;
  fullWidth?: boolean;
  // Colors
  background?: string;
  textColor?: string;
  // Padding
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Decoration
  borderRadius?: number;
  // Alignment (Flexbox)
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  fillSpace?: boolean;
}

export const Column: React.FC<ColumnProps> & { craft?: any } = ({
  children,
  width = 'auto',
  fullWidth = false,
  background = 'transparent',
  textColor = 'inherit',
  paddingTop = 4,
  paddingRight = 4,
  paddingBottom = 4,
  paddingLeft = 4,
  borderRadius = 0,
  flexDirection = 'column',
  alignItems = 'flex-start',
  justifyContent = 'flex-start',
  fillSpace = false,
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
      className={`${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      } border border-dashed border-gray-300 dark:border-gray-600`}
      style={{
        width: fullWidth ? '100%' : width,
        background,
        color: textColor,
        paddingTop: `${paddingTop * 4}px`,
        paddingRight: `${paddingRight * 4}px`,
        paddingBottom: `${paddingBottom * 4}px`,
        paddingLeft: `${paddingLeft * 4}px`,
        borderRadius: `${borderRadius}px`,
        display: 'flex',
        flexDirection,
        alignItems,
        justifyContent,
        flex: fillSpace ? '1 1 0%' : '0 1 auto',
        minHeight: '100px',
      }}
    >
      {children || (
        <div className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm w-full">
          <div className="font-medium mb-1">Drop components here</div>
          <div className="text-xs opacity-75">
            Alignment settings will affect child components
          </div>
        </div>
      )}
    </div>
  );
};

const ColumnSettings: React.FC = () => {
  const {
    actions: { setProp },
    width,
    fullWidth,
    background,
    textColor,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderRadius,
    flexDirection,
    alignItems,
    justifyContent,
    fillSpace,
  } = useNode((node) => ({
    width: node.data.props.width,
    fullWidth: node.data.props.fullWidth,
    background: node.data.props.background,
    textColor: node.data.props.textColor,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    borderRadius: node.data.props.borderRadius,
    flexDirection: node.data.props.flexDirection,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    fillSpace: node.data.props.fillSpace,
  }));

  return (
    <div className="space-y-6">
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
        <div className="space-y-2">
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
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Color</label>
            <input
              type="text"
              value={textColor}
              onChange={(e) => setProp((props: any) => (props.textColor = e.target.value))}
              placeholder="inherit"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
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
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Alignment</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Flex Direction */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Flex Direction</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="flexDirection"
                  value="row"
                  checked={flexDirection === 'row'}
                  onChange={(e) => setProp((props: any) => (props.flexDirection = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Row</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="flexDirection"
                  value="column"
                  checked={flexDirection === 'column'}
                  onChange={(e) => setProp((props: any) => (props.flexDirection = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Column</span>
              </label>
            </div>
          </div>

          {/* Fill Space */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Fill Space</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fillSpace"
                  checked={fillSpace}
                  onChange={() => setProp((props: any) => (props.fillSpace = true))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fillSpace"
                  checked={!fillSpace}
                  onChange={() => setProp((props: any) => (props.fillSpace = false))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Align Items */}
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
                <span className="text-xs text-gray-700 dark:text-gray-300">Start</span>
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
                <span className="text-xs text-gray-700 dark:text-gray-300">End</span>
              </label>
            </div>
          </div>

          {/* Justify Content */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Justify Content</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="flex-start"
                  checked={justifyContent === 'flex-start'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Start</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="center"
                  checked={justifyContent === 'center'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Center</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="flex-end"
                  checked={justifyContent === 'flex-end'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">End</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="space-between"
                  checked={justifyContent === 'space-between'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Between</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Column.craft = {
  displayName: 'Column',
  props: {
    width: 'auto',
    fullWidth: false,
    background: 'transparent',
    textColor: 'inherit',
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    borderRadius: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    fillSpace: false,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ColumnSettings,
  },
};
