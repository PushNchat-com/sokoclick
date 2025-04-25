import { Session } from '@supabase/supabase-js';

export interface LocalizedMessage {
  en: string;
  fr: string;
}

export enum UserRole {
  CUSTOMER = 'customer',
  SELLER = 'seller',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  CONTENT_MODERATOR = 'content_moderator',
  ANALYTICS_VIEWER = 'analytics_viewer',
  CUSTOMER_SUPPORT = 'customer_support'
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  permissions?: string[];
  lastLogin?: Date;
  isAdmin?: boolean; // Flag to easily identify admin vs regular user
}

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: UserProfile | null;
  session: Session | null;
  error: string | null;
}

export type AuthStateChangeCallback = (session: Session | null, user: UserProfile | null) => void;

export interface SecurityEvent {
  event_type: 'login' | 'logout' | 'password_reset' | 'signup' | 'password_change';
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