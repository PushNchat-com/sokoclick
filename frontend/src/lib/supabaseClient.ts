import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sokoclick-auth-token',
    storage: {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          console.error('Error retrieving auth data from localStorage', error);
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.error('Error storing auth data in localStorage', error);
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.error('Error removing auth data from localStorage', error);
          return Promise.resolve();
        }
      },
    },
  },
  global: {
    headers: {
      'x-application-name': 'sokoclick',
    },
    fetch: fetch.bind(globalThis),
  },
  realtime: {
    timeout: 30000,
    logger: (_log: unknown) => {
      // Disable logging to avoid eval in logger
    },
  },
}); 