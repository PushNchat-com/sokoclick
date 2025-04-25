interface LogData {
  [key: string]: any;
}

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
  if (process.env.NODE_ENV !== 'production') {
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
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[PERFORMANCE] ${operation}: ${timeMs}ms`);
  }
  
  // In production, we would send this to analytics
}; 