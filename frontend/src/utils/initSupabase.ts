import { initStorage } from '../api/supabaseStorage';

/**
 * Initialize Supabase resources needed for the application
 * @returns Promise that resolves to an object with initialization results
 */
export const initializeSupabaseResources = async () => {
  try {
    // Initialize storage buckets
    const storageResult = await initStorage();
    
    // Additional initialization steps can be added here
    // For example, creating database triggers, policies, etc.
    
    return {
      success: storageResult.success,
      results: {
        storage: storageResult
      },
      messages: storageResult.success 
        ? ['Storage buckets initialized successfully']
        : [`Storage initialization issues: ${storageResult.message}`]
    };
  } catch (error: any) {
    console.error('Failed to initialize Supabase resources:', error);
    return {
      success: false,
      error,
      message: error.message || 'Unknown error initializing Supabase resources',
      results: {
        storage: { success: false, message: 'Storage initialization failed' }
      }
    };
  }
};

export default initializeSupabaseResources; 