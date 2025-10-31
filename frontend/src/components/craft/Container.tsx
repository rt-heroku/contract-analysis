import React from 'react';
import { useNode } from '@craftjs/core';

interface ContainerProps {
  children?: React.ReactNode;
  // Dimensions
  width?: string;
  height?: string;
  // Colors
  background?: string;
  textColor?: string;
  // Margin (individual sides)
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  // Padding (individual sides)
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Decoration
  borderRadius?: number;
  boxShadow?: number;
  // Alignment (Flexbox)
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  fillSpace?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> & { craft?: any } = ({
  children,
  width = 'auto',
  height = 'auto',
  background = 'transparent',
  textColor = 'inherit',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  paddingTop = 4,
  paddingRight = 4,
  paddingBottom = 4,
  paddingLeft = 4,
  borderRadius = 0,
  boxShadow = 0,
  flexDirection = 'column',
  alignItems = 'flex-start',
  justifyContent = 'flex-start',
  fillSpace = false,
  className = '',
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const shadowStyles = [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  ];

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} ${className} border border-dashed border-gray-300 dark:border-gray-600`}
      style={{
        width,
        height,
        background,
        color: textColor,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        paddingTop: `${paddingTop * 4}px`,
        paddingRight: `${paddingRight * 4}px`,
        paddingBottom: `${paddingBottom * 4}px`,
        paddingLeft: `${paddingLeft * 4}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: shadowStyles[boxShadow],
        display: 'flex',
        flexDirection,
        alignItems,
        justifyContent,
        flex: fillSpace ? 1 : 'none',
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

const ContainerSettings: React.FC = () => {
  const {
    actions: { setProp },
    width,
    height,
    background,
    textColor,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderRadius,
    boxShadow,
    flexDirection,
    alignItems,
    justifyContent,
    fillSpace,
  } = useNode((node) => ({
    width: node.data.props.width,
    height: node.data.props.height,
    background: node.data.props.background,
    textColor: node.data.props.textColor,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    borderRadius: node.data.props.borderRadius,
    boxShadow: node.data.props.boxShadow,
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
          <div className="flex gap-2">
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
              placeholder="auto"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">×</span>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = e.target.value))}
              placeholder="auto"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
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
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Radius</label>
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
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Shadow</label>
            <input
              type="range"
              min="0"
              max="4"
              value={boxShadow}
              onChange={(e) => setProp((props: any) => (props.boxShadow = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {['None', 'Small', 'Medium', 'Large', 'Extra Large'][boxShadow]}
            </span>
          </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    width: 'auto',
    height: 'auto',
    background: 'transparent',
    textColor: 'inherit',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    borderRadius: 0,
    boxShadow: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    fillSpace: false,
    className: '',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
};

