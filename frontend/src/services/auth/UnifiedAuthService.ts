import { supabase } from '../supabase';
import { BaseServiceImpl } from '../core/BaseService';
import { ServiceResponse, createSuccessResponse, createErrorResponse, ServiceErrorType } from '../core/ServiceResponse';
import { Session, User } from '@supabase/supabase-js';
import { 
  UserRole, 
  UserProfile, 
  AuthResponse, 
  AuthStateChangeCallback 
} from '../../types/auth';

// Define error messages in both English and French
export const AUTH_ERROR_MESSAGES = {
  invalidCredentials: {
    en: 'Invalid email or password',
    fr: 'Email ou mot de passe invalide'
  },
  emailAlreadyInUse: {
    en: 'Email is already in use',
    fr: 'Cet email est déjà utilisé'
  },
  weakPassword: {
    en: 'Password is too weak. It should be at least 8 characters long',
    fr: 'Le mot de passe est trop faible. Il doit comporter au moins 8 caractères'
  },
  invalidEmail: {
    en: 'Please enter a valid email address',
    fr: 'Veuillez entrer une adresse email valide'
  },
  emailNotConfirmed: {
    en: 'Please confirm your email before logging in',
    fr: 'Veuillez confirmer votre email avant de vous connecter'
  },
  networkError: {
    en: 'Network error. Please check your connection',
    fr: 'Erreur réseau. Veuillez vérifier votre connexion'
  },
  serverError: {
    en: 'Server error. Please try again later',
    fr: 'Erreur serveur. Veuillez réessayer plus tard'
  },
  sessionExpired: {
    en: 'Your session has expired. Please log in again',
    fr: 'Votre session a expiré. Veuillez vous reconnecter'
  },
  unauthorizedAccess: {
    en: 'You do not have permission to access this resource',
    fr: 'Vous n\'avez pas la permission d\'accéder à cette ressource'
  }
};

/**
 * UnifiedAuthService providing authentication functionality for all user types
 */
class UnifiedAuthService extends BaseServiceImpl {
  private authStateSubscribers: AuthStateChangeCallback[] = [];
  private currentUser: UserProfile | null = null;
  private currentSession: Session | null = null;
  private supabaseSubscription: { unsubscribe: () => void } | null = null;

  constructor() {
    super('UnifiedAuthService', 'auth');
  }

  /**
   * Initialize the auth service
   */
  async initialize(): Promise<ServiceResponse> {
    if (this.initialized) {
      return createSuccessResponse();
    }

    try {
      // Initialize base service
      const baseResponse = await super.initialize();
      if (!baseResponse.success) {
        return baseResponse;
      }

      // Set up auth state change listener
      this.setupAuthStateListener();

      // Try to get the current session
      const session = await this.getSession();
      if (session) {
        // Get user profile if we have a session
        this.currentSession = session;
        this.currentUser = await this.getUserProfile(session.user.id);
      }

      this.initialized = true;
      return createSuccessResponse();
    } catch (error) {
      return this.processError('initialize', error);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    this.authStateSubscribers.push(callback);
    
    // If we already have a user/session, notify immediately
    if (this.currentSession || this.currentUser) {
      setTimeout(() => {
        callback(this.currentSession, this.currentUser);
      }, 0);
    }
    
    // Return unsubscribe function
    return () => {
      this.authStateSubscribers = this.authStateSubscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Set up Supabase auth state change listener
   */
  private setupAuthStateListener(): void {
    // Clean up existing subscription if any
    if (this.supabaseSubscription) {
      this.supabaseSubscription.unsubscribe();
    }
    
    // Set up new subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        this.currentSession = session;
        
        let user: UserProfile | null = null;
        if (session?.user) {
          user = await this.getUserProfile(session.user.id);
        }
        
        this.currentUser = user;
        
        // Notify all subscribers
        this.authStateSubscribers.forEach(sub => sub(session, user));
      }
    );
    
    this.supabaseSubscription = subscription;
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;
      
      console.log('[UnifiedAuthService] Getting user profile for:', user.email);

      // Special handling for known admin emails
      const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
      if (trustedAdmins.includes(user.email.toLowerCase())) {
        console.log('[UnifiedAuthService] Trusted admin detected, creating profile');
        return {
          id: userId,
          email: user.email,
          role: UserRole.SUPER_ADMIN,
          name: user.email.split('@')[0],
          permissions: this.getDefaultPermissions(UserRole.SUPER_ADMIN),
          isAdmin: true
        };
      }

      // Try to get admin profile first
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (adminData && !adminError) {
          console.log('[UnifiedAuthService] Found admin user in database');
          return {
            id: userId,
            email: adminData.email,
            name: adminData.name,
            role: adminData.role as UserRole,
            permissions: adminData.permissions || [],
            lastLogin: adminData.last_login ? new Date(adminData.last_login) : undefined,
            isAdmin: true
          };
        }
      } catch (err) {
        console.warn('[UnifiedAuthService] Admin profile fetch error, continuing with regular profile:', err);
      }
      
      // Try to get regular user profile
      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (userData && !userError) {
          console.log('[UnifiedAuthService] Found regular user profile');
          return {
            id: userData.id,
            email: userData.email || '',
            firstName: userData.first_name,
            lastName: userData.last_name,
            phone: userData.phone,
            role: userData.role as UserRole || UserRole.CUSTOMER,
            isAdmin: false
          };
        }
      } catch (err) {
        console.warn('[UnifiedAuthService] Regular profile fetch error:', err);
      }
      
      // If no profile found, return minimal user object from auth
      if (user) {
        console.log('[UnifiedAuthService] Creating minimal user profile');
        return {
          id: user.id,
          email: user.email || '',
          role: UserRole.CUSTOMER,
          isAdmin: false
        };
      }
      
