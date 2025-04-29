// Export Supabase client and utilities
export {
  supabase,
  testConnection,
  checkConnectionHealth,
  monitorConnection,
  isAuthenticated,
  getCurrentUser,
} from "@/services/supabase";

// Export the unified storage service
export * from "./unifiedStorage";

// Export slot services
export * from "./slots";
export { default as slotBatchOperations } from "./slotBatchOperations";

// Export hooks
export * from "../hooks/useStorage";
export * from "../hooks/useSlotBatchOperations";
