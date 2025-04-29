import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../store/LanguageContext";
import {
  createAriaLabel,
  focusStyles,
} from "../ui/design-system/accessibility";

export interface DialogProps {
  /**
   * Whether the dialog is visible
   */
  isOpen: boolean;

  /**
   * Dialog title
   */
  title: React.ReactNode;

  /**
   * Dialog body content
   */
  children: React.ReactNode;

  /**
   * Callback when close button is clicked or backdrop is clicked
   */
  onClose: () => void;

  /**
   * Whether to display a close button
   */
  showCloseButton?: boolean;

  /**
   * Additional actions to display in the footer
   */
  actions?: React.ReactNode;

  /**
   * Size of the dialog
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Max width of the dialog (CSS value)
   */
  maxWidth?: string;

  /**
   * Whether to close when clicking outside
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether to close when pressing Escape key
   */
  closeOnEsc?: boolean;

  /**
   * Additional CSS class for the dialog
   */
  className?: string;
}

/**
 * A reusable dialog component with accessibility features.
 */
const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  children,
  onClose,
  showCloseButton = true,
  actions,
  size = "md",
  maxWidth,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className = "",
}) => {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Predefined sizes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Set focus on dialog when opened
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Find the first focusable element and focus it
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      } else {
        // If no focusable elements, focus the dialog itself
        dialogRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Render dialog in a portal
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="dialog-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      >
        {/* Dialog positioning */}
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Dialog container */}
          <div
            ref={dialogRef}
            className={`bg-white rounded-lg shadow-xl overflow-hidden transform transition-all ${sizeClasses[size]} ${className}`}
            style={{ maxWidth: maxWidth || undefined }}
            tabIndex={-1}
            role="document"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2
                id="dialog-title"
                className="text-lg font-medium text-gray-900"
              >
                {title}
              </h2>

              {showCloseButton && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                  style={focusStyles.keyboard}
                  {...createAriaLabel(
                    t({
                      en: "Close dialog",
                      fr: "Fermer la boîte de dialogue",
                    }),
                  )}
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-4">{children}</div>

            {/* Footer with actions */}
            {actions && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Export the Dialog component as the default export
export default Dialog;

/**
 * A specialized confirmation dialog with predefined actions.
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger" | "warning" | "success";
  onConfirm: () => void;
  onCancel: () => void;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  size = "sm",
  icon,
}) => {
  const { t } = useLanguage();

  // Default labels
  const defaultConfirmLabel = t({
    en: "Confirm",
    fr: "Confirmer",
  });

  const defaultCancelLabel = t({
    en: "Cancel",
    fr: "Annuler",
  });

  // Button variant styles
  const variantStyles = {
    primary: "bg-primary-600 hover:bg-primary-700 focus:ring-primary-500",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
  };

  const actions = (
    <>
      <button
        type="button"
        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={onCancel}
        style={focusStyles.keyboard}
      >
        {cancelLabel || defaultCancelLabel}
      </button>
      <button
        type="button"
        className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${variantStyles[confirmVariant]} focus:outline-none focus:ring-2 focus:ring-offset-2`}
        onClick={onConfirm}
        style={focusStyles.keyboard}
      >
        {confirmLabel || defaultConfirmLabel}
      </button>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      actions={actions}
      size={size}
      closeOnBackdropClick={false}
    >
      <div className="flex">
        {icon && <div className="mr-4 flex-shrink-0 mt-0.5">{icon}</div>}
        <div>
          {typeof message === "string" ? (
            <p className="text-sm text-gray-500">{message}</p>
          ) : (
            message
          )}
        </div>
      </div>
    </Dialog>
  );
};
