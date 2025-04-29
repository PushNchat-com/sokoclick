/**
 * Consolidated errorLogger.ts and logging.ts into a unified logger.ts.
 * Handles general logging and error tracking in a centralized module.
 * Date: 2023-10-24
 */

import { ErrorInfo } from "react";
import { supabase } from "../services/supabase";
import { v4 as uuidv4 } from "uuid";

/*********************
 * TYPES
 *********************/

/**
 * Log data interface with key-value pairs
 */
interface LogData {
  [key: string]: any;
}

/**
 * Error log entry structure for analytics_events table
 */
interface ErrorLogEntry {
  event_type: string;
  additional_data: {
    error_id: string;
    component_name?: string;
    error_message: string;
    error_stack?: string;
    component_stack?: string;
    browser_info?: string;
    path?: string;
  };
  user_id?: string | null;
  session_id?: string;
}

/*********************
 * BASIC LOGGING FUNCTIONS
 *********************/

/**
 * Log an error message and optional data to the console
 * In a production environment, this would send the error to a logging service
 */
export const logError = (message: string, data?: LogData): void => {
  console.error(`[ERROR] ${message}`, data);

  // In a production app, we would send this to a logging service like Sentry
  // Example: Sentry.captureException(data?.error, { extra: { message, ...data } });
};

/**
 * Log an informational message and optional data
 */
export const logInfo = (message: string, data?: LogData): void => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[INFO] ${message}`, data);
  }
};

/**
 * Log a warning message and optional data
 */
export const logWarning = (message: string, data?: LogData): void => {
  console.warn(`[WARNING] ${message}`, data);

  // In a production app, we might want to send warnings to a logging service as well
};

/**
 * Log performance metrics
 */
export const logPerformance = (operation: string, timeMs: number): void => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[PERFORMANCE] ${operation}: ${timeMs}ms`);
  }

  // In production, we would send this to analytics
};

/*********************
 * ENHANCED ERROR LOGGING FUNCTIONS
 *********************/

/**
 * Centralized utility for logging errors to Supabase and optionally external services
 * @param error The error object
 * @param errorInfo React ErrorInfo object containing component stack
 * @param componentName Optional name of the component where the error occurred
 */
export const logComponentError = async (
  error: Error,
  errorInfo?: ErrorInfo,
  componentName?: string,
): Promise<void> => {
  try {
    // Generate unique error ID for tracing
    const errorId = uuidv4();

    // Get current user if available
    const { data: userData } = await supabase.auth.getUser();
    let userIdValue: string | undefined = undefined;
    if (userData?.user?.id) {
      userIdValue = userData.user.id;
    }

    // Generate a session ID if not available
    const sessionIdFromStorage = localStorage.getItem('session_id');
    const sessionId: string = sessionIdFromStorage !== null ? sessionIdFromStorage : uuidv4();
    if (!sessionIdFromStorage) {
      localStorage.setItem('session_id', sessionId);
    }

    // Browser and environment info
    const browserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    };

    // Create error log entry for analytics_events table
    const errorLogEntry: ErrorLogEntry = {
      event_type: "error_log",
      additional_data: {
        error_id: errorId,
        component_name: componentName || "Unknown",
        error_message: error.message || "Unknown error",
        error_stack: error.stack,
        component_stack: errorInfo?.componentStack,
        browser_info: JSON.stringify(browserInfo),
        path: window.location.pathname,
      },
      user_id: userIdValue,
      session_id: sessionId,
    };

    // Only log to Supabase in production to avoid filling the table during development
    if (process.env.NODE_ENV === "production") {
      // Insert into analytics_events table
      const { error: insertError } = await supabase
        .from("analytics_events")
        .insert(errorLogEntry);

      if (insertError) {
        console.error("Failed to insert error log:", insertError);
      }

      // Integration with external error tracking services
      // Uncomment if you're using an external service like Sentry
      // sendToExternalService(errorLogEntry);
    }

    // Always log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.group(`[ErrorLogger] ${componentName || "Unknown component"}`);
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo?.componentStack);
      console.error("Error ID:", errorId);
      console.error("User ID:", userIdValue || "Not logged in");
      console.error("Path:", window.location.pathname);
      console.groupEnd();
    }
  } catch (loggingError) {
    // Fallback logging if error logging itself fails
    console.error("Error in errorLogger:", loggingError);
    console.error("Original error:", error);
  }
};

/**
 * Log the result of an API operation
 * @param operation Name of the operation
 * @param result Success or failure
 * @param details Additional details about the operation
 */
export const logApiOperation = (
  operation: string,
  result: "success" | "failure",
  details?: LogData,
): void => {
  const message = `API ${operation} ${result}`;
  if (result === "success") {
    logInfo(message, details);
  } else {
    logError(message, details);
  }

  // In production, send to analytics
  if (process.env.NODE_ENV === "production") {
    // Example: Analytics.trackEvent('api_operation', { operation, result, ...details });
  }
};

// Export as both named exports and a default object for flexibility
export default {
  logError,
  logInfo,
  logWarning,
  logPerformance,
  logComponentError,
  logApiOperation,
};
