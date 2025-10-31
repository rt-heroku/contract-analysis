import React from 'react';
import { useNode } from '@craftjs/core';

interface ContainerProps {
  children?: React.ReactNode;
  padding?: number;
  background?: string;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  padding = 4,
  background = 'transparent',
  className = '',
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
      className={`${selected ? 'ring-2 ring-primary-500' : ''} ${className}`}
      style={{
        padding: `${padding * 4}px`,
        background,
        minHeight: '100px',
      }}
    >
      {children}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    padding: 4,
    background: 'transparent',
    className: '',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
};

