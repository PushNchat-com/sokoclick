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
        // Initial query for regular users
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' });
        
        // Apply filters
        if (role) {
          query = query.eq('role', role);
        }
        
        if (verificationStatus !== undefined) {
          query = query.eq('is_verified', verificationStatus);
        }
        
        if (searchQuery) {
          query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
        }
        
        const { data: profilesData, error: profilesError, count } = await query;
        
        if (profilesError) {
          throw new Error(`Error fetching user profiles: ${profilesError.message}`);
        }
        
        // Set total count
        setTotal(count || 0);
        
        // If no regular users match or we're specifically looking for admin users
        let adminUsers: any[] = [];
        if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || 
            role === UserRole.CONTENT_MODERATOR || role === UserRole.ANALYTICS_VIEWER || 
            role === UserRole.CUSTOMER_SUPPORT) {
          
          // Query for admin users
          let adminQuery = supabase
            .from('admin_users')
            .select('*');
          
          if (role) {
            adminQuery = adminQuery.eq('role', role);
          }
          
          if (searchQuery) {
            adminQuery = adminQuery.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
          }
          
          const { data: adminData, error: adminError } = await adminQuery;
          
          if (adminError) {
            throw new Error(`Error fetching admin users: ${adminError.message}`);
          }
          
          if (adminData) {
            adminUsers = adminData;
          }
        }
        
        // Transform regular user data
        const regularUsers = profilesData ? profilesData.map(profile => ({
          id: profile.id,
          email: profile.email || '',
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          role: profile.role as UserRole,
          isVerified: profile.is_verified || false,
          createdAt: profile.created_at,
          lastLogin: profile.last_login
        })) : [];
        
        // Transform admin user data
        const transformedAdminUsers = adminUsers.map(admin => ({
          id: admin.id,
          email: admin.email,
          firstName: '',
          lastName: '',
          name: admin.name,
          role: admin.role as UserRole,
          isVerified: true, // Admins are always verified
          createdAt: admin.created_at,
          lastLogin: admin.last_login
        }));
        
        // Combine and set users
        setUsers([...regularUsers, ...transformedAdminUsers]);
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
