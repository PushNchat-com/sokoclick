import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../store/LanguageContext';

const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const { resetPassword, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Text content
  const text = {
    title: { en: 'Reset your password', fr: 'Réinitialiser votre mot de passe' },
    description: { en: 'Enter your email address and we will send you instructions to reset your password', 
                  fr: 'Entrez votre adresse email et nous vous enverrons des instructions pour réinitialiser votre mot de passe' },
    email: { en: 'Email address', fr: 'Adresse email' },
    submitButton: { en: 'Send reset link', fr: 'Envoyer le lien de réinitialisation' },
    processing: { en: 'Sending...', fr: 'Envoi en cours...' },
    successMessage: { en: 'Check your email for a password reset link', 
                     fr: 'Vérifiez votre email pour un lien de réinitialisation du mot de passe' },
    rememberPassword: { en: 'Remember your password?', fr: 'Vous vous souvenez de votre mot de passe?' },
    loginAction: { en: 'Sign in', fr: 'Se connecter' },
    errors: {
      emailRequired: { en: 'Email is required', fr: "L'email est requis" },
      emailInvalid: { en: 'Please enter a valid email', fr: 'Veuillez entrer un email valide' }
    }
  };

  const validateForm = (): boolean => {
    clearError();
    setFormError('');
    setSuccessMessage('');
    
    if (!email.trim()) {
      setFormError(t(text.errors.emailRequired));
      return false;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError(t(text.errors.emailInvalid));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const { success, error } = await resetPassword(email);
      
      if (success) {
        setSuccessMessage(t(text.successMessage));
        setEmail('');
      } else if (error) {
        setFormError(error);
      }
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t(text.title)}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t(text.description)}
          </p>
        </div>
        
        {successMessage ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  {t(text.email)}
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t(text.email)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {(error || formError) && (
              <div className="text-red-500 text-sm">
                {formError || error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? t(text.processing) : t(text.submitButton)}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          <p className="text-sm">
            {t(text.rememberPassword)}{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              {t(text.loginAction)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 