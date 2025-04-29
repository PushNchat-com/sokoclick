import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useMemo,
} from "react";
import { Session } from "@supabase/supabase-js";
import { unifiedAuthService } from "../services/auth/UnifiedAuthService";
import { AuthUserProfile, AuthResponse, AuthState } from "../types/auth";
import { AuthConfig } from "../services/auth/AuthConfig";
import { useLanguage } from "../store/LanguageContext";
import { supabase } from "../services/supabase";
import { userProfileService } from "../services/auth/UserProfileService";

// Define roles explicitly as strings constants
export const UserRoleEnum = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin", // Assuming 'admin' is also a possible role string
  SELLER: "seller",
  CUSTOMER: "customer",
} as const;

// Define a type for the role values based on the enum constant
type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

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
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
  isInRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => Promise<boolean>;

  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    userData: {
      name?: string;
      whatsapp_number?: string;
      role?: UserRole;
    },
  ) => Promise<AuthResponse>;
  signOut: () => Promise<{ success: boolean; error: string | null }>;
  resetPassword: (
    email: string,
  ) => Promise<{ success: boolean; error: string | null }>;
  updateUser: (
    updates: Partial<AuthUserProfile>,
  ) => Promise<{ success: boolean; error: string | null }>;
  clearError: () => void;
}

// Create the context with a default value
const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(
  undefined,
);

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

const INIT_TIMEOUT_MS = 15000; // 15 seconds for initial auth check

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({
  children,
  timeoutMs = INIT_TIMEOUT_MS, // Use a dedicated init timeout
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true, // Start loading
    error: null,
    isAdmin: false,
    isAuthenticated: false,
  });

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
      if (!mounted.current) return;
      console.log("[UnifiedAuthContext] Initializing auth state...");
      // Ensure loading is true at the start
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Set the timeout *before* starting async operations
        initTimeoutRef.current = setTimeout(() => {
          if (!mounted.current) return;
          console.warn(
            "[UnifiedAuthContext] Initialization timed out after",
            timeoutMs,
            "ms.",
          );
          // Only set error if still loading (i.e., initializeAuth didn't finish)
          setAuthState((prev) =>
            prev.loading
              ? {
                  ...prev,
                  loading: false,
                  error: AuthConfig.getError("SERVER_ERROR", "en"), // Consider a specific timeout error
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
          setAuthState((prev) => ({
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
        const isAdminUser =
          !!userProfile &&
          (userProfile.role === UserRoleEnum.ADMIN ||
            userProfile.role === UserRoleEnum.SUPER_ADMIN);
        setAuthState({
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
        setAuthState((prev) => ({
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
        console.log(`[UnifiedAuthContext] Auth state changed: ${_event}`);

        let userProfile: AuthUserProfile | null = null;
        if (session?.user) {
          userProfile = await userProfileService.getProfile(session.user.id);
          if (!userProfile) {
            console.warn(
              `[UnifiedAuthContext] Profile not found/created after auth change for user ${session.user.id}`,
            );
          }
        }

        const isAdminUser =
          !!userProfile &&
          (userProfile.role === UserRoleEnum.ADMIN ||
            userProfile.role === UserRoleEnum.SUPER_ADMIN);
        setAuthState({
          user: userProfile,
          session,
          loading: false, // Ensure loading is false after update
          error: null,
          isAdmin: isAdminUser,
          isAuthenticated: !!userProfile && !!session, // Adjust as needed
        });
      },
    );

    authSubscription = authListenerData.subscription;
    console.log("[UnifiedAuthContext] Auth listener setup complete.");

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
    };
  }, [timeoutMs]);

  // Computed properties using useMemo for optimization
  const contextValue = useMemo(
    () => ({
      ...authState,
      isSuperAdmin:
        !!authState.user && authState.user.role === UserRoleEnum.SUPER_ADMIN,
      isSeller: !!authState.user && authState.user.role === UserRoleEnum.SELLER,
      isCustomer:
        !!authState.user && authState.user.role === UserRoleEnum.CUSTOMER,
      isInRole: (role: UserRole) =>
        !!authState.user && authState.user.role === role,
      hasPermission: async (permission: string) => {
        if (!authState.isAdmin) return false;
        return true;
      },
      signIn: unifiedAuthService.signIn.bind(unifiedAuthService),
      signUp: unifiedAuthService.signUp.bind(unifiedAuthService),
      signOut: unifiedAuthService.signOut.bind(unifiedAuthService),
      resetPassword: unifiedAuthService.resetPassword.bind(unifiedAuthService),
      updateUser: unifiedAuthService.updateUser.bind(unifiedAuthService),
      clearError: () => setAuthState((prev) => ({ ...prev, error: null })),
    }),
    [authState],
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
