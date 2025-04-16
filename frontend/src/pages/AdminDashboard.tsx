import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SlotManager from '../components/admin/SlotManager';
import { useAuth } from '../context/AuthContext';

type AdminTab = 'slots' | 'products' | 'users' | 'analytics';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('slots');
  const { user, updateUserRole } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Log user information on component mount for debugging
  useEffect(() => {
    if (user) {
      const userInfo = {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        role: user.user_metadata?.role
      };
      console.log('AdminDashboard - User Info:', userInfo);
      setDebugInfo(JSON.stringify(userInfo, null, 2));
    } else {
      console.log('AdminDashboard - No user found');
      setDebugInfo('No user data available');
    }
  }, [user]);

  const isAdmin = user?.user_metadata?.role === 'admin';
  const isAdminEmail = user?.email === 'sokoclick.com@gmail.com' || user?.email === 'strength.cm@gmail.com';

  const setAdminRole = async () => {
    if (!user) return;
    try {
      const result = await updateUserRole('admin');
      if (result.error) {
        console.error('Failed to set admin role:', result.error);
        setDebugInfo(prev => prev + '\n\nError setting admin role: ' + result.error.message);
      } else {
        console.log('Successfully set admin role');
        setDebugInfo(prev => prev + '\n\nAdmin role set successfully!');
        // Force refresh to get the updated user data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error in setAdminRole:', error);
      setDebugInfo(prev => prev + '\n\nException: ' + String(error));
    }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'slots', label: t('admin.tabs.slots') },
    { id: 'products', label: t('admin.tabs.products') },
    { id: 'users', label: t('admin.tabs.users') },
    { id: 'analytics', label: t('admin.tabs.analytics') },
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-6 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <svg 
                className="w-16 h-16 text-error-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t('admin.accessDenied')}</h2>
              <p className="text-gray-600 mb-4">{t('admin.adminRoleRequired')}</p>
              
              {/* Debug information */}
              <div className="mt-4 mb-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-60">
                <h3 className="font-bold mb-2">Debug Information:</h3>
                <pre>{debugInfo}</pre>
              </div>
              
              {/* Show admin role button only for admin emails */}
              {isAdminEmail && (
                <button 
                  onClick={setAdminRole}
                  className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Set Admin Role
                </button>
              )}
              
              <a 
                href="/"
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                {t('backToHome')}
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
            <p className="text-sm text-gray-500">{t('admin.dashboardDescription')}</p>
          </div>
          
          {/* Optional debug section for admin */}
          <div className="mb-6 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-40">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <pre>{debugInfo}</pre>
          </div>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4">
              {activeTab === 'slots' && <SlotManager />}
              
              {activeTab === 'products' && (
                <div className="p-4 text-center">
                  <p className="text-gray-500">{t('admin.productManagementComingSoon')}</p>
                </div>
              )}
              
              {activeTab === 'users' && (
                <div className="p-4 text-center">
                  <p className="text-gray-500">{t('admin.userManagementComingSoon')}</p>
                </div>
              )}
              
              {activeTab === 'analytics' && (
                <div className="p-4 text-center">
                  <p className="text-gray-500">{t('admin.analyticsComingSoon')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard; 