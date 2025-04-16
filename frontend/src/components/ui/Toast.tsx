import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  id?: string;
}

interface ToastContextType {
  showToast: (toast: ToastProps) => string;
  hideToast: (id: string) => void;
  toasts: Array<ToastProps & { id: string }>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider component for managing toast notifications across the app
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  // Show a toast and return its ID
  const showToast = useCallback((toast: ToastProps): string => {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    // Check if toast with same message already exists
    const existingToast = toasts.find(t => t.message === toast.message);
    if (existingToast) {
      // Reset the timer for the existing toast by updating it
      setToasts(current => 
        current.map(t => t.id === existingToast.id ? { ...t, duration: toast.duration } : t)
      );
      return existingToast.id;
    }
    
    setToasts(current => [...current, newToast]);
    return id;
  }, [toasts]);

  const hideToast = useCallback((id: string): void => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    toasts.forEach(toast => {
      if (toast.duration !== 0 && toast.duration !== Infinity) {
        const timer = setTimeout(() => {
          hideToast(toast.id);
        }, toast.duration || 3000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast functionality throughout the app
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    toast: (message: string, variant: ToastVariant = 'info', duration = 3000) => {
      context.showToast({ message, variant, duration });
    },
    success: (message: string, duration = 3000) => {
      context.showToast({ message, variant: 'success', duration });
    },
    error: (message: string, duration = 3000) => {
      context.showToast({ message, variant: 'error', duration });
    },
    warning: (message: string, duration = 3000) => {
      context.showToast({ message, variant: 'warning', duration });
    },
    info: (message: string, duration = 3000) => {
      context.showToast({ message, variant: 'info', duration });
    },
    hide: context.hideToast,
  };
};

/**
 * Container component that renders all active toasts
 */
const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context) return null;
  
  const { toasts, hideToast } = context;

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
};

/**
 * Individual Toast component (internal use only)
 */
const ToastItem: React.FC<{ toast: ToastProps & { id: string }, onClose: () => void }> = ({ 
  toast, 
  onClose 
}) => {
  const { message, variant = 'info' } = toast;

  const variantClasses = {
    success: 'bg-success-100 text-success-800 border-success-300',
    error: 'bg-error-100 text-error-800 border-error-300',
    warning: 'bg-accent-100 text-accent-800 border-accent-300',
    info: 'bg-primary-100 text-primary-800 border-primary-300',
  };

  const iconByVariant = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h.01a1 1 0 000-2H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div
      className={`rounded-md border px-4 py-3 shadow-md transition-all duration-300 flex items-start ${variantClasses[variant]}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">{iconByVariant[variant]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        type="button"
        className="ml-4 inline-flex flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none"
        onClick={onClose}
        aria-label="Close"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

/**
 * Legacy Toast component for backward compatibility
 * @deprecated Use useToast hook instead
 */
const Toast: React.FC<ToastProps & { onClose?: () => void, isVisible?: boolean }> = (props) => {
  console.warn('Toast component is deprecated. Use useToast hook instead');
  const toast = useToast();
  
  useEffect(() => {
    if (props.isVisible) {
      toast.toast(props.message, props.variant, props.duration);
    }
  }, [props.isVisible]);
  
  return null;
};

export default Toast; 