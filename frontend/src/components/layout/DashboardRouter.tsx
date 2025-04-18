import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import SellerDashboard from '../seller/SellerDashboard';
import BuyerDashboard from '../buyer/BuyerDashboard';
import LoadingState from '../ui/LoadingState';
import { supabaseClient } from '../../api/supabase';

/**
 * Component that routes users to the appropriate dashboard based on their role
 */
const DashboardRouter: React.FC = () => {
  const { user, isLoading, userRole } = useAuth();
  const [refreshedRole, setRefreshedRole] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Force refresh of user role from database to ensure it's up-to-date
  useEffect(() => {
    const refreshUserRole = async () => {
      if (!user || isRefreshing) return;
      
      setIsRefreshing(true);
      try {
        console.log('Refreshing user role from database...');
        
        // Get fresh role data directly from the database
        const { data, error } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error refreshing user role:', error);
        } else if (data) {
          console.log('Refreshed role from DB:', data.role);
          setRefreshedRole(data.role);
        }
      } catch (err) {
        console.error('Failed to refresh user role:', err);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    refreshUserRole();
  }, [user]);
  
  // Use the refreshed role if available, otherwise fall back to the one from useAuth
  const effectiveRole = refreshedRole || userRole;
  
  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }
  
  if (!user) {
    return <div>Please sign in to access your dashboard</div>;
  }
  
  // Show appropriate dashboard based on user role
  console.log('Rendering dashboard for role:', effectiveRole);
  
  if (effectiveRole === 'seller') {
    return <SellerDashboard user={user} />;
  } else if (effectiveRole === 'admin') {
    // Redirect to admin dashboard
    window.location.href = '/admin';
    return <LoadingState message="Redirecting to admin dashboard..." />;
  } else {
    // Default to buyer dashboard
    return <BuyerDashboard user={user} />;
  }
};

export default DashboardRouter; 