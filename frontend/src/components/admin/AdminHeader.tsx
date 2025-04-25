import React from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowRightIcon } from '../ui/Icons';

interface Breadcrumb {
  label: { en: string; fr: string };
  path?: string;
}

export interface AdminHeaderProps {
  title: { en: string; fr: string };
  description?: { en: string; fr: string };
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode[];
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  title, 
  description, 
  breadcrumbs = [],
  actions = [] 
}) => {
  const { t } = useLanguage();

  return (
    <div className="pb-5 mb-6 border-b border-gray-200">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex mb-3" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link 
                to="/admin/dashboard" 
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600"
              >
                {t({ en: 'Dashboard', fr: 'Tableau de bord' })}
              </Link>
            </li>
            
            {breadcrumbs.map((crumb, index) => (
              <li key={index}>
                <div className="flex items-center">
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  {crumb.path ? (
                    <Link
                      to={crumb.path}
                      className="ml-1 text-sm font-medium text-gray-500 hover:text-indigo-600 md:ml-2"
                    >
                      {t(crumb.label)}
                    </Link>
                  ) : (
                    <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2">
                      {t(crumb.label)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t(title)}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {t(description)}
            </p>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="flex space-x-3">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHeader; 