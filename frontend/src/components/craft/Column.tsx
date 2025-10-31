import React from 'react';
import { useNode } from '@craftjs/core';

interface ColumnProps {
  children?: React.ReactNode;
  background?: string;
  padding?: number;
}

export const Column: React.FC<ColumnProps> & { craft?: any } = ({
  children,
  background = 'transparent',
  padding = 4,
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
        padding: `${padding * 4}px`,
        background,
        minHeight: '100px',
      }}
    >
      {children || (
        <div className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">
          Drop components here
        </div>
      )}
    </div>
  );
};

const ColumnSettings: React.FC = () => {
  const {
    actions: { setProp },
    padding,
    background,
  } = useNode((node) => ({
    padding: node.data.props.padding,
    background: node.data.props.background,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Padding
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={padding}
          onChange={(e) => setProp((props: any) => (props.padding = parseInt(e.target.value)))}
          className="w-full"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{padding * 4}px</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Background
        </label>
        <select
          value={background}
          onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
        >
          <option value="transparent">Transparent</option>
          <option value="#ffffff">White</option>
          <option value="#f3f4f6">Gray</option>
          <option value="#dbeafe">Blue</option>
          <option value="#dcfce7">Green</option>
          <option value="#fef3c7">Yellow</option>
        </select>
      </div>
    </div>
  );
};

Column.craft = {
  displayName: 'Column',
  props: {
    background: 'transparent',
    padding: 4,
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

