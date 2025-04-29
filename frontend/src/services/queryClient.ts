import { QueryClient } from "@tanstack/react-query";
import { toast } from "../utils/toast";
import { TIMEOUTS } from "../config/timeouts";

/**
 * Global configuration for the React Query client
 * - Sets up default stale times
 * - Configures retry behavior
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time from centralized config
      staleTime: TIMEOUTS.CACHE_STALE_TIME,

      // Cache time from centralized config (called gcTime in v5)
      gcTime: TIMEOUTS.CACHE_MAX_AGE,

      // Retry failed queries 1 time by default
      retry: 1,

      // Refetch on window focus after stale time
      refetchOnWindowFocus: "always",

      // Don't refetch on reconnect for offline support
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

/**
 * Query key factories to maintain consistent cache keys across the application
 */
export const queryKeys = {
  // User related queries
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters: any) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Product related queries
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: any) =>
      [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Slot related queries
  slots: {
    all: ["slots"] as const,
    lists: () => [...queryKeys.slots.all, "list"] as const,
    list: (filters: any) => [...queryKeys.slots.lists(), { filters }] as const,
    details: () => [...queryKeys.slots.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.slots.details(), id] as const,
    stats: () => [...queryKeys.slots.all, "stats"] as const,
  },

  // Auction Slot related queries (New)
  auctionSlots: {
    all: ["auctionSlots"] as const,
    lists: () => [...queryKeys.auctionSlots.all, "list"] as const,
    list: (filters: any) =>
      [...queryKeys.auctionSlots.lists(), { filters }] as const,
    details: () => [...queryKeys.auctionSlots.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.auctionSlots.details(), id] as const,
    // Add stats key if needed for auction slots
    // stats: () => [...queryKeys.auctionSlots.all, 'stats'] as const,
  },

  // Category related queries
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters: any) =>
      [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
};

export default queryClient;
