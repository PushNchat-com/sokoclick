import { createClient } from "@supabase/supabase-js";
import { TIMEOUTS } from "../../config/timeouts";
import type { Database, Json } from "../../types/supabase-types";

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
  if (!navigator.onLine) {
    throw new Error("Browser is offline");
  }
  
  try {
    // Try to use the ping RPC function first
    let pingSuccess = false;
    
    try {
      const { data: pingData, error: pingError } = await supabase.rpc("ping");
      
      if (!pingError && pingData) {
        // The ping was successful
        console.info("Supabase connection successful:", pingData);
        pingSuccess = true;
        return true;
      }
    } catch (pingErr) {
      console.info("Ping RPC function error:", pingErr);
      // Will fall through to the fallback method
    }
    
    // If ping wasn't successful, use the fallback method
    if (!pingSuccess) {
      console.info("Using fallback connection test");
      const { error: countError } = await supabase
        .from("auction_slots")
        .select("*", { count: "exact", head: true });
      
      if (countError) throw countError;
      
      // Success if we got here
      console.info("Supabase connection successful (fallback method)");
      return true;
    }
    
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
