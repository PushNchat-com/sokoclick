import supabase from './supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

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

// Define user roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_MODERATOR = 'content_moderator',
  ANALYTICS_VIEWER = 'analytics_viewer',
  CUSTOMER_SUPPORT = 'customer_support',
  SELLER = 'seller',
  CUSTOMER = 'customer'
}

// User profile type
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
}

export interface AuthResponse {
  user: UserProfile | null;
  session: Session | null;
  error: string | null;
}

// Auth state subscriber function type
export type AuthStateChangeCallback = (session: Session | null, user: UserProfile | null) => void;

let authStateSubscribers: AuthStateChangeCallback[] = [];

/**
 * Subscribe to auth state changes
 * @param callback Function to call on auth state change
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (callback: AuthStateChangeCallback): (() => void) => {
  authStateSubscribers.push(callback);
  
  // Set up Supabase auth subscription
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_, session) => {
      let user: UserProfile | null = null;
      
      if (session?.user) {
        user = await getUserProfile(session.user.id);
      }
      
      // Notify all subscribers
      authStateSubscribers.forEach(sub => sub(session, user));
    }
  );
  
  // Return unsubscribe function
  return () => {
    authStateSubscribers = authStateSubscribers.filter(sub => sub !== callback);
    subscription.unsubscribe();
  };
};

/**
 * Get user profile from database
 * @param userId User ID
 * @returns User profile or null
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    // Get user email from auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;
    
    console.log('[auth.service] Getting user profile for:', user.email);

    // Special handling for known admin emails
    const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
    if (trustedAdmins.includes(user.email.toLowerCase())) {
      console.log('[auth.service] Trusted admin detected, creating profile');
      return {
        id: userId,
        email: user.email,
        role: UserRole.SUPER_ADMIN,
        name: user.email.split('@')[0],
        permissions: getDefaultPermissions(UserRole.SUPER_ADMIN)
      };
    }

    // Try to get admin profile by email first - with simplified query
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (adminData && !adminError) {
        console.log('[auth.service] Found admin user in database');
        return {
          id: userId,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role as UserRole,
          permissions: adminData.permissions || [],
          lastLogin: adminData.last_login ? new Date(adminData.last_login) : undefined,
        };
      }
    } catch (err) {
      console.warn('[auth.service] Admin profile fetch error, continuing with regular profile:', err);
    }
    
    // Try to get regular user profile
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userData && !userError) {
        console.log('[auth.service] Found regular user profile');
        return {
          id: userData.id,
          email: userData.email || '',
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          role: userData.role as UserRole || UserRole.CUSTOMER,
        };
      }
    } catch (err) {
      console.warn('[auth.service] Regular profile fetch error:', err);
    }
    
    // If no profile found, return minimal user object from auth
    if (user) {
      console.log('[auth.service] Creating minimal user profile');
      return {
        id: user.id,
        email: user.email || '',
        role: UserRole.CUSTOMER,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Sign up a new user
 * @param email User email
 * @param password User password
 * @param userData Additional user data
 * @returns Auth response
 */
export const signUp = async (
  email: string,
  password: string,
  userData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    role?: UserRole;
  }
): Promise<AuthResponse> => {
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
      UserRole.CUSTOMER_SUPPORT
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
          permissions: getDefaultPermissions(userData.role),
          last_login: new Date().toISOString(),
        });

      if (profileError) {
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
          phone: userData.phone || null,
          role: userData.role || UserRole.CUSTOMER,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        return { user: null, session: null, error: profileError.message };
      }
    }

    const user: UserProfile = {
      id: data.user.id,
      email: email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: userData.name,
      phone: userData.phone,
      role: userData.role || UserRole.CUSTOMER,
    };

    return { user, session: data.session, error: null };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : AUTH_ERROR_MESSAGES.serverError.en
    };
  }
};

/**
 * Sign in a user
 * @param email User email
 * @param password User password
 * @returns Auth response
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, session: null, error: AUTH_ERROR_MESSAGES.invalidCredentials.en };
    }

    const user = await getUserProfile(data.user.id);

    // Update last login time for admins
    if (user && [UserRole.SUPER_ADMIN, UserRole.CONTENT_MODERATOR, 
                UserRole.ANALYTICS_VIEWER, UserRole.CUSTOMER_SUPPORT].includes(user.role)) {
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return { user, session: data.session, error: null };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : AUTH_ERROR_MESSAGES.serverError.en
    };
  }
};

/**
 * Sign in admin only
 */
export const signInAdmin = async (email: string, password: string): Promise<AuthResponse> => {
  console.log('[auth.service] signInAdmin called for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('[auth.service] Supabase login result:', !!data.user, 'error:', !!error);
    
    if (error) {
      console.error('[auth.service] Supabase login error:', error.message);
      return { user: null, session: null, error: error.message };
    }

    if (!data.user) {
      console.error('[auth.service] No user returned from login');
      return { user: null, session: null, error: 'Login failed. Please try again.' };
    }

    // Get user profile with role
    console.log('[auth.service] Getting user profile');
    const userProfile = await getUserProfile(data.user.id);
    
    console.log('[auth.service] User profile:', userProfile);
    
    // Check if this is a special admin email - these should always be allowed
    const trustedAdmins = ['sokoclick.com@gmail.com', 'pushns24@gmail.com'];
    const isTrustedAdmin = trustedAdmins.includes(email.toLowerCase());
    
    if (!userProfile) {
      console.error('[auth.service] No user profile found');
      
      // Special bypass for trusted admins
      if (isTrustedAdmin) {
        console.log('[auth.service] Allowing trusted admin without profile:', email);
        // Create a minimal profile for the trusted admin
        const adminProfile: UserProfile = {
          id: data.user.id,
          email: email,
          role: UserRole.SUPER_ADMIN,
          name: email.split('@')[0],
          permissions: getDefaultPermissions(UserRole.SUPER_ADMIN)
        };
        return { user: adminProfile, session: data.session, error: null };
      }
      
      await signOut(); // Sign out if profile not found
      return { user: null, session: null, error: 'User profile not found' };
    }
    
    console.log('[auth.service] User role:', userProfile.role);
    
    // Verify this is an admin account - with bypass for trusted admin emails
    if (userProfile.role !== UserRole.SUPER_ADMIN && !isTrustedAdmin) {
      console.error('[auth.service] User is not a super admin');
      await signOut(); // Sign out if not admin
      return { 
        user: null, 
        session: null, 
        error: 'This account does not have admin privileges'
      };
    }
    
    // Force setting role to super_admin for trusted admins
    if (isTrustedAdmin && userProfile.role !== UserRole.SUPER_ADMIN) {
      console.log('[auth.service] Upgrading trusted admin role');
      userProfile.role = UserRole.SUPER_ADMIN;
      userProfile.permissions = getDefaultPermissions(UserRole.SUPER_ADMIN);
      
      // Try to update the profile - don't block if this fails
      try {
        await updateUser({
          id: userProfile.id,
          role: UserRole.SUPER_ADMIN,
          permissions: getDefaultPermissions(UserRole.SUPER_ADMIN)
        });
      } catch (err) {
        console.warn('[auth.service] Failed to update admin role, but continuing:', err);
      }
    }

    console.log('[auth.service] Admin login successful');
    return { user: userProfile, session: data.session, error: null };
  } catch (err) {
    console.error('[auth.service] Unexpected error during admin login:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return { user: null, session: null, error: errorMessage };
  }
};

/**
 * Sign out the current user
 * @returns Success result
 */
export const signOut = async (): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : AUTH_ERROR_MESSAGES.serverError.en
    };
  }
};

/**
 * Get the current user session
 * @returns Current session
 */
export const getSession = async (): Promise<Session | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get the current user and profile
 * @returns Current user profile
 */
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    return await getUserProfile(user.id);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Reset password for a user
 * @param email User email
 * @returns Success result
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : AUTH_ERROR_MESSAGES.serverError.en
    };
  }
};

/**
 * Update user profile
 * @param updates User profile updates
 * @returns Success result
 */
export const updateUser = async (
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    const currentProfile = await getUserProfile(user.id);
    if (!currentProfile) {
      return { success: false, error: 'User profile not found' };
    }
    
    // Determine if admin or regular user
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.CONTENT_MODERATOR,
                    UserRole.ANALYTICS_VIEWER, UserRole.CUSTOMER_SUPPORT].includes(currentProfile.role);
    
    // Split updates between auth and profile
    const authUpdates: any = {};
    const profileUpdates: any = {};
    
    // Determine which fields go where
    if (updates.email) authUpdates.email = updates.email;
    
    if (isAdmin) {
      if (updates.name) profileUpdates.name = updates.name;
      if (updates.role) profileUpdates.role = updates.role;
      if (updates.permissions) profileUpdates.permissions = updates.permissions;
      
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from('admin_users')
          .update(profileUpdates)
          .eq('id', user.id);
          
        if (error) {
          return { success: false, error: error.message };
        }
      }
    } else {
      if (updates.firstName) profileUpdates.first_name = updates.firstName;
      if (updates.lastName) profileUpdates.last_name = updates.lastName;
      if (updates.phone) profileUpdates.phone = updates.phone;
      if (updates.role) profileUpdates.role = updates.role;
      
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);
          
        if (error) {
          return { success: false, error: error.message };
        }
      }
    }
    
    // Update auth if needed
    if (Object.keys(authUpdates).length > 0) {
      const { error } = await supabase.auth.updateUser(authUpdates);
      if (error) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : AUTH_ERROR_MESSAGES.serverError.en
    };
  }
};

/**
 * Check if user has a specific permission
 * @param permission Permission to check
 * @returns True if user has permission
 */
export const hasPermission = async (permission: string): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Super admins have all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // Check user permissions
  return !!user.permissions && user.permissions.includes(permission);
};

/**
 * Get default permissions for a role
 * @param role User role
 * @returns Array of permissions
 */
export const getDefaultPermissions = (role?: UserRole): string[] => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return [
        'products:read', 'products:write', 'products:delete', 'products:approve',
        'users:read', 'users:write', 'users:delete', 'users:verify',
        'slots:read', 'slots:write', 'slots:delete',
        'analytics:read', 'analytics:export',
        'settings:read', 'settings:write'
      ];
    case UserRole.CONTENT_MODERATOR:
      return [
        'products:read', 'products:write', 'products:approve',
        'users:read', 'users:verify',
        'slots:read', 'slots:write'
      ];
    case UserRole.ANALYTICS_VIEWER:
      return [
        'products:read',
        'users:read',
        'slots:read',
        'analytics:read', 'analytics:export'
      ];
    case UserRole.CUSTOMER_SUPPORT:
      return [
        'products:read',
        'users:read',
        'slots:read'
      ];
    default:
      return [];
  }
}; 