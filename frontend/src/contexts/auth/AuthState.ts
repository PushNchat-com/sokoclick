export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isVerifiedSeller: boolean;
  userId: string | null;
  userEmail: string | null;
  userRole: 'admin' | 'seller' | 'customer' | null;
  whatsappNumber: string | null;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  isSeller: false,
  isVerifiedSeller: false,
  userId: null,
  userEmail: null,
  userRole: null,
  whatsappNumber: null
}; 