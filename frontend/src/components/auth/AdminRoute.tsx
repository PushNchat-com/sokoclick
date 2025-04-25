import React, { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { UserRole } from '../../types/auth';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactElement;
}

/**
 * AdminRoute component protects routes that require admin privileges
 * @param children - The route content to render if authorized
 * @param requiredRoles - Array of roles that can access this route (defaults to SUPER_ADMIN)
 * @param redirectTo - Custom redirect path for unauthorized users (defaults to /admin/login)
 * @param fallback - Custom loading component (uses default if not provided)
 */
const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredRoles = [UserRole.SUPER_ADMIN],
  redirectTo = '/admin/login',
  fallback
}) => {
  const { user, isAdmin, loading } = useUnifiedAuth();
  const location = useLocation();
  
  // Show loading indicator while authentication is being verified
  if (loading) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Check if user is not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  // Check if user is not admin - redirect to unauthorized page
  if (!isAdmin) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  // Check if user has at least one of the required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return <Navigate to="/admin/unauthorized" replace />;
    }
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default AdminRoute; 