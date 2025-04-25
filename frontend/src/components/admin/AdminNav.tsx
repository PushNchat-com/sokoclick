import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { 
  DashboardIcon, 
  ProductIcon, 
  CategoryIcon, 
  UsersIcon, 
  AnalyticsIcon, 
  SettingsIcon,
  MenuIcon,
  XIcon
} from '../ui/Icons';

interface NavItem {
  path: string;
  label: { en: string; fr: string };
  icon: React.ReactNode;
  badge?: number;
}

const AdminNav: React.FC = () => {
  const { t } = useLanguage();
  const { user, signOut } = useUnifiedAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items
  const navItems: NavItem[] = [
    {
      path: '/admin/dashboard',
      label: { en: 'Dashboard', fr: 'Tableau de bord' },
      icon: <DashboardIcon className="w-5 h-5" />,
      badge: 0
    },
    {
      path: '/admin/products',
      label: { en: 'Products', fr: 'Produits' },
      icon: <ProductIcon className="w-5 h-5" />,
      badge: 0
    },
    {
      path: '/admin/slots',
      label: { en: 'Slot Management', fr: 'Gestion des emplacements' },
      icon: <CategoryIcon className="w-5 h-5" />,
      badge: 0
    },
    {
      path: '/admin/users',
      label: { en: 'User Management', fr: 'Gestion des utilisateurs' },
      icon: <UsersIcon className="w-5 h-5" />,
      badge: 0
    },
    {
      path: '/admin/analytics',
      label: { en: 'Analytics', fr: 'Analytique' },
      icon: <AnalyticsIcon className="w-5 h-5" />,
      badge: 0
    },
    {
      path: '/admin/settings',
      label: { en: 'Settings', fr: 'Paramètres' },
      icon: <SettingsIcon className="w-5 h-5" />,
      badge: 0
    },
    {
      path: '/admin/transactions',
      label: { en: 'Transactions', fr: 'Transactions' },
      icon: <i className="fas fa-credit-card mr-3" />,
      badge: 0
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
        {/* Admin logo and title */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">SokoClick Admin</h1>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              {t({ en: 'Welcome', fr: 'Bienvenue' })}, {user.firstName || user.email}
            </p>
          )}
        </div>

        {/* Nav links */}
        <div className="py-4 flex-grow">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600' : ''
                    }`
                  }
                >
                  <span className="mr-3 text-gray-500">{item.icon}</span>
                  <span>{t(item.label)}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-semibold">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.firstName || user?.email}</p>
              <p className="text-xs text-gray-500">{t({ en: 'Admin', fr: 'Administrateur' })}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <h1 className="text-lg font-bold text-indigo-600">SokoClick Admin</h1>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="bg-white border-b border-gray-200 shadow-lg">
            <ul className="py-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 ${
                        isActive ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : ''
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3 text-gray-500">{item.icon}</span>
                    <span>{t(item.label)}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminNav; 