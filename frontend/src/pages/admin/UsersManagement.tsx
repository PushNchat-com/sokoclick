import React from 'react';
import { useTranslation } from 'react-i18next';
import UserManager from '../../components/admin/UserManager';

/**
 * User Management page for the admin dashboard
 * Delegates actual user management functionality to the UserManager component
 */
const UsersManagement: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">{t('userManagement') || 'User Management'}</h1>
      <UserManager />
    </div>
  );
};

export default UsersManagement; 