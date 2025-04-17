import React from 'react';
import clsx from 'clsx';

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Badge content
   */
  children: React.ReactNode;
  /**
   * Badge color
   */
  color?: BadgeColor;
  /**
   * Badge size variant
   */
  size?: BadgeSize;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Badge component for displaying status indicators, labels, or counts
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  color = 'primary',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap';
  
  const colorClasses = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-sky-100 text-sky-800'
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };
  
  return (
    <span 
      className={clsx(
        baseClasses,
        colorClasses[color],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge; 