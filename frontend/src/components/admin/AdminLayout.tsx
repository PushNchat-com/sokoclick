import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import AdminHeader from './AdminHeader';
import AdminNav from './AdminNav';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';
import { ErrorMonitoring } from '../../services/monitoring/ErrorMonitoring';
import { PerformanceMonitor } from '../../services/monitoring/PerformanceMonitor';

// Lazy load health monitor component
const SystemHealthMonitor = lazy(() => import('./monitors/SystemHealthMonitor'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <LoadingSpinner size="large" />
  </div>
);

interface AdminLayoutProps {
  title?: string;
  enableHealthMonitor?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  title = 'Admin Dashboard',
  enableHealthMonitor = false
}) => {
  const { user, loading, isAdmin } = useUnifiedAuth();
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [systemAlertsCount, setSystemAlertsCount] = useState(0);

  const handleHealthAlert = (count: number) => {
    PerformanceMonitor.trackEvent('admin_health_alert_received');
    setSystemAlertsCount(count);
  };

  const toggleHealthMonitor = () => {
    PerformanceMonitor.trackEvent('admin_toggle_health_monitor');
    setShowHealthMonitor(prev => !prev);
  };

  useEffect(() => {
    // Record page view for performance analysis
    PerformanceMonitor.trackPageView('admin_dashboard');
    
    // Check for system alerts if health monitor is enabled
    if (enableHealthMonitor) {
      // This could be replaced with actual API call to check system health
      const checkInterval = setInterval(() => {
        // Simulate random alerts (0-3) for demo purposes
        const alertCount = Math.floor(Math.random() * 4);
        handleHealthAlert(alertCount);
      }, 30000);
      
      return () => clearInterval(checkInterval);
    }
  }, [enableHealthMonitor]);

  // Handle loading state
  if (loading) {
    return <LoadingFallback />;
  }

  // Handle authentication and authorization
  if (!user) {
    ErrorMonitoring.logSecurityIssue('Unauthenticated access attempt to admin area');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    ErrorMonitoring.logSecurityIssue('Unauthorized access attempt to admin area', {
      userId: user.id,
      attemptedRole: 'admin'
    });
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminNav 
        systemAlertsCount={systemAlertsCount}
        showHealthMonitor={showHealthMonitor}
        onToggleHealthMonitor={enableHealthMonitor ? toggleHealthMonitor : undefined}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title={title} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <ErrorBoundary>
            <Outlet />
            
            {enableHealthMonitor && showHealthMonitor && (
              <Suspense fallback={<LoadingFallback />}>
                <SystemHealthMonitor onAlertCountChange={handleHealthAlert} />
              </Suspense>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 