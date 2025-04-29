import React from "react";
import { cn } from "../../utils/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  checkboxClassName?: string;
  hideLabel?: boolean;
  indeterminate?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  helperText,
  error,
  className = "",
  labelClassName = "",
  checkboxClassName = "",
  hideLabel = false,
  indeterminate = false,
  disabled = false,
  required = false,
  ...rest
}) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const containerClasses = cn("flex items-start", className);

  const checkboxClasses = cn(
    "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors",
    disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : "",
    error ? "border-red-500 focus:ring-red-500" : "",
    checkboxClassName,
  );

  const labelClasses = cn(
    "text-sm font-medium text-gray-700 ml-2",
    labelClassName,
    hideLabel ? "sr-only" : "",
  );

  return (
    <div>
      <div className={containerClasses}>
        <div className="flex items-center h-5">
          <input
            ref={checkboxRef}
            id={id}
            type="checkbox"
            disabled={disabled}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            className={checkboxClasses}
            required={required}
            {...rest}
          />
        </div>

        {label && (
          <div className="ml-2">
            <label htmlFor={id} className={labelClasses}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        )}
      </div>

      {helperText && !error && (
        <p id={`${id}-helper`} className="mt-1 text-sm text-gray-500 ml-6">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600 ml-6">
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
