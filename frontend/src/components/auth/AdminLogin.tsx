import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { UserRole } from '../../types/auth';
import logoImage from '../../assets/images/logo.svg';

interface LocationState {
  from?: string;
}

// Text content with translations
const text = {
  title: {
    en: 'Admin Login',
    fr: 'Connexion Admin'
  },
  description: {
    en: 'Sign in to your admin account',
    fr: 'Connectez-vous à votre compte administrateur'
  },
  email: {
    en: 'Email address',
    fr: 'Adresse email'
  },
  password: {
    en: 'Password',
    fr: 'Mot de passe'
  },
  loginAction: {
    en: 'Sign in',
    fr: 'Se connecter'
  },
  loggingIn: {
    en: 'Signing in...',
    fr: 'Connexion en cours...'
  },
  backToSite: {
    en: 'Back to site',
    fr: 'Retour au site'
  },
  errors: {
    emailRequired: {
      en: 'Email is required',
      fr: 'L\'email est requis'
    },
    invalidEmail: {
      en: 'Please enter a valid email address',
      fr: 'Veuillez entrer une adresse email valide'
    },
    passwordRequired: {
      en: 'Password is required',
      fr: 'Le mot de passe est requis'
    },
    passwordLength: {
      en: 'Password should be at least 8 characters',
      fr: 'Le mot de passe doit comporter au moins 8 caractères'
    },
    invalidCredentials: {
      en: 'Invalid email or password',
      fr: 'Email ou mot de passe invalide'
    },
    noAdminPrivileges: {
      en: 'This account does not have admin privileges',
      fr: 'Ce compte ne dispose pas de privilèges administrateur'
    },
    loginFailed: {
      en: 'Login failed. Please try again',
      fr: 'Échec de la connexion. Veuillez réessayer'
    },
    tooManyAttempts: {
      en: 'Too many login attempts. Please try again later',
      fr: 'Trop de tentatives de connexion. Veuillez réessayer plus tard'
    },
    profileNotFound: {
      en: 'Admin profile not found',
      fr: 'Profil administrateur introuvable'
    }
  }
};

const AdminLogin: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signOut, user, isAdmin } = useUnifiedAuth();
  
  const [formState, setFormState] = useState({
    email: '',
    password: '',
    error: '',
    loading: false,
    message: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Get redirect path from location state or default to admin dashboard
  const from = (location.state as LocationState)?.from || '/admin';

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate(from);
    }
  }, [user, isAdmin, navigate, from]);

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
  
  // Handle form submission using UnifiedAuthContext
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setFormState(prev => ({ 
        ...prev, 
        loading: true, 
        error: '',
        message: ''
      }));
      
      // Use the unified auth service for sign in
      const response = await signIn(formState.email, formState.password);
      
      if (response.error) {
        // Handle error case
        let errorMessage = response.error;
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = t(text.errors.invalidCredentials);
        } else if (errorMessage.includes('rate limit')) {
          errorMessage = t(text.errors.tooManyAttempts);
        }
        
        setFormState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
        return;
      }
      
      if (!response.user) {
        setFormState(prev => ({
          ...prev,
          error: t(text.errors.loginFailed),
          loading: false
        }));
        return;
      }
      
      // Check if user has admin privileges
      if (!response.user.isAdmin) {
        setFormState(prev => ({
          ...prev,
          error: t(text.errors.noAdminPrivileges),
          loading: false
        }));
        
        // Sign out if not admin
        await signOut();
        return;
      }
      
      // Login successful, navigate to admin dashboard or requested page
      setFormState(prev => ({
        ...prev,
        message: `Welcome, ${response.user?.name || response.user?.email}!`,
        loading: false
      }));
      
      // Navigate to the admin dashboard or requested page
      navigate(from);
      
    } catch (error) {
      console.error('Admin login error:', error);
      setFormState(prev => ({
        ...prev,
        error: t(text.errors.loginFailed),
        loading: false
      }));
    }
  }, [formState.email, formState.password, signIn, signOut, navigate, from, t, validateForm]);

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

        {formState.error && (
          <div className="rounded-md bg-red-50 p-4 animate-shake" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{formState.error}</p>
              </div>
            </div>
          </div>
        )}

        {formState.message && (
          <div className="rounded-md bg-green-50 p-4 animate-fadeIn" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{formState.message}</p>
              </div>
            </div>
          </div>
        )}

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

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={formState.loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {formState.loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t(text.loggingIn)}
                </span>
              ) : (
                t(text.loginAction)
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
          >
            {t(text.backToSite)}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 