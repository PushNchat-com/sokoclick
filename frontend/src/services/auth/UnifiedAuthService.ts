import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { AuthConfig } from "./AuthConfig";
import { AdminAuthService } from "./AdminAuthService";
import { SecureSessionManager } from "./SecureSessionManager";
import { RateLimiter } from "./RateLimiter";
import {
  UserProfile,
  AuthResponse,
  UserRole,
  AuthStateChangeCallback,
} from "../../types/auth";
import { userProfileService } from "./UserProfileService";

/**
 * Unified authentication service that coordinates between specialized auth services
 */
class UnifiedAuthService {
  private static instance: UnifiedAuthService;
  private readonly sessionManager: SecureSessionManager;
  private readonly rateLimiter: RateLimiter;
  private readonly adminService: AdminAuthService;
  private readonly subscribers: Set<AuthStateChangeCallback>;
  private currentUser: UserProfile | null;
  private currentSession: Session | null;
  private initialized: boolean;

  private constructor() {
    this.sessionManager = SecureSessionManager.getInstance();
    this.rateLimiter = RateLimiter.getInstance();
    this.adminService = AdminAuthService.getInstance();
    this.subscribers = new Set();
    this.currentUser = null;
    this.currentSession = null;
    this.initialized = false;

    // Initialize configuration
    AuthConfig.init();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UnifiedAuthService {
    if (!this.instance) {
      this.instance = new UnifiedAuthService();
    }
    return this.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure Supabase client
      // No longer needed, supabase client initializes itself
      // await supabase.auth.initialize();

      // Try to restore session
      this.currentSession = await this.sessionManager.getStoredSession();
      if (this.currentSession?.user) {
        // Fetch profile using the service
        this.currentUser = await userProfileService.getProfile(
          this.currentSession.user.id,
          this.currentSession.user.email,
        );
      }

      this.initialized = true;
    } catch (error) {
      console.error("[UnifiedAuthService] Initialization error:", error);
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
  private notifySubscribers(
    event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | null,
    session: Session | null,
  ): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(event, session);
      } catch (error) {
        console.error(
          "[UnifiedAuthService] Subscriber notification error:",
          error,
        );
      }
    });
  }

  /**
   * Get user profile (delegated to UserProfileService)
   * This method is now simpler and primarily for internal use or explicit fetches.
   */
  async getUserProfile(
    userId: string,
    userEmail?: string,
  ): Promise<UserProfile | null> {
    // Delegate to the centralized profile service
    return userProfileService.getProfile(userId, userEmail);
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if this might be an admin login
    if (email.endsWith("@sokoclick.com") || AuthConfig.isTrustedAdmin(email)) {
      // Admin sign-in attempt - use AdminAuthService
      const adminResponse = await this.adminService.signIn(email, password);
      if (adminResponse.user && adminResponse.session) {
        // Successfully logged in as admin
        this.currentSession = adminResponse.session;
        this.currentUser = adminResponse.user;
        await this.sessionManager.storeSession(adminResponse.session);
        this.notifySubscribers("SIGNED_IN", adminResponse.session);
      }
      return adminResponse;
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

      if (!data.user || !data.session) {
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("INVALID_CREDENTIALS"),
        };
      }

      // Get user profile using the service
      const userProfile = await userProfileService.getProfile(
        data.user.id,
        data.user.email,
      );
      if (!userProfile) {
        // Profile fetch/creation failed after successful login
        await supabase.auth.signOut(); // Sign out to avoid inconsistent state
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("PROFILE_NOT_FOUND", "en"), // Use new error
        };
      }

      // Store session and user
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
      console.error("[UnifiedAuthService] Sign in error:", error);
      return {
        user: null,
        session: null,
        error: AuthConfig.getError("SERVER_ERROR", "en"),
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error: string | null }> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const userId = this.currentUser?.id;
      await supabase.auth.signOut();
      this.currentSession = null;
      this.currentUser = null;
      this.sessionManager.clearSession();
      if (userId) {
        userProfileService.invalidateCache(userId); // Invalidate cache
      }
      this.notifySubscribers("SIGNED_OUT", null);
      return { success: true, error: null };
    } catch (error) {
      console.error("[UnifiedAuthService] Sign out error:", error);
      return {
        success: false,
        error: AuthConfig.getError("SERVER_ERROR", "en"),
      };
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
      console.error("[UnifiedAuthService] Get session error:", error);
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
      console.error("[UnifiedAuthService] Reset password error:", error);
      return {
        success: false,
        error: AuthConfig.getError("SERVER_ERROR", "en"),
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUser(
    updates: Partial<UserProfile>,
  ): Promise<{ success: boolean; error: string | null }> {
    if (!this.currentUser) {
      return {
        success: false,
        error: AuthConfig.getError("SESSION_EXPIRED", "en"),
      };
    }

    const userId = this.currentUser.id;

    // Use admin service for admin users if it exists and has specific logic
    // if (this.currentUser.isAdmin) { // Check if specific admin logic is needed
    //   return this.adminService.updateProfile(updates); // Or delegate specific parts
    // }

    try {
      // Update auth email if provided and changed
      if (updates.email && updates.email !== this.currentUser.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: updates.email,
        });
        if (authError) throw authError;
      }

      // Prepare profile updates (handle snake_case conversion)
      const profileUpdates: Record<string, any> = {};
      if (updates.firstName !== undefined)
        profileUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined)
        profileUpdates.last_name = updates.lastName;
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      // Role updates should likely be handled by specific admin actions, not general update
      // if (updates.role !== undefined) profileUpdates.role = updates.role;
      if (updates.email !== undefined) profileUpdates.email = updates.email; // Ensure email sync if changed

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString();
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", userId);

        if (profileError) throw profileError;
      }

      // Update local state and invalidate cache
      this.currentUser = { ...this.currentUser, ...updates };
      userProfileService.invalidateCache(userId); // Invalidate cache after update

      return { success: true, error: null };
    } catch (error: any) {
      console.error("[UnifiedAuthService] Update user error:", error);
      return {
        success: false,
        error: error.message || AuthConfig.getError("SERVER_ERROR", "en"),
      };
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(
    email: string,
    password: string,
    userData: {
      firstName?: string;
      lastName?: string;
      // name?: string; // Prefer firstName/lastName
      phone?: string;
      role?: UserRole; // Should default to customer, admin roles require specific flow
    },
  ): Promise<AuthResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!data.user || !data.session) {
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("SERVER_ERROR", "en"),
        };
      }

      // Profile creation is now handled by the trigger `handle_new_user`
      // We just need to fetch the newly created profile
      const userProfile = await userProfileService.getProfile(
        data.user.id,
        data.user.email,
      );

      if (!userProfile) {
        // This case indicates a problem with the trigger or RLS policy
        console.error(
          `[UnifiedAuthService] Profile not found/created for new user ${data.user.id}`,
        );
        await supabase.auth.admin.deleteUser(data.user.id); // Attempt cleanup
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("PROFILE_NOT_FOUND", "en"),
        };
      }

      // Update profile with additional data if provided (handle_new_user creates basic profile)
      const profileUpdates: Partial<UserProfile> = {};
      if (userData.firstName) profileUpdates.firstName = userData.firstName;
      if (userData.lastName) profileUpdates.lastName = userData.lastName;
      if (userData.phone) profileUpdates.phone = userData.phone;
      // Only allow non-admin roles during standard signup
      if (
        userData.role &&
        userData.role !== UserRole.ADMIN &&
        userData.role !== UserRole.SUPER_ADMIN
      ) {
        profileUpdates.role = userData.role;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await this.updateUser({ id: data.user.id, ...profileUpdates });
        // Re-fetch profile to get updated data (or merge locally if preferred)
        // const updatedProfile = await userProfileService.getProfile(data.user.id);
        // this.currentUser = updatedProfile || userProfile; // Update local state
        Object.assign(userProfile, profileUpdates); // Merge locally for now
      } else {
        this.currentUser = userProfile;
      }

      // Store session
      this.currentSession = data.session;
      // this.currentUser updated above
      await this.sessionManager.storeSession(data.session);

      // Notify subscribers
      this.notifySubscribers("SIGNED_IN", data.session);

      return {
        user: this.currentUser,
        session: data.session,
        error: null,
      };
    } catch (error: any) {
      console.error("[UnifiedAuthService] Sign up error:", error);
      return {
        user: null,
        session: null,
        error: error.message || AuthConfig.getError("SERVER_ERROR", "en"),
      };
    }
  }
}

// Export singleton instance
export const unifiedAuthService = UnifiedAuthService.getInstance();
