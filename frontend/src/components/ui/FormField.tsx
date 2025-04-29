import React from "react";
import { createAriaLabel, focusStyles } from "./design-system/accessibility";

interface FormFieldProps {
  /**
   * Field label text
   */
  label: React.ReactNode;

  /**
   * Input element for the field
   */
  children: React.ReactNode;

  /**
   * Error message to display, if any
   */
  error?: string;

  /**
   * Success message to display if validated successfully
   */
  success?: string;

  /**
   * Hint text to display below the field
   */
  hint?: React.ReactNode;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is currently in loading state
   */
  isLoading?: boolean;

  /**
   * ID for the input element
   */
  id?: string;

  /**
   * Whether field was touched/interacted with
   */
  touched?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * FormField component that provides a consistent layout for form fields
 * with validation feedback and accessibility features.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  success,
  hint,
  required = false,
  isLoading = false,
  id,
  touched = false,
  className = "",
}) => {
  // Generate a random ID if not provided
  const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const successId = `${fieldId}-success`;

  // Determine if we should show validation state
  const showError = !!error && touched;
  const showSuccess = !!success && touched && !error;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex justify-between mb-1">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {required && (
          <span className="text-xs text-gray-500" id={`${fieldId}-required`}>
            Required
          </span>
        )}
      </div>

      <div className="relative">
        {/* Clone child element to inject necessary props */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Variables to help build the aria description for screen readers
            const ariaDescribedBy = [
              hint ? hintId : "",
              showError ? errorId : "",
              showSuccess ? successId : "",
            ]
              .filter(Boolean)
              .join(" ");

            return React.cloneElement(child, {
              id: fieldId,
              "aria-invalid": showError ? "true" : undefined,
              "aria-required": required ? "true" : undefined,
              "aria-describedby": ariaDescribedBy || undefined,
              className: `${child.props.className || ""} ${
                showError
                  ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                  : showSuccess
                    ? "border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500"
                    : ""
              }`,
            });
          }
          return child;
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            {...createAriaLabel("Loading")}
          >
            <svg
              className="h-5 w-5 text-gray-400 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Success indicator */}
        {showSuccess && !isLoading && (
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            {...createAriaLabel("Field validated successfully")}
          >
            <svg
              className="h-5 w-5 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {/* Error indicator */}
        {showError && !isLoading && (
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            {...createAriaLabel("Error")}
          >
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Field hint/help text */}
      {hint && (
        <p className="mt-1 text-sm text-gray-500" id={hintId}>
          {hint}
        </p>
      )}

      {/* Error message */}
      {showError && (
        <p className="mt-2 text-sm text-red-600" id={errorId}>
          {error}
        </p>
      )}

      {/* Success message */}
      {showSuccess && (
        <p className="mt-2 text-sm text-green-600" id={successId}>
          {success}
        </p>
      )}
    </div>
  );
};
