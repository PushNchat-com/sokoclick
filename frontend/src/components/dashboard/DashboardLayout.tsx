import React, { ReactNode } from 'react';
import clsx from 'clsx';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
  contentClassName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  header,
  sidebar,
  className,
  contentClassName,
}) => {
  return (
    <div className={clsx('min-h-screen bg-gray-50', className)}>
      {header && <div className="sticky top-0 z-10 bg-white border-b border-gray-200">{header}</div>}
      
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        {sidebar && (
          <div className="hidden md:block w-64 border-r border-gray-200 bg-white h-full overflow-y-auto">
            {sidebar}
          </div>
        )}
        
        <main className={clsx('flex-1 overflow-y-auto p-6', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 