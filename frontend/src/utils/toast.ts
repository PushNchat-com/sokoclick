/**
 * Merged toast utilities from toast.tsx into toast.ts.
 * Unified multilingual support and enhanced notification handling.
 * Removed duplicate toast.tsx file.
 * Date: 2023-10-24
 */
import { createElement } from "react";
import { toast as hotToast } from "react-hot-toast";
import { TranslationObject } from "../store/LanguageContext";
import {
  formatErrorMessage,
  formatSuccessMessage,
  translateTechnicalError,
} from "./formatMessage";

// Import language utils
import {
  getCurrentLanguage,
  getCurrentLanguageText,
} from "../store/LanguageContext";

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Toast options
 */
export interface ToastOptions {
  duration?: number;
  action?: {
    text: string | TranslationObject;
    onClick: () => void;
    label?: string; // Added for compatibility with toast.tsx
  };
}

// Interface for custom toast with JSX
export interface ToastWithActionProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Helper function to create a custom toast with action
function createToastWithAction(props: ToastWithActionProps) {
  const { message, action } = props;

  return createElement(
    "div",
    {
      className:
        "flex items-center justify-between gap-4 min-w-[300px] p-4 bg-white rounded-lg shadow-lg",
    },
    [
      createElement("span", { key: "message" }, message),
      action &&
        createElement(
          "button",
          {
            key: "action",
            onClick: action.onClick,
            className:
              "px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
          },
          action.label,
        ),
    ].filter(Boolean),
  );
}

// Helper function to get toast options
function getToastOptions(type: ToastType, options?: ToastOptions): any {
  const baseOptions = {
    duration: options?.duration || (type === "error" ? 5000 : 3000),
    ariaProps: {
      role: type === "error" ? "alert" : "status",
      "aria-live": type === "error" ? "assertive" : "polite",
    },
  };

  if (options?.action) {
    const actionText =
      typeof options.action.text === "string"
        ? options.action.text
        : getCurrentLanguageText(options.action.text);

    return {
      ...baseOptions,
      icon: null,
      className: "toast-with-action",
      style: {
        padding: "16px",
        color: "#1a1a1a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
      },
      action: {
        text: actionText,
        onClick: options.action.onClick,
      },
    };
  }

  return baseOptions;
}

/**
 * Toast service for displaying notifications with bilingual support
 */
export const toast = {
  /**
   * Display a success toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  success(message: string | TranslationObject, options?: ToastOptions) {
    const msg =
      typeof message === "string" ? message : getCurrentLanguageText(message);
    return hotToast.success(msg, getToastOptions("success", options));
  },

  /**
   * Display an error toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  error(message: string | TranslationObject, options?: ToastOptions) {
    // If it's a string, try to translate technical error to user-friendly format
    if (typeof message === "string") {
      const errorType = translateTechnicalError(message);
      const formattedMessage = formatErrorMessage(errorType);
      const msg = getCurrentLanguageText(formattedMessage);
      return hotToast.error(msg, getToastOptions("error", options));
    }

    // If it's already a translation object, use it directly
    const msg = getCurrentLanguageText(message);
    return hotToast.error(msg, getToastOptions("error", options));
  },

  /**
   * Display an error toast message for a specific error
   * @param error The error object or message
   * @param options Toast display options
   */
  errorWithType(error: Error | string, options?: ToastOptions) {
    const errorType = translateTechnicalError(error);
    const formattedMessage = formatErrorMessage(errorType);
    const msg = getCurrentLanguageText(formattedMessage);
    return hotToast.error(msg, getToastOptions("error", options));
  },

  /**
   * Display an info toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  info(message: string | TranslationObject, options?: ToastOptions) {
    const msg =
      typeof message === "string" ? message : getCurrentLanguageText(message);
    return hotToast(msg, {
      icon: "ℹ️",
      style: {
        backgroundColor: "#EFF6FF",
        color: "#3B82F6",
        border: "1px solid #93C5FD",
      },
      ...getToastOptions("info", options),
    });
  },

  /**
   * Display a warning toast message
   * @param message The message or translation object
   * @param options Toast display options
   */
  warning(message: string | TranslationObject, options?: ToastOptions) {
    const msg =
      typeof message === "string" ? message : getCurrentLanguageText(message);

    // Use a simpler approach without custom JSX to avoid potential issues
    return hotToast(msg, {
      icon: "⚠️",
      style: {
        backgroundColor: "#FFFBEB",
        color: "#D97706",
        border: "1px solid #FCD34D",
      },
      ...getToastOptions("warning", options),
    });
  },

  /**
   * Display a custom toast message
   * @param message The message or translation object
   * @param type Toast type
   * @param options Toast display options
   */
  custom(
    message: string | TranslationObject,
    type: ToastType = "info",
    options?: ToastOptions,
  ) {
    switch (type) {
      case "success":
        return this.success(message, options);
      case "error":
        return this.error(message, options);
      case "warning":
        return this.warning(message, options);
      case "info":
      default:
        return this.info(message, options);
    }
  },

  /**
   * Display a custom toast with JSX content (from toast.tsx)
   * @param message The message to display
   * @param options Toast options
   */
  customWithAction(message: string, options?: ToastOptions) {
    return hotToast.custom(
      createToastWithAction({
        message,
        action: options?.action
          ? {
              label:
                typeof options.action.text === "string"
                  ? options.action.text
                  : getCurrentLanguageText(options.action.text),
              onClick: options.action.onClick,
            }
          : undefined,
      }),
      {
        duration: options?.duration || 3000,
      },
    );
  },

  /**
   * Dismiss a specific toast by ID
   * @param id Toast ID
   */
  dismiss(id: string) {
    hotToast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    hotToast.dismiss();
  },

  /**
   * Alias for dismiss (compatibility with toast.tsx)
   */
  remove: hotToast.remove,
};

export default toast;
