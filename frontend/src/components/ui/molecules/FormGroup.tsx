import React from "react";
import { cn } from "../../../utils/cn";
import { Input, InputProps } from "../atoms/Input";

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  label?: string | React.ReactNode;
  labelFor?: string;
  helpText?: string | React.ReactNode;
  error?: string;
  required?: boolean;
  orientation?: "vertical" | "horizontal";
  spacing?: "sm" | "md" | "lg";
  labelWidth?: string | number;
  fieldWidth?: string | number;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  label,
  labelFor,
  helpText,
  error,
  required,
  orientation = "vertical",
  spacing = "md",
  labelWidth,
  fieldWidth,
  className,
  ...props
}) => {
  // Generate a unique ID if not provided
  const id =
    labelFor || `form-group-${Math.random().toString(36).substring(2, 9)}`;
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;

  const spacingClasses = {
    sm: "space-y-1",
    md: "space-y-2",
    lg: "space-y-4",
  };

  // Clone the child to pass props if it's an Input component
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // Check if child is an Input component and has no error prop of its own
      if (child.type === Input && !child.props.error && error) {
        return React.cloneElement(child as React.ReactElement<InputProps>, {
          id,
          error,
          "aria-describedby": cn(
            errorId,
            helpId,
            child.props["aria-describedby"],
          ),
        });
      }

      // For other form elements, just set the ID and aria-describedby
      if (!child.props.id) {
        return React.cloneElement(child, {
          id,
          "aria-describedby": cn(
            errorId,
            helpId,
            child.props["aria-describedby"],
          ),
        });
      }
    }
    return child;
  });

  if (orientation === "horizontal") {
    return (
      <div
        className={cn(
          "grid grid-cols-12 gap-4 items-start",
          error && "text-red-500",
          className,
        )}
        {...props}
      >
        {label && (
          <div
            className="col-span-4"
            style={labelWidth ? { width: labelWidth } : undefined}
          >
            <label
              htmlFor={id}
              className={cn(
                "block text-sm font-medium text-gray-700",
                error && "text-red-500",
              )}
            >
              {label}
              {required && <span className="ml-1 text-red-500">*</span>}
            </label>
          </div>
        )}

        <div
          className="col-span-8"
          style={fieldWidth ? { width: fieldWidth } : undefined}
        >
          {enhancedChildren}

          {helpText && !error && (
            <p id={helpId} className="mt-1 text-sm text-gray-500">
              {helpText}
            </p>
          )}

          {error && (
            <p id={errorId} className="mt-1 text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        spacingClasses[spacing],
        error && "text-red-500",
        className,
      )}
      {...props}
    >
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "block text-sm font-medium text-gray-700",
            error && "text-red-500",
          )}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {enhancedChildren}

      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormGroup;
