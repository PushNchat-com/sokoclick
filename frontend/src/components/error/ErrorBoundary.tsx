import React, { Component, ErrorInfo, ReactNode } from "react";
import { logComponentError } from "../../utils/logger";
import { toast } from "../../utils/toast";
import { useLanguage } from "../../store/LanguageContext";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch and handle errors in its child components
 * Uses the ErrorLogger utility to log errors to Supabase and optionally external services
 */
class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error logging service
    const { componentName } = this.props;
    logComponentError(error, errorInfo, componentName);

    // Also log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Show toast notification
    toast.error("An error occurred. The development team has been notified.");
  }

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg my-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 mb-3">
            We're sorry, but there was an error loading this component. The
            development team has been notified.
          </p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

/**
 * Wrapped ErrorBoundary with language context
 */
const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  const { t } = useLanguage();

  // Custom fallback with i18n support
  const localizedFallback = (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg my-4">
      <h3 className="text-lg font-medium text-red-800 mb-2">
        {t({
          en: "Something went wrong",
          fr: "Une erreur s'est produite",
        })}
      </h3>
      <p className="text-red-600 mb-3">
        {t({
          en: "We're sorry, but there was an error loading this component. The development team has been notified.",
          fr: "Nous sommes désolés, mais une erreur s'est produite lors du chargement de ce composant. L'équipe de développement a été informée.",
        })}
      </p>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        onClick={() => window.location.reload()}
      >
        {t({
          en: "Reload Page",
          fr: "Recharger la page",
        })}
      </button>
    </div>
  );

  return (
    <ErrorBoundaryClass
      {...props}
      fallback={props.fallback || localizedFallback}
    />
  );
};

export default ErrorBoundary;
