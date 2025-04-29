import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  RefreshCw,
  X,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

export interface ErrorDetails {
  message: string;
  code?: string;
  context?: Record<string, any>;
  recoveryOptions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  helpLink?: string;
}

export interface ErrorHandlerProps {
  error?: ErrorDetails | null;
  onClose?: () => void;
  fullScreen?: boolean;
  className?: string;
  showReportButton?: boolean;
  onReport?: (error: ErrorDetails) => void;
  children?: React.ReactNode;
}

const ErrorCard: React.FC<ErrorHandlerProps> = ({
  error,
  onClose,
  fullScreen = false,
  className = "",
  showReportButton = true,
  onReport,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [error]);

  if (!error) return null;

  const handleReport = () => {
    if (onReport && error) {
      onReport(error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const getFriendlyMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "NETWORK_ERROR":
        return "We're having trouble connecting to the server. Please check your internet connection and try again.";
      case "AUTH_EXPIRED":
        return "Your session has expired. Please log in again to continue.";
      case "PERMISSION_DENIED":
        return "You don't have permission to perform this action.";
      case "RESOURCE_NOT_FOUND":
        return "The resource you're looking for could not be found.";
      case "RATE_LIMITED":
        return "You've made too many requests. Please wait a moment and try again.";
      case "VALIDATION_ERROR":
        return "There was a problem with the data you submitted. Please check your inputs and try again.";
      case "SERVICE_UNAVAILABLE":
        return "This service is temporarily unavailable. Our team has been notified and is working on a fix.";
      default:
        return (
          error.message ||
          "Something went wrong. Please try again or contact support if the problem persists."
        );
    }
  };

  const friendlyMessage = getFriendlyMessage(error.code);

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 bg-white flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${className}`}
      >
        <div className="max-w-lg w-full bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-red-50 p-4 flex items-start justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-red-500 mr-3" size={24} />
              <h2 className="text-red-700 text-lg font-semibold">
                An error occurred
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close error message"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">{friendlyMessage}</p>

            {error.code && (
              <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-500">
                  Error code: {error.code}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              {error.recoveryOptions && error.recoveryOptions.length > 0 ? (
                error.recoveryOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={option.action}
                    className={`px-4 py-2 rounded focus:outline-none focus:ring-2 transition-colors ${
                      option.primary
                        ? "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-300"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh page
                </button>
              )}

              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Go back
              </button>

              {showReportButton && (
                <button
                  onClick={handleReport}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  Report issue
                </button>
              )}
            </div>

            {error.helpLink && (
              <div className="mt-4">
                <a
                  href={error.helpLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 inline-flex items-center text-sm"
                >
                  <HelpCircle size={16} className="mr-1" />
                  View help documentation
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      <div className="bg-red-50 p-3 flex items-start justify-between">
        <div className="flex items-center">
          <AlertTriangle className="text-red-500 mr-2" size={18} />
          <h3 className="text-red-700 font-medium">Error</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close error message"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-gray-700 text-sm mb-3">{friendlyMessage}</p>

        <div className="flex flex-wrap gap-2">
          {error.recoveryOptions && error.recoveryOptions.length > 0 ? (
            error.recoveryOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 transition-colors ${
                  option.primary
                    ? "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
            >
              <RefreshCw size={14} className="mr-1" />
              Retry
            </button>
          )}

          {showReportButton && (
            <button
              onClick={handleReport}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            >
              Report
            </button>
          )}
        </div>

        {error.helpLink && (
          <div className="mt-2">
            <a
              href={error.helpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 inline-flex items-center text-xs"
            >
              <HelpCircle size={12} className="mr-1" />
              Help
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Error Boundary component
export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, info: React.ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }

    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorCard
          error={{
            message:
              this.state.error?.message || "An unexpected error occurred",
            code: "REACT_ERROR",
            recoveryOptions: [
              {
                label: "Refresh page",
                action: () => window.location.reload(),
                primary: true,
              },
            ],
          }}
          fullScreen
        />
      );
    }

    return this.props.children;
  }
}

// Hook for using error handling
export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorDetails | null>(null);

  const showError = (errorDetails: ErrorDetails) => {
    setError(errorDetails);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    showError,
    clearError,
    ErrorDisplay: ({
      fullScreen,
      className,
      showReportButton,
      onReport,
    }: Omit<ErrorHandlerProps, "error" | "onClose">) => (
      <ErrorCard
        error={error}
        onClose={clearError}
        fullScreen={fullScreen}
        className={className}
        showReportButton={showReportButton}
        onReport={onReport}
      />
    ),
  };
};

export default ErrorCard;
