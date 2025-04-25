import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { UserRole } from '../../types/auth';

interface PrivateRouteProps {
  children: ReactElement;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactElement;
}

/**
 * PrivateRoute component protects routes that require authentication
 * @param children - The route content to render if authorized
 * @param requiredRoles - Optional specific roles required to access the route
 * @param redirectTo - Custom redirect path for unauthorized users (defaults to /login)
 * @param fallback - Custom loading component (uses default if not provided)
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles = [],
  redirectTo = '/login',
  fallback
}): ReactElement => {
  const { user, isAuthenticated, loading } = useUnifiedAuth();
  const location = useLocation();

  // Show loading state while authentication is being verified
  if (loading) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to visit for redirection after login
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check if specific roles are required and if user has one of them
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // Redirect to unauthorized page for authenticated users without required role
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default PrivateRoute; 