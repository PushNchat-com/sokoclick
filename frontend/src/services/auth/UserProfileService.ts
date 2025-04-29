import { supabase } from "../supabase";
import { AuthUserProfile } from "../../types/auth";
import { AuthConfig } from "./AuthConfig";

const PROFILE_CACHE_TTL_MS = AuthConfig.STORAGE.CACHE_TTL_MS; // Use configured TTL

interface CachedProfile {
  profile: AuthUserProfile;
  expiry: number;
}

class UserProfileService {
  private static instance: UserProfileService;
  private profileCache = new Map<string, CachedProfile>();

  private constructor() {}

  static getInstance(): UserProfileService {
    if (!this.instance) {
      this.instance = new UserProfileService();
    }
    return this.instance;
  }

  /**
   * Fetches a user profile from the 'users' table, utilizing a cache with TTL.
   * Returns null if the profile is not found.
   */
  async getProfile(userId: string): Promise<AuthUserProfile | null> {
    // Check cache first
    const cached = this.profileCache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      console.log(`[UserProfileService] Cache hit for user: ${userId}`);
      return cached.profile;
    }

    console.log(
      `[UserProfileService] Cache miss or expired for user: ${userId}. Fetching from 'users' table...`,
    );

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select(
          "id, email, name, whatsapp_number, role, is_verified, verification_level",
        )
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Failed to fetch user profile");
      }

      if (!profileData) {
        console.warn(`No profile found for user ID: ${userId}`);
        return null;
      }

      const profile: AuthUserProfile = {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        whatsapp_number: profileData.whatsapp_number,
        role: profileData.role,
        is_verified: profileData.is_verified,
        verification_level: profileData.verification_level,
      };

      this.updateCache(userId, profile);
      return profile;
    } catch (error) {
      console.error(
        `[UserProfileService] Failed to get profile for ${userId}:`,
        error,
      );
      this.profileCache.delete(userId);
      return null;
    }
  }

  /**
   * Updates the profile cache.
   */
  private updateCache(userId: string, profile: AuthUserProfile): void {
    this.profileCache.set(userId, {
      profile,
      expiry: Date.now() + PROFILE_CACHE_TTL_MS,
    });
    console.log(`[UserProfileService] Cache updated for user: ${userId}`);
  }

  /**
   * Invalidates the cache for a specific user.
   */
  invalidateCache(userId: string): void {
    this.profileCache.delete(userId);
    console.log(`[UserProfileService] Cache invalidated for user: ${userId}`);
  }
}

export const userProfileService = UserProfileService.getInstance();
