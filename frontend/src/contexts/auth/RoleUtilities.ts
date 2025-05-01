import { supabase } from '../../services/supabase';

export const verifyAdminAuth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Admin verification failed:', error);
    return false;
  }
};

export const isSellerVerified = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_verified, verification_level') // Select required fields
      .eq('id', userId)
      .single();
      
    if (error) {
      // Handle case where user might not be found (e.g., during signup)
      if (error.code === 'PGRST116') { 
        console.warn('Seller verification check: User not found (might be expected).');
        return false;
      }
      throw error; // Rethrow other errors
    }
    return !!data?.is_verified; // Check if is_verified is true
  } catch (error) {
    console.error('Seller verification check failed:', error);
    return false;
  }
}; 