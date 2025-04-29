import { supabase } from "../services/supabase";

// Re-export the supabase client
export { supabase };

// For testing purposes
export const getSupabaseClient = () => supabase;
