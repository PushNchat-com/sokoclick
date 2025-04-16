import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastVariant } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  hideToast: () => void;
}

interface ToastInfo {
  message: string;
  variant: ToastVariant;
  duration: number;
  id: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3000) => {
    const id = Date.now();
    const newToast = { message, variant, duration, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id?: number) => {
    if (id) {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    } else {
      setToasts([]); // Clear all toasts if no ID is provided
    }
  }, []);

  const contextValue = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
            isVisible={true}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider; 