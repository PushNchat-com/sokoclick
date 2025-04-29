import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  ErrorMonitoring,
  ErrorSeverity,
} from "../../services/core/ErrorMonitoring";

interface ErrorBoundaryProps {
  /**
   * Child components that will be wrapped by the error boundary
   */
  children: ReactNode;

  /**
   * Optional component to display when an error occurs
   */
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);

  /**
   * Component name for error tracking
   */
  componentName?: string;

  /**
   * Optional callback when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the component tree.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our monitoring service
    const { componentName, onError } = this.props;

    ErrorMonitoring.logSystemError(error, {
      component: componentName || "ErrorBoundary",
      severity: ErrorSeverity.ERROR,
      metadata: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
      },
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render custom fallback UI
      if (fallback) {
        if (typeof fallback === "function" && error && errorInfo) {
          return fallback(error, errorInfo);
        }
        return fallback;
      }

      // Default error UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
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
              <h3 className="text-sm font-medium text-red-800">
                An error occurred
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error?.message || "Something went wrong"}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Refresh page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render children if no error
    return children;
  }
}

/**
 * HOC that wraps a component with an ErrorBoundary
 * @param Component The component to wrap
 * @param errorBoundaryProps Props for the ErrorBoundary
 * @returns A wrapped component with error handling
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component";

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary
      {...errorBoundaryProps}
      componentName={errorBoundaryProps?.componentName || displayName}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
