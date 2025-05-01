import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import { useLanguage } from "../../store/LanguageContext";
import {
  ErrorMonitoring,
  ErrorSeverity,
} from "../../services/core/ErrorMonitoring";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";

interface Props {
  children: ReactNode;
  component?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack?: string;
}

interface ErrorContentProps {
  error: Error | null;
  componentStack?: string;
  component?: string;
  resetError: () => void;
}

const ErrorContent: React.FC<ErrorContentProps> = ({
  error,
  componentStack,
  component,
  resetError,
}) => {
  const { t } = useLanguage();
  const { user } = useUnifiedAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [resolutionSteps, setResolutionSteps] = useState<string[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);

  const text = {
    title: {
      en: "Something went wrong in the admin interface",
      fr: "Une erreur s'est produite dans l'interface d'administration",
    },
    description: {
      en: "Please try one of the suggested solutions below or contact support if the problem persists.",
      fr: "Veuillez essayer l'une des solutions suggérées ci-dessous ou contacter le support si le problème persiste.",
    },
    refresh: {
      en: "Refresh Page",
      fr: "Rafraîchir la Page",
    },
    errorDetails: {
      en: "Error Details",
      fr: "Détails de l'Erreur",
    },
    hideDetails: {
      en: "Hide Details",
      fr: "Masquer les Détails",
    },
    showDetails: {
      en: "Show Technical Details",
      fr: "Afficher les Détails Techniques",
    },
    clearCache: {
      en: "Clear Browser Cache",
      fr: "Effacer le Cache du Navigateur",
    },
    tryAgain: {
      en: "Try Again",
      fr: "Réessayer",
    },
    suggestedActions: {
      en: "Suggested Actions",
      fr: "Actions Suggérées",
    },
    contactSupport: {
      en: "Contact Support",
      fr: "Contacter le Support",
    },
    autoRecover: {
      en: "Attempt Automatic Recovery",
      fr: "Tenter une Récupération Automatique",
    },
    recoveringMessage: {
      en: "Attempting to recover...",
      fr: "Tentative de récupération...",
    },
  };

  // Log the error to our monitoring system
  React.useEffect(() => {
    if (error) {
      ErrorMonitoring.logSystemError(error, {
        component: component || "AdminInterface",
        severity: ErrorSeverity.ERROR,
        userId: user?.id,
        metadata: {
          componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      });

      // Generate resolution steps based on error
      const steps: string[] = [];

      // Generic steps for all errors
      steps.push(
        t({
          en: "Refresh the page to try again",
          fr: "Rafraîchissez la page pour réessayer",
        }),
      );

      // Error-specific steps
      if (
        error.message.includes("network") ||
        error.message.includes("fetch") ||
        error.message.includes("connection")
      ) {
        steps.push(
          t({
            en: "Check your internet connection",
            fr: "Vérifiez votre connexion internet",
          }),
        );
      }

      if (
        error.message.includes("permission") ||
        error.message.includes("access") ||
        error.message.includes("authorized")
      ) {
        steps.push(
          t({
            en: "You may not have the required permissions. Try logging out and back in.",
            fr: "Vous n'avez peut-être pas les autorisations requises. Essayez de vous déconnecter et de vous reconnecter.",
          }),
        );
      }

      if (
        error.message.includes("storage") ||
        error.message.includes("quota") ||
        error.message.includes("localStorage")
      ) {
        steps.push(
          t({
            en: "Clear your browser cache and cookies",
            fr: "Effacez le cache et les cookies de votre navigateur",
          }),
        );
      }

      // Always add support contact as last step
      steps.push(
        t({
          en: "If the problem persists, contact support with the error details",
          fr: "Si le problème persiste, contactez le support avec les détails de l'erreur",
        }),
      );

      setResolutionSteps(steps);
    }
  }, [error, component, componentStack, user?.id, t]);

  const handleClearCache = () => {
    // Clear application cache
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies by setting expiration in the past
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });

    // Reload the page
    window.location.reload();
  };

  const handleAttemptRecovery = async () => {
    setIsRecovering(true);

    try {
      // Perform some recovery actions based on the error
      if (
        error?.message.includes("network") ||
        error?.message.includes("connection")
      ) {
        // Try to reconnect
        await fetch("/api/health-check");
      }

      if (
        error?.message.includes("storage") ||
        error?.message.includes("quota")
      ) {
        // Clear local storage
        localStorage.clear();
      }

      // Reset the error state
      resetError();
    } catch (e) {
      console.error("Recovery failed:", e);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-center text-xl font-semibold text-gray-900 mb-2">
          {t(text.title)}
        </h2>

        <p className="text-center text-gray-600 mb-6">{t(text.description)}</p>

        {/* Resolution steps */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {t(text.suggestedActions)}
          </h3>
          <ul className="text-sm text-gray-600 space-y-2 pl-5 list-disc">
            {resolutionSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => window.location.reload()}
            className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t(text.refresh)}
          </button>

          <button
            onClick={handleClearCache}
            className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t(text.clearCache)}
          </button>
        </div>

        <button
          onClick={handleAttemptRecovery}
          disabled={isRecovering}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 mb-4"
        >
          {isRecovering ? t(text.recoveringMessage) : t(text.autoRecover)}
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          {showDetails ? t(text.hideDetails) : t(text.showDetails)}
        </button>

        {showDetails && error && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t(text.errorDetails)}
            </h3>
            <pre className="text-xs text-red-600 overflow-auto max-h-64">
              <strong>Message:</strong> {error.message}
              {"\n\n"}
              <strong>Stack:</strong> {error.stack}
              {componentStack && (
                <>
                  {"\n\n"}
                  <strong>Component Stack:</strong> {componentStack}
                </>
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to monitoring service
    ErrorMonitoring.logSystemError(error, {
      component: this.props.component || "AdminInterface",
      severity: ErrorSeverity.ERROR,
      metadata: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
      },
    });

    // Update state to render fallback UI
    this.setState({ 
      hasError: true,
      error,
      componentStack: errorInfo.componentStack || undefined
    });
  }

  public resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      componentStack: undefined,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContent
          error={this.state.error}
          componentStack={this.state.componentStack}
          component={this.props.component}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
