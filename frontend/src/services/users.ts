import supabase from './supabase';
import type { PostgrestError } from '@supabase/postgrest-js';
import { useState, useEffect, useCallback } from 'react';
import { UserRole } from './auth';

/**
 * User interface for admin management
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  name?: string;
}

// Add type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Custom hook to fetch and manage users data
 */
export const useUsers = (
  role?: UserRole,
  searchQuery?: string,
  verificationStatus?: boolean
) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to manually trigger a refresh
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if users table exists instead of profiles
        let userTable = 'users';
        let userQuery = supabase
          .from(userTable)
          .select('*', { count: 'exact' });
        
        // If users table doesn't work, try the users view
        const { error: testError } = await userQuery.limit(1);
        if (testError && testError.message.includes('does not exist')) {
          // Try alternate table for users
          userTable = 'auth_users';
          userQuery = supabase
            .from(userTable)
            .select('*', { count: 'exact' });
        }
        
        // Apply filters
        if (role) {
          userQuery = userQuery.eq('role', role);
        }
        
        if (verificationStatus !== undefined) {
          userQuery = userQuery.eq('is_verified', verificationStatus);
        }
        
        if (searchQuery) {
          // Adapt this based on actual column names in your table
          userQuery = userQuery.or(`email.ilike.%${searchQuery}%`);
        }
        
        const { data: userData, error: userError, count } = await userQuery;
        
        if (userError) {
          console.warn(`Error fetching from ${userTable}:`, userError);
          // Fall back to minimal approach - if we can't get users, at least don't crash
          setUsers([]);
          setTotal(0);
          throw new Error(`Error fetching users: ${userError.message}`);
        }
        
        // Set total count
        setTotal(count || 0);
        
        // Transform regular user data with field mapping
        const regularUsers = userData ? userData.map(user => ({
          id: user.id,
          email: user.email || '',
          firstName: user.first_name || user.firstName || '',
          lastName: user.last_name || user.lastName || '',
          phone: user.phone || '',
          role: user.role as UserRole,
          isVerified: user.is_verified || user.isVerified || false,
          createdAt: user.created_at || user.createdAt,
          lastLogin: user.last_login || user.lastLogin
        })) : [];
        
        // Set users
        setUsers(regularUsers);
      } catch (err) {
        console.error('Error:', err);
        setError(isPostgrestError(err) ? err.message : 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role, searchQuery, verificationStatus, refreshTrigger]);

  return { users, loading, error, total, refresh };
};

/**
 * Service for managing users
 */
export const userService = {
  /**
   * Get a single user by ID
   */
  getUserById: async (id: string): Promise<User | null> => {
    try {
      // Try regular user profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (profileData) {
        return {
          id: profileData.id,
          email: profileData.email || '',
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          phone: profileData.phone,
          role: profileData.role as UserRole,
          isVerified: profileData.is_verified || false,
          createdAt: profileData.created_at,
          lastLogin: profileData.last_login
        };
      }
      
      // Try admin user if not found
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (adminData) {
        return {
          id: adminData.id,
          email: adminData.email,
          firstName: '',
          lastName: '',
          name: adminData.name,
          role: adminData.role as UserRole,
          isVerified: true, // Admins are always verified
          createdAt: adminData.created_at,
          lastLogin: adminData.last_login
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  },
  
  /**
   * Update a user's verification status
   */
  updateVerificationStatus: async (
    id: string,
    isVerified: boolean
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: isVerified })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error:', err);
      return {
        success: false,
        error: isPostgrestError(err) ? err.message : 'Operation failed'
      };
    }
  },
  
  /**
   * Update a user's role
   */
  updateUserRole: async (
    id: string,
    role: UserRole
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Check if this is a regular user or admin user
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      
      if (adminData) {
        // For admin roles, update the admin_users table
        if (![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MODERATOR, 
              UserRole.ANALYTICS_VIEWER, UserRole.CUSTOMER_SUPPORT].includes(role)) {
          return {
            success: false,
            error: 'Cannot change admin user to non-admin role'
          };
        }
        
        const { error } = await supabase
          .from('admin_users')
          .update({ role })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
      } else if (profileData) {
        // For non-admin roles, update the profiles table
        if ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CONTENT_MODERATOR, 
             UserRole.ANALYTICS_VIEWER, UserRole.CUSTOMER_SUPPORT].includes(role)) {
          return {
            success: false,
            error: 'Cannot change regular user to admin role directly'
          };
        }
        
        const { error } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
      } else {
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error:', err);
      return {
        success: false,
        error: isPostgrestError(err) ? err.message : 'Operation failed'
      };
    }
  },
  
  /**
   * Update a user's profile information
   */
  updateUserProfile: async (
    id: string,
    updates: Partial<User>
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Check user type
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', id)
        .maybeSingle();
      
      if (adminData) {
        // Admin user updates
        const adminUpdates: Record<string, any> = {};
        
        if (updates.email) adminUpdates.email = updates.email;
        if (updates.name) adminUpdates.name = updates.name;
        
        if (Object.keys(adminUpdates).length > 0) {
          const { error } = await supabase
            .from('admin_users')
            .update(adminUpdates)
            .eq('id', id);
          
          if (error) {
            throw error;
          }
        }
      } else {
        // Regular user updates
        const profileUpdates: Record<string, any> = {};
        
        if (updates.email) profileUpdates.email = updates.email;
        if (updates.firstName) profileUpdates.first_name = updates.firstName;
        if (updates.lastName) profileUpdates.last_name = updates.lastName;
        if (updates.phone) profileUpdates.phone = updates.phone;
        if (updates.isVerified !== undefined) profileUpdates.is_verified = updates.isVerified;
        
        if (Object.keys(profileUpdates).length > 0) {
          const { error } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', id);
          
          if (error) {
            throw error;
          }
        }
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error:', err);
      return {
        success: false,
        error: isPostgrestError(err) ? err.message : 'Operation failed'
      };
    }
  },
  
  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<{
    total: number;
    verified: number;
    unverified: number;
    sellers: number;
    customers: number;
    admins: number;
    error: string | null;
  }> => {
    try {
      // Get total user count
      const { count: totalCount, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) {
        throw totalError;
      }
      
      // Get verified users count
      const { count: verifiedCount, error: verifiedError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);
      
      if (verifiedError) {
        throw verifiedError;
      }
      
      // Get sellers count
      const { count: sellersCount, error: sellersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', UserRole.SELLER);
      
      if (sellersError) {
        throw sellersError;
      }
      
      // Get admin users count
      const { count: adminsCount, error: adminsError } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });
      
      if (adminsError) {
        throw adminsError;
      }
      
      const total = totalCount || 0;
      const verified = verifiedCount || 0;
      const unverified = total - verified;
      const sellers = sellersCount || 0;
      const customers = total - sellers;
      const admins = adminsCount || 0;
      
      return {
        total,
        verified,
        unverified,
        sellers,
        customers,
        admins,
        error: null
      };
    } catch (err) {
      console.error('Error:', err);
      return {
        total: 0,
        verified: 0,
        unverified: 0,
        sellers: 0,
        customers: 0,
        admins: 0,
        error: isPostgrestError(err) ? err.message : 'Failed to get user statistics'
      };
    }
  }
};
