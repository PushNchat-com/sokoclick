import React from 'react';
import { twMerge } from 'tailwind-merge';
import { InfoIcon, RefreshIcon } from './Icons';
import { Button } from './Button';

export interface ErrorMessageProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Optional callback to retry the failed operation
   */
  onRetry?: () => void;
  
  /**
   * Optional custom classname for styling
   */
  className?: string;
  
  /**
   * Variant of the error message
   */
  variant?: 'inline' | 'block' | 'toast';
  
  /**
   * Title for the error message (only used in block variant)
   */
  title?: string;
}

/**
 * Reusable error message component that displays an error with optional retry functionality
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  className,
  variant = 'inline',
  title = 'Error',
}) => {
  // Inline variant (simple text with icon)
  if (variant === 'inline') {
    return (
      <div 
        className={twMerge(
          "text-red-600 text-sm flex items-center gap-1.5",
          className
        )}
        role="alert"
      >
        <InfoIcon className="w-4 h-4" />
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 text-red-700 hover:text-red-900 hover:underline flex items-center gap-1"
            aria-label="Retry"
          >
            <RefreshIcon className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }
  
  // Block variant (for section errors)
  if (variant === 'block') {
    return (
      <div 
        className={twMerge(
          "bg-red-50 border border-red-200 rounded-md p-4",
          className
        )}
        role="alert"
      >
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <div className="mt-1 text-sm text-red-700">{message}</div>
            {onRetry && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="inline-flex items-center"
                >
                  <RefreshIcon className="w-4 h-4 mr-1.5" />
                  Try again
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Toast variant (for notification errors)
  return (
    <div 
      className={twMerge(
        "bg-white shadow-md border-l-4 border-red-500 rounded-r-md p-3",
        className
      )}
      role="alert"
    >
      <div className="flex items-center">
        <InfoIcon className="w-5 h-5 text-red-500" />
        <p className="ml-2 text-sm text-gray-800">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs text-red-600 hover:text-red-800 hover:underline flex items-center"
          aria-label="Retry"
        >
          <RefreshIcon className="w-3 h-3 mr-1" />
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage; 