import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { unifiedAuthService } from '../services/auth/UnifiedAuthService';
import { UserProfile, AuthResponse, UserRole } from '../types/auth';
import { toast } from '../utils/toast';

// Enhanced auth context type definition
interface UnifiedAuthContextType {
  // State
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Role helpers
  isSuperAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
  isInRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => Promise<boolean>;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, userData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    role?: UserRole;
  }) => Promise<AuthResponse>;
  signOut: () => Promise<{ success: boolean; error: string | null }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
  updateUser: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
  clearError: () => void;
}

// Create the context with a default value
const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

// Provider props
interface UnifiedAuthProviderProps {
  children: ReactNode;
}

// UnifiedAuthProvider component
export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Computed properties
  const isAuthenticated = !!session && !!user;
  const isSuperAdmin = !!user && user.role === UserRole.SUPER_ADMIN;
  const isSeller = !!user && user.role === UserRole.SELLER;
  const isCustomer = !!user && user.role === UserRole.CUSTOMER;

  const isInRole = (role: UserRole): boolean => {
    return !!user && user.role === role;
  };

  // Initialize auth on component mount
  useEffect(() => {
    async function initializeAuth() {
      setLoading(true);
      
      try {
        // Initialize the auth service
        await unifiedAuthService.initialize();
        
        // Get current session and user
        const currentSession = await unifiedAuthService.getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          const currentUser = await unifiedAuthService.getUserProfile(currentSession.user.id);
          setUser(currentUser);
          setIsAdmin(!!currentUser?.isAdmin || 
                    (!!currentUser && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)));
        }
      } catch (error) {
        console.error('[UnifiedAuthContext] Initialization error:', error);
        setError(error instanceof Error ? error.message : 'Authentication initialization failed');
      } finally {
        setLoading(false);
      }
    }
    
    initializeAuth();
  }, []);

  // Session refresh mechanism - check session every 5 minutes
  useEffect(() => {
    const sessionRefreshInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    const checkSession = async () => {
      try {
        // Get current session
        const currentSession = await unifiedAuthService.getSession();
        
        // Case 1: No session but user exists in state
        if (!currentSession && user) {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          
          toast.warning({
            en: 'Your session has expired. Please sign in again.',
            fr: 'Votre session a expiré. Veuillez vous reconnecter.'
          });
          return;
        }
        
        // Case 2: Valid session, check for user profile updates
        if (currentSession?.user?.id && user) {
          const updatedUser = await unifiedAuthService.getUserProfile(currentSession.user.id);
          
          if (updatedUser) {
            // Check for role changes
            if (updatedUser.role !== user.role) {
              setUser(updatedUser);
              setIsAdmin(!!updatedUser.isAdmin || 
                        [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(updatedUser.role));
              
              toast.info({
                en: 'Your account role has been updated.',
                fr: 'Le rôle de votre compte a été mis à jour.'
              });
            }
            
            // Check for permission changes
            const currentPermissions = new Set(user.permissions || []);
            const newPermissions = new Set(updatedUser.permissions || []);
            
            if (
              // Check if arrays are different lengths
              (user.permissions?.length || 0) !== (updatedUser.permissions?.length || 0) ||
              // Or if any permissions were removed
              user.permissions?.some(perm => !newPermissions.has(perm)) ||
              // Or if any permissions were added
              updatedUser.permissions?.some(perm => !currentPermissions.has(perm))
            ) {
              setUser(updatedUser);
              
              toast.info({
                en: 'Your account permissions have been updated.',
                fr: 'Les permissions de votre compte ont été mises à jour.'
              });
            }
          }
        }
      } catch (error) {
        console.error('[UnifiedAuthContext] Session refresh error:', error);
      }
    };
    
    // Set up interval to check session
    const intervalId = setInterval(checkSession, sessionRefreshInterval);
    
    // Initial check
    checkSession();
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = unifiedAuthService.onAuthStateChange((newSession, newUser) => {
      setSession(newSession);
      setUser(newUser);
      setIsAdmin(!!newUser?.isAdmin || 
                (!!newUser && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(newUser.role)));
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Sign in handler
  const handleSignIn = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedAuthService.signIn(email, password);
      if (response.error) {
        setError(response.error);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const handleSignUp = async (
    email: string,
    password: string,
    userData: {
      firstName?: string;
      lastName?: string;
      name?: string;
      phone?: string;
      role?: UserRole;
    }
  ): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedAuthService.signUp(email, password, userData);
      if (response.error) {
        setError(response.error);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async (): Promise<{ success: boolean; error: string | null }> => {
    setLoading(true);
    try {
      const response = await unifiedAuthService.signOut();
      if (!response.success && response.error) {
        setError(response.error);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Reset password handler
  const handleResetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedAuthService.resetPassword(email);
      if (!response.success && response.error) {
        setError(response.error);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Update user handler
  const handleUpdateUser = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error: string | null }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await unifiedAuthService.updateUser(updates);
      if (!response.success && response.error) {
        setError(response.error);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  // Check permission
  const hasPermission = async (permission: string): Promise<boolean> => {
    return unifiedAuthService.hasPermission(permission);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Create context value
  const value: UnifiedAuthContextType = {
    user,
    session,
    loading,
    isAdmin,
    isAuthenticated,
    error,
    isSuperAdmin,
    isSeller,
    isCustomer,
    isInRole,
    hasPermission,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateUser: handleUpdateUser,
    clearError
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  
  return context;
};

// Export for backwards compatibility but mark as deprecated
/**
 * @deprecated Use useUnifiedAuth instead
 */
export const useAuth = useUnifiedAuth;

export default UnifiedAuthContext; 