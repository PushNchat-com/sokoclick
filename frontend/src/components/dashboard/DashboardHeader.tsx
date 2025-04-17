import React from 'react';
import Button from '../ui/Button';

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="mt-4 flex-shrink-0 sm:mt-0">{actions}</div>
      )}
    </div>
  );
};

export default DashboardHeader; 