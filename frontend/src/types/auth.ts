import { Session } from "@supabase/supabase-js";
import { Tables, Enums } from "./supabase-types";

export interface LocalizedMessage {
  en: string;
  fr: string;
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  SELLER = "seller",
  CUSTOMER = "customer"
}

export type AuthUserProfile = Pick<
  Tables<"users">,
  | "id"
  | "email"
  | "name"
  | "whatsapp_number"
  | "role"
  | "is_verified"
  | "verification_level"
>;

export interface UserMetadata {
  name?: string;
  whatsapp_number?: string;
  role?: Tables<"users">["role"];
}

export interface AuthResponse {
  user: AuthUserProfile | null;
  session: Session | null;
  error: string | null;
}

export type AuthStateChangeCallback = (
  event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | null,
  session: Session | null,
) => void | Promise<void>;

export interface AuthState {
  user: AuthUserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface SecurityEvent {
  event_type:
    | "login"
    | "logout"
    | "password_reset"
    | "signup"
    | "password_change";
  timestamp: string;
  metadata: Record<string, any>;
}

export interface AuthAttempt {
  email: string;
  success: boolean;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  unmetRequirements: LocalizedMessage[];
}

export interface ResetPasswordToken {
  token: string;
  email: string;
  expires_at: Date;
  used: boolean;
}
