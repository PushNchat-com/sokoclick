import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import supabase from '../../services/supabase';
import { getUserProfile } from '../../services/auth';
import { UserRole } from '../../types/auth';
import logoImage from '../../assets/images/logo.svg';

interface LocationState {
  from?: string;
}

// Admin emails that should always be allowed access
const TRUSTED_ADMIN_EMAILS = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];

const AdminLogin: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    error: '',
    loading: false,
    debugInfo: '',
    message: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Get redirect path from location state or default to admin dashboard
  const from = (location.state as LocationState)?.from || '/admin';

  // Handle form field changes
  const handleFieldChange = useCallback((field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      // Clear any existing error when user starts typing
      error: ''
    }));
    
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!formState.email) {
      errors.email = t(text.errors.emailRequired);
    } else if (!/^\S+@\S+\.\S+$/.test(formState.email)) {
      errors.email = t(text.errors.invalidEmail);
    }
    
    if (!formState.password) {
      errors.password = t(text.errors.passwordRequired);
    } else if (formState.password.length < 8) {
      errors.password = t(text.errors.passwordLength);
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState.email, formState.password, t]);
  
  // Handle form submission - direct authentication without context
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setFormState(prev => ({ 
        ...prev, 
        loading: true, 
        error: '',
        message: '',
        debugInfo: '' 
      }));
      
      // Check if using trusted admin email
      const isTrustedAdmin = TRUSTED_ADMIN_EMAILS.includes(formState.email.toLowerCase());
      
      // Direct authentication with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formState.email,
        password: formState.password
      });
      
      if (error) {
        // Handle specific error cases
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = t(text.errors.invalidCredentials);
        } else if (error.message.includes('rate limit')) {
          errorMessage = t(text.errors.tooManyAttempts);
        }
        
        setFormState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
        return;
      }
      
      if (!data.user) {
        setFormState(prev => ({
          ...prev,
          error: t(text.errors.loginFailed),
          loading: false
        }));
        return;
      }
      
      // Security check: Track this login attempt
      try {
        // Replace API call with direct Supabase insertion to admin_access_logs
        await supabase.from('admin_access_logs').insert({
          admin_id: data.user.id,
          email: formState.email,
          action: 'admin_login_attempt',
          ip_address: null, // Can't reliably get client IP on frontend
          user_agent: navigator.userAgent,
          success: true
        });
      } catch (err) {
        console.warn('Failed to log admin access attempt:', err);
        // Non-blocking error - continue authentication flow
      }
      
      // Get user profile to check role
      const userProfile = await getUserProfile(data.user.id);
      
      // Debug information for troubleshooting - only show in development
      if (process.env.NODE_ENV === 'development') {
        const debugInfo = JSON.stringify({
          userId: data.user.id,
          email: data.user.email,
          userProfile: userProfile ? {
            id: userProfile.id,
            email: userProfile.email,
            role: userProfile.role
          } : null
        }, null, 2);
        
        setFormState(prev => ({
          ...prev,
          debugInfo
        }));
      }
      
      // Allow trusted admin emails to bypass role check
      if (!userProfile) {
        if (isTrustedAdmin) {
          console.log('Allowing trusted admin without profile:', formState.email);
          setFormState(prev => ({
            ...prev, 
            message: 'Welcome, trusted admin!',
            loading: false
          }));
          
          setTimeout(() => {
            navigate(from);
          }, 1000);
          return;
        }
        
        await supabase.auth.signOut();
        setFormState(prev => ({
          ...prev,
          error: t(text.errors.profileNotFound),
          loading: false
        }));
        return;
      }
      
      // Verify this is an admin account - with bypass for trusted emails
      if (userProfile.role !== UserRole.SUPER_ADMIN && !isTrustedAdmin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        
        setFormState(prev => ({
          ...prev,
          error: t(text.errors.noAdminPrivileges),
          loading: false
        }));
        return;
      }
      
      // Login successful, navigate to admin dashboard or requested page
      setFormState(prev => ({
        ...prev,
        message: t(text.success.welcome),
        loading: false
      }));
      
      setTimeout(() => {
        navigate(from);
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setFormState(prev => ({
        ...prev,
        error: t(text.errors.unknownError),
        loading: false,
        debugInfo: process.env.NODE_ENV === 'development' ? errorMessage : ''
      }));
    }
  }, [formState.email, formState.password, validateForm, navigate, from, t]);

  // Text content with expanded error messages
  const text = {
    title: { en: 'Admin Login', fr: 'Connexion Administrateur' },
    description: { en: 'Sign in to access the admin dashboard', fr: 'Connectez-vous pour accéder au tableau de bord administrateur' },
    email: { en: 'Email address', fr: 'Adresse email' },
    password: { en: 'Password', fr: 'Mot de passe' },
    signIn: { en: 'Sign in', fr: 'Se connecter' },
    signingIn: { en: 'Signing in...', fr: 'Connexion en cours...' },
    success: {
      welcome: { en: 'Welcome! Redirecting...', fr: 'Bienvenue ! Redirection...' }
    },
    errors: {
      emailRequired: { en: 'Email is required', fr: "L'email est requis" },
      invalidEmail: { en: 'Please enter a valid email address', fr: 'Veuillez entrer une adresse email valide' },
      passwordRequired: { en: 'Password is required', fr: 'Le mot de passe est requis' },
      passwordLength: { en: 'Password must be at least 8 characters', fr: 'Le mot de passe doit comporter au moins 8 caractères' },
      invalidCredentials: { en: 'Invalid email or password', fr: 'Email ou mot de passe invalide' },
      loginFailed: { en: 'Login failed. Please try again.', fr: 'Échec de la connexion. Veuillez réessayer.' },
      profileNotFound: { en: 'User profile not found', fr: 'Profil utilisateur introuvable' },
      noAdminPrivileges: { en: 'This account does not have admin privileges', fr: "Ce compte ne dispose pas des privilèges d'administrateur" },
      tooManyAttempts: { en: 'Too many login attempts. Please try again later.', fr: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.' },
      unknownError: { en: 'An error occurred. Please try again.', fr: 'Une erreur est survenue. Veuillez réessayer.' }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <img src={logoImage} alt="SokoClick Logo" className="h-12 w-auto mb-8" />
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            {t(text.title)}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t(text.description)}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t(text.email)}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                disabled={formState.loading}
                value={formState.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${validationErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600" role="alert">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t(text.password)}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                aria-required="true"
                disabled={formState.loading}
                value={formState.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${validationErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50`}
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600" role="alert">{validationErrors.password}</p>
              )}
            </div>
          </div>

          {formState.error && (
            <div className="rounded-md bg-red-50 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{formState.error}</p>
                  {formState.debugInfo && (
                    <details className="mt-1">
                      <summary className="text-xs cursor-pointer">Debug Info</summary>
                      <pre className="text-xs mt-1 overflow-x-auto p-2 bg-gray-100 rounded">{formState.debugInfo}</pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {formState.message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{formState.message}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={formState.loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {formState.loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t(text.signingIn)}
                </>
              ) : (
                t(text.signIn)
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 