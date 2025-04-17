import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Hook to manage authentication state across the application
 */
export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch seller profile
          await fetchSellerProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await fetchSellerProfile(newSession.user.id);
        } else {
          setSeller(null);
        }
      }
    );

    initializeAuth();

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSellerProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('sellers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching seller profile:', error);
        return;
      }

      if (data) {
        setSeller(data as Seller);
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Then, create the seller profile
      const { error: profileError } = await supabaseClient
        .from('sellers')
        .insert([
          {
            id: authData.user.id,
            name,
            email,
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        throw profileError;
      }

      return { success: true, data: authData };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setSeller(null);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  };

  const updateSellerProfile = async (updates: Partial<Seller>) => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { data, error } = await supabaseClient
        .from('sellers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSeller(data as Seller);
      return { success: true, data };
    } catch (error) {
      console.error('Error updating seller profile:', error);
      return { success: false, error };
    }
  };

  return {
    session,
    user,
    seller,
    loading,
    signIn,
    signUp,
    signOut,
    updateSellerProfile,
  };
}; 