import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from "lucide-react";

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorStack: string | null;
  errorActions: Array<{
    label: string;
    icon: ReactNode;
    action: () => void;
    primary?: boolean;
  }>;
}

type FallbackProps = { error: Error; reset: () => void };
type FallbackRender = (props: FallbackProps) => ReactNode;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | FallbackRender;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: any[];
  showDetails?: boolean;
  customActions?: Array<{
    label: string;
    icon: ReactNode;
    action: () => void;
    primary?: boolean;
  }>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
  public state: ErrorState = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorStack: null,
    errorActions: [],
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const defaultActions = [
      {
        label: "Try Again",
        icon: <RefreshCcw size={16} />,
        action: this.reset,
        primary: true,
      },
      {
        label: "Go Back",
        icon: <ArrowLeft size={16} />,
        action: () => window.history.back(),
      },
      {
        label: "Go Home",
        icon: <Home size={16} />,
        action: () => (window.location.href = "/"),
      },
    ];

    this.setState({
      error,
      errorInfo,
      errorStack: error.stack || null,
      errorActions: [...(this.props.customActions || []), ...defaultActions],
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log the error to the console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);

    // You could also send to an error tracking service here
    // e.g., Sentry, LogRocket, etc.
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "error", {
        event_category: "Error Boundary",
        event_label: error.message,
        value: 1,
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && this.props.resetKeys) {
      if (
        prevProps.resetKeys &&
        JSON.stringify(prevProps.resetKeys) !==
          JSON.stringify(this.props.resetKeys)
      ) {
        this.reset();
      }
    }
  }

  reset(): void {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorStack: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const fallback = this.props.fallback;
        if (typeof fallback === "function" && this.state.error) {
          return fallback({ error: this.state.error, reset: this.reset });
        }
        return fallback as ReactNode;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <div className="mb-4 text-red-500">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            We've encountered an unexpected error. Please try again or use one
            of the options below.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {this.state.errorActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  action.primary
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {this.props.showDetails && this.state.error && (
            <div className="w-full mt-4">
              <details className="bg-gray-100 p-4 rounded text-left">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details
                </summary>
                <div className="text-xs overflow-auto max-h-[200px]">
                  <p className="font-semibold mb-1">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorStack && (
                    <pre className="whitespace-pre-wrap text-red-600 bg-gray-200 p-2 rounded">
                      {this.state.errorStack}
                    </pre>
                  )}
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-gray-700 mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler(givenError?: Error): (error: Error) => void {
  const [error, setError] = React.useState<Error | null>(null);

  if (givenError || error) {
    throw givenError || error;
  }

  return setError;
}

// Higher-order component for error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, "children"> = {},
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || "Component";

  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

// Utils
export function reportError(error: Error, componentInfo?: string): void {
  console.error(`Error occurred in ${componentInfo || "component"}:`, error);

  // Here you would typically send to error tracking service
  // if (window.errorTrackingService) {
  //   window.errorTrackingService.captureException(error, { extra: { componentInfo } });
  // }
}

// Define types for the gtag function
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: {
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: any;
      },
    ) => void;
  }
}

export default ErrorBoundary;
