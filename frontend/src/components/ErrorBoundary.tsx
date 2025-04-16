import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error }) => {
  const { t } = useTranslation();
  
  return (
    <div className="p-4 border border-red-500 bg-red-50 rounded-md">
      <h2 className="text-lg font-semibold text-red-800 mb-2">{t('errorOccurred')}</h2>
      <p className="text-sm text-red-700 mb-2">{error?.message || t('unknownError')}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="text-sm px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
};

export default ErrorBoundary; 