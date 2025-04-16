import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Profile } from '../types/supabase';

// Type for user with role
export interface UserWithRole extends Profile {
  role: 'buyer' | 'seller' | 'admin' | null;
}

/**
 * Hook to fetch all users for admin management
 */
export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real app, this would be connected to Supabase
      // Only accessible to admin due to RLS policies
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};

/**
 * Hook to update user roles (admin only)
 */
export const useUpdateUserRole = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const updateRole = async (userId: string, newRole: 'buyer' | 'seller' | 'admin') => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // In a real app, this would be connected to Supabase
      // Only accessible to admin due to RLS policies
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateRole, loading, error, success };
};

// If there's no supabase connection yet, we'll use mock data for demonstration
export const getMockUsers = (): UserWithRole[] => {
  return [
    {
      id: '1',
      email: 'admin@sokoclick.com',
      whatsapp_number: '+23765000001',
      display_name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: 'Douala, Cameroon',
      profile_image: null,
      rating: 5.0,
      joined_date: new Date().toISOString(),
      bio: 'System administrator',
      verified: true
    },
    {
      id: '2',
      email: 'seller@example.com',
      whatsapp_number: '+23765000002',
      display_name: 'Example Seller',
      role: 'seller',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: 'Yaounde, Cameroon',
      profile_image: null,
      rating: 4.5,
      joined_date: new Date().toISOString(),
      bio: 'Selling electronics and gadgets',
      verified: true
    },
    {
      id: '3',
      email: 'buyer@example.com',
      whatsapp_number: '+23765000003',
      display_name: 'Sample Buyer',
      role: 'buyer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location: 'Buea, Cameroon',
      profile_image: null,
      rating: 4.0,
      joined_date: new Date().toISOString(),
      bio: 'Looking for great deals',
      verified: true
    }
  ];
}; 