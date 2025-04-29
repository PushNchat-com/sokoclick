import { PostgrestError } from "@supabase/postgrest-js";
import { ErrorMonitoring, ErrorSeverity } from "./core/ErrorMonitoring";
import { toast } from "../utils/toast";
import { testConnection } from "./supabase";

/**
 * Common error categories for better error handling
 */
export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  RATE_LIMIT = "rate_limit",
  SERVER = "server",
  UNKNOWN = "unknown",
}

/**
 * Database error interface with enhanced typing
 */
export interface DatabaseError {
  message: string;
  code?: string;
  category: ErrorCategory;
  originalError: PostgrestError | Error | null;
  details?: string;
  recommendation?: string;
  status?: number;
  retriable: boolean;
}

/**
 * Options for error handling
 */
export interface ErrorHandlingOptions {
  showToast?: boolean;
  logToMonitoring?: boolean;
  severity?: ErrorSeverity;
  componentName?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Default error handling options
 */
const defaultOptions: ErrorHandlingOptions = {
  showToast: true,
  logToMonitoring: true,
  severity: ErrorSeverity.ERROR,
};

/**
 * Common error messages for different scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: {
    en: "Network error. Please check your connection and try again.",
    fr: "Erreur de réseau. Veuillez vérifier votre connexion et réessayer.",
  },
  AUTHENTICATION: {
    en: "Authentication error. Please sign in again.",
    fr: "Erreur d'authentification. Veuillez vous reconnecter.",
  },
  AUTHORIZATION: {
    en: "You don't have permission to perform this action.",
    fr: "Vous n'avez pas la permission d'effectuer cette action.",
  },
  VALIDATION: {
    en: "Invalid data submitted. Please check your inputs.",
    fr: "Données soumises invalides. Veuillez vérifier vos entrées.",
  },
  NOT_FOUND: {
    en: "The requested resource was not found.",
    fr: "La ressource demandée n'a pas été trouvée.",
  },
  SERVER: {
    en: "Server error. Our team has been notified.",
    fr: "Erreur du serveur. Notre équipe a été notifiée.",
  },
  UNKNOWN: {
    en: "An unexpected error occurred. Please try again.",
    fr: "Une erreur inattendue s'est produite. Veuillez réessayer.",
  },
  CONFLICT: {
    en: "A conflict occurred. The resource may have been modified.",
    fr: "Un conflit s'est produit. La ressource a peut-être été modifiée.",
  },
  RATE_LIMIT: {
    en: "Too many requests. Please try again later.",
    fr: "Trop de requêtes. Veuillez réessayer plus tard.",
  },
};

/**
 * Map PostgreSQL error codes to error categories
 */
const errorCodeToCategory: Record<string, ErrorCategory> = {
  "08000": ErrorCategory.NETWORK, // Connection Exception
  "08003": ErrorCategory.NETWORK, // Connection Does Not Exist
  "08006": ErrorCategory.NETWORK, // Connection Failure
  "28000": ErrorCategory.AUTHENTICATION, // Invalid Authorization Specification
  "28P01": ErrorCategory.AUTHENTICATION, // Invalid Password
  "42501": ErrorCategory.AUTHORIZATION, // Insufficient Privilege
  "22000": ErrorCategory.VALIDATION, // Data Exception
  "23000": ErrorCategory.VALIDATION, // Integrity Constraint Violation
  "23505": ErrorCategory.CONFLICT, // Unique Violation
  "23503": ErrorCategory.VALIDATION, // Foreign Key Violation
  P0001: ErrorCategory.VALIDATION, // Raised Exception
  "42P01": ErrorCategory.NOT_FOUND, // Undefined Table
  "42703": ErrorCategory.VALIDATION, // Undefined Column
  "53100": ErrorCategory.RATE_LIMIT, // Disk Full
  "53200": ErrorCategory.RATE_LIMIT, // Out of Memory
  "53300": ErrorCategory.RATE_LIMIT, // Too Many Connections
  "53400": ErrorCategory.RATE_LIMIT, // Configuration Limit Exceeded
  "58000": ErrorCategory.SERVER, // System Error
  XX000: ErrorCategory.SERVER, // Internal Error
};

/**
 * Map HTTP status codes to error categories
 */
const statusCodeToCategory: Record<number, ErrorCategory> = {
  400: ErrorCategory.VALIDATION,
  401: ErrorCategory.AUTHENTICATION,
  403: ErrorCategory.AUTHORIZATION,
  404: ErrorCategory.NOT_FOUND,
  409: ErrorCategory.CONFLICT,
  422: ErrorCategory.VALIDATION,
  429: ErrorCategory.RATE_LIMIT,
  500: ErrorCategory.SERVER,
  502: ErrorCategory.SERVER,
  503: ErrorCategory.SERVER,
  504: ErrorCategory.SERVER,
};

/**
 * Classify a Supabase PostgrestError into our more detailed error system
 */
export function classifyPostgrestError(error: PostgrestError): DatabaseError {
  // Extract what we need from the PostgrestError
  const { message, code, details, hint } = error;

  // Get status from error if available (status may not be a direct property)
  const status = (error as any).status as number | undefined;

  // Determine error category based on PostgreSQL error code or HTTP status
  let category: ErrorCategory = ErrorCategory.UNKNOWN;

  if (code && errorCodeToCategory[code]) {
    category = errorCodeToCategory[code];
  } else if (status && statusCodeToCategory[status]) {
    category = statusCodeToCategory[status];
  }

  // Network errors typically have no status
  if (!status && message.includes("network")) {
    category = ErrorCategory.NETWORK;
  }

  // Determine if error is likely retriable
  const retriable = [
    ErrorCategory.NETWORK,
    ErrorCategory.RATE_LIMIT,
    ErrorCategory.SERVER,
  ].includes(category);

  return {
    message,
    code,
    category,
    originalError: error,
    details: details || undefined,
    recommendation: hint || undefined,
    status,
    retriable,
  };
}

/**
 * Handles standard errors and returns a normalized DatabaseError
 */
export function handleError(
  error: PostgrestError | Error | null | unknown,
  options: ErrorHandlingOptions = {},
): DatabaseError {
  const opts = { ...defaultOptions, ...options };

  // Create a standardized error
  let dbError: DatabaseError;

  if (error instanceof Error) {
    if ("code" in error && "details" in error && "message" in error) {
      // This looks like a PostgrestError
      dbError = classifyPostgrestError(error as unknown as PostgrestError);
    } else {
      // Generic Error object
      dbError = {
        message: error.message,
        category: error.message.toLowerCase().includes("network")
          ? ErrorCategory.NETWORK
          : ErrorCategory.UNKNOWN,
        originalError: error,
        retriable: error.message.toLowerCase().includes("network"),
      };
    }
  } else if (error && typeof error === "object") {
    // Unknown object type
    dbError = {
      message: "Unknown error occurred",
      category: ErrorCategory.UNKNOWN,
      originalError: new Error(JSON.stringify(error)),
      retriable: false,
    };
  } else {
    // Null, undefined, or primitive value
    dbError = {
      message: "No error details available",
      category: ErrorCategory.UNKNOWN,
      originalError: null,
      retriable: false,
    };
  }

  // Log to error monitoring system if requested
  if (opts.logToMonitoring) {
    ErrorMonitoring.logSystemError(
      dbError.originalError || new Error(dbError.message),
      {
        component: opts.componentName || "DatabaseOperation",
        severity: opts.severity || ErrorSeverity.ERROR,
        userId: opts.userId,
        metadata: {
          errorCategory: dbError.category,
          errorCode: dbError.code,
          errorDetails: dbError.details,
          ...opts.metadata,
        },
      },
    );
  }

  // Show toast if requested
  if (opts.showToast) {
    // Use category-specific message based on error type
    const categoryKey =
      dbError.category.toUpperCase() as keyof typeof ERROR_MESSAGES;
    const errorMsg = ERROR_MESSAGES[categoryKey] || ERROR_MESSAGES.UNKNOWN;

    toast.error(errorMsg.en);
  }

  return dbError;
}

/**
 * Checks connection and returns proper error if it fails
 */
export async function checkConnectionWithError(): Promise<DatabaseError | null> {
  const status = await testConnection();

  if (!status.isConnected) {
    return handleError(status.error || new Error("Connection failed"), {
      componentName: "ConnectionCheck",
      showToast: false, // Don't show toast here, let caller decide
    });
  }

  return null;
}

/**
 * Wraps a database operation in error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: ErrorHandlingOptions = {},
): Promise<{ data: T | null; error: DatabaseError | null }> {
  try {
    // First check connection
    const connectionError = await checkConnectionWithError();
    if (connectionError) {
      return { data: null, error: connectionError };
    }

    // Perform the operation
    const { data, error } = await operation();

    // Handle any errors
    if (error) {
      return {
        data: null,
        error: handleError(error, options),
      };
    }

    return { data, error: null };
  } catch (unexpectedError) {
    // Handle unexpected errors
    return {
      data: null,
      error: handleError(unexpectedError, {
        ...options,
        severity: ErrorSeverity.ERROR,
      }),
    };
  }
}

/**
 * Creates a wrapper for component error boundaries to use
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    ErrorMonitoring.logSystemError(error, {
      component: componentName,
      severity: ErrorSeverity.ERROR,
      metadata: {
        componentStack: errorInfo.componentStack,
        url: window.location.href,
      },
    });

    // Show a generic error toast
    toast.error(ERROR_MESSAGES.UNKNOWN.en);
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any) => boolean;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate backoff delay
      delay = Math.min(delay * backoffFactor, maxDelay);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never happen but TypeScript requires it
  throw new Error("Exceeded maximum retries");
}
