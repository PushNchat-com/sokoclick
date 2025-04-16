import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';
import Container from '../ui/Container';
import Button from '../ui/Button';

const Header = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user has admin role
  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <header className="site-header">
      <Container>
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Logo variant="default" />
            </Link>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50">
              {t('home')}
            </Link>
            <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50">
              {t('about')}
            </Link>
            <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50">
              {t('contact')}
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-primary-600 hover:bg-primary-50">
                  {t('admin.dashboard')}
                </Link>
                <Link to="/design-system" className="px-3 py-2 rounded-md text-sm font-medium text-accent-600 hover:bg-accent-50">
                  Design System
                </Link>
              </>
            )}
            {user && (
              <Link to="/messages" className="px-3 py-2 rounded-md text-sm font-medium text-green-600 hover:bg-green-50">
                {t('whatsapp.conversations')}
              </Link>
            )}
          </div>
          
          <div className="flex items-center">
            <LanguageSelector />
            
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="relative flex items-center space-x-3">
                  <span className="hidden md:inline-block text-sm text-gray-600">
                    {user.email}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => signOut()}
                  >
                    {t('signOut')}
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login">
                    <Button variant="primary" size="sm">
                      {t('signIn')}
                    </Button>
                  </Link>
                  <Link to="/register" className="hidden md:inline-block">
                    <Button variant="outline" size="sm">
                      {t('register')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">{t('openMenu')}</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </Container>

      {mobileMenuOpen && (
        <div className="md:hidden shadow-lg border-t">
          <Container>
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('about')}
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('contact')}
              </Link>
              {isAdmin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-primary-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('admin.dashboard')}
                  </Link>
                  <Link
                    to="/design-system"
                    className="block px-3 py-2 rounded-md text-base font-medium text-accent-600 hover:bg-accent-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Design System
                  </Link>
                </>
              )}
              {user && (
                <Link
                  to="/messages"
                  className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-green-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('whatsapp.conversations')}
                </Link>
              )}
              {!user && (
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('register')}
                </Link>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
};

export default Header; 