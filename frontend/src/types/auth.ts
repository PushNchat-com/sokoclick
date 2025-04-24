export interface LocalizedMessage {
  en: string;
  fr: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  unmetRequirements: LocalizedMessage[];
}

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

export interface ResetPasswordToken {
  token: string;
  email: string;
  expires_at: Date;
  used: boolean;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MODERATOR = 'content_moderator',
  ANALYTICS_VIEWER = 'analytics_viewer',
  CUSTOMER_SUPPORT = 'customer_support',
  SELLER = 'seller',
  CUSTOMER = 'customer'
}

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  role: UserRole;
  permissions?: string[];
  lastLogin?: Date;
}

export interface AuthResponse {
  user: UserProfile | null;
  session: any | null;
  error: string | null;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} 