// frontend/src/components/auth/AdminLogin.tsx

import React, { useCallback, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLanguage } from "../../store/LanguageContext";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import AuthLayout from "../../layouts/AuthLayout";
import useAuthForm from "../../hooks/useAuthForm";
import { LocationState } from "../../types/router";

// Increased timeout duration
const LOGIN_TIMEOUT_DURATION = 30000; // 30 seconds

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
  },
};

const AdminLogin: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signIn,
    signOut,
    user,
    isAdmin,
    loading: authContextLoading,
  } = useUnifiedAuth();

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "signingIn" | "checkingProfile" | "error" | "success"
  >("idle");
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
    resetForm,
  } = useAuthForm("admin-login");

  const from = (location.state as LocationState)?.from || "/admin";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!authContextLoading && user && isAdmin) {
      console.log("[AdminLogin] User is admin, navigating to:", from);
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, authContextLoading, navigate, from]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validateForm()) {
        return;
      }

      setSubmitStatus("signingIn");

      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }

      loginTimeoutRef.current = setTimeout(() => {
        if (!mounted.current || submitStatus === "success") return;
        setSubmitStatus("error");
        setSubmitError(t(text.errors.loginTimeout));
      }, LOGIN_TIMEOUT_DURATION);

      try {
        const response = await signIn(formState.email, formState.password);

        if (submitStatus === "signingIn") {
          setSubmitStatus("checkingProfile");
        }

        if (!mounted.current) return;

        if (response.error) {
          let errorMessage = response.error;
          if (errorMessage.includes("Invalid login credentials")) {
            errorMessage = t(text.errors.invalidCredentials);
          } else if (errorMessage.includes("UNAUTHORIZED_ACCESS")) {
            errorMessage = t(text.errors.noAdminPrivileges);
          } else if (errorMessage.includes("rate limit")) {
            errorMessage = t(text.errors.tooManyAttempts);
          } else if (
            errorMessage.includes("fetch user profile") ||
            errorMessage.includes("PROFILE_NOT_FOUND")
          ) {
            errorMessage = t(text.errors.loginFailed);
          }
          setSubmitError(errorMessage);
          setSubmitStatus("error");
          if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
          return;
        }

        setSubmitStatus("success");
        if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      } catch (error: any) {
        if (!mounted.current) return;
        console.error("Login submission error:", error);
        setSubmitError(error.message || t(text.errors.loginFailed));
        setSubmitStatus("error");
        if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);
      }
    },
    [
      formState.email,
      formState.password,
      signIn,
      t,
      validateForm,
      text.errors,
      setSubmitError,
      setSubmitStatus,
      submitStatus, // Include submitStatus here
    ],
  );

  const isLoading =
    submitStatus === "signingIn" ||
    submitStatus === "checkingProfile" ||
    authContextLoading;
  const currentLoadingText = authContextLoading
    ? t({ en: "Initializing...", fr: "Initialisation..." })
    : submitStatus === "checkingProfile"
      ? t(text.checkingProfile)
      : t(text.loggingIn);

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
        {submitStatus === "error" && submitError && (
          <div className="rounded-md bg-red-50 p-4 mb-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
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
                disabled={isLoading} // Use combined isLoading state
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
                disabled={isLoading} // Use combined isLoading state
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
              disabled={isLoading} // Use combined isLoading state
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-150 ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {/* Use combined isLoading state and specific loading text */}
              {isLoading ? currentLoadingText : t(text.loginAction)}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <Link
            to="/"
            className="w-full flex justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {t(text.backToSite)}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;
