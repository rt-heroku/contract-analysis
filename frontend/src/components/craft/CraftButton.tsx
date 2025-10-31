import React from 'react';
import { useNode } from '@craftjs/core';

interface CraftButtonProps {
  text?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const CraftButton: React.FC<CraftButtonProps> & { craft?: any } = ({
  text = 'Button',
  variant = 'primary',
  size = 'md',
  onClick,
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-600 dark:hover:bg-primary-700',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      ref={(ref) => ref && connect(drag(ref))}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${selected ? 'ring-2 ring-primary-500' : ''}`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

CraftButton.craft = {
  displayName: 'Button',
  props: {
    text: 'Button',
    variant: 'primary',
    size: 'md',
  },
  rules: {
    canDrag: () => true,
  },
};

