import React, { useState } from "react";
import { cn } from "../../../utils/cn";
import { Button, ButtonProps } from "../atoms/Button";
import { Icon } from "../atoms/Icon";

export interface ActionButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  confirmText?: string;
  confirmDescription?: string;
  confirmVariant?: "warning" | "danger" | "info";
  confirmIcon?: string;
  requireConfirmation?: boolean;
  cancelText?: string;
  confirmButtonText?: string;
  onConfirm?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  onCancel?: () => void;
  preventDefaultLoading?: boolean;
  autoDisableOnLoading?: boolean;
  autoDisableOnConfirm?: boolean;
  successText?: string;
  successIcon?: string;
  successDuration?: number;
  errorIcon?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  isLoading: propsIsLoading,
  confirmText = "Are you sure?",
  confirmDescription,
  confirmVariant = "warning",
  confirmIcon,
  requireConfirmation = false,
  cancelText = "Cancel",
  confirmButtonText = "Confirm",
  onConfirm,
  onCancel,
  preventDefaultLoading = false,
  autoDisableOnLoading = true,
  autoDisableOnConfirm = true,
  successText,
  successIcon = "check",
  successDuration = 1500,
  errorIcon = "error",
  children,
  disabled,
  variant,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // When in confirmation mode, set button variant based on confirmVariant
  const getButtonVariant = () => {
    if (showConfirm) {
      if (confirmVariant === "danger") return "destructive";
      if (confirmVariant === "warning") return "warning";
      return "primary";
    }
    return variant;
  };

  // Handle click with confirmation flow
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // If in confirmation mode and confirm is clicked
    if (showConfirm) {
      setShowConfirm(false);

      if (autoDisableOnConfirm) {
        setIsLoading(true);
      }

      try {
        if (onConfirm) {
          const result = onConfirm(e);

          // If the result is a promise, wait for it
          if (result instanceof Promise) {
            await result;
          }
        }

        if (successText) {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, successDuration);
        }
      } catch (error) {
        console.error("Error in ActionButton onConfirm:", error);
        setShowError(true);
        setTimeout(() => {
          setShowError(false);
        }, successDuration);
      } finally {
        if (autoDisableOnConfirm) {
          setIsLoading(false);
        }
      }

      return;
    }

    // If confirmation is required, show confirmation UI
    if (requireConfirmation) {
      setShowConfirm(true);
      return;
    }

    // Normal click without confirmation
    if (onClick) {
      if (!preventDefaultLoading && autoDisableOnLoading) {
        setIsLoading(true);
      }

      try {
        const result = onClick(e);

        // If the result is a promise, wait for it
        if (result instanceof Promise) {
          await result;
        }

        if (successText) {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
          }, successDuration);
        }
      } catch (error) {
        console.error("Error in ActionButton onClick:", error);
        setShowError(true);
        setTimeout(() => {
          setShowError(false);
        }, successDuration);
      } finally {
        if (!preventDefaultLoading && autoDisableOnLoading) {
          setIsLoading(false);
        }
      }
    }
  };

  // Handle cancel during confirmation
  const handleCancel = () => {
    setShowConfirm(false);
    if (onCancel) {
      onCancel();
    }
  };

  // Render different states
  if (showConfirm) {
    return (
      <div className="inline-flex space-x-2">
        <Button
          variant="ghost"
          onClick={handleCancel}
          size={props.size}
          disabled={isLoading || disabled}
          {...props}
        >
          {cancelText}
        </Button>
        <Button
          variant={getButtonVariant()}
          onClick={handleClick}
          isLoading={isLoading || propsIsLoading}
          size={props.size}
          disabled={isLoading || propsIsLoading || disabled}
          leftIcon={
            confirmIcon ? <Icon name={confirmIcon} size="sm" /> : undefined
          }
          {...props}
        >
          {confirmButtonText}
        </Button>
      </div>
    );
  }

  if (showSuccess && successText) {
    return (
      <Button
        variant="success"
        disabled
        leftIcon={<Icon name={successIcon} size="sm" />}
        size={props.size}
        className={cn(props.className, "animate-pulse")}
        {...props}
      >
        {successText}
      </Button>
    );
  }

  if (showError) {
    return (
      <Button
        variant="destructive"
        onClick={handleClick}
        leftIcon={<Icon name={errorIcon} size="sm" />}
        size={props.size}
        {...props}
      >
        {children}
      </Button>
    );
  }

  // Normal state
  return (
    <Button
      variant={getButtonVariant()}
      onClick={handleClick}
      isLoading={isLoading || propsIsLoading}
      disabled={isLoading || propsIsLoading || disabled}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ActionButton;
