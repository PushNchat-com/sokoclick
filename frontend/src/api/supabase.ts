import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase-generated';
import { getErrorMessage } from '../utils/error';
import { AuctionSlot } from '../types/auctions';
import { supabaseClient as supabase, handleError } from '../lib/supabase';
import migrationSql from './migrations/add_auction_user_relations.sql?raw';
import syncRolesSql from './migrations/sync_user_roles.sql?raw';
import adminDashboardStatsSql from './migrations/admin_dashboard_stats.sql?raw';
import restoreAdminSql from './migrations/restore_admin.sql?raw';
import fixUserRlsRecursionSql from './migrations/fix_user_rls_recursion.sql?raw';
import diagnoseRolesSql from './migrations/diagnose_roles.sql?raw';
import fixUserRoleTypeSql from './migrations/fix_user_role_type.sql?raw';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env file.');
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// Create Supabase client with types
export const supabaseClient = supabase;

// Type for auction slot insert/update
type AuctionSlotInsert = Omit<Database['public']['Tables']['auction_slots']['Insert'], 'id'> & { id?: number };
type AuctionSlotUpdate = Database['public']['Tables']['auction_slots']['Update'];

/**
 * Apply migration to restore admin privileges to system admin account
 */
export const applyRestoreAdminMigration = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Applying restore admin migration...');
    
    // Run the migration SQL
    const { error } = await supabaseClient.rpc('pgsql', { query: restoreAdminSql });
    
    if (error) {
      console.error('Restore admin migration failed:', error);
      return { 
        success: false, 
        message: `Restore admin migration failed: ${error.message || 'Unknown error'}`
      };
    }
    
    return { 
      success: true, 
      message: 'Admin privileges restored successfully' 
    };
  } catch (error: any) {
    console.error('Error applying restore admin migration:', error);
    return { 
      success: false, 
      message: `Restore admin migration error: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Apply migration to fix user RLS recursion issues
 */
export const applyFixUserRlsRecursionMigration = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Applying fix for user RLS recursion issues...');
    
    // Run the migration SQL
    const { error } = await supabaseClient.rpc('pgsql', { query: fixUserRlsRecursionSql });
    
    if (error) {
      console.error('Fix user RLS recursion migration failed:', error);
      return { 
        success: false, 
        message: `Fix user RLS recursion migration failed: ${error.message || 'Unknown error'}`
      };
    }
    
    return { 
      success: true, 
      message: 'User RLS recursion issues fixed successfully' 
    };
  } catch (error: any) {
    console.error('Error applying fix user RLS recursion migration:', error);
    return { 
      success: false, 
      message: `Fix user RLS recursion migration error: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Apply migration to fix user role types
 */
export const applyFixUserRoleTypeMigration = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Applying fix for user role types...');
    
    // Run the migration SQL
    const { error } = await supabaseClient.rpc('pgsql', { query: fixUserRoleTypeSql });
    
    if (error) {
      console.error('Fix user role type migration failed:', error);
      return { 
        success: false, 
        message: `Fix user role type migration failed: ${error.message || 'Unknown error'}`
      };
    }
    
    return { 
      success: true, 
      message: 'User role types fixed successfully' 
    };
  } catch (error: any) {
    console.error('Error applying fix user role type migration:', error);
    return { 
      success: false, 
      message: `Fix user role type migration error: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Apply database migrations if needed
 * This helps ensure the database schema is properly set up
 */
export const applyMigrations = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    // Check if we can access the auction_slots table to see if migration is needed
    const { error: checkError } = await supabaseClient
      .from('auction_slots')
      .select('seller_id')
      .limit(1);
    
    // If we get a column error, we need to run the migration
    const needsMigration = checkError && 
      (checkError.message?.includes('column "seller_id" does not exist') ||
       checkError.message?.includes('relationship') ||
       checkError.message?.includes('not found'));
    
    if (needsMigration) {
      console.log('Database migration needed for auction slots relationships');
      
      // Run the migration SQL
      const { error } = await supabaseClient.rpc('pgsql', { query: migrationSql });
      
      if (error) {
        console.error('Migration failed:', error);
        return { 
          success: false, 
          message: `Migration failed: ${error.message || 'Unknown error'}`
        };
      }
    }

    // Apply role synchronization migration
    const roleSyncResult = await applyRoleSyncMigration();
    if (!roleSyncResult.success) {
      return roleSyncResult;
    }

    // Apply admin dashboard stats migration
    const statsResult = await applyAdminDashboardStatsMigration();
    if (!statsResult.success) {
      return statsResult;
    }

    // Apply restore admin migration
    const restoreAdminResult = await applyRestoreAdminMigration();
    if (!restoreAdminResult.success) {
      return restoreAdminResult;
    }
    
    // Apply fix for user RLS recursion issues
    const fixUserRlsResult = await applyFixUserRlsRecursionMigration();
    if (!fixUserRlsResult.success) {
      return fixUserRlsResult;
    }
    
    // Apply fix for user role types
    const fixUserRoleTypeResult = await applyFixUserRoleTypeMigration();
    if (!fixUserRoleTypeResult.success) {
      return fixUserRoleTypeResult;
    }
    
    return { 
      success: true, 
      message: 'All migrations applied successfully' 
    };
  } catch (error: any) {
    console.error('Error applying migrations:', error);
    return { 
      success: false, 
      message: `Migration error: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Apply role synchronization migration if needed
 * This ensures roles stay in sync between users table and auth metadata
 */
export const applyRoleSyncMigration = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Applying role synchronization migration...');
    
    // Run the migration SQL
    const { error } = await supabaseClient.rpc('pgsql', { query: syncRolesSql });
    
    if (error) {
      console.error('Role sync migration failed:', error);
      return { 
        success: false, 
        message: `Role sync migration failed: ${error.message || 'Unknown error'}`
      };
    }
    
    return { 
      success: true, 
      message: 'Role synchronization migration applied successfully' 
    };
  } catch (error: any) {
    console.error('Error applying role sync migration:', error);
    return { 
      success: false, 
      message: `Role sync migration error: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Apply admin dashboard stats view migration
 * This creates a view that provides aggregated statistics for the admin dashboard
 */
export const applyAdminDashboardStatsMigration = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Applying admin dashboard stats view migration...');
    
    // Run the migration SQL
    const { error } = await supabaseClient.rpc('pgsql', { query: adminDashboardStatsSql });
    
    if (error) {
      console.error('Admin dashboard stats view migration failed:', error);
      return { 
        success: false, 
        message: `Admin dashboard stats view migration failed: ${error.message || 'Unknown error'}`
      };
    }
    
    return { 
      success: true, 
      message: 'Admin dashboard stats view migration applied successfully' 
    };
  } catch (error: any) {
    console.error('Error applying admin dashboard stats view migration:', error);
    return { 
      success: false, 
      message: `Admin dashboard stats view migration error: ${error.message || 'Unknown error'}`
    };
  }
};

/**
 * Run the diagnostic script to check user roles
 * This is primarily for debugging purposes
 */
export const runDiagnosticScript = async (): Promise<any> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Running user role diagnostic script...');
    
    // Run the diagnostic SQL
    const { data, error } = await supabaseClient.rpc('pgsql', { query: diagnoseRolesSql });
    
    if (error) {
      console.error('Diagnostic script failed:', error);
      return { 
        success: false, 
        message: `Diagnostic script failed: ${error.message || 'Unknown error'}`,
        error
      };
    }
    
    return { 
      success: true, 
      message: 'Diagnostic completed successfully',
      data
    };
  } catch (error: any) {
    console.error('Error running diagnostic script:', error);
    return { 
      success: false, 
      message: `Diagnostic error: ${error.message || 'Unknown error'}`,
      error
    };
  }
};

/**
 * Fix a specific user's role synchronization
 * This can be used to manually fix a user whose roles are out of sync
 */
export const fixUserRoleSync = async (userId: string, role: string): Promise<boolean> => {
  console.log(`Attempting to fix role sync for user ${userId} to role ${role}`);
  try {
    // Step 1: Try the RPC function first (most reliable method)
    try {
      console.log(`Using update_user_role RPC function for user ${userId}`);
      const { error: rpcError } = await supabaseClient.rpc('update_user_role', {
        user_id: userId,
        new_role: role
      });
      
      if (!rpcError) {
        console.log(`Successfully updated role for user ${userId} using RPC`);
        return true;
      }
      
      console.warn(`RPC failed, trying direct updates. Error: ${rpcError.message}`);
    } catch (rpcErr) {
      console.warn(`Error in RPC update: ${rpcErr}`);
    }
    
    // Step 2: If RPC fails, update both tables directly
    // First update the public.users table
    console.log(`Directly updating users table for user ${userId}`);
    const { error: usersError } = await supabaseClient
      .from('users')
      .update({ role })
      .eq('id', userId);
      
    if (usersError) {
      console.error(`Failed to update users table: ${usersError.message}`);
      throw usersError;
    }
    
    // Then directly update auth metadata
    console.log(`Directly updating auth metadata for user ${userId}`);
    const { error: authError } = await supabaseClient
      .from('auth.users')
      .update({ 
        raw_user_meta_data: supabaseClient.rpc('jsonb_set', {
          target: 'raw_user_meta_data', 
          path: '{role}',
          value: JSON.stringify(role)
        })
      })
      .eq('id', userId);
    
    if (authError) {
      console.error(`Failed to update auth metadata: ${authError.message}`);
      // Don't throw - we may not have permission but the RLS trigger might have worked
      console.warn(`Auth update failed but users table was updated, role sync may be fixed by trigger`);
    }
    
    // Step 3: Verify the update by reading both values
    console.log(`Verifying role update for user ${userId}...`);
    try {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      const { data: authData, error: authReadError } = await supabaseClient
        .rpc('get_auth_user_role', { user_id: userId });
      
      if (!userError && !authReadError) {
        const usersRole = userData?.role;
        const authRole = authData;
        
        console.log(`User ${userId} now has role ${usersRole} in users table and ${authRole} in auth metadata`);
        
        // Return success only if both are the same as the requested role
        const isSuccess = usersRole === role && authRole === role;
        if (isSuccess) {
          console.log(`Role sync verified for user ${userId}`);
        } else {
          console.warn(`Role sync may not be complete - users: ${usersRole}, auth: ${authRole}, requested: ${role}`);
        }
        return isSuccess;
      }
    } catch (verifyError) {
      console.warn(`Couldn't verify role update: ${verifyError}`);
    }
    
    // If we reach here, we've done our best with the update
    return true;
  } catch (error) {
    console.error('Failed to fix user role sync:', error);
    return false;
  }
};

/**
 * Create an RPC function for getting a user's role from auth metadata
 * This is useful for verifying role sync
 */
export const createRoleAccessFunctions = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseClient) {
      return { success: false, message: 'Supabase client not initialized' };
    }

    console.log('Creating role access functions...');
    
    const roleAccessSql = `
      -- Function to get a user's role from auth metadata
      CREATE OR REPLACE FUNCTION public.get_auth_user_role(user_id UUID)
      RETURNS TEXT AS $$
      DECLARE
        user_role TEXT;
      BEGIN
        SELECT (raw_user_meta_data->>'role')::TEXT INTO user_role
        FROM auth.users
        WHERE id = user_id;
        
        RETURN user_role;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Run the function creation SQL
    const { error } = await supabaseClient.rpc('pgsql', { query: roleAccessSql });
    
    if (error) {
      console.error('Role access function creation failed:', error);
      return { 
        success: false, 
        message: `Role access function creation failed: ${error.message || 'Unknown error'}`
      };
    }
    
    return { 
      success: true, 
      message: 'Role access functions created successfully' 
    };
  } catch (error: any) {
    console.error('Error creating role access functions:', error);
    return { 
      success: false, 
      message: `Role access function creation error: ${error.message || 'Unknown error'}`
    };
  }
};

// Helper functions for common database operations
export const supabaseHelper = {
  // Authentication helpers
  auth: {
    getCurrentUser: async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw handleError(error);
      return data.user;
    },
  },
  
  // User helpers
  users: {
    getUser: async (userId: string) => {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw handleError(error);
      return data;
    },
    
    updateUser: async (userId: string, updates: any) => {
      const { data, error } = await supabaseClient
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw handleError(error);
      return data;
    },
  },
  
  // Products helpers
  products: {
    getProducts: async (limit = 20, offset = 0) => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (error) throw handleError(error);
      return data;
    },
    
    getProductById: async (productId: string) => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw handleError(error);
      return data;
    },
    
    createProduct: async (productData: any) => {
      const { data, error } = await supabaseClient
        .from('products')
        .insert([productData])
        .select();
      
      if (error) throw handleError(error);
      return data[0];
    },
  },
  
  // Auction slots helpers
  auctionSlots: {
    /**
     * Get auction slots with optional filtering
     * @param limit Number of auction slots to get
     * @param filter Optional filter: 'active', 'scheduled', 'ended', 'featured'
     */
    getAuctionSlots: async (limit = 25, filter = '') => {
      // Try first with the view for better performance and simpler query
      try {
        let query = supabaseClient
          .from('auction_slots_with_relations')
          .select('*')
          .order('id', { ascending: false })
          .limit(limit);
        
        // Apply filters
        if (filter === 'active') {
          query = query.eq('auction_state', 'active');
        } else if (filter === 'scheduled') {
          query = query.eq('auction_state', 'scheduled');
        } else if (filter === 'ended') {
          query = query.eq('auction_state', 'ended');
        } else if (filter === 'featured') {
          query = query.eq('featured', true);
        }

        const { data, error } = await query;
        
        if (!error) {
          return data || [];
        }
      } catch (err) {
        console.warn('Could not use auction_slots_with_relations view, falling back to direct query');
      }

      // Fallback to direct query with explicit foreign key relationships
      try {
        let query = supabaseClient
          .from('auction_slots')
          .select(`
            *,
            product:products(id, name_en, name_fr, description_en, description_fr, image_urls, starting_price, category, condition),
            seller:users!seller_id(id, email, whatsapp_number, phone_number),
            buyer:users!buyer_id(id, email)
          `)
          .order('id', { ascending: false })
          .limit(limit);
        
        // Apply filters based on auction_state column
        if (filter === 'active') {
          query = query.eq('auction_state', 'active');
        } else if (filter === 'scheduled') {
          query = query.eq('auction_state', 'scheduled');
        } else if (filter === 'ended') {
          query = query.eq('auction_state', 'ended');
        } else if (filter === 'featured') {
          query = query.eq('featured', true);
        }

        const { data, error } = await query;
        
        if (!error) {
          return data || [];
        }
      } catch (err) {
        console.warn('Could not use explicit foreign key relationships, falling back to simple query');
      }

      // Final fallback: just get auction slots without relationships
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select('*')
        .order('id', { ascending: false })
        .limit(limit);
      
      if (error) throw handleError(error);
      
      // Use separate queries to manually load products and users
      const enhancedData = await Promise.all(
        (data || []).map(async (slot) => {
          let product = null;
          if (slot.product_id) {
            try {
              const { data: productData } = await supabaseClient
                .from('products')
                .select('*')
                .eq('id', slot.product_id)
                .single();
              product = productData;
            } catch (e) {
              console.warn(`Could not load product ${slot.product_id}`, e);
            }
          }
          return { ...slot, product };
        })
      );
      
      return enhancedData;
    },

    /**
     * Get a single auction slot by ID
     */
    getAuctionSlotById: async (id: number) => {
      // Try with relationships first
      try {
        const { data, error } = await supabaseClient
          .from('auction_slots')
          .select(`
            *,
            product:products(id, name_en, name_fr, description_en, description_fr, image_urls, starting_price, category, condition),
            seller:users!seller_id(id, email, whatsapp_number, phone_number),
            buyer:users!buyer_id(id, email)
          `)
          .eq('id', id)
          .single();
        
        if (!error) {
          return data;
        }
      } catch (err) {
        console.warn('Could not use relationships in getAuctionSlotById, falling back to simple query');
      }

      // Fallback: Get auction slot without relationships
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw handleError(error);
      
      // Manually get product data
      let product = null;
      if (data.product_id) {
        try {
          const { data: productData } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', data.product_id)
            .single();
          product = productData;
        } catch (e) {
          console.warn(`Could not load product ${data.product_id}`, e);
        }
      }
      
      return { ...data, product };
    },

    /**
     * Get auction slots for a specific seller
     */
    getSellerAuctions: async (sellerId: string) => {
      // Try with relationships first
      try {
        const { data, error } = await supabaseClient
          .from('auction_slots')
          .select(`
            *,
            product:products(id, name_en, name_fr, description_en, description_fr, image_urls, starting_price, category, condition),
            seller:users!seller_id(id, email, whatsapp_number, phone_number),
            buyer:users!buyer_id(id, email)
          `)
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });
        
        if (!error) {
          return data;
        }
      } catch (err) {
        console.warn('Could not use relationships in getSellerAuctions, trying alternative approach');
      }

      // Alternative approach: Get product's seller_id
      try {
        const { data, error } = await supabaseClient
          .from('auction_slots')
          .select(`
            *,
            product:products!inner(*)
          `)
          .eq('product:products.seller_id', sellerId)
          .order('created_at', { ascending: false });
        
        if (!error) {
          return data;
        }
      } catch (err) {
        console.warn('Alternative approach also failed, returning empty result');
      }

      return [];
    },
  },

  // Add to supabaseHelper
  migrations: {
    applyAuctionRelations: applyMigrations,
    applyRoleSync: applyRoleSyncMigration,
    applyAdminDashboardStats: applyAdminDashboardStatsMigration
  },
};