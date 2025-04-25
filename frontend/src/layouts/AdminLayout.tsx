import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { logAdminAction, AuditAction, AuditResource } from '../services/auditLog';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user } = useUnifiedAuth();
  
  // Initialize session timeout
  useSessionTimeout();

  // Log admin view
  React.useEffect(() => {
    if (user) {
      logAdminAction(
        AuditAction.VIEW,
        AuditResource.ADMIN,
        undefined,
        { path: window.location.pathname }
      );
    }
  }, [user]);

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        {children || <Outlet />}
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminLayout;
