import React from 'react';
import { useNode } from '@craftjs/core';

interface ColumnsProps {
  children?: React.ReactNode;
  columns?: number;
  gap?: number;
}

export const Columns: React.FC<ColumnsProps> & { craft?: any } = ({
  children,
  columns = 2,
  gap = 4,
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
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 4}px`,
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
    columns,
    gap,
  } = useNode((node) => ({
    columns: node.data.props.columns,
    gap: node.data.props.gap,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Number of Columns
        </label>
        <input
          type="range"
          min="1"
          max="6"
          value={columns}
          onChange={(e) => setProp((props: any) => (props.columns = parseInt(e.target.value)))}
          className="w-full"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">{columns} columns</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gap
        </label>
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
  );
};

Columns.craft = {
  displayName: 'Columns',
  props: {
    columns: 2,
    gap: 4,
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

