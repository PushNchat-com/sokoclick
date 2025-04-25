import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { validatePasswordStrength, validateResetToken, trackSecurityEvent } from '../../utils/securityUtils';
import { supabase } from '../../services/supabase';

const ResetPassword: React.FC = () => {
  const { t } = useLanguage();
  const { updateUser, loading, error, clearError } = useUnifiedAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({
    score: 0,
    feedback: ''
  });
  
  // Enhanced text content
  const text = {
    title: { en: 'Reset your password', fr: 'Réinitialiser votre mot de passe' },
    description: { en: 'Enter your new password below', fr: 'Entrez votre nouveau mot de passe ci-dessous' },
    newPassword: { en: 'New password', fr: 'Nouveau mot de passe' },
    confirmPassword: { en: 'Confirm password', fr: 'Confirmer le mot de passe' },
    submitButton: { en: 'Reset password', fr: 'Réinitialiser le mot de passe' },
    processing: { en: 'Resetting...', fr: 'Réinitialisation en cours...' },
    successMessage: { en: 'Your password has been reset successfully. Redirecting to login...', 
                     fr: 'Votre mot de passe a été réinitialisé avec succès. Redirection vers la page de connexion...' },
    errors: {
      passwordRequired: { en: 'Password is required', fr: 'Le mot de passe est requis' },
      passwordLength: { en: 'Password must be at least 8 characters', fr: 'Le mot de passe doit comporter au moins 8 caractères' },
      passwordsMatch: { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
      unknown: { en: 'An unknown error occurred', fr: 'Une erreur inconnue est survenue' }
    },
    passwordStrength: {
      weak: { en: 'Weak', fr: 'Faible' },
      medium: { en: 'Medium', fr: 'Moyen' },
      strong: { en: 'Strong', fr: 'Fort' }
    },
    tokenError: {
      invalid: { en: 'Invalid or expired reset link', fr: 'Lien de réinitialisation invalide ou expiré' },
      expired: { en: 'Reset link has expired. Please request a new one.', fr: 'Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.' }
    }
  };
  
  // Get and validate the token from the URL
  const hash = location.hash;
  
  useEffect(() => {
    const validateToken = async () => {
      // Check if there's a hash in the URL (Supabase auth redirect)
      if (hash && hash.includes('type=recovery')) {
        const isValid = validateResetToken(hash);
        if (!isValid) {
          setFormError(t(text.tokenError.invalid));
          // Redirect to forgot password after delay
          setTimeout(() => {
            navigate('/forgot-password');
          }, 3000);
        }
      } else {
        // No hash, redirect to forgot password
        navigate('/forgot-password');
      }
    };
    
    validateToken();
  }, [hash, navigate, t]);
  
  // Handle password change with strength check
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPassword(value);
    
    const result = validatePasswordStrength(value);
    const unmetCount = result.unmetRequirements.length;
    const score = 5 - unmetCount;
    
    setPasswordStrength({
      score,
      feedback: unmetCount > 0 ? result.unmetRequirements[0][t.language] : ''
    });
  };
  
  const validateForm = (): boolean => {
    clearError();
    setFormError('');
    
    if (!password) {
      setFormError(t(text.errors.passwordRequired));
      return false;
    }
    
    const result = validatePasswordStrength(password);
    if (!result.isValid) {
      setFormError(result.unmetRequirements.map(req => t(req)).join(', '));
      return false;
    }
    
    if (password !== confirmPassword) {
      setFormError(t(text.errors.passwordsMatch));
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Track password reset attempt
      await trackSecurityEvent('password_reset', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      
      // Use Supabase method to update password
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        setFormError(error.message);
        return;
      }
      
      // Track successful password change
      await trackSecurityEvent('password_change', {
        success: true,
        timestamp: new Date().toISOString()
      });
      
      setSuccessMessage(t(text.successMessage));
      
      // Redirect to login after short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setFormError(t(text.errors.unknown));
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
                <label htmlFor="password" className="sr-only">
                  {t(text.newPassword)}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t(text.newPassword)}
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-1 p-3 bg-gray-50 border-x border-gray-300">
                  <div className="flex items-center">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score <= 3 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {passwordStrength.score <= 2 ? t(text.passwordStrength.weak) :
                       passwordStrength.score <= 3 ? t(text.passwordStrength.medium) :
                       t(text.passwordStrength.strong)}
                    </span>
                  </div>
                  {passwordStrength.feedback && (
                    <p className="mt-1 text-sm text-gray-600">{passwordStrength.feedback}</p>
                  )}
                </div>
              )}
              
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  {t(text.confirmPassword)}
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t(text.confirmPassword)}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
      </div>
    </div>
  );
};

export default ResetPassword; 