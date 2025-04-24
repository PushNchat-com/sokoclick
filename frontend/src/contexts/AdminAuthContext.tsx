import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '../types/auth';
import { signInAdmin, signOut, getCurrentUser } from '../services/auth';
import { supabase } from '../lib/supabaseClient';

interface AdminAuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Create a default context value to avoid undefined checks
const defaultContextValue: AdminAuthContextType = {
  user: null,
  session: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  signIn: async () => ({ success: false, error: 'Not implemented' }),
  signOut: async () => {},
  clearError: () => {}
};

const AdminAuthContext = createContext<AdminAuthContextType>(defaultContextValue);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use a single state object to prevent partial updates
  const [state, setState] = useState({
    user: null as UserProfile | null,
    session: null as Session | null,
    loading: true,
    error: null as string | null,
    isAuthenticated: false,
    isAdmin: false
  });
  
  const navigate = useNavigate();
  
  // References to manage initialization and prevent loops
  const isInitializedRef = useRef(false);
  const authSubscriptionRef = useRef<{ data: { subscription: any } } | null>(null);
  const unmountedRef = useRef(false);

  // Safe state update function
  const safeSetState = useCallback((updates: Partial<typeof state>) => {
    if (!unmountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Initialize auth state only once
  useEffect(() => {
    unmountedRef.current = false;
    
    // Skip if already initialized
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (unmountedRef.current) return;

        if (session) {
          const user = await getCurrentUser();
          
          // Check for trusted admin emails
          const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
          const isTrustedAdmin = user?.email ? trustedAdmins.includes(user.email.toLowerCase()) : false;
          const isAdmin = isTrustedAdmin || user?.role === UserRole.SUPER_ADMIN;
          
          safeSetState({
            user,
            session,
            isAuthenticated: !!user && isAdmin,
            isAdmin,
            loading: false
          });
        } else {
          safeSetState({
            loading: false,
            isAuthenticated: false,
            isAdmin: false
          });
        }
      } catch (error) {
        console.error('Error initializing admin auth:', error);
        
        safeSetState({
          loading: false,
          error: 'Failed to initialize authentication'
        });
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      // Clean up any existing subscription
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.data.subscription.unsubscribe();
        authSubscriptionRef.current = null;
      }
      
      authSubscriptionRef.current = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (unmountedRef.current) return;

        if (session) {
          try {
            const user = await getCurrentUser();
            
            // Check for trusted admin emails
            const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
            const isTrustedAdmin = user?.email ? trustedAdmins.includes(user.email.toLowerCase()) : false;
            const isAdmin = isTrustedAdmin || user?.role === UserRole.SUPER_ADMIN;
            
            safeSetState({
              user,
              session,
              isAuthenticated: !!user && isAdmin,
              isAdmin,
              loading: false
            });
          } catch (error) {
            console.error('Error during auth state change:', error);
            safeSetState({ loading: false });
          }
        } else {
          safeSetState({
            user: null,
            session: null,
            isAuthenticated: false,
            isAdmin: false,
            loading: false
          });
        }
      });
    };

    // Initialize auth
    initializeAuth();
    setupAuthListener();

    // Clean up on unmount
    return () => {
      unmountedRef.current = true;
      
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.data.subscription.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, [safeSetState]);

  // Sign in handler
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      safeSetState({ loading: true, error: null });
      
      const { user, session, error } = await signInAdmin(email, password);

      if (error) {
        safeSetState({ error, loading: false });
        return { success: false, error };
      }

      if (!user) {
        const error = 'Login failed. Please try again.';
        safeSetState({ error, loading: false });
        return { success: false, error };
      }

      // Check for trusted admin emails
      const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
      const isTrustedAdmin = trustedAdmins.includes(email.toLowerCase());
      const isAdmin = isTrustedAdmin || user.role === UserRole.SUPER_ADMIN;

      if (!isAdmin) {
        const error = 'Unauthorized access. Admin privileges required.';
        safeSetState({ error, loading: false });
        return { success: false, error };
      }

      safeSetState({
        user,
        session,
        isAuthenticated: true,
        isAdmin: true,
        loading: false,
        error: null
      });

      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      safeSetState({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  }, [safeSetState]);

  // Sign out handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      safeSetState({
        user: null,
        session: null,
        isAuthenticated: false,
        isAdmin: false
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [navigate, safeSetState]);

  // Clear error handler
  const clearError = useCallback(() => {
    safeSetState({ error: null });
  }, [safeSetState]);

  // Context value
  const value = {
    ...state,
    signIn: handleSignIn,
    signOut: handleSignOut,
    clearError
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthProvider; 