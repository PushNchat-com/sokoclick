import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLanguage } from '../store/LanguageContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Text content wrapper to use language context
const ErrorContent = ({ error }: { error: Error | null }) => {
  const { t } = useLanguage();
  
  const text = {
    title: { 
      en: 'Something went wrong', 
      fr: 'Une erreur est survenue' 
    },
    retry: { 
      en: 'Try again', 
      fr: 'Réessayer' 
    },
    description: {
      en: 'We apologize for the inconvenience. Please try refreshing the page.',
      fr: 'Nous nous excusons pour la gêne occasionnée. Veuillez rafraîchir la page.'
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t(text.title)}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t(text.description)}
          </p>
          {error && process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-red-50 text-red-900 rounded-md text-sm overflow-auto">
              {error.message}
            </pre>
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t(text.retry)}
          </button>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorContent error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 