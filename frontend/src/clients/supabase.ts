import { supabase } from '../lib/supabaseClient';

// Re-export the supabase client
export { supabase };

// For testing purposes
export const getSupabaseClient = () => supabase; 