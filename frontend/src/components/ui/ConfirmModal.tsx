import React from "react";
import Dialog from "./Dialog";
import { Button } from "./Button";
import { useLanguage } from "../../store/LanguageContext";
import { cn } from "../../utils/cn";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: { en: string; fr: string };
  description?: { en: string; fr: string };
  confirmText?: { en: string; fr: string };
  cancelText?: { en: string; fr: string };
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
}) => {
  const { t } = useLanguage();

  // Default text values
  const defaultConfirmText = { en: "Confirm", fr: "Confirmer" };
  const defaultCancelText = { en: "Cancel", fr: "Annuler" };
  const defaultDescription = {
    en: "This action cannot be undone. Are you sure you want to continue?",
    fr: "Cette action ne peut pas être annulée. Êtes-vous sûr de vouloir continuer ?",
  };

  // Variant styling
  const variantStyles = {
    danger: {
      icon: "text-red-500",
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      title: "text-red-700",
    },
    warning: {
      icon: "text-amber-500",
      button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
      title: "text-amber-700",
    },
    info: {
      icon: "text-blue-500",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      title: "text-blue-700",
    },
  };

  // Icon based on variant
  const VariantIcon = () => {
    switch (variant) {
      case "danger":
        return (
          <svg
            className={cn("h-6 w-6", variantStyles[variant].icon)}
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className={cn("h-6 w-6", variantStyles[variant].icon)}
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className={cn("h-6 w-6", variantStyles[variant].icon)}
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t(title)}
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          <div
            className={cn(
              "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-opacity-10 sm:mx-0 sm:h-10 sm:w-10",
              `bg-${variant}-100`,
            )}
          >
            <VariantIcon />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3
              className={cn(
                "text-lg leading-6 font-medium",
                variantStyles[variant].title,
              )}
              id="confirm-modal-title"
            >
              {t(title)}
            </h3>
            <div className="mt-2">
              <p
                className="text-sm text-gray-500"
                id="confirm-modal-description"
              >
                {t(description || defaultDescription)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <Button
          type="button"
          className={cn(
            "w-full sm:w-auto sm:ml-3",
            variantStyles[variant].button,
          )}
          onClick={onConfirm}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t(confirmText || defaultConfirmText)}
            </>
          ) : (
            t(confirmText || defaultConfirmText)
          )}
        </Button>
        <Button
          type="button"
          className="mt-3 w-full sm:mt-0 sm:w-auto bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
          onClick={onClose}
          disabled={isLoading}
        >
          {t(cancelText || defaultCancelText)}
        </Button>
      </div>
    </Dialog>
  );
};
