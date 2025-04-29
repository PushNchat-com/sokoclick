/**
 * Central configuration for timeout settings
 * Used throughout the application for consistent timeout handling
 */

// Get any environment variable overrides
const getEnvTimeout = (key: string, defaultValue: number): number => {
  const envValue = import.meta.env[`VITE_${key}`];
  return envValue ? parseInt(envValue, 10) : defaultValue;
};

export const TIMEOUTS = {
  // API and network timeouts
  API_REQUEST: getEnvTimeout("API_TIMEOUT", 30000), // Default 30s, can be overridden
  UPLOAD_RETRY_DELAY: getEnvTimeout("UPLOAD_RETRY_DELAY", 1000), // Base delay for retries
  UPLOAD_MAX_RETRIES: getEnvTimeout("UPLOAD_MAX_RETRIES", 3), // Maximum retry attempts

  // Supabase specific
  SUPABASE_REALTIME: getEnvTimeout("SUPABASE_REALTIME_TIMEOUT", 10000), // Realtime connection timeout

  // UI timeouts
  TOAST_DURATION: 5000, // Toast notification display time
  DEBOUNCE_SEARCH: 300, // Debounce time for search inputs
  ANIMATION_DURATION: 300, // Standard animation duration

  // Session timeouts
  SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  SESSION_WARNING: 5 * 60 * 1000, // Warning 5 minutes before expiry

  // Cache durations
  CACHE_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_MAX_AGE: 10 * 60 * 1000, // 10 minutes
};

export default TIMEOUTS;
