import { supabase } from "../supabase";
import { AuthUserProfile, UserRole, UserRoleEnum } from "../../types/auth";
import { AuthConfig } from "./AuthConfig";

const PROFILE_CACHE_TTL_MS = AuthConfig.STORAGE.CACHE_TTL_MS; // Use configured TTL
// Add a fetch timeout
const PROFILE_FETCH_TIMEOUT_MS = 10000; // 10 seconds

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
    // Check cache first - TEMPORARILY DISABLED FOR DEBUGGING
    /*
    const cached = this.profileCache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      console.log(`[UserProfileService] Cache hit for user: ${userId}`);
      return cached.profile;
    }
    */
    
    // Ensure we always log the fetch attempt
    console.log(
      `[UserProfileService] Cache bypassed for debugging. Fetching full profile from 'users' table for user: ${userId}...`,
    );

    try {
        // Create a timeout promise
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Profile fetch timed out after ${PROFILE_FETCH_TIMEOUT_MS}ms`));
          }, PROFILE_FETCH_TIMEOUT_MS);
        });

        // The actual fetch promise
        const fetchPromise = this.fetchProfileFromDB(userId);

        // Race the two promises - whichever resolves/rejects first wins
        const profile = await Promise.race([fetchPromise, timeoutPromise]);
        return profile;
    } catch (error) {
      console.error(
        `[UserProfileService] Failed to get profile for ${userId}:`,
        error,
      );
      this.profileCache.delete(userId);
      
      // Create a minimal profile on timeout to prevent blocking the UI
      if (error instanceof Error && error.message.includes('timed out')) {
        console.warn(`[UserProfileService] Creating minimal profile due to timeout for ${userId}`);
        // Return a minimal profile with just the ID to unblock login
        return {
          id: userId,
          role: UserRoleEnum.ADMIN, // Use the enum value instead of hardcoded string
          // Add minimal required fields to satisfy the type
          email: null,
          name: null,
          whatsapp_number: null,
          is_verified: false,
          verification_level: null
        };
      }
      
      return null;
    }
  }
  
  /**
   * Fetches the profile from the database
   */
  private async fetchProfileFromDB(userId: string): Promise<AuthUserProfile | null> {
    // Ensure we are selecting ALL required fields
    const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select(
          "id, email, name, whatsapp_number, role, is_verified, verification_level"
        )
        .eq("id", userId)
        .maybeSingle();
        
    console.log(`[UserProfileService] Full profile query finished for user: ${userId}`, { profileData, profileError });

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    if (!profileData) {
      console.warn(`No profile found for user ID: ${userId}`);
      return null;
    }

    // Use the full profile data
    const profile: AuthUserProfile = { 
        id: profileData.id, 
        email: profileData.email,
        name: profileData.name,
        whatsapp_number: profileData.whatsapp_number,
        role: profileData.role as UserRole, 
        is_verified: profileData.is_verified,
        verification_level: profileData.verification_level,
    }; 
    
    // Update cache even though we bypassed reading from it initially
    this.updateCache(userId, profile);
    return profile;
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
