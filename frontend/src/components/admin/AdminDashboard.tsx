import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// StatCard component for dashboard statistics
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: 'users' | 'clock' | 'money' | 'document';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  isPositive, 
  subtitle, 
  icon 
}) => {
  const iconMap = {
    users: (
      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ),
    clock: (
      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    money: (
      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    ),
    document: (
      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-primary-100 mr-4">
          {iconMap[icon]}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center">
          <span className={`mr-1 ${isPositive ? 'text-success-500' : 'text-error-500'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
          {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
        </div>
      )}
      {!change && subtitle && (
        <div className="mt-4">
          <span className="text-sm text-gray-500">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

// ActivityItem component for recent activity
interface ActivityItemProps {
  type: 'new-auction' | 'new-user' | 'auction-completed' | 'payment-received';
  title: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, time }) => {
  const iconMap = {
    'new-auction': (
      <div className="p-2 rounded-full bg-accent-100 text-accent-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    'new-user': (
      <div className="p-2 rounded-full bg-success-100 text-success-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
        </svg>
      </div>
    ),
    'auction-completed': (
      <div className="p-2 rounded-full bg-primary-100 text-primary-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    ),
    'payment-received': (
      <div className="p-2 rounded-full bg-success-100 text-success-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      </div>
    )
  };

  return (
    <div className="flex items-center">
      {iconMap[type]}
      <div className="ml-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">{time} ago</p>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t('admin.dashboard')}</h1>
      <p className="text-gray-600 mb-8">{t('admin.dashboardDescription')}</p>
      
      <div className="flex border-b">
        <button
          className={`py-2 px-4 ${activeTab === 'overview' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          {t('admin.tabs.overview')}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'users' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('users')}
        >
          {t('admin.tabs.users')}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'auctions' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('auctions')}
        >
          {t('admin.tabs.auctions')}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'transactions' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('transactions')}
        >
          {t('admin.tabs.transactions')}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'settings' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('settings')}
        >
          {t('admin.tabs.settings')}
        </button>
      </div>

      {/* Dashboard content based on active tab */}
      <div className="mt-8">
        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'users' && <p>User management coming soon</p>}
        {activeTab === 'auctions' && <p>Auction management coming soon</p>}
        {activeTab === 'transactions' && <p>Transaction management coming soon</p>}
        {activeTab === 'settings' && <p>{t('admin.admindashboard.settingsComingSoon')}</p>}
      </div>
    </div>
  );
};

const DashboardOverview: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">{t('admin.dashboardOverview')}</h2>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title={t('admin.stats.totalUsers')} 
          value="0" 
          change="12.5%" 
          isPositive={true}
          subtitle={t('admin.stats.lastWeek')}
          icon="users"
        />
        <StatCard 
          title={t('admin.stats.activeAuctions')} 
          value="0" 
          change="8.1%" 
          isPositive={true}
          subtitle={t('admin.stats.currentlyRunning')}
          icon="clock"
        />
        <StatCard 
          title={t('admin.stats.totalRevenue')} 
          value="0 FCFA" 
          change="23.4%" 
          isPositive={true}
          subtitle={t('admin.stats.fromCommissions')}
          icon="money"
        />
        <StatCard 
          title={t('admin.stats.pendingTransactions')} 
          value="0" 
          change=""
          isPositive={false}
          subtitle={t('admin.stats.needsAttention')}
          icon="document"
        />
      </div>
      
      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('admin.activity.recentActivity')}</h3>
        <div className="space-y-4">
          <ActivityItem 
            type="new-auction" 
            title={t('admin.activity.newAuction')} 
            time="2h"
          />
          <ActivityItem 
            type="new-user" 
            title={t('admin.activity.newUser')} 
            time="3h"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 