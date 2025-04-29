import { PostgrestError } from "@supabase/postgrest-js";
import { supabase } from "@/services/supabase";
import { AuditAction, AuditResource } from "./auditLog";

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorEn?: string;
  errorFr?: string;
}

/**
 * Common type guard for PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}

/**
 * Generic error handler for service functions
 */
export function handleServiceError<T>(
  error: unknown,
  context: string,
): ServiceResponse<T> {
  console.error(`Error in ${context}:`, error);

  // Handle different error types
  if (isPostgrestError(error)) {
    return {
      success: false,
      errorEn: `Operation failed: ${error.message}`,
      errorFr: `Opération échouée: ${error.message}`,
      error: error.message,
    };
  } else if (error instanceof Error) {
    return {
      success: false,
      errorEn: `An error occurred: ${error.message}`,
      errorFr: `Une erreur s'est produite: ${error.message}`,
      error: error.message,
    };
  }

  return {
    success: false,
    errorEn: "An unknown error occurred",
    errorFr: "Une erreur inconnue s'est produite",
    error: "Unknown error",
  };
}

/**
 * Log an administrative action with error handling
 */
export async function logAdminAction(
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>,
): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      console.warn("Cannot log admin action: User not authenticated");
      return;
    }

    const logEntry = {
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    };

    // First try the RPC method to bypass RLS policies
    const { error } = await supabase.rpc("log_admin_action", {
      log_entry: logEntry,
    });

    if (error) {
      // Fallback: direct insert with bypass flag
      const fallbackResult = await supabase
        .from("admin_audit_logs")
        .insert({ ...logEntry, skip_rls_check: true });

      if (fallbackResult.error) {
        console.warn("Error logging admin action:", fallbackResult.error);
        console.info("Admin Audit Log (not saved):", logEntry);
      }
    }
  } catch (error) {
    console.warn("Error in audit logging:", error);
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryableErrors?: Array<string | RegExp>;
    onRetry?: (attempt: number, error: Error) => void;
  } = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    retryableErrors = [
      "connection error",
      "timeout",
      "network error",
      "rate limit",
      /5\d\d/, // 5xx errors
      "ECONNRESET",
      "ETIMEDOUT",
    ],
    onRetry = (attempt, error) =>
      console.warn(`Retry attempt ${attempt} after error: ${error.message}`),
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      // Check if we've reached max retries
      if (attempt >= maxRetries) {
        throw error;
      }

      // Check if this error is retryable
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isRetryable = retryableErrors.some((pattern) =>
        typeof pattern === "string"
          ? errorMessage.includes(pattern)
          : pattern.test(errorMessage),
      );

      if (!isRetryable) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt - 1) + Math.random() * 100,
        maxDelay,
      );

      // Call onRetry callback
      if (error instanceof Error) {
        onRetry(attempt, error);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[],
): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
