import React, { Component, ErrorInfo, ReactNode } from "react";
import { useLanguage } from "../../store/LanguageContext";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Need a functional component wrapper to use the hook
const AuthErrorFallback: React.FC<{
  onRetry: () => void;
  error?: Error | null;
}> = ({ onRetry, error }) => {
  const { t } = useLanguage();
  const text = {
    title: { en: "Authentication Error", fr: "Erreur d'authentification" },
    message: {
      en: "Something went wrong during authentication.",
      fr: "Un problème est survenu lors de l'authentification.",
    },
    retry: { en: "Try Again", fr: "Réessayer" },
    details: { en: "Error Details", fr: "Détails de l'erreur" },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-4 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-xl font-semibold text-red-700 mb-2">
        {t(text.title)}
      </h2>
      <p className="text-red-600 mb-4">{t(text.message)}</p>
      {/* Optionally show error details in development */}
      {process.env.NODE_ENV === "development" && error && (
        <details className="mb-4 w-full max-w-md text-left">
          <summary className="cursor-pointer text-sm text-gray-600">
            {t(text.details)}
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 text-xs text-gray-700 rounded overflow-auto">
            {error.stack || error.message}
          </pre>
        </details>
      )}
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        {t(text.retry)}
      </button>
    </div>
  );
};

class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AuthErrorBoundary] Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
    // You can also log the error to an error reporting service here
    // logErrorToMyService(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Here you might want to trigger a refresh or navigation action
    // depending on the context where the boundary is used.
    // For now, just resetting the state.
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback
      ) : (
        <AuthErrorFallback
          onRetry={this.handleRetry}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
