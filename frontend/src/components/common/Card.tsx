import React, { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode; // Changed from string to ReactNode to support JSX elements
  subtitle?: string;
  action?: ReactNode;
  actions?: ReactNode; // Support both 'action' and 'actions'
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  actions,
}) => {
  const actionElement = actions || action; // Support both props
  
  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {(title || actionElement) && (
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actionElement && <div>{actionElement}</div>}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
};


