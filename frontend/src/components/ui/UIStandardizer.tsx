import React from "react";
import { cn } from "../../utils/cn";

/**
 * Standardized button styles to ensure consistent styling across the application
 */
export const buttonStyles = {
  variant: {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent focus:ring-indigo-500",
    secondary:
      "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-indigo-500",
    success:
      "bg-green-600 hover:bg-green-700 text-white border-transparent focus:ring-green-500",
    danger:
      "bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500",
    warning:
      "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent focus:ring-yellow-500",
    info: "bg-blue-500 hover:bg-blue-600 text-white border-transparent focus:ring-blue-500",
    ghost:
      "bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-gray-500",
    outline:
      "bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-indigo-500",
  },
  size: {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  },
  rounded: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  },
  disabled: "opacity-50 cursor-not-allowed",
  base: "inline-flex items-center justify-center font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
};

/**
 * Standardized input styles
 */
export const inputStyles = {
  base: "block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
  size: {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  },
  state: {
    error:
      "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500",
    success:
      "border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500",
    disabled: "bg-gray-100 text-gray-500 cursor-not-allowed",
  },
  rounded: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  },
};

/**
 * Standardized icon sizes
 */
export const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

/**
 * Standardized card styles
 */
export const cardStyles = {
  base: "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",
  padding: {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  },
  hover: "transition-shadow hover:shadow-md",
};

/**
 * Standardized form field wrapper
 */
export const formFieldStyles = {
  base: "space-y-1",
  inline: "flex items-center space-x-2",
  label: "block text-sm font-medium text-gray-700",
  hint: "text-xs text-gray-500 mt-1",
  error: "text-xs text-red-500 mt-1",
  success: "text-xs text-green-500 mt-1",
  required: "text-red-500 ml-1",
};

/**
 * Standardized hover and active states
 */
export const interactionStyles = {
  hover: {
    scale: "hover:scale-105 transition-transform",
    opacity: "hover:opacity-80 transition-opacity",
    shadow: "hover:shadow-md transition-shadow",
    border: "hover:border-indigo-500 transition-colors",
  },
  active: {
    scale: "active:scale-95 transition-transform",
    opacity: "active:opacity-70 transition-opacity",
  },
  focus: {
    ring: "focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:outline-none",
    border: "focus:border-indigo-500 focus:outline-none",
  },
};

/**
 * Animate entrance for progressive loading
 */
export const entranceAnimations = {
  fadeIn: "animate-fade-in",
  slideIn: "animate-slide-in",
  scaleIn: "animate-scale-in",
  custom: "transition-all duration-300 ease-in-out",
};

/**
 * A component for standardized section headings
 */
export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  icon,
  action,
  className,
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          {icon && <div className="mr-3 text-indigo-600">{icon}</div>}
          <div>
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

/**
 * A component for consistent empty states
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "text-center py-12 px-4 bg-white border border-gray-200 rounded-lg",
        className,
      )}
    >
      {icon && <div className="mx-auto">{icon}</div>}
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

/**
 * A component for consistent content wrappers
 */
export interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentWrapper: React.FC<ContentWrapperProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
        className,
      )}
    >
      {children}
    </div>
  );
};

/**
 * A component for consistent dividers
 */
export interface DividerProps {
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ label, className }) => {
  if (label) {
    return (
      <div className={cn("relative my-6", className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white text-sm text-gray-500">{label}</span>
        </div>
      </div>
    );
  }

  return <div className={cn("my-6 border-t border-gray-200", className)} />;
};

export default {
  buttonStyles,
  inputStyles,
  iconSizes,
  cardStyles,
  formFieldStyles,
  interactionStyles,
  entranceAnimations,
  SectionHeading,
  EmptyState,
  ContentWrapper,
  Divider,
};
