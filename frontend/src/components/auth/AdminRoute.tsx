import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { UserRole } from '../../types/auth';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredRoles = [UserRole.SUPER_ADMIN]
}) => {
  const { isAuthenticated, isAdmin, user, loading } = useAdminAuth();
  const location = useLocation();
  
  // Show loading indicator while authentication is being verified
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Check if user is not authenticated
  if (!isAuthenticated) {
    // Redirect to admin login
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user is not admin
  if (!isAdmin) {
    // Redirect to unauthorized page
    return <Navigate to="/admin/unauthorized" replace />;
  }

  // Check if user has required roles
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    // Redirect to unauthorized page
    return <Navigate to="/admin/unauthorized" replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default AdminRoute; 