/**
 * Utility functions for error handling
 */

/**
 * Extracts a readable error message from different error types
 * 
 * @param error Any type of error object or string
 * @returns A readable error message string
 */
export const getErrorMessage = (error: unknown): string => {
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle Supabase error objects
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Default fallback
  return 'An unknown error occurred';
};

/**
 * Creates a standardized Error object from any error source
 * 
 * @param error Any type of error object or string
 * @returns A standard Error object
 */
export const createError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  
  return new Error(getErrorMessage(error));
};

/**
 * Logs an error to the console with contextual information
 * 
 * @param error The error object
 * @param context Optional context information about where the error occurred
 */
export const logError = (error: unknown, context?: string): void => {
  const errorMessage = getErrorMessage(error);
  const contextPrefix = context ? `[${context}] ` : '';
  console.error(`${contextPrefix}Error: ${errorMessage}`);
  
  // Optional: add additional error logging logic here (e.g., to a monitoring service)
}; 