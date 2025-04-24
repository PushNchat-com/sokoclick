import React from 'react';
import { toast as hotToast, Toast } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ToastWithAction: React.FC<{ message: string; action?: ToastOptions['action'] }> = ({
  message,
  action
}) => (
  <div className="flex items-center justify-between gap-4 min-w-[300px] p-4 bg-white rounded-lg shadow-lg">
    <span>{message}</span>
    {action && (
      <button
        onClick={action.onClick}
        className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {action.label}
      </button>
    )}
  </div>
);

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return hotToast.success(message, {
      duration: options?.duration || 3000,
      ...(options?.action && {
        icon: null,
        className: 'toast-with-action',
        style: {
          padding: '16px',
          color: '#1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        },
        ariaProps: {
          role: 'status',
          'aria-live': 'polite',
        },
      }),
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    return hotToast.error(message, {
      duration: options?.duration || 5000,
      ...(options?.action && {
        icon: null,
        className: 'toast-with-action',
        style: {
          padding: '16px',
          color: '#1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        },
        ariaProps: {
          role: 'alert',
          'aria-live': 'assertive',
        },
      }),
    });
  },
  
  custom: (message: string, options?: ToastOptions) => {
    return hotToast.custom(
      <ToastWithAction message={message} action={options?.action} />,
      {
        duration: options?.duration || 3000,
      }
    );
  },
  
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
}; 