import React from 'react';
import clsx from 'clsx';

export type BadgeColor = 'success' | 'info' | 'warning' | 'danger' | 'accent' | 'default';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  /**
   * Badge content
   */
  children: React.ReactNode;
  /**
   * Badge color variant
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
  color = 'default',
  size = 'small',
  className,
}) => {
  const badgeClasses = clsx(
    'inline-flex items-center justify-center rounded-full font-medium',
    {
      // Color variants
      'bg-green-100 text-green-800': color === 'success',
      'bg-blue-100 text-blue-800': color === 'info',
      'bg-yellow-100 text-yellow-800': color === 'warning',
      'bg-red-100 text-red-800': color === 'danger',
      'bg-purple-100 text-purple-800': color === 'accent',
      'bg-gray-100 text-gray-800': color === 'default',
      
      // Size variants
      'text-xs px-2 py-0.5': size === 'small',
      'text-sm px-2.5 py-1': size === 'medium',
      'text-base px-3 py-1.5': size === 'large',
    },
    className
  );

  return <span className={badgeClasses}>{children}</span>;
};

export default Badge; 