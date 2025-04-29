import React from "react";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "../../store/LanguageContext";
import {
  formatErrorMessage,
  translateTechnicalError,
} from "../../utils/formatMessage";

// Icons
export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

export const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
      clipRule="evenodd"
    />
  </svg>
);

export interface ErrorMessageProps {
  /**
   * Error message or error object to display
   */
  message: string | Error;

  /**
   * Optional title to display above the error message
   */
  title?: string;

  /**
   * Callback when retry button is clicked
   */
  onRetry?: () => void;

  /**
   * CSS class name for the error message container
   */
  className?: string;

  /**
   * Variant of the error message
   */
  variant?: "inline" | "toast" | "banner";
}

/**
 * Standardized error message component that follows the pattern:
 * [What happened] because [Why]. To fix, [How].
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title,
  onRetry,
  className,
  variant = "inline",
}) => {
  const { t } = useLanguage();

  // Convert Error object to string if needed
  const errorMessage = message instanceof Error ? message.message : message;

  // Determine error type and get standardized message
  const errorType = translateTechnicalError(errorMessage);
  const formattedMessage = t(formatErrorMessage(errorType));

  // If it's an inline error (form field, etc.)
  if (variant === "inline") {
    return (
      <div className={twMerge("text-sm text-red-600", className)} role="alert">
        {formattedMessage}
      </div>
    );
  }

  // If it's a banner error (page-level)
  if (variant === "banner") {
    return (
      <div
        className={twMerge(
          "bg-red-50 border-l-4 border-red-400 p-4",
          className,
        )}
        role="alert"
      >
        {title && (
          <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
        )}

        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
          <div>
            <p className="text-sm text-red-700">{formattedMessage}</p>

            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshIcon
                  className="-ml-1 mr-2 h-4 w-4"
                  aria-hidden="true"
                />
                {t({
                  en: "Try again",
                  fr: "Réessayer",
                })}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Toast variant (for notification errors)
  return (
    <div
      className={twMerge(
        "bg-white shadow-md border-l-4 border-red-500 rounded-r-md p-3",
        className,
      )}
      role="alert"
    >
      <div className="flex items-center">
        <InfoIcon className="w-5 h-5 text-red-500 mr-2" />
        <p className="text-sm text-gray-800">{formattedMessage}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs text-red-600 hover:text-red-800 hover:underline flex items-center"
          aria-label={t({
            en: "Try again",
            fr: "Réessayer",
          })}
        >
          <RefreshIcon className="w-3 h-3 mr-1" />
          {t({
            en: "Try again",
            fr: "Réessayer",
          })}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
