/**
 * Central export point for Supabase client and helper functions
 */

// Export the client and basic helpers
export {
  supabase,
  testConnection as pingSupabase, // Renamed to avoid conflict with the more comprehensive version
  isAuthenticated,
  getCurrentUser,
} from "./config";

// Export the connection monitoring utilities
export {
  testConnection,
  checkConnectionHealth,
  monitorConnection,
  type ConnectionStatus,
} from "./connection";

/**
 * Example usage:
 *
 * ```typescript
 * import { supabase, testConnection } from '@/services/supabase';
 *
 * // Check connection at app startup
 * async function initializeApp() {
 *   const status = await testConnection();
 *   if (!status.isConnected) {
 *     console.error('Database connection failed:', status.error);
 *     // Show error to user or retry
 *   } else {
 *     console.log(`Connected to Supabase (latency: ${status.latency}ms)`);
 *   }
 * }
 *
 * // Regular data fetching
 * async function fetchData() {
 *   const { data, error } = await supabase
 *     .from('table_name')
 *     .select('*');
 *
 *   if (error) {
 *     console.error('Error fetching data:', error);
 *     return null;
 *   }
 *
 *   return data;
 * }
 * ```
 */
