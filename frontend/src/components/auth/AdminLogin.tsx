// frontend/src/components/auth/AdminLogin.tsx

import React, { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLanguage } from "../../store/LanguageContext";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import AuthLayout from "../../layouts/AuthLayout";
import useAuthForm from "../../hooks/useAuthForm";
import { LocationState } from "../../types/router";

const LOGIN_TIMEOUT_DURATION = 30000;

enum LoginState {
  IDLE = 'idle',
  SIGNING_IN = 'signingIn',
  FETCHING_PROFILE = 'fetchingProfile',
  SUCCESS = 'success',
  ERROR = 'error'
}

const text = {
  title: { en: "Admin Login", fr: "Connexion Admin" },
  description: {
    en: "Sign in to your admin account",
    fr: "Connectez-vous à votre compte administrateur",
  },
  email: { en: "Email address", fr: "Adresse email" },
  password: { en: "Password", fr: "Mot de passe" },
  loginAction: { en: "Sign in", fr: "Se connecter" },
  loggingIn: { en: "Signing in...", fr: "Connexion en cours..." },
  checkingProfile: {
    en: "Checking profile...",
    fr: "Vérification du profil...",
  },
  backToSite: { en: "Back to site", fr: "Retour au site" },
  errors: {
    invalidCredentials: {
      en: "Invalid email or password",
      fr: "Email ou mot de passe invalide",
    },
    noAdminPrivileges: {
      en: "This account does not have admin privileges",
      fr: "Ce compte ne dispose pas de privilèges administrateur",
    },
    loginFailed: {
      en: "Login failed. Please try again",
      fr: "Échec de la connexion. Veuillez réessayer",
    },
    loginTimeout: {
      en: "Login request timed out. Please check your connection and try again.",
      fr: "La demande de connexion a expiré. Veuillez vérifier votre connexion et réessayer.",
    },
    tooManyAttempts: {
      en: "Too many login attempts. Please try again later",
      fr: "Trop de tentatives de connexion. Veuillez réessayer plus tard",
    },
    profileFetchFailed: {
      en: "Could not load admin profile after login.",
      fr: "Impossible de charger le profil administrateur après la connexion.",
    }
  },
};

const AdminLogin: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    user,
    isAdmin,
    loading: authContextLoading,
    clearAuthError,
  } = useUnifiedAuth();

  const [loginState, setLoginState] = useState<LoginState>(LoginState.IDLE);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mounted = useRef(true);

  const {
    formState,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
  } = useAuthForm("admin-login");

  const from = (location.state as LocationState)?.from || "/admin";

  useEffect(() => {
    mounted.current = true;
    clearAuthError();
    return () => {
      mounted.current = false;
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, [clearAuthError]);

  useEffect(() => {
    if (loginState === LoginState.SIGNING_IN && 
        (!authContextLoading || (user !== null && isAdmin !== null))) {
      
      console.log("[AdminLogin] Auth context update detected, processing login state.", 
                 { user: !!user, isAdmin, authLoading: authContextLoading });
      
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
        loginTimeoutRef.current = null;
      }

      if (user && isAdmin) {
        console.log("[AdminLogin] User is authenticated and has admin privileges.");
        setLoginState(LoginState.SUCCESS);
      } 
      else if (user && isAdmin === false) {
        console.log("[AdminLogin] User is authenticated but lacks admin privileges.");
        setLoginState(LoginState.ERROR);
        setSubmitError(t(text.errors.noAdminPrivileges));
      }
      else if (!user && !authContextLoading) {
        console.log("[AdminLogin] Authentication failed - no user found after loading.");
        setLoginState(LoginState.ERROR);
        setSubmitError(t(text.errors.invalidCredentials));
      }
      else if (authContextLoading) {
        console.log("[AdminLogin] Auth context still loading but we have partial data. Waiting for completion.");
      }
    }
  }, [user, isAdmin, authContextLoading, loginState, t, text.errors]);

  useEffect(() => {
    if (loginState === LoginState.SUCCESS && user && isAdmin) {
      console.log("[AdminLogin] Login SUCCESS confirmed. Navigating to:", from);
      const navTimeout = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
      return () => clearTimeout(navTimeout);
    }
  }, [loginState, navigate, from, user, isAdmin]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      clearAuthError();

      if (!validateForm()) {
        return;
      }

      setLoginState(LoginState.SIGNING_IN);

      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }

      try {
        console.log("[AdminLogin] Calling context login...");
        await login(formState.email, formState.password);
        console.log("[AdminLogin] Context login call finished, waiting for auth context to update.");
        
        loginTimeoutRef.current = setTimeout(() => {
          if (!mounted.current) return;
          if (loginState === LoginState.SIGNING_IN) {
            console.warn("[AdminLogin] Login process timed out while waiting for auth context to update.");
            setLoginState(LoginState.ERROR);
            setSubmitError(t(text.errors.loginTimeout));
          }
        }, LOGIN_TIMEOUT_DURATION);
      } catch (error: any) {
        if (!mounted.current) return;
        console.error('[AdminLogin] Error during handleSubmit:', error);
        if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
        setLoginState(LoginState.ERROR);

        let displayError = t(text.errors.loginFailed);
        if (typeof error.message === 'string') {
          if (error.message.includes("Invalid login credentials")) {
            displayError = t(text.errors.invalidCredentials);
          } else if (error.message.includes(t(text.errors.profileFetchFailed))) {
            displayError = t(text.errors.profileFetchFailed);
          } else if (error.message.includes(t(text.errors.noAdminPrivileges))) {
            displayError = t(text.errors.noAdminPrivileges);
          } else if (error.message.includes("Session retrieval failed") || error.message.includes("No session available")) {
            // Keep default login failed message
          } else if (error.message.includes("fetch") || error.message.includes("network")) {
            displayError = t(text.errors.loginFailed) + " (Network Issue)";
          }
        }
        setSubmitError(displayError);
      }
    },
    [
      formState.email,
      formState.password,
      login,
      t,
      validateForm,
      text.errors,
      clearAuthError,
      loginState,
    ],
  );

  const isLoading =
    loginState === LoginState.SIGNING_IN ||
    loginState === LoginState.FETCHING_PROFILE;

  const currentLoadingText =
    loginState === LoginState.FETCHING_PROFILE
      ? t(text.checkingProfile)
      : loginState === LoginState.SIGNING_IN
        ? t(text.loggingIn)
        : t({ en: "Initializing...", fr: "Initialisation..." });

  return (
    <AuthLayout>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t(text.title)}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t(text.description)}
        </p>
      </div>

      <div className="mt-8">
        {loginState === LoginState.ERROR && submitError && (
          <div className="rounded-md bg-red-50 p-4 mb-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {submitError}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t(text.email)}
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`appearance-none block w-full px-3 py-2 border ${
                  touched.email && errors.email
                    ? "border-red-300"
                    : "border-gray-300"
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50`}
                value={formState.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.email && errors.email && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t(text.password)}
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={`appearance-none block w-full px-3 py-2 border ${
                  touched.password && errors.password
                    ? "border-red-300"
                    : "border-gray-300"
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50`}
                value={formState.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {touched.password && errors.password && (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {errors.password}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? currentLoadingText : t(text.loginAction)}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                <Link
                  to="/"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {t(text.backToSite)}
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;