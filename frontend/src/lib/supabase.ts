import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase-generated';

/**
 * Configuration options for the Supabase client
 */
interface SupabaseConfig {
  url: string;
  anonKey: string;
  storageUrl?: string;
  authFlowType?: 'implicit' | 'pkce';
  autoRefreshToken?: boolean;
  persistSession?: boolean;
  detectSessionInUrl?: boolean;
  headers?: Record<string, string>;
}

/**
 * Get Supabase configuration from environment variables
 */
const getSupabaseConfig = (): SupabaseConfig => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const storageUrl = import.meta.env.VITE_SUPABASE_STORAGE_URL;

  if (!url || !anonKey) {
    console.error('Missing Supabase URL or Anon Key. Check your environment variables.');
    throw new Error('Missing required Supabase configuration');
  }

  return {
    url,
    anonKey,
    storageUrl,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  };
};

/**
 * Initialize Supabase client
 */
const initializeSupabaseClient = () => {
  try {
    const config = getSupabaseConfig();
    
    // Initialize Supabase client with auth settings
    return createClient<Database>(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: config.autoRefreshToken,
        persistSession: config.persistSession,
        detectSessionInUrl: config.detectSessionInUrl
      },
      global: {
        headers: config.headers
      },
      ...(config.storageUrl ? { storage: { url: config.storageUrl } } : {})
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    // Still return a client with empty strings to prevent app crashes
    // but this client won't work - app will handle auth failures appropriately
    return createClient<Database>('', '', {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
};

// Create and export the Supabase client
export const supabaseClient = initializeSupabaseClient();

/**
 * Helper functions for handling Supabase errors
 */
export const handleError = (error: any, defaultMessage = 'An unknown error occurred'): Error => {
  // Log the error for debugging
  console.error('Supabase error:', error);
  
  // Return a standardized error format
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    // Handle Supabase-specific error format
    const message = error.message || error.msg || error.error_description || defaultMessage;
    const code = error.code || error.statusCode || error.status || 'UNKNOWN';
    
    const formattedError = new Error(message);
    (formattedError as any).code = code;
    (formattedError as any).details = error.details || null;
    
    return formattedError;
  }
  
  return new Error(defaultMessage);
};

/**
 * Check if an error is a Supabase authentication error
 */
export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  const code = error.code || (error as any).code;
  return (
    code === 'UNAUTHORIZED' || 
    code === '401' || 
    code === 401 ||
    code === 'UNAUTHENTICATED' ||
    (typeof error.message === 'string' && error.message.includes('auth'))
  );
};

export default supabaseClient; 