/**
 * @deprecated This file is deprecated. Use the centralized client from './supabase/index.ts'.
 *
 * Re-exporting from the new centralized location to maintain backward compatibility.
 * This file will be removed in a future update.
 */

export {
  supabase,
  isAuthenticated,
  getCurrentUser,
  testConnection,
  checkConnectionHealth,
  monitorConnection,
} from "./supabase/index";
