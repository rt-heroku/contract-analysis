import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  title?: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  headerBackground?: string;
  headerTextColor?: string;
  contentBackground?: string;
  borderRadius?: number;
}

export const Collapsible: React.FC<CollapsibleProps> & { craft?: any } = ({
  title = 'Collapsible Section',
  defaultOpen = false,
  children,
  width = '100%',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  headerBackground = '#f3f4f6',
  headerTextColor = '#111827',
  contentBackground = '#ffffff',
  borderRadius = 8,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`border border-gray-200 dark:border-gray-700 overflow-hidden ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
      style={{
        width,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        borderRadius: `${borderRadius}px`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:opacity-80"
        style={{
          background: headerBackground,
          color: headerTextColor,
        }}
      >
        <span className="font-medium text-sm">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div
          className="p-4"
          style={{
            background: contentBackground,
          }}
        >
          {children || (
            <div className="text-gray-400 dark:text-gray-500 text-center py-4 text-sm">
              <div className="font-medium mb-1">Drop components here</div>
              <div className="text-xs opacity-75">
                This content is shown when expanded
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CollapsibleSettings: React.FC = () => {
  const {
    actions: { setProp },
    title,
    defaultOpen,
    width,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    headerBackground,
    headerTextColor,
    contentBackground,
    borderRadius,
  } = useNode((node) => ({
    title: node.data.props.title,
    defaultOpen: node.data.props.defaultOpen,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    headerBackground: node.data.props.headerBackground,
    headerTextColor: node.data.props.headerTextColor,
    contentBackground: node.data.props.contentBackground,
    borderRadius: node.data.props.borderRadius,
  }));

  return (
    <div className="space-y-6">
      {/* Content */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Content</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setProp((props: any) => (props.title = e.target.value))}
              placeholder="Section Title"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={defaultOpen}
                onChange={(e) => setProp((props: any) => (props.defaultOpen = e.target.checked))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Default Open</span>
            </label>
          </div>
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
            placeholder="100%"
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

      {/* Styling */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Styling</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Header Background</label>
            <input
              type="text"
              value={headerBackground}
              onChange={(e) => setProp((props: any) => (props.headerBackground = e.target.value))}
              placeholder="#f3f4f6"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Header Text Color</label>
            <input
              type="text"
              value={headerTextColor}
              onChange={(e) => setProp((props: any) => (props.headerTextColor = e.target.value))}
              placeholder="#111827"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Content Background</label>
            <input
              type="text"
              value={contentBackground}
              onChange={(e) => setProp((props: any) => (props.contentBackground = e.target.value))}
              placeholder="#ffffff"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
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
      </div>
    </div>
  );
};

Collapsible.craft = {
  displayName: 'Collapsible',
  props: {
    title: 'Collapsible Section',
    defaultOpen: false,
    width: '100%',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    headerBackground: '#f3f4f6',
    headerTextColor: '#111827',
    contentBackground: '#ffffff',
    borderRadius: 8,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: CollapsibleSettings,
  },
};

