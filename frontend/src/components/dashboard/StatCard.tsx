import React from 'react';
import clsx from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  helperText?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  helperText,
  className,
}) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow p-5', className)}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          
          {change && (
            <div className="mt-1 flex items-center">
              <span
                className={clsx(
                  'text-sm font-medium',
                  change.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
              </span>
            </div>
          )}
          
          {helperText && (
            <p className="mt-1 text-sm text-gray-500">{helperText}</p>
          )}
        </div>
        
        {icon && (
          <div className="rounded-md bg-primary-50 p-3 text-primary-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard; 