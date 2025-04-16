import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'seller' | 'buyer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check if requiredRole is specified
  if (requiredRole) {
    const userRole = user.user_metadata?.role;
    
    // If user doesn't have the required role
    if (userRole !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
};

export default ProtectedRoute; 