import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../api/supabase';

// Define valid roles according to database schema
export type UserRole = 'buyer' | 'seller' | 'admin';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone?: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to parse and validate user role
  const parseUserRole = (metadata: any): UserRole => {
    const role = metadata?.role;
    // Check if role matches one of our valid roles
    if (role === 'admin' || role === 'buyer' || role === 'seller') {
      return role as UserRole;
    }
    // Default to buyer if role is invalid
    return 'buyer';
  };

  // Function to update user state
  const updateUserState = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      const role = parseUserRole(session.user.user_metadata);
      setUserRole(role);
      
      // Debug: Log user metadata 
      console.log('User session loaded:', {
        id: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata,
        role: role
      });
      
      // Check for admin emails and update role if needed
      const userEmail = session.user.email;
      if (userEmail && (userEmail === 'sokoclick.com@gmail.com' || userEmail === 'strength.cm@gmail.com')) {
        if (role !== 'admin') {
          console.log('Updating user role to admin for:', userEmail);
          updateUserMetadata('admin').catch(err => {
            console.error('Failed to update user role:', err);
          });
        }
      }
    } else {
      setUserRole(null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      updateUserState(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        updateUserState(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to update user metadata
  const updateUserMetadata = async (role: UserRole) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role }
      });
      
      if (!error) {
        // Update local user state to reflect the change immediately
        setUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            user_metadata: {
              ...prev.user_metadata,
              role
            }
          };
        });
        setUserRole(role);
      }
      
      return { error };
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'buyer', phone?: string) => {
    // Check if email is for admin accounts and override role
    const isAdmin = email === 'sokoclick.com@gmail.com' || email === 'strength.cm@gmail.com';
    const effectiveRole = isAdmin ? 'admin' : role;
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
          role: effectiveRole
        }
      }
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // New method to expose role update functionality
  const updateUserRole = async (role: UserRole) => {
    return updateUserMetadata(role);
  };

  const value = {
    session,
    user,
    loading,
    userRole, // Add userRole to context
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