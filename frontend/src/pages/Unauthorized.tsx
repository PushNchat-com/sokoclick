import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole, updateUserRole } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');

  // Get role from URL query param
  const searchParams = new URLSearchParams(location.search);
  const requiredRole = searchParams.get('role') || 'admin';

  // Debug function to force update user role
  const forceUpdateUserRole = async (role: 'admin' | 'seller' | 'buyer') => {
    if (!user) return;
    
    setIsUpdating(true);
    setDebugMessage('Updating role...');
    
    try {
      const { error } = await updateUserRole(role);
      
      if (error) {
        setDebugMessage(`Error updating role: ${error.message}`);
      } else {
        setDebugMessage(`Role updated to ${role}. Redirecting in 2 seconds...`);
        setTimeout(() => {
          navigate(`/${role}`);
        }, 2000);
      }
    } catch (err) {
      setDebugMessage(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Container size="small" className="py-12">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">{t('unauthorized')}</h1>
            <p className="text-gray-600 mb-6">{t('unauthorizedMessage')}</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                {t('backToHome')}
              </Button>
              <Button variant="primary" onClick={() => navigate('/login', { state: { from: `/${requiredRole}` } })}>
                {t('signIn')}
              </Button>
            </div>

            {/* Debug section (hidden by default) */}
            <div className="mt-12 border-t pt-4">
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
              
              {showDebug && (
                <div className="mt-4 text-left p-4 bg-gray-50 rounded border">
                  <h3 className="font-medium mb-2">Debug Information</h3>
                  <p className="text-sm mb-2">Current user: {user?.email || 'Not logged in'}</p>
                  <p className="text-sm mb-2">Current role: {userRole || 'None'}</p>
                  <p className="text-sm mb-4">Required role: {requiredRole}</p>
                  
                  {debugMessage && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      {debugMessage}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => forceUpdateUserRole('admin')}
                      disabled={isUpdating}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Force Admin Role
                    </button>
                    <button
                      onClick={() => forceUpdateUserRole('seller')}
                      disabled={isUpdating}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Force Seller Role
                    </button>
                    <button
                      onClick={() => forceUpdateUserRole('buyer')}
                      disabled={isUpdating}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Force Buyer Role
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

export default Unauthorized; 