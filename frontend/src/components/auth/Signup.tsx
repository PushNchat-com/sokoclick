import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { UserRole } from '../../services/auth';
import { validatePasswordStrength, validateAndFormatPhone, trackSecurityEvent } from '../../utils/securityUtils';
import ResponsiveImage from '../ui/ResponsiveImage';
import logoImage from '../../assets/images/logo.svg';

const Signup: React.FC = () => {
  const { t } = useLanguage();
  const { signUp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const [validationError, setValidationError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  
  // Add success notification state
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({
    score: 0,
    feedback: ''
  });
  
  // Enhanced text content
  const text = {
    title: { en: 'Create your account', fr: 'Créez votre compte' },
    description: { en: 'Join SokoClick to start selling', fr: 'Rejoignez SokoClick pour commencer à vendre' },
    firstName: { en: 'First name', fr: 'Prénom' },
    lastName: { en: 'Last name', fr: 'Nom' },
    email: { en: 'Email address', fr: 'Adresse email' },
    phone: { en: 'Phone number (WhatsApp)', fr: 'Numéro de téléphone (WhatsApp)' },
    password: { en: 'Password', fr: 'Mot de passe' },
    confirmPassword: { en: 'Confirm password', fr: 'Confirmer le mot de passe' },
    processing: { en: 'Creating account...', fr: 'Création du compte...' },
    action: { en: 'Sign up', fr: "S'inscrire" },
    continueAction: { en: 'Continue', fr: 'Continuer' },
    backAction: { en: 'Back', fr: 'Retour' },
    haveAccount: { en: 'Already have an account?', fr: 'Vous avez déjà un compte?' },
    loginAction: { en: 'Sign in', fr: 'Se connecter' },
    step: { en: 'Step', fr: 'Étape' },
    of: { en: 'of', fr: 'sur' },
    personalInfo: { en: 'Personal Information', fr: 'Informations personnelles' },
    accountInfo: { en: 'Account Information', fr: 'Informations du compte' },
    errors: {
      emailRequired: { en: 'Email is required', fr: "L'email est requis" },
      emailInvalid: { en: 'Please enter a valid email', fr: 'Veuillez entrer un email valide' },
      passwordRequired: { en: 'Password is required', fr: 'Le mot de passe est requis' },
      passwordLength: { en: 'Password must be at least 8 characters', fr: 'Le mot de passe doit comporter au moins 8 caractères' },
      passwordsMatch: { en: 'Passwords do not match', fr: 'Les mots de passe ne correspondent pas' },
      firstNameRequired: { en: 'First name is required', fr: 'Le prénom est requis' },
      lastNameRequired: { en: 'Last name is required', fr: 'Le nom est requis' },
      phoneInvalid: { en: 'Please enter a valid Cameroon phone number', fr: 'Veuillez entrer un numéro de téléphone camerounais valide' }
    },
    success: {
      title: { en: 'Account created successfully!', fr: 'Compte créé avec succès!' },
      message: { 
        en: 'Your account has been created. Please check your email to verify your account before signing in.',
        fr: 'Votre compte a été créé. Veuillez vérifier votre email pour activer votre compte avant de vous connecter.'
      }
    },
    serverError: {
      en: 'An error occurred while creating your account. Please try again.',
      fr: 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer.'
    },
    terms: {
      accept: { 
        en: 'I accept the Terms and Conditions', 
        fr: "J'accepte les Conditions Générales" 
      },
      required: {
        en: 'You must accept the Terms and Conditions',
        fr: 'Vous devez accepter les Conditions Générales'
      }
    },
    passwordStrength: {
      weak: { en: 'Weak', fr: 'Faible' },
      medium: { en: 'Medium', fr: 'Moyen' },
      strong: { en: 'Strong', fr: 'Fort' }
    }
  };
  
  // Enhanced validation
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        return !value.trim() ? t(text.errors.firstNameRequired) : '';
      case 'lastName':
        return !value.trim() ? t(text.errors.lastNameRequired) : '';
      case 'email':
        if (!value.trim()) return t(text.errors.emailRequired);
        return !/^\S+@\S+\.\S+$/.test(value) ? t(text.errors.emailInvalid) : '';
      case 'phone':
        if (!value.trim()) return '';
        const { isValid } = validateAndFormatPhone(value);
        return !isValid ? t(text.errors.phoneInvalid) : '';
      case 'password':
        if (!value) return t(text.errors.passwordRequired);
        const result = validatePasswordStrength(value);
        if (!result.isValid) {
          return result.unmetRequirements.map(req => t(req)).join(', ');
        }
        return '';
      case 'confirmPassword':
        return value !== formData.password ? t(text.errors.passwordsMatch) : '';
      default:
        return '';
    }
  };
  
  // Handle field blur for validation
  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setValidation(prev => ({ ...prev, [name]: error }));
  };
  
  const validateStep = (step: number): boolean => {
    clearError();
    setValidationError('');
    
    let isValid = true;
    const newValidation: Record<string, string> = {};
    const newTouched: Record<string, boolean> = { ...touched };
    
    if (step === 1) {
      // Mark step 1 fields as touched
      ['firstName', 'lastName', 'email', 'phone'].forEach(field => {
        newTouched[field] = true;
        const value = formData[field as keyof typeof formData];
        const errorMsg = validateField(field, value);
        newValidation[field] = errorMsg;
        if (errorMsg) isValid = false;
      });
    }
    
    if (step === 2) {
      // Mark step 2 fields as touched
      ['password', 'confirmPassword'].forEach(field => {
        newTouched[field] = true;
        const value = formData[field as keyof typeof formData];
        const errorMsg = validateField(field, value);
        newValidation[field] = errorMsg;
        if (errorMsg) isValid = false;
      });
    }
    
    setTouched(newTouched);
    setValidation(newValidation);
    
    return isValid;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If field is touched, validate on change
    if (touched[name]) {
      const error = validateField(name, value);
      setValidation(prev => ({ ...prev, [name]: error }));
    }
  };
  
  // Format phone number on change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const { formatted } = validateAndFormatPhone(value);
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
  };
  
  // Handle password change with strength check
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      password: value
    }));
    
    const result = validatePasswordStrength(value);
    const unmetCount = result.unmetRequirements.length;
    const score = 5 - unmetCount;
    
    setPasswordStrength({
      score,
      feedback: unmetCount > 0 ? result.unmetRequirements[0][t.language] : ''
    });
  };
  
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setAnimationDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePreviousStep = () => {
    setAnimationDirection('backward');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    if (!acceptedTerms) {
      setValidationError(t(text.terms.required));
      return;
    }
    
    try {
      // Track signup attempt
      await trackSecurityEvent('signup', {
        email: formData.email,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      const response = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone ? `+237${formData.phone.replace(/\s/g, '')}` : '',
        role: UserRole.CUSTOMER
      });
      
      if (response.error) {
        setValidationError(response.error);
        return;
      }

      if (response.user) {
        setSignupSuccess(true);
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              registered: true,
              email: formData.email 
            }
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setValidationError(t(text.serverError));
    }
  };
  
  const renderProgressBar = () => (
    <div className="w-full mb-6" aria-label={`${t(text.step)} ${currentStep} ${t(text.of)} ${totalSteps}`}>
      <div className="flex justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          {t(text.step)} {currentStep} {t(text.of)} {totalSteps}
        </span>
        <span className="text-xs font-medium text-gray-500">
          {currentStep === 1 ? t(text.personalInfo) : t(text.accountInfo)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          role="progressbar"
          aria-valuenow={(currentStep / totalSteps) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
  
  // Add success notification component
  const renderSuccessNotification = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 animate-fadeIn">
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-green-100 p-2">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          {t(text.success.title)}
        </h3>
        <p className="text-sm text-center text-gray-600">
          {t(text.success.message)}
        </p>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      {signupSuccess && renderSuccessNotification()}
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
            {t(text.title)}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t(text.description)}
          </p>
        </div>
        
        {renderProgressBar()}
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Step 1: Personal Information */}
          <div 
            className={`${currentStep === 1 ? 'block' : 'hidden'} ${animationDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}
            aria-hidden={currentStep !== 1}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.firstName)}
                </label>
                <input
                  id="first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  aria-required="true"
                  aria-invalid={!!validation.firstName}
                  aria-describedby={validation.firstName ? 'firstName-error' : undefined}
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    touched.firstName && validation.firstName 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('firstName')}
                />
                {touched.firstName && validation.firstName && (
                  <p className="mt-1 text-sm text-red-600" id="firstName-error" role="alert">
                    {validation.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.lastName)}
                </label>
                <input
                  id="last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  aria-required="true"
                  aria-invalid={!!validation.lastName}
                  aria-describedby={validation.lastName ? 'lastName-error' : undefined}
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    touched.lastName && validation.lastName 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('lastName')}
                />
                {touched.lastName && validation.lastName && (
                  <p className="mt-1 text-sm text-red-600" id="lastName-error" role="alert">
                    {validation.lastName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.email)}
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
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                />
                {touched.email && validation.email && (
                  <p className="mt-1 text-sm text-red-600" id="email-error" role="alert">
                    {validation.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.phone)}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">+237</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={!!validation.phone}
                    aria-describedby={validation.phone ? 'phone-error' : undefined}
                    className={`appearance-none relative block w-full pl-14 px-3 py-3 border ${
                      touched.phone && validation.phone 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200`}
                    placeholder="6XXXXXXXX"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onBlur={() => handleBlur('phone')}
                  />
                </div>
                {touched.phone && validation.phone && (
                  <p className="mt-1 text-sm text-red-600" id="phone-error" role="alert">
                    {validation.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Step 2: Account Information */}
          <div 
            className={`${currentStep === 2 ? 'block' : 'hidden'} ${animationDirection === 'forward' ? 'animate-slideInRight' : 'animate-slideInLeft'}`}
            aria-hidden={currentStep !== 2}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.password)}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
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
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                />
                <p className={`mt-1 text-xs ${touched.password && validation.password ? 'text-red-600' : 'text-gray-500'}`}>
                  {t(text.errors.passwordLength)}
                </p>
                {touched.password && validation.password && validation.password !== t(text.errors.passwordLength) && (
                  <p className="mt-1 text-sm text-red-600" id="password-error" role="alert">
                    {validation.password}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t(text.confirmPassword)}
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={!!validation.confirmPassword}
                  aria-describedby={validation.confirmPassword ? 'confirmPassword-error' : undefined}
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    touched.confirmPassword && validation.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                />
                {touched.confirmPassword && validation.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600" id="confirmPassword-error" role="alert">
                    {validation.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Password strength indicator */}
          {touched.password && (
            <div className="mt-1">
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

          {/* Terms and Conditions */}
          <div className="flex items-center">
            <input
              id="accept-terms"
              name="accept-terms"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
              {t(text.terms.accept)}
            </label>
          </div>

          {error && (
            <div className="text-sm rounded-md bg-red-50 p-4 animate-shake" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={`flex ${currentStep > 1 ? 'justify-between' : 'justify-end'}`}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:translate-x-[-2px]"
              >
                <span className="flex items-center">
                  <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t(text.backAction)}
                </span>
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:translate-x-[2px]"
              >
                <span className="flex items-center">
                  {t(text.continueAction)}
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t(text.processing)}</span>
                  </>
                ) : (
                  <span>{t(text.action)}</span>
                )}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t(text.haveAccount)}{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {t(text.loginAction)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 