import { QueryClient } from '@tanstack/react-query';
import { toast } from '../utils/toast';

/**
 * Global configuration for the React Query client
 * - Sets up default stale times
 * - Configures retry behavior
 * - Handles error reporting
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time of 5 minutes - data will be considered fresh for this period
      staleTime: 5 * 60 * 1000,
      
      // Cache time of 10 minutes - data will remain in the cache for this long after becoming inactive
      cacheTime: 10 * 60 * 1000,
      
      // Retry failed queries 1 time by default
      retry: 1,
      
      // Refetch on window focus after stale time
      refetchOnWindowFocus: 'always',
      
      // Don't refetch on reconnect for offline support
      refetchOnReconnect: false,
      
      // Show error notifications for query failures
      onError: (error: unknown) => {
        const message = error instanceof Error 
          ? error.message 
          : 'An error occurred while fetching data';
          
        console.error('Query error:', error);
        
        // Only show toast in production to avoid spam during development
        if (process.env.NODE_ENV === 'production') {
          toast.error(`${message}. Please try again.`);
        }
      }
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Show error notifications for mutation failures
      onError: (error: unknown) => {
        const message = error instanceof Error 
          ? error.message 
          : 'An error occurred while performing this operation';
          
        console.error('Mutation error:', error);
        toast.error(`${message}. Please try again.`);
      }
    }
  }
});

/**
 * Query key factories to maintain consistent cache keys across the application
 */
export const queryKeys = {
  // User related queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Product related queries
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  
  // Slot related queries
  slots: {
    all: ['slots'] as const,
    lists: () => [...queryKeys.slots.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.slots.lists(), { filters }] as const,
    details: () => [...queryKeys.slots.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.slots.details(), id] as const,
    stats: () => [...queryKeys.slots.all, 'stats'] as const,
  },
  
  // Category related queries
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  }
};

export default queryClient; 