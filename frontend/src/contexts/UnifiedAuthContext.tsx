import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
// import { unifiedAuthService } from "../services/auth/UnifiedAuthService"; // Likely unused now
import { AuthConfig } from "../services/auth/AuthConfig";
import { useLanguage } from "../store/LanguageContext";
import { supabase } from "../services/supabase";
import { userProfileService } from "../services/auth/UserProfileService";
import { TokenManager } from './auth/TokenManager';
// Import the standard types
import { UserRole, AuthUserProfile, UserRoleEnum } from "@/types/auth";

// Restore AuthState interface, using imported AuthUserProfile
export interface AuthState {
  user: AuthUserProfile | null; // Use imported type
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean; 
  isAuthenticated: boolean;
}

// Configuration
const AUTH_CONFIG = {
  timeoutMs: 5000, // 5 seconds timeout
  sessionRefreshMs: 5 * 60 * 1000, // 5 minutes
  isDevelopment: process.env.NODE_ENV === "development",
  isLocalhost:
    typeof window !== "undefined" && window.location.hostname === "localhost",
  trustedAdminEmails: [
    "sokoclick.com@gmail.com",
    "pushns24@gmail.com",
  ] as readonly string[],
  persistenceMode: "local" as const, // Use localStorage for persistence
} as const;

// Error messages
const AUTH_ERRORS = {
  noAdminPrivileges: {
    en: "This account does not have admin privileges",
    fr: "Ce compte ne dispose pas des privilèges administrateur",
  },
  profileLoadFailed: {
    en: "Failed to load user profile. Please try again.",
    fr: "Échec du chargement du profil. Veuillez réessayer.",
  },
  signInFailed: {
    en: "An error occurred while signing in. Please try again.",
    fr: "Une erreur s'est produite lors de la connexion. Veuillez réessayer.",
  },
} as const;

// Cache key for storing auth state
const AUTH_CACHE_KEY = "sokoclick_auth_state";

// Cache interface
interface CachedAuthState {
  user: AuthUserProfile | null;
  session: Session | null;
  timestamp: number;
}

// Enhanced auth context type definition
interface UnifiedAuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<{ data: { session: Session | null }; error: Error | null }>;
  authError: Error | null;
  signUp: (email: string, password: string, options?: { data?: object; emailRedirectTo?: string }) => Promise<{ data: { user: User | null; session: Session | null; }; error: Error | null; }>;
  resetPasswordForEmail: (email: string, options?: { redirectTo?: string }) => Promise<{ data: {}; error: Error | null; }>;
  updateUserPassword: (password: string) => Promise<{ data: { user: User }; error: Error | null }>;
  clearAuthError: () => void;
}

// Create the context with a default value
const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(
  undefined,
);

// BroadcastChannel for cross-tab synchronization
const authChannel = typeof window !== 'undefined' 
  ? new BroadcastChannel('auth_channel') 
  : null;

// Provider props
interface UnifiedAuthProviderProps {
  children: ReactNode;
  timeoutMs?: number;
}

