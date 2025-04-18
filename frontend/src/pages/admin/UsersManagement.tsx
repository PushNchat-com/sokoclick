import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient } from '../../api/supabase';
import { useToast } from '../../components/ui/Toast';
import UserManager from '../../components/admin/UserManager';

/**
 * User Management page for the admin dashboard
 * Delegates actual user management functionality to the UserManager component
 */
const UsersManagement: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just set loading to false after component mounts
    // The actual data fetching is handled by the UserManager component
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('admin.manageUsers')}</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <UserManager />
      )}
    </div>
  );
};

export default UsersManagement; 