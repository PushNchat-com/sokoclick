import React from "react";
import { cn } from "../../../utils/cn";
import { Icon } from "./Icon";
import { focusStyles } from "../design-system/accessibility";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success"
  | "warning"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button content
   */
  children?: React.ReactNode;

  /**
   * Button visual variant
   */
  variant?: ButtonVariant;

  /**
   * Button size
   */
  size?: ButtonSize;

  /**
   * Expands the button to full width
   */
  fullWidth?: boolean;

  /**
   * Icon to display at the start of the button
   */
  startIcon?: string;

  /**
   * Icon to display at the end of the button
   */
  endIcon?: string;

  /**
   * Shows a loading state
   */
  isLoading?: boolean;

  /**
   * Text to be shown when loading
   */
  loadingText?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  startIcon,
  endIcon,
  isLoading = false,
  loadingText,
  disabled,
  type = "button",
  ...props
}) => {
  // Base styles
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  // Size classes
  const sizeClasses = {
    xs: "text-xs h-7 px-2 py-1 gap-1",
    sm: "text-sm h-8 px-3 py-1 gap-1.5",
    md: "text-sm h-10 px-4 py-2 gap-2",
    lg: "text-base h-12 px-6 py-3 gap-2.5",
  };

  // Variant classes
  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary",
    secondary:
      "bg-secondary text-white hover:bg-secondary-dark focus-visible:ring-secondary",
    ghost:
      "bg-transparent hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-400",
    outline:
      "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
    success:
      "bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500",
    warning:
      "bg-yellow-400 text-gray-900 hover:bg-yellow-500 focus-visible:ring-yellow-400",
    link: "bg-transparent text-primary-600 hover:underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 p-0",
  };

  // Icon size mapping based on button size
  const iconSizes = {
    xs: "xs",
    sm: "sm",
    md: "sm",
    lg: "md",
  };

  // Combine all styles
  const buttonStyles = [
    baseStyles,
    sizeClasses[size],
    variantClasses[variant],
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "",
    fullWidth ? "w-full" : "",
    isLoading ? "relative" : "",
    className,
  ].join(" ");

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={buttonStyles}
      style={focusStyles.keyboard}
      aria-busy={isLoading ? "true" : "false"}
      aria-disabled={disabled ? "true" : "false"}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="sr-only">{props["aria-label"] || "Loading..."}</span>
        </span>
      )}

      <span className={`flex items-center ${isLoading ? "opacity-0" : ""}`}>
        {startIcon && <Icon name={startIcon} size={iconSizes[size]} />}
        {children}
        {endIcon && <Icon name={endIcon} size={iconSizes[size]} />}
      </span>
    </button>
  );
};

Button.displayName = "Button";

export default Button;
