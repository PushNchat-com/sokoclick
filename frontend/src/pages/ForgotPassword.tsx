import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(t('pleaseEnterEmail'));
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        throw new Error(resetError.message);
      }
      
      setSuccess(t('passwordResetEmailSent'));
      setEmail('');
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
              {t('forgotPassword')}
            </h1>
            <p className="text-center text-gray-600">
              {t('enterEmailForPasswordReset')}
            </p>
          </div>
          
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('emailPlaceholder')}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
              {loading ? t('sending') : t('sendResetLink')}
              {loading && (
                <svg className="ml-2 w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {t('rememberPassword')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500">
                {t('signIn')}
              </Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPassword; 