import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '../api/supabase';
import { UserWithRole } from '../hooks/useAdminData';

// Define valid roles according to database schema
export type UserRole = 'buyer' | 'seller' | 'admin';

// Define the shape of our auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userWithRole: UserWithRole | null;
  loading: boolean;
  error: Error | null;
  userRole: UserRole | null;
  canAccess: (requiredRole: 'buyer' | 'seller' | 'admin') => boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: Error }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone?: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<{ error: any }>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userWithRole: null,
  loading: true,
  error: null,
  userRole: null,
  canAccess: () => false,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  signOut: async () => {},
  updateUserRole: async () => ({ error: null }),
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userWithRole, setUserWithRole] = useState<UserWithRole | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to parse and validate user role
  const parseUserRole = (userData: any): UserRole => {
    const role = userData?.role as UserRole;
    if (role && ['buyer', 'seller', 'admin'].includes(role)) {
      return role;
    }
    // Default to 'buyer' if role is invalid or not present
    return 'buyer';
  };

  // Update user state when session changes
  const updateUserState = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const role = parseUserRole(session.user.user_metadata);
      setUserRole(role);
      
      // Create a UserWithRole object with only the properties defined in the interface
      setUserWithRole({
        id: session.user.id,
        email: session.user.email || '',
        whatsapp_number: session.user.user_metadata?.phone || '',
        role: role,
        display_name: session.user.user_metadata?.full_name || '',
        profile_image: session.user.user_metadata?.profile_image || '',
        location: '',
        rating: 0,
        joined_date: session.user.created_at,
        bio: '',
        verified: false
      });
    } else {
      setUserRole(null);
      setUserWithRole(null);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      updateUserState(data.session);
      
      return { success: true };
    } catch (err) {
      console.error('Error signing in:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err : new Error('Failed to sign in') 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole, phone?: string) => {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
        },
      },
    });

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabaseClient.auth.updateUser({ password });
    return { error };
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut();
      setUser(null);
      setUserWithRole(null);
      setUserRole(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) return { error: new Error('No user is logged in') };

    const { error } = await supabaseClient.auth.updateUser({
      data: { role },
    });

    if (!error && userWithRole) {
      // Update local state
      setUserRole(role);
      setUserWithRole({
        ...userWithRole,
        role
      });
    }

    return { error };
  };

  // Function to check if user can access a specific feature based on role
  const canAccess = (requiredRole: 'buyer' | 'seller' | 'admin'): boolean => {
    if (!userRole) return false;
    
    switch (requiredRole) {
      case 'admin':
        return userRole === 'admin';
      case 'seller':
        // Sellers and admins can access seller features
        return userRole === 'seller' || userRole === 'admin';
      case 'buyer':
        // Everyone can access buyer features
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      updateUserState(session);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      updateUserState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Context value
  const value = {
    session,
    user,
    userWithRole,
    loading,
    error,
    userRole,
    canAccess,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
    updateUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 