      return null;
    } catch (error) {
      console.error('[UnifiedAuthService] Error fetching user profile:', error);
      return null;
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
      name?: string;
      phone?: string;
      role?: UserRole;
    }
  ): Promise<AuthResponse> {
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, session: null, error: AUTH_ERROR_MESSAGES.serverError.en };
      }

      // Determine profile type based on role
      const isAdmin = userData.role && [
        UserRole.SUPER_ADMIN,
        UserRole.CONTENT_MODERATOR,
        UserRole.ANALYTICS_VIEWER,
        UserRole.CUSTOMER_SUPPORT,
        UserRole.ADMIN
      ].includes(userData.role);

      if (isAdmin) {
        // Create admin profile
        const { error: profileError } = await supabase
          .from('admin_users')
          .insert({
            id: data.user.id,
            email: email,
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            role: userData.role,
            permissions: this.getDefaultPermissions(userData.role),
            last_login: new Date().toISOString(),
          });

        if (profileError) {
          console.error('[UnifiedAuthService] Admin profile creation error:', profileError);
          return { user: null, session: null, error: profileError.message };
        }
      } else {
        // Create regular user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            phone: userData.phone || '',
            role: userData.role || UserRole.CUSTOMER,
          });

        if (profileError) {
          console.error('[UnifiedAuthService] User profile creation error:', profileError);
          return { user: null, session: null, error: profileError.message };
        }
      }

      // Get the created user profile
      const userProfile = await this.getUserProfile(data.user.id);

      return {
        user: userProfile,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('[UnifiedAuthService] Sign up error:', error);
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Sign in a user
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

      if (!data.user) {
        return { user: null, session: null, error: AUTH_ERROR_MESSAGES.serverError.en };
      }

      // Get the user profile
      const userProfile = await this.getUserProfile(data.user.id);

      // Update last login timestamp for admin users
      if (userProfile?.isAdmin) {
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('email', email);
      }

      return {
        user: userProfile,
        session: data.session,
        error: null
      };
    } catch (error) {
      console.error('[UnifiedAuthService] Sign in error:', error);
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      this.currentUser = null;
      this.currentSession = null;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('[UnifiedAuthService] Sign out error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get the current user's session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        return null;
      }
      
      return data.session;
    } catch (error) {
      console.error('[UnifiedAuthService] Get session error:', error);
      return null;
    }
  }

  /**
   * Get the currently logged in user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    const session = await this.getSession();
    if (!session?.user) {
      return null;
    }
    
    this.currentUser = await this.getUserProfile(session.user.id);
    return this.currentUser;
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('[UnifiedAuthService] Reset password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update user information
   */
  async updateUser(updates: Partial<UserProfile>): Promise<{ success: boolean; error: string | null }> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'No user is currently logged in' };
      }

      // Update auth email if provided
      if (updates.email && updates.email !== currentUser.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: updates.email
        });
        
        if (authError) {
          return { success: false, error: authError.message };
        }
      }

      // Update profile based on user type
      if (currentUser.isAdmin) {
        // Update admin profile
        const adminUpdates: Record<string, any> = {};
        
        if (updates.name) adminUpdates.name = updates.name;
        if (updates.role) adminUpdates.role = updates.role;
        if (updates.permissions) adminUpdates.permissions = updates.permissions;
        if (updates.email) adminUpdates.email = updates.email;
        
        if (Object.keys(adminUpdates).length > 0) {
          const { error: profileError } = await supabase
            .from('admin_users')
            .update(adminUpdates)
            .eq('id', currentUser.id);
          
          if (profileError) {
            return { success: false, error: profileError.message };
          }
        }
      } else {
        // Update regular user profile
        const userUpdates: Record<string, any> = {};
        
        if (updates.firstName) userUpdates.first_name = updates.firstName;
        if (updates.lastName) userUpdates.last_name = updates.lastName;
        if (updates.phone) userUpdates.phone = updates.phone;
        if (updates.role) userUpdates.role = updates.role;
        if (updates.email) userUpdates.email = updates.email;
        
        if (Object.keys(userUpdates).length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(userUpdates)
            .eq('id', currentUser.id);
          
          if (profileError) {
            return { success: false, error: profileError.message };
          }
        }
      }

      // Get updated user profile
      this.currentUser = await this.getUserProfile(currentUser.id);
      
      return { success: true, error: null };
    } catch (error) {
      console.error('[UnifiedAuthService] Update user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Check if the current user has a specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Check user permissions
    return user.permissions?.includes(permission) || false;
  }

  /**
   * Get default permissions for a role
   */
  getDefaultPermissions(role?: UserRole): string[] {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return ['*']; // All permissions
      
      case UserRole.ADMIN:
        return [
          'products:read', 'products:write',
          'users:read', 'users:write',
          'orders:read', 'orders:write',
          'categories:read', 'categories:write'
        ];
      
      case UserRole.CONTENT_MODERATOR:
        return [
          'products:read', 'products:write',
          'categories:read', 'categories:write'
        ];
      
      case UserRole.ANALYTICS_VIEWER:
        return [
          'analytics:read',
          'products:read',
          'users:read',
          'orders:read'
        ];
      
      case UserRole.CUSTOMER_SUPPORT:
        return [
          'users:read',
          'orders:read', 'orders:write',
          'products:read'
        ];
      
      case UserRole.SELLER:
        return [
          'own-products:read', 'own-products:write',
          'own-orders:read'
        ];
      
      case UserRole.CUSTOMER:
      default:
        return [
          'own-orders:read', 'own-orders:write'
        ];
    }
  }
}

// Export singleton instance
export const unifiedAuthService = new UnifiedAuthService(); 