import { createClient } from "@supabase/supabase-js";
import { TIMEOUTS } from "../../config/timeouts";
import type { Database } from "../../types/supabase-types";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate presence of required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.",
  );
}

// Create the Supabase client with typed Database interface
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "sokoclick-auth-token",
    storage: {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          console.error("Error retrieving auth data from localStorage", error);
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.error("Error storing auth data in localStorage", error);
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.error("Error removing auth data from localStorage", error);
          return Promise.resolve();
        }
      },
    },
  },
  global: {
    headers: {
      "x-application-name": "sokoclick",
    },
    fetch: fetch.bind(globalThis),
  },
  realtime: {
    timeout: TIMEOUTS.SUPABASE_REALTIME,
    logger: (_log: unknown) => {
      // Disable logging to avoid eval in logger
    },
  },
});

/**
 * Tests the connection to Supabase
 * @returns Promise that resolves to true if connection is successful, or rejects with error
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    // Ping a lightweight table or call a simple RPC function
    // Here we're using a simple query to fetch the server timestamp
    const { data, error } = await supabase.rpc("ping");

    if (error) {
      throw error;
    }

    console.info("Supabase connection successful:", data);
    return true;
  } catch (error) {
    console.error("Supabase connection test failed:", error);
    throw error;
  }
};

// Re-export auth helper functions for convenience
export const isAuthenticated = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};
