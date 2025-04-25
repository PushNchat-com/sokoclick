import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { useLanguage } from '../../store/LanguageContext';
import ResponsiveImage from '../ui/ResponsiveImage';
import logoImage from '../../assets/images/logo.svg';

interface LocationState {
  from?: string;
  registered?: boolean;
}

const Login: React.FC = () => {
  const { signIn, user } = useUnifiedAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const from = state?.from || '/dashboard';
  const showSuccessMessage = state?.registered || false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [validation, setValidation] = useState({ email: '', password: '' });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Text content
  const text = {
    title: 'Sign in to your account',
    description: 'Enter your details below',
    email: 'Email address',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginAction: 'Sign in',
    loggingIn: 'Signing in...',
    noAccount: "Don't have an account?",
    signupAction: 'Sign up',
    invalidCredentials: 'Invalid email or password',
    serverError: 'An error occurred. Please try again.',
    registerSuccess: 'Registration successful! Please sign in.',
    errors: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordInvalid: 'Password must be at least 6 characters'
    }
  };

  const validateEmail = (value: string): string => {
    if (!value) {
      return text.errors.emailRequired;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return text.errors.emailInvalid;
    }
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) {
      return text.errors.passwordRequired;
    }
    if (value.length < 6) {
      return text.errors.passwordInvalid;
    }
    return '';
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  const validateField = (field: 'email' | 'password') => {
    const validators = {
      email: validateEmail,
      password: validatePassword
    };

    const value = field === 'email' ? email : password;
    const validationResult = validators[field](value);
    setValidation({ ...validation, [field]: validationResult });
    return !validationResult;
  };

  const validateForm = (): boolean => {
    setFormError(null);
    
    setTouched({ email: true, password: true });
    const fields: ('email' | 'password')[] = ['email', 'password'];
    const isValid = fields.every(field => validateField(field));
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const { user, error } = await signIn(email, password);
      
      if (error) {
        setFormError(error);
        return;
      }
      
      if (user) {
        console.log('Login successful, navigating to:', from);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'Invalid login credentials') {
        setFormError(text.invalidCredentials);
      } else {
        setFormError(text.serverError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-8 rounded-lg shadow-md animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="flex justify-center mb-8">
            <img 
              src={logoImage} 
              alt="SokoClick Logo" 
              width="48" 
              height="48" 
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            {text.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {text.description}
          </p>
        </div>
        
        {showSuccessMessage && (
          <div className="rounded-md bg-green-50 p-4 mb-4 animate-slideDown" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {text.registerSuccess}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {formError && (
          <div className="rounded-md bg-red-50 p-4 mb-4 animate-shake" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {formError}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                {text.email}
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={!!validation.email}
                aria-describedby={validation.email ? 'email-error' : undefined}
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  touched.email && validation.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    validateField('email');
                  }
                }}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && validation.email && (
                <p className="mt-1 text-sm text-red-600" id="email-error" role="alert">
                  {validation.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {text.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={!!validation.password}
                aria-describedby={validation.password ? 'password-error' : undefined}
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  touched.password && validation.password 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    validateField('password');
                  }
                }}
                onBlur={() => handleBlur('password')}
              />
              {touched.password && validation.password && (
                <p className="mt-1 text-sm text-red-600" id="password-error" role="alert">
                  {validation.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                {text.rememberMe}
              </label>
            </div>
            
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                {text.forgotPassword}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{text.loggingIn}</span>
                </>
              ) : (
                <span>{text.loginAction}</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {text.noAccount}{' '}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {text.signupAction}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 