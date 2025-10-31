import React from 'react';
import { useNode } from '@craftjs/core';

interface CraftCardProps {
  title?: string;
  children?: React.ReactNode;
  padding?: number;
}

export const CraftCard: React.FC<CraftCardProps> & { craft?: any } = ({
  title = 'Card Title',
  children,
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
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${
        selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''
      }`}
    >
      {title && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div style={{ padding: `${padding * 4}px` }} className="min-h-[100px]">
        {children}
      </div>
    </div>
  );
};

CraftCard.craft = {
  displayName: 'Card',
  props: {
    title: 'Card Title',
    padding: 4,
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};

