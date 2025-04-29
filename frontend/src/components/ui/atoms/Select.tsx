import React, { useState } from "react";
import { cn } from "../../utils/cn";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  id: string;
  options: SelectOption[];
  label?: string;
  helperText?: string;
  error?: string;
  size?: SelectSize;
  fullWidth?: boolean;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  hideLabel?: boolean;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  options,
  label,
  helperText,
  error,
  size = "md",
  fullWidth = false,
  className = "",
  labelClassName = "",
  selectClassName = "",
  hideLabel = false,
  placeholder,
  disabled = false,
  required = false,
  ...rest
}) => {
  const baseSelectClasses =
    "block border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white pr-10";

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2 text-base",
    lg: "px-4 py-3 text-lg",
  };

  const stateClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-gray-300";

  const disabledClasses = disabled
    ? "bg-gray-100 cursor-not-allowed opacity-75"
    : "";
  const widthClasses = fullWidth ? "w-full" : "";

  const selectClasses = cn(
    baseSelectClasses,
    sizeClasses[size],
    stateClasses,
    disabledClasses,
    widthClasses,
    selectClassName,
  );

  const containerClasses = cn("flex flex-col", widthClasses, className);

  const labelClasses = cn(
    "text-sm font-medium text-gray-700 mb-1",
    labelClassName,
    hideLabel ? "sr-only" : "",
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
          className={selectClasses}
          required={required}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {helperText && !error && (
        <p id={`${id}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
