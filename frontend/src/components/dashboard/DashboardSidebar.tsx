import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: SidebarNavItem[];
}

interface DashboardSidebarProps {
  navItems: SidebarNavItem[];
  logoText?: string;
  className?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  navItems,
  logoText = 'SokoClick',
  className,
}) => {
  const location = useLocation();
  const { user, userRole, userWithRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const displayName = userWithRole?.display_name || userRole || '';
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : '';

  const toggleExpanded = (itemHref: string) => {
    setExpandedItems(prev => 
      prev.includes(itemHref)
        ? prev.filter(item => item !== itemHref)
        : [...prev, itemHref]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const renderNavItem = (item: SidebarNavItem) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const expanded = expandedItems.includes(item.href);

    return (
      <li key={item.href} className="mb-1">
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleExpanded(item.href)}
              className={clsx(
                'flex items-center w-full px-3 py-2 text-sm rounded-md',
                active 
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              <svg
                className={clsx(
                  'ml-2 h-4 w-4 transition-transform',
                  expanded ? 'transform rotate-180' : ''
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expanded && (
              <ul className="mt-1 ml-8 space-y-1">
                {item.children?.map((child) => (
                  <li key={child.href}>
                    <NavLink
                      to={child.href}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center px-3 py-2 text-sm rounded-md',
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        )
                      }
                    >
                      <span className="mr-3">{child.icon}</span>
                      <span>{child.label}</span>
                      {child.badge && (
                        <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                          {child.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <NavLink
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3 py-2 text-sm rounded-md',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              )
            }
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        )}
      </li>
    );
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Logo variant="small" />
          <span className="ml-2 font-bold text-gray-900">{logoText}</span>
        </div>
      </div>
      
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map(renderNavItem)}
        </ul>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
            {userInitial}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">
              {userRole === 'admin' ? 'Administrator' : userRole === 'seller' ? 'Seller' : 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar; 