import { supabase } from "../supabase";
import { BaseAuthService } from "./BaseAuthService";
import { AuthConfig } from "./AuthConfig";
import { UserProfile, UserRole, AuthResponse } from "../../types/auth";
import { userProfileService } from "./UserProfileService";

/**
 * Specialized authentication service for admin users
 */
export class AdminAuthService extends BaseAuthService {
  private static instance: AdminAuthService;

  private constructor() {
    super("AdminAuthService");
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AdminAuthService {
    if (!this.instance) {
      this.instance = new AdminAuthService();
    }
    return this.instance;
  }

  /**
   * Implementation for BaseAuthService compatibility.
   * Prefer using getAdminProfile for admin-specific checks.
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.getAdminProfile(userId);
  }

  /**
   * Get admin user profile (delegated and filtered)
   */
  async getAdminProfile(userId: string): Promise<UserProfile | null> {
    const profile = await userProfileService.getProfile(userId);
    // Ensure the fetched profile is actually an admin
    if (profile && profile.isAdmin) {
      return profile;
    }
    return null;
  }

  /**
   * Override sign in to enforce admin-only access
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
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
          error: AuthConfig.getError("INVALID_CREDENTIALS", "en"),
        };
      }

      // Get admin profile using the specific method
      const adminProfile = await this.getAdminProfile(data.user.id);
      if (!adminProfile) {
        // User exists but is not an admin
        await supabase.auth.signOut(); // Sign out immediately
        return {
          user: null,
          session: null,
          error: AuthConfig.getError("UNAUTHORIZED_ACCESS", "en"),
        };
      }

      // Successfully authenticated as admin
      return {
        user: adminProfile,
        session: data.session,
        error: null,
      };
    } catch (error: any) {
      console.error("[AdminAuthService] Sign in error:", error);
      return {
        user: null,
        session: null,
        error: error.message || AuthConfig.getError("SERVER_ERROR", "en"),
      };
    }
  }

  // Removed overridden updateProfile, createAdmin, deleteAdmin
  // Base class or UnifiedAuthService handles these sufficiently for now.
  // Override ONLY if specific admin logic is needed beyond profile checks.
}
