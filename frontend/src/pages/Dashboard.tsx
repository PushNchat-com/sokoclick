import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/ui/LoadingState';

/**
 * Dashboard router component that redirects users to the appropriate
 * role-specific dashboard based on their authentication status and role.
 */
const Dashboard = () => {
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'seller') {
        navigate('/seller/dashboard');
      } else {
        // Default to home for buyers or unauthenticated users
        navigate('/');
      }
    }
  }, [userRole, loading, navigate]);

  // Show loading state while determining where to redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading your dashboard..." />
      </div>
    );
  }
  
  // This should not be visible as the user will be redirected
  return null;
};

export default Dashboard; 