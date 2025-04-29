import { supabase } from "@/services/supabase";
import { Database } from "@/types/supabase-types";
import type { PostgrestError } from "@supabase/postgrest-js";
import { useState, useEffect, useCallback } from "react";

export type UserRole = "customer" | "seller" | "admin";

/**
 * User interface represents a user in the system
 */
export interface User {
  id: string;
  role: UserRole;
  whatsappNumber?: string;
  name?: string;
  email?: string;
  location?: string;
  isVerified: boolean;
  verificationLevel?: "basic" | "complete";
  verificationDate?: string;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

// Transform from database format (snake_case) to frontend format (camelCase)
const transformUser = (user: Database["public"]["Tables"]["users"]["Row"]): User => {
  return {
    id: user.id,
    role: user.role as UserRole,
    whatsappNumber: user.whatsapp_number || undefined,
    name: user.name || undefined,
    email: user.email || undefined,
    location: user.location || undefined,
    isVerified: user.is_verified || false,
    verificationLevel: (user.verification_level as "basic" | "complete" | null) || undefined,
    verificationDate: user.verification_date ? new Date(user.verification_date).toISOString() : undefined,
    joinedDate: user.joined_date ? new Date(user.joined_date).toISOString() : new Date(user.created_at).toISOString(),
    createdAt: new Date(user.created_at).toISOString(),
    updatedAt: new Date(user.updated_at).toISOString(),
  };
};

// Transform from frontend format (camelCase) to database format (snake_case)
const transformUserForDB = (user: Partial<User>): Partial<Database["public"]["Tables"]["users"]["Insert"]> => {
  const dbUser: Partial<Database["public"]["Tables"]["users"]["Insert"]> = {};
  
  if (user.role !== undefined) dbUser.role = user.role;
  if (user.whatsappNumber !== undefined) dbUser.whatsapp_number = user.whatsappNumber;
  if (user.name !== undefined) dbUser.name = user.name;
  if (user.email !== undefined) dbUser.email = user.email;
  if (user.location !== undefined) dbUser.location = user.location;
  if (user.isVerified !== undefined) dbUser.is_verified = user.isVerified;
  if (user.verificationLevel !== undefined) dbUser.verification_level = user.verificationLevel;
  if (user.verificationDate !== undefined) dbUser.verification_date = user.verificationDate;
  
  return dbUser;
};

// Add type guard for PostgrestError
function isPostgrestError(error: any): error is PostgrestError {
  return (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "details" in error &&
    "hint" in error &&
    "code" in error
  );
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: supabaseError } = await supabase
        .from("users")
        .select("*");

      if (supabaseError) {
        throw supabaseError;
      }

      if (userData) {
        // Transform regular user data
        const regularUsers = userData.map(user => transformUser(user));
        setUsers(regularUsers);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        isPostgrestError(err)
          ? `Database error: ${err.message}`
          : "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refreshUsers: fetchUsers };
}

export const userService = {
  getUserById: async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error || !data) return null;
      
      return transformUser(data);
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  },

  verifyUser: async (
    id: string,
    isVerified: boolean
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_verified: isVerified })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error("Error:", error);
      return {
        success: false,
        error: isPostgrestError(error)
          ? error.message
          : "Failed to update user verification status",
      };
    }
  },

  updateUserRole: async (
    id: string,
    role: UserRole
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", id);

      if (error) {
        throw error;
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error("Error:", error);
      return {
        success: false,
        error: isPostgrestError(error)
          ? error.message
          : "Failed to update user role",
      };
    }
  },

  updateUserProfile: async (
    id: string,
    updates: Partial<User>
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const dbUser = transformUserForDB(updates);
      
      const { error } = await supabase
        .from("users")
        .update(dbUser)
        .eq("id", id);

      if (error) {
        throw error;
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error("Error:", error);
      return {
        success: false,
        error: isPostgrestError(error)
          ? error.message
          : "Failed to update user profile",
      };
    }
  },

  getUserStats: async (): Promise<{
    total: number;
    verified: number;
    unverified: number;
    customers: number;
    sellers: number;
    admins: number;
  }> => {
    try {
      // Get total user count
      const { count: totalCount, error: totalError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (totalError) {
        throw totalError;
      }

      // Get verified users count
      const { count: verifiedCount, error: verifiedError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true);

      if (verifiedError) {
        throw verifiedError;
      }

      // Get sellers count
      const { count: sellersCount, error: sellersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "seller");

      if (sellersError) {
        throw sellersError;
      }
      
      // Get admin count
      const { count: adminsCount, error: adminsError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (adminsError) {
        throw adminsError;
      }

      const total = totalCount || 0;
      const verified = verifiedCount || 0;
      const unverified = total - verified;
      const sellers = sellersCount || 0;
      const admins = adminsCount || 0;
      const customers = total - sellers - admins;

      return {
        total,
        verified,
        unverified,
        customers,
        sellers,
        admins,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return {
        total: 0,
        verified: 0,
        unverified: 0,
        customers: 0,
        sellers: 0,
        admins: 0,
      };
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (error || !data) return null;
    
    return transformUser(data);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (error || !data) return null;
    
    return transformUser(data);
  },

  getUserByWhatsapp: async (whatsappNumber: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_number", whatsappNumber)
      .single();
    
    if (error || !data) return null;
    
    return transformUser(data);
  },

  createUser: async (userData: Partial<User>): Promise<User | null> => {
    const dbUser = transformUserForDB(userData);
    
    const { data, error } = await supabase
      .from("users")
      .insert([dbUser])
      .select()
      .single();
    
    if (error || !data) return null;
    
    return transformUser(data);
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);
    
    return !error;
  },

  getAdminUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "admin");
    
    if (error || !data) return [];
    
    return data.map(transformUser);
  },

  getSellerUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "seller");
    
    if (error || !data) return [];
    
    return data.map(transformUser);
  },

  verifySellerAccount: async (
    userId: string, 
    verificationLevel: "basic" | "complete"
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("users")
      .update({
        is_verified: true,
        verification_level: verificationLevel,
        verification_date: new Date().toISOString()
      })
      .eq("id", userId)
      .eq("role", "seller");
    
    return !error;
  },

  revokeSellerVerification: async (userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("users")
      .update({
        is_verified: false,
        verification_level: null,
        verification_date: null
      })
      .eq("id", userId)
      .eq("role", "seller");
    
    return !error;
  },

  changeUserRole: async (userId: string, newRole: UserRole): Promise<boolean> => {
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);
    
    return !error;
  },
};
