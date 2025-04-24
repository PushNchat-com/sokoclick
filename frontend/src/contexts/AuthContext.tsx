import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';
import { UserRole, UserMetadata } from '../types/auth';
import {
  signIn,
  signUp,
  signOut,
  resetPassword,
  updateUser,
  onAuthStateChange,
  getUserProfile,
  getSession,
  getCurrentUser,
  UserProfile,
  AuthResponse
} from '../services/auth';
import { supabase } from '../services/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  failedAttempts: number;
  lockoutUntil: Date | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ user: User | null; error: string | null }>;
  signUp: (email: string, password: string, metadata: UserMetadata) => Promise<{ user: User | null; error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error: string | null }>;
  updateUser: (updates: Partial<UserMetadata>) => Promise<{ success: boolean; error: string | null }>;
  isAllowed: (allowedRoles: UserRole[]) => boolean;
  clearError: () => void;
  isAdmin: boolean;
  isSeller: boolean;
}

const LOCKOUT_THRESHOLD = 5; // Number of failed attempts before lockout
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_REFRESH_THRESHOLD = 10 * 60; // 10 minutes in seconds

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    failedAttempts: 0,
    lockoutUntil: null
  });
  const navigate = useNavigate();

  // Track authentication attempts
  const trackAuthAttempt = async (success: boolean, email: string) => {
    try {
      const { error } = await supabase.from('auth_logs').insert({
        email,
        success,
        ip_address: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(data => data.ip),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to track auth attempt:', err);
    }
  };

  // Check session validity and refresh if needed
  const checkAndRefreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const timeUntilExpiry = expiresAt - Math.floor(Date.now() / 1000);
    if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD) {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Failed to refresh session:', error);
        await handleSignOut();
      }
    }
  };

  // Set up auth state listener
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setState(s => ({
        ...s,
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session?.user
      }));

      if (session) {
        refreshInterval = setInterval(checkAndRefreshSession, 5 * 60 * 1000);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState(s => ({
        ...s,
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session?.user
      }));

      if (session) {
        refreshInterval = setInterval(checkAndRefreshSession, 5 * 60 * 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const handleSignIn = async (email: string, password: string, rememberMe = false) => {
    try {
      // Check for lockout
      if (state.lockoutUntil && new Date() < state.lockoutUntil) {
        const waitMinutes = Math.ceil((state.lockoutUntil.getTime() - Date.now()) / 60000);
        return { 
          user: null, 
          error: `Too many failed attempts. Please try again in ${waitMinutes} minutes.` 
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Track the attempt
      await trackAuthAttempt(!error, email);

      if (error) {
        const newFailedAttempts = state.failedAttempts + 1;
        const shouldLockout = newFailedAttempts >= LOCKOUT_THRESHOLD;

        setState(s => ({
          ...s,
          error: error.message,
          failedAttempts: newFailedAttempts,
          lockoutUntil: shouldLockout ? new Date(Date.now() + LOCKOUT_DURATION) : null
        }));

        return { user: null, error: error.message };
      }

      // Reset failed attempts on successful login
      setState(s => ({
        ...s,
        failedAttempts: 0,
        lockoutUntil: null,
        error: null
      }));

      return { user: data.user, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { user: null, error: 'An unexpected error occurred' };
    }
  };

  const handleSignUp = async (
    email: string, 
    password: string, 
    metadata: UserMetadata
  ): Promise<{ user: User | null; error: string | null }> => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            role: metadata.role || UserRole.CUSTOMER
          }
        }
      });
      
      if (error) {
        setState(s => ({ ...s, error: error.message }));
        return { user: null, error: error.message };
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState(s => ({ ...s, error: errorMessage }));
      return { user: null, error: errorMessage };
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
    navigate('/login');
  };

  const handleUpdatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      console.error('Update password error:', err);
      return { success: false, error: 'Failed to update password' };
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      console.error('Reset password error:', err);
      return { success: false, error: 'Failed to send reset password email' };
    }
  };

  const handleUpdateUser = async (updates: Partial<UserMetadata>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, error: 'Failed to update user profile' };
    }
  };

  const isAllowed = (allowedRoles: UserRole[]): boolean => {
    const userRole = state.user?.user_metadata?.role as UserRole;
    return userRole ? allowedRoles.includes(userRole) : false;
  };

  const clearError = () => {
    setState(s => ({ ...s, error: null }));
  };

  const value: AuthContextType = {
    ...state,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    updateUser: handleUpdateUser,
    isAllowed,
    clearError,
    isAdmin: isAllowed([UserRole.ADMIN]),
    isSeller: isAllowed([UserRole.SELLER])
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;