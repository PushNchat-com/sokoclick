/**
 * Consolidated ErrorBoundary component.
 * Merged duplicate from components/ErrorBoundary.tsx into components/ui/ErrorBoundary.tsx.
 * Standardized to support both named and default exports.
 * Date: 2023-10-24
 */
import React, { Component, ReactNode, ErrorInfo } from "react";
import { ErrorSeverity } from "../../services/core/ErrorMonitoring";
import { useLanguage } from "../../store/LanguageContext";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  resetKey?: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Text content wrapper with i18n
const DefaultErrorContent = ({
  error,
  reset,
}: {
  error: Error | null;
  reset: () => void;
}) => {
  // Use language context if available, otherwise default to English
  let t;
  try {
    const { t: translateFn } = useLanguage();
    t = translateFn;
  } catch (e) {
    // Fallback if language context is not available
    t = (text: any) => (typeof text === "string" ? text : text.en || text);
  }

  const text = {
    title: {
      en: "Something went wrong",
      fr: "Une erreur est survenue",
    },
    retry: {
      en: "Try again",
      fr: "Réessayer",
    },
    description: {
      en: "We apologize for the inconvenience. Please try refreshing the page.",
      fr: "Nous nous excusons pour la gêne occasionnée. Veuillez rafraîchir la page.",
    },
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
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
          <h3 className="text-sm font-medium text-red-800">{t(text.title)}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{t(text.description)}</p>
            {error && process.env.NODE_ENV === "development" && (
              <pre className="mt-2 p-2 bg-red-100 text-red-900 rounded-md text-xs overflow-auto">
                {error.message}
              </pre>
            )}
          </div>
          <div className="mt-4">
            <button
              onClick={reset}
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t(text.retry)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole application.
 *
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback UI
 * <ErrorBoundary
 *   fallback={<div>Something went wrong. Please try again later.</div>}
 *   onError={(error) => logErrorToService(error)}
 *   componentName="ProductGrid"
 * >
 *   <ProductGrid />
 * </ErrorBoundary>
 *
 * @example
 * // With fallback function
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <DataFetchingComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      // Default error logging if no custom handler provided
      console.error("Error caught by ErrorBoundary:", error, errorInfo);

      // If ErrorMonitoring service is available, log it there
      try {
        const {
          ErrorMonitoring,
        } = require("../../services/core/ErrorMonitoring");
        ErrorMonitoring.logSystemError(error, {
          component: this.props.componentName || "ErrorBoundary",
          severity: ErrorSeverity.ERROR,
          metadata: {
            componentStack: errorInfo.componentStack,
            url: window.location.href,
          },
        });
      } catch (e) {
        // If ErrorMonitoring can't be loaded, just continue with console error
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // If the resetKey prop changes, reset the error boundary
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      // Render the fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function" && this.state.error) {
          return (this.props.fallback as Function)(
            this.state.error,
            this.resetErrorBoundary,
          );
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorContent
          error={this.state.error}
          reset={this.resetErrorBoundary}
        />
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
