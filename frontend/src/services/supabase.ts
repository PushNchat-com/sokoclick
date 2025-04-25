import { supabase } from '../lib/supabaseClient';

// Re-export the supabase client
export { supabase };

// Helper function to check if the user is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};
