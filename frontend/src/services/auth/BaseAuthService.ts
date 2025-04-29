import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { AuthConfig } from "./AuthConfig";
import { SecureSessionManager } from "./SecureSessionManager";
import { RateLimiter } from "./RateLimiter";
import {
  AuthUserProfile,
  AuthResponse,
  AuthStateChangeCallback,
} from "../../types/auth";
import { UserRoleEnum } from "../../contexts/UnifiedAuthContext";

/**
 * Base authentication service providing common functionality
 * Extended by specialized services (AdminAuthService, SellerAuthService)
 */
export abstract class BaseAuthService {
  protected readonly sessionManager: SecureSessionManager;
  protected readonly rateLimiter: RateLimiter;
  protected readonly subscribers: Set<AuthStateChangeCallback>;
  protected currentUser: AuthUserProfile | null;
  protected currentSession: Session | null;
  protected initialized: boolean;

  constructor(protected readonly serviceName: string) {
    this.sessionManager = SecureSessionManager.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.subscribers = new Set();
    this.currentUser = null;
    this.currentSession = null;
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure Supabase client
      await supabase.auth.initialize({
        persistSession: true,
        detectSessionInUrl: true,
        storageType: AuthConfig.STORAGE.PERSISTENCE_MODE,
      });

      // Try to restore session
      this.currentSession = await this.sessionManager.getStoredSession();
      if (this.currentSession?.user) {
        this.currentUser = await this.getUserProfile(
          this.currentSession.user.id,
        );
      }

      this.initialized = true;
    } catch (error) {
      console.error(`[${this.serviceName}] Initialization error:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    this.subscribers.add(callback);

    // Notify immediately if we have a session
    if (this.currentSession || this.currentUser) {
      setTimeout(() => {
        callback(this.currentSession ? "SIGNED_IN" : null, this.currentSession);
      }, 0);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify subscribers of auth state changes
   */
  protected notifySubscribers(
    event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | null,
    session: Session | null,
  ): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(event, session);
      } catch (error) {
        console.error(
          `[${this.serviceName}] Subscriber notification error:`,
          error,
        );
      }
    });
  }

  /**
   * Get user profile - implemented by specialized services
   */
  abstract getUserProfile(userId: string): Promise<AuthUserProfile | null>;

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check rate limiting
    if (this.rateLimiter.isRateLimited(email)) {
      const timeRemaining = this.rateLimiter.getTimeRemaining(email);
      return {
        user: null,
        session: null,
        error: `${AuthConfig.getError("RATE_LIMIT_EXCEEDED")}. Try again in ${Math.ceil(timeRemaining / 1000)} seconds.`,
      };
    }

    try {
      // Record attempt
      if (!this.rateLimiter.recordAttempt(email)) {
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("RATE_LIMIT_EXCEEDED"),
        };
      }

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!data.user) {
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("INVALID_CREDENTIALS"),
        };
      }

      // Get user profile
      const userProfile = await this.getUserProfile(data.user.id);
      if (!userProfile) {
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("SERVER_ERROR"),
        };
      }

      // Store session
      this.currentSession = data.session;
      this.currentUser = userProfile;
      await this.sessionManager.storeSession(data.session);

      // Reset rate limiting on successful login
      this.rateLimiter.reset(email);

      // Notify subscribers
      this.notifySubscribers("SIGNED_IN", data.session);

      return {
        user: userProfile,
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Sign in error:`, error);
      return {
        user: null,
        session: null,
        error: AuthConfig.getError("SERVER_ERROR"),
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await supabase.auth.signOut();
      this.currentSession = null;
      this.currentUser = null;
      this.sessionManager.clearSession();
      this.notifySubscribers("SIGNED_OUT", null);
    } catch (error) {
      console.error(`[${this.serviceName}] Sign out error:`, error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error(`[${this.serviceName}] Get session error:`, error);
      return null;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    email: string,
  ): Promise<{ success: boolean; error: string | null }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return {
        success: !error,
        error: error ? error.message : null,
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Reset password error:`, error);
      return {
        success: false,
        error: AuthConfig.getError("SERVER_ERROR"),
      };
    }
  }

  /**
   * Check if a user has a specific permission
   */
  protected hasPermission(user: AuthUserProfile, permission: string): boolean {
    if (!user) return false;
    if (user.role === UserRoleEnum.SUPER_ADMIN) return true;
    // Since AuthUserProfile doesn't have permissions field, we need to modify this
    // Let's just return false or implement a simpler check
    return false;
  }

  /**
   * Get default permissions for a role
   */
  protected getDefaultPermissions(role: string): string[] {
    switch (role) {
      case UserRoleEnum.SUPER_ADMIN:
        return ["*"];
      case UserRoleEnum.ADMIN:
        return [
          "products:read",
          "products:write",
          "users:read",
          "users:write",
          "orders:read",
          "orders:write",
          "categories:read",
          "categories:write",
        ];
      case UserRoleEnum.SELLER:
        return ["own-products:read", "own-products:write", "own-orders:read"];
      case UserRoleEnum.CUSTOMER:
        return ["own-orders:read", "own-orders:write"];
      default:
        return [];
    }
  }
}
