import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const { t } = useTranslation();
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if the user is authenticated through the reset password link
  useEffect(() => {
    // If user is not set, it means they are not authenticated via the reset link
    if (!user) {
      setError(t('invalidResetLink'));
    }
  }, [user, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError(t('pleaseEnterNewPassword'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      const { error: updateError } = await updatePassword(password);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Redirect to login page after successful password reset
      navigate('/login', { 
        replace: true,
        state: { message: t('passwordResetSuccessful') }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError'));
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {t('resetPassword')}
            </h1>
            <p className="text-center text-gray-600">
              {t('createNewPassword')}
            </p>
          </div>
          
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('newPassword')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('passwordPlaceholder')}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirmNewPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('confirmPasswordPlaceholder')}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !user}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
              {loading ? t('resetting') : t('resetPassword')}
              {loading && (
                <svg className="ml-2 w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResetPassword; 