import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { useLanguage } from "../../store/LanguageContext";
import AuthLayout from "../../layouts/AuthLayout";
import useAuthForm from "../../hooks/useAuthForm";

interface LocationState {
  from?: string;
  registered?: boolean;
}

const Login: React.FC = () => {
  const { login, user } = useUnifiedAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const from = state?.from || "/dashboard";
  const showSuccessMessage = state?.registered || false;

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    formState,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  } = useAuthForm("login");

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const text = {
    title: {
      en: "Sign in to your account",
      fr: "Connectez-vous à votre compte",
    },
    description: {
      en: "Enter your details below",
      fr: "Entrez vos informations ci-dessous",
    },
    email: { en: "Email address", fr: "Adresse email" },
    password: { en: "Password", fr: "Mot de passe" },
    rememberMe: { en: "Remember me", fr: "Se souvenir de moi" },
    forgotPassword: { en: "Forgot password?", fr: "Mot de passe oublié ?" },
    loginAction: { en: "Sign in", fr: "Se connecter" },
    loggingIn: { en: "Signing in...", fr: "Connexion en cours..." },
    noAccount: {
      en: "Don't have an account?",
      fr: "Vous n'avez pas de compte ?",
    },
    signupAction: { en: "Sign up", fr: "S'inscrire" },
    serverError: {
      en: "An error occurred. Please try again.",
      fr: "Une erreur s'est produite. Veuillez réessayer.",
    },
    registerSuccess: {
      en: "Registration successful! Please sign in.",
      fr: "Inscription réussie ! Veuillez vous connecter.",
    },
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validateForm()) {
        return;
      }

      try {
        setSubmitLoading(true);
        await login(
          formState.email,
          formState.password,
        );
        resetForm();
      } catch (err: any) {
        console.error("Login submission error:", err);
        setSubmitError(err.message || t(text.serverError));
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      login,
      formState,
      validateForm,
      navigate,
      from,
      t,
      text.serverError,
      resetForm,
    ],
  );

  return (
    <AuthLayout>
      <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        {t(text.title)}
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600 mb-6">
        {t(text.description)}
      </p>

      {showSuccessMessage && (
        <div
          className="rounded-md bg-green-50 p-4 mb-4 animate-slideDown"
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {t(text.registerSuccess)}
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <div
          className="rounded-md bg-red-50 p-4 mb-4 animate-shake"
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.email)}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`appearance-none block w-full px-3 py-2 border ${
              touched.email && errors.email
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200`}
            placeholder="name@example.com"
            value={formState.email}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.email && errors.email && (
            <p
              className="mt-1 text-sm text-red-600"
              id="email-error"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t(text.password)}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`appearance-none block w-full px-3 py-2 border ${
              touched.password && errors.password
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 sm:text-sm transition-colors duration-200`}
            placeholder="••••••••"
            value={formState.password}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.password && errors.password && (
            <p
              className="mt-1 text-sm text-red-600"
              id="password-error"
              role="alert"
            >
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center"></div>
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t(text.forgotPassword)}
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={submitLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              submitLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
          >
            {submitLoading ? t(text.loggingIn) : t(text.loginAction)}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          {t(text.noAccount)}{" "}
          <Link
            to="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {t(text.signupAction)}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
