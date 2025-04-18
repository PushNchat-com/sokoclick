import React from 'react';
import { useTranslation } from 'react-i18next';
import SellerDashboard from '../../components/seller/Dashboard';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const SellerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  
  // Redirect if not a seller
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (userRole !== 'seller' && userRole !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('seller.dashboard')}</h1>
      
      <SellerDashboard />
    </div>
  );
};

export default SellerDashboardPage; 