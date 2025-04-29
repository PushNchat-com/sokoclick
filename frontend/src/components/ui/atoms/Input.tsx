import React from "react";
import { cn } from "../../../utils/cn";
import { Icon } from "./Icon";

export type InputSize = "sm" | "md" | "lg";
export type InputStatus = "default" | "error" | "success" | "warning";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input size
   */
  size?: InputSize;

  /**
   * Icon to display at the start of the input
   */
  startIcon?: string;

  /**
   * Icon to display at the end of the input
   */
  endIcon?: string;

  /**
   * Input validation status
   */
  status?: InputStatus;

  /**
   * Helper text to display below the input
   */
  helperText?: string;

  /**
   * Label for the input
   */
  label?: string;

  /**
   * Required field indicator
   */
  required?: boolean;

  /**
   * Whether the input should be disabled
   */
  disabled?: boolean;

  /**
   * Full width input
   */
  fullWidth?: boolean;

  /**
   * Additional className for the input container
   */
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = "md",
      startIcon,
      endIcon,
      status = "default",
      helperText,
      label,
      required = false,
      disabled = false,
      fullWidth = false,
      wrapperClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || React.useId();

    // Base styles
    const baseInputStyles =
      "block rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    };

    // Status classes
    const statusClasses = {
      default: "border-gray-300 focus:border-primary focus:ring-primary/30",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500/30",
      success:
        "border-green-500 focus:border-green-500 focus:ring-green-500/30",
      warning:
        "border-yellow-400 focus:border-yellow-400 focus:ring-yellow-400/30",
    };

    // Helper text classes based on status
    const helperTextClasses = {
      default: "text-gray-500",
      error: "text-red-500",
      success: "text-green-500",
      warning: "text-yellow-600",
    };

    // Icon size mapping based on input size
    const iconSizes = {
      sm: "xs",
      md: "sm",
      lg: "md",
    };

    return (
      <div
        className={cn("flex flex-col", fullWidth && "w-full", wrapperClassName)}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon
                name={startIcon}
                size={iconSizes[size]}
                className="text-gray-400"
              />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              baseInputStyles,
              sizeClasses[size],
              statusClasses[status],
              startIcon && "pl-10",
              endIcon && "pr-10",
              fullWidth && "w-full",
              className,
            )}
            aria-invalid={status === "error" ? "true" : "false"}
            aria-describedby={helperText ? `${inputId}-helper-text` : undefined}
            {...props}
          />

          {endIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Icon
                name={endIcon}
                size={iconSizes[size]}
                className="text-gray-400"
              />
            </div>
          )}
        </div>

        {helperText && (
          <p
            id={`${inputId}-helper-text`}
            className={cn("mt-1.5 text-xs", helperTextClasses[status])}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
