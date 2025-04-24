import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLanguage } from '../../store/LanguageContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorContent: React.FC<{ error: Error | null }> = ({ error }) => {
  const { t } = useLanguage();

  const text = {
    title: {
      en: 'Something went wrong in the admin interface',
      fr: "Une erreur s'est produite dans l'interface d'administration"
    },
    description: {
      en: 'Please try refreshing the page or contact support if the problem persists.',
      fr: 'Veuillez rafraîchir la page ou contacter le support si le problème persiste.'
    },
    refresh: {
      en: 'Refresh Page',
      fr: 'Rafraîchir la Page'
    },
    errorDetails: {
      en: 'Error Details',
      fr: 'Détails de l\'Erreur'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-center text-xl font-semibold text-gray-900 mb-2">
          {t(text.title)}
        </h2>
        
        <p className="text-center text-gray-600 mb-6">
          {t(text.description)}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t(text.refresh)}
        </button>

        {error && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {t(text.errorDetails)}
            </h3>
            <pre className="text-xs text-red-600 overflow-auto">
              {error.message}
              {'\n'}
              {error.stack}
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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Error:', error);
    console.error('Error Info:', errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorContent error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary; 