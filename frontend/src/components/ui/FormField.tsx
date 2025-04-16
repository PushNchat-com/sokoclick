import React, { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id?: string;
  helpText?: string;
  required?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helpTextClassName?: string;
}

/**
 * Reusable form field component with integrated validation display
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  id,
  helpText,
  required = false,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helpTextClassName = '',
  className = '',
  ...props
}) => {
  // Generate an ID if not provided
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Base classes
  const defaultContainerClass = 'mb-4';
  const defaultLabelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const defaultInputClass = 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500';
  const defaultErrorClass = 'mt-1 text-sm text-error-600';
  const defaultHelpTextClass = 'mt-1 text-sm text-gray-500';

  // Error state classes
  const errorInputClass = error ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : '';
  
  return (
    <div className={`${defaultContainerClass} ${containerClassName}`}>
      <label 
        htmlFor={fieldId} 
        className={`${defaultLabelClass} ${labelClassName}`}
      >
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>
      
      <input
        id={fieldId}
        className={`${defaultInputClass} ${errorInputClass} ${inputClassName} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
        {...props}
      />
      
      {error && (
        <p 
          id={`${fieldId}-error`} 
          className={`${defaultErrorClass} ${errorClassName}`}
        >
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p 
          id={`${fieldId}-help`} 
          className={`${defaultHelpTextClass} ${helpTextClassName}`}
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField; 