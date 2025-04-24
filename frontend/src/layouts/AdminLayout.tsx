import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { logAdminAction, AuditAction, AuditResource } from '../services/auditLog';

const AdminLayout: React.FC = () => {
  const { user } = useAdminAuth();
  
  // Initialize session timeout
  useSessionTimeout();

  // Log admin view
  React.useEffect(() => {
    if (user) {
      logAdminAction(
        user,
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
              <Outlet />
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminLayout;