// Development mock user factory with caching
const createMockAdminUser = (): { user: AuthUserProfile; session: Session } => {
  const cachedMock = sessionStorage.getItem("mock_admin_user");
  if (cachedMock) {
    const parsed = JSON.parse(cachedMock);
    return {
      user: parsed.user as AuthUserProfile,
      session: {
        ...parsed.session,
        expires_at: Date.now() + 3600000,
      },
    };
  }

  const mockData = {
    user: {
      id: "dev-admin-id",
      email: "dev-admin@sokoclick.com",
      name: "Dev Admin",
      whatsapp_number: "+1234567890",
      role: UserRoleEnum.SUPER_ADMIN,
      is_verified: true,
      verification_level: "complete",
    } as AuthUserProfile,
    session: {
      access_token: "dev-token",
      refresh_token: "dev-refresh",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      user: {
        id: "dev-admin-id",
        email: "dev-admin@sokoclick.com",
        app_metadata: { provider: "email" },
        user_metadata: { name: "Dev Admin" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        role: "authenticated",
        updated_at: new Date().toISOString(),
      },
    },
  };

  sessionStorage.setItem("mock_admin_user", JSON.stringify(mockData));
  return mockData;
};

// Cache helpers
const loadFromCache = (): CachedAuthState | null => {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CachedAuthState;
    // Only use cache if it's less than 1 hour old
    if (Date.now() - parsed.timestamp > 3600000) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveToCache = (state: CachedAuthState) => {
  try {
    localStorage.setItem(
      AUTH_CACHE_KEY,
      JSON.stringify({
        ...state,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Ignore cache errors
  }
};

// Helper to check if user is trusted admin
const isTrustedAdmin = (email: string): boolean => {
  return AUTH_CONFIG.trustedAdminEmails.includes(email);
};

// Increase timeout from 15 seconds to 30 seconds
const INIT_TIMEOUT_MS = 30000; // 30 seconds for initial auth check 

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({
  children,
  timeoutMs = INIT_TIMEOUT_MS, // Use a dedicated init timeout
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true, // Start loading
    error: null,
    isAdmin: false,
    isAuthenticated: false,
  });

  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Use React.useRef to ensure TokenManager instance persists across renders
  const tokenManagerRef = React.useRef(new TokenManager());

  const mounted = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for init timeout

  useEffect(() => {
    mounted.current = true;
    let authSubscription: any = null;

    // Clear any previous timeout when effect runs
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    async function initializeAuth() {
      console.log("[UnifiedAuthContext] Initializing auth state...");
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Set the timeout *before* starting async operations
        initTimeoutRef.current = setTimeout(() => {
          if (!mounted.current) return;
          console.warn(
            "[UnifiedAuthContext] Initialization timed out after",
            timeoutMs,
            "ms.",
          );
          // Only set error if still loading and preserve any session data we have
          setState((prev) =>
            prev.loading
              ? {
                  ...prev,
                  loading: false,
                  error: AuthConfig.getError("SERVER_ERROR", "en"),
                  // Keep existing session and user data if available
                  user: prev.user,
                  session: prev.session,
                  // Don't change authentication state if we have session
                  isAuthenticated: prev.isAuthenticated || !!prev.session
                }
              : prev,
          );
        }, timeoutMs);

        console.log("[UnifiedAuthContext] Getting session...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted.current) return; // Check mounted after async call
        console.log(
          "[UnifiedAuthContext] Got session response.",
          session ? `User ID: ${session.user.id}` : "No session",
        );

        if (sessionError) {
          console.error(
            "[UnifiedAuthContext] Error getting session:",
            sessionError,
          );
          // Don't throw, set error state instead
          setState((prev) => ({
            ...prev,
            loading: false,
            error: AuthConfig.getError("NETWORK_ERROR", "en"), // More specific error?
            isAdmin: false,
            isAuthenticated: false,
          }));
          if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
          return; // Stop initialization here
        }

        let userProfile: AuthUserProfile | null = null;
        let isAdminUser = false; // Initialize isAdminUser
        if (session?.user) {
          console.log(
            "[UnifiedAuthContext] Session found, fetching profile for:",
            session.user.id,
          );
          userProfile = await userProfileService.getProfile(session.user.id);
          if (!mounted.current) return; // Check mounted after async call
          console.log(
            "[UnifiedAuthContext] Profile fetch result:",
            userProfile ? `Role: ${userProfile.role}` : "Not found/created",
          );

          // *** Determine admin status directly from profile ***
          isAdminUser =
            !!userProfile &&
            (userProfile.role === UserRoleEnum.ADMIN ||
             userProfile.role === UserRoleEnum.SUPER_ADMIN);
          console.log("[UnifiedAuthContext] Admin status determined from profile:", isAdminUser);
            
          if (!userProfile) {
            console.warn(
              `[UnifiedAuthContext] Profile not found/created for user ${session.user.id}. User might need setup.`,              
            );
            // Proceed without profile for now, maybe show a setup prompt later?
          }
        }

        // Successfully initialized (with or without profile)
        console.log(
          "[UnifiedAuthContext] Initialization sequence finished. Setting final state.",
        );
        // Use the isAdminUser determined above
        setState({
          user: userProfile,
          session,
          loading: false, // Set loading false
          error: null,
          isAdmin: isAdminUser, 
          isAuthenticated: !!userProfile && !!session, // Require both profile and session? Adjust as needed.
        });

        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current); // Clear timeout on success
      } catch (error) {
        // Catch unexpected errors during the process
        console.error(
          "[UnifiedAuthContext] Unexpected initialization error:",
          error,
        );
        if (!mounted.current) return;
        setState((prev) => ({
          ...prev,
          user: null,
          session: null,
          loading: false, // Ensure loading is false on error
          error: AuthConfig.getError("SERVER_ERROR", "en"),
          isAdmin: false,
          isAuthenticated: false,
        }));
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      }
    }

    initializeAuth();

    // Auth state change listener
    console.log("[UnifiedAuthContext] Setting up auth state listener...");
    const { data: authListenerData } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted.current) return;
        console.log(`[UnifiedAuthContext] Auth state changed: ${_event}`, session ? `User ID: ${session.user.id}` : "No session");

        // *** MODIFIED: Handle SIGNED_IN and SIGNED_OUT explicitly ***
        if (_event === "SIGNED_IN" && session?.user) {
          setState(prev => ({ ...prev, loading: true, error: null })); // Indicate loading while fetching profile
          try {
            console.log("[UnifiedAuthContext Listener] SIGNED_IN detected. User ID:", session.user.id);

            // Proceed with the profile fetch logic
            console.log("[UnifiedAuthContext Listener] Fetching profile via service for:", session.user.id);
            const userProfile = await userProfileService.getProfile(session.user.id);
              
            if (!mounted.current) return; 

            console.log("[UnifiedAuthContext Listener] Profile fetch result:", userProfile ? `Role: ${userProfile.role}` : "Not found/created");

            const isAdminUser =
              !!userProfile &&
              (userProfile.role === UserRoleEnum.ADMIN ||
               userProfile.role === UserRoleEnum.SUPER_ADMIN);
            console.log("[UnifiedAuthContext Listener] Admin status determined:", isAdminUser);

            setState({
              user: userProfile, // Use the fetched profile
              session: session,
              loading: false,
              error: null,
              isAdmin: isAdminUser,
              isAuthenticated: true, 
            });

             // Broadcast authenticated state to other tabs
            if (authChannel) {
              authChannel.postMessage({ type: 'AUTH_STATE_CHANGED', state: 'authenticated' });
            }

          } catch (error) { // Catch errors from service call or isAdmin check
            console.error("[UnifiedAuthContext Listener] Error during profile processing:", error);
             if (!mounted.current) return;
            // Failed to get profile or process it
            setState(prev => ({
              ...prev,
              user: null,
              session: session, // Keep the session
              loading: false,
              error: AuthConfig.getError("PROFILE_LOAD_FAILED", "en"), 
              isAdmin: false,
              isAuthenticated: true, // Still authenticated session-wise
            }));
          }
        } else if (_event === "SIGNED_OUT") {
          console.log("[UnifiedAuthContext Listener] SIGNED_OUT detected. Clearing state.");
          setState({
            user: null,
            session: null,
            loading: false,
            error: null,
            isAdmin: false,
            isAuthenticated: false,
          });
          // Broadcast unauthenticated state to other tabs
          if (authChannel) {
            authChannel.postMessage({ type: 'AUTH_STATE_CHANGED', state: 'unauthenticated' });
          }
        } else if (session) {
            // Handle other events like TOKEN_REFRESHED, USER_UPDATED if needed
            // For now, just update the session if it exists but wasn't SIGNED_IN
            console.log("[UnifiedAuthContext Listener] Updating session for event:", _event);
            setState(prev => ({
                ...prev,
                session: session,
                // Keep existing user/isAdmin state if session is just refreshed
                // Only set loading false if it was true
                loading: prev.loading ? false : prev.loading, 
            }));
        }
        // If session is null and event wasn't SIGNED_OUT, it might be an initial load state?
        // The initial load is handled by initializeAuth.
      },
    );

    authSubscription = authListenerData.subscription;
    console.log("[UnifiedAuthContext] Auth listener setup complete.");

    // Listen for auth events from other tabs
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_STATE_CHANGED') {
        if (event.data.state === 'unauthenticated' && state.isAuthenticated) {
          // Another tab logged out, sync this tab
          console.log('Auth state change detected from another tab: signing out.');
          supabase.auth.signOut(); // Triggers onAuthStateChange locally
        } else if (event.data.state === 'authenticated' && !state.isAuthenticated) {
          // Another tab logged in, refresh session here
          console.log('Auth state change detected from another tab: refreshing session.');
          supabase.auth.getSession(); // This *might* trigger onAuthStateChange if session is new/different
        }
      }
    };
    
    if (authChannel) {
      authChannel.addEventListener('message', handleAuthMessage);
    }

    return () => {
      mounted.current = false;
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        console.log("[UnifiedAuthContext] Cleared init timeout on unmount.");
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
        console.log("[UnifiedAuthContext] Unmounted, listener unsubscribed.");
      } else {
        console.log(
          "[UnifiedAuthContext] Unmounted, no listener to unsubscribe.",
        );
      }
      if (authChannel) {
        authChannel.removeEventListener('message', handleAuthMessage);
        // Do not close the channel here, it might be used by other instances
      }
    };
  }, [state.isAuthenticated]);

  // Function to clear the auth error state
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Computed properties using useMemo for optimization
  const contextValue = useMemo(
    () => ({
      ...state,
      login: async (email: string, password: string) => {
        setAuthError(null);
        setState(prev => ({ ...prev, loading: true })); // Set loading true
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          // onAuthStateChange handles success state update
        } catch (error) {
          console.error('Login failed:', error);
          const err = error instanceof Error ? error : new Error(String(error));
          setAuthError(err);
          setState(prev => ({ ...prev, loading: false })); // Set loading false on error
          throw err; // Rethrow for component handling
        }
      },
      logout: async () => {
        setAuthError(null);
        setState(prev => ({ ...prev, loading: true }));
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          // onAuthStateChange handles success state update
          setState(prev => ({ 
            user: null, 
            session: null, 
            loading: false, 
            error: null, 
            isAdmin: false, 
            isAuthenticated: false 
          }));
        } catch (error) {
          console.error('Logout failed:', error);
          const err = error instanceof Error ? error : new Error(String(error));
          setAuthError(err);
          setState(prev => ({ ...prev, loading: false }));
          throw err; // Rethrow for component handling
        }
      },
      // Implementation for signUp
      signUp: async (email: string, password: string, options?: { data?: object; emailRedirectTo?: string }) => {
        setAuthError(null);
        setState(prev => ({ ...prev, loading: true }));
        try {
          const { data, error } = await supabase.auth.signUp({ email, password, options });
          if (error) throw error;
          // Typically profile creation happens separately or via trigger
          // onAuthStateChange might not fire immediately for signup depending on email verification
          setState(prev => ({ ...prev, loading: false })); // Might need adjustment based on flow
          return { data, error: null };
        } catch (error) {
          console.error('Signup failed:', error);
          const err = error instanceof Error ? error : new Error(String(error));
          setAuthError(err);
          setState(prev => ({ ...prev, loading: false }));
          throw err; // Rethrow
        }
      },
      // Implementation for resetPasswordForEmail
      resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
        setAuthError(null);
        setState(prev => ({ ...prev, loading: true }));
        try {
          const { data, error } = await supabase.auth.resetPasswordForEmail(email, options);
          if (error) throw error;
          setState(prev => ({ ...prev, loading: false }));
          return { data, error: null };
        } catch (error) {
          console.error('Password reset request failed:', error);
          const err = error instanceof Error ? error : new Error(String(error));
          setAuthError(err);
          setState(prev => ({ ...prev, loading: false }));
          throw err;
        }
      },
      // Implementation for updateUserPassword
      updateUserPassword: async (password: string) => {
        setAuthError(null);
        setState(prev => ({ ...prev, loading: true }));
        try {
          const { data, error } = await supabase.auth.updateUser({ password });
          if (error) throw error;
          setState(prev => ({ ...prev, loading: false })); // Password updated, session likely remains
          return { data, error: null };
        } catch (error) {
          console.error('Password update failed:', error);
          const err = error instanceof Error ? error : new Error(String(error));
          setAuthError(err);
          setState(prev => ({ ...prev, loading: false }));
          throw err;
        }
      },
      clearAuthError, // Provide the clear error function
      refreshSession: async () => {
        setAuthError(null);
        try {
          const result = await supabase.auth.refreshSession();
          if (result.error) throw result.error;
          // onAuthStateChange should handle state updates based on the refreshed session
          return result;
        } catch (error) {
          console.error('Manual Session refresh failed:', error);
          const err = error instanceof Error ? error : new Error('Session refresh failed');
          setAuthError(err);
           // If refresh fails, user is likely logged out
          await supabase.auth.signOut();
          throw err;
        }
      },
      authError,
    }),
    [state, authError, clearAuthError],
  );

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  if (context === undefined) {
    throw new Error("useUnifiedAuth must be used within a UnifiedAuthProvider");
  }
  return context;
};

// Export for backwards compatibility but mark as deprecated
/**
 * @deprecated Use useUnifiedAuth instead
 */
export const useAuth = useUnifiedAuth;

export default UnifiedAuthContext;
