import React from 'react';
import { useNode } from '@craftjs/core';

interface CraftCardProps {
  title?: string;
  children?: React.ReactNode;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  background?: string;
  borderRadius?: number;
  boxShadow?: number;
}

export const CraftCard: React.FC<CraftCardProps> & { craft?: any } = ({
  title = 'Card Title',
  children,
  width = 'auto',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  paddingTop = 4,
  paddingRight = 4,
  paddingBottom = 4,
  paddingLeft = 4,
  background = '#ffffff',
  borderRadius = 8,
  boxShadow = 1,
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
      className={`border border-gray-200 dark:border-gray-700 ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        background,
        borderRadius: `${borderRadius}px`,
        boxShadow: shadowStyles[boxShadow],
        overflow: 'hidden',
      }}
    >
      {title && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div
        style={{
          paddingTop: `${paddingTop * 4}px`,
          paddingRight: `${paddingRight * 4}px`,
          paddingBottom: `${paddingBottom * 4}px`,
          paddingLeft: `${paddingLeft * 4}px`,
          minHeight: '100px',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const CardSettings: React.FC = () => {
  const {
    actions: { setProp },
    title,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    background,
    borderRadius,
    boxShadow,
  } = useNode((node) => ({
    title: node.data.props.title,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    background: node.data.props.background,
    borderRadius: node.data.props.borderRadius,
    boxShadow: node.data.props.boxShadow,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Content</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
            placeholder="Card Title"
            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          />
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
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
              <input type="range" min="0" max="20" value={paddingTop} onChange={(e) => setProp((props: any) => (props.paddingTop = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="20" value={paddingRight} onChange={(e) => setProp((props: any) => (props.paddingRight = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input type="range" min="0" max="20" value={paddingBottom} onChange={(e) => setProp((props: any) => (props.paddingBottom = parseInt(e.target.value)))} className="flex-1" />
              <input type="range" min="0" max="20" value={paddingLeft} onChange={(e) => setProp((props: any) => (props.paddingLeft = parseInt(e.target.value)))} className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Styling */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Styling</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Background</label>
            <input type="text" value={background} onChange={(e) => setProp((props: any) => (props.background = e.target.value))} placeholder="#ffffff" className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Border Radius</label>
            <input type="range" min="0" max="50" value={borderRadius} onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value)))} className="w-full" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{borderRadius}px</span>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Shadow</label>
            <input type="range" min="0" max="4" value={boxShadow} onChange={(e) => setProp((props: any) => (props.boxShadow = parseInt(e.target.value)))} className="w-full" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {['None', 'Small', 'Medium', 'Large', 'Extra Large'][boxShadow]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

CraftCard.craft = {
  displayName: 'Card',
  props: {
    title: 'Card Title',
    width: 'auto',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    background: '#ffffff',
    borderRadius: 8,
    boxShadow: 1,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: CardSettings,
  },
};

