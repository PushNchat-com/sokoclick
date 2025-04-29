import React, { ReactElement, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUnifiedAuth } from "../../contexts/UnifiedAuthContext";
import { UserRole } from "../../types/auth";

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactElement;
  loadingTimeout?: number;
}

/**
 * AdminRoute component protects routes that require admin privileges
 * @param children - The route content to render if authorized
 * @param requiredRoles - Array of roles that can access this route (defaults to SUPER_ADMIN)
 * @param redirectTo - Custom redirect path for unauthorized users (defaults to /admin/login)
 * @param fallback - Custom loading component (uses default if not provided)
 * @param loadingTimeout - Timeout in ms before showing error state (defaults to 10000)
 */
const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredRoles = [UserRole.SUPER_ADMIN],
  redirectTo = "/admin/login",
  fallback,
  loadingTimeout = 10000,
}) => {
  const { user, isAdmin, loading } = useUnifiedAuth();
  const location = useLocation();
  const [showError, setShowError] = useState(false);

  // Handle loading timeout
  useEffect(() => {
    if (!loading) {
      setShowError(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowError(true);
    }, loadingTimeout);

    return () => clearTimeout(timeoutId);
  }, [loading, loadingTimeout]);

  // Show loading indicator while authentication is being verified
  if (loading) {
    if (showError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to verify admin access. Please try again.
            </p>
            <a
              href={redirectTo}
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Return to Login
            </a>
          </div>
        </div>
      );
    }

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
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
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
