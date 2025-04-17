import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import LoadingState from '../../components/ui/LoadingState';
import SlotManager from '../../components/admin/SlotManager';
import UserManager from '../../components/admin/UserManager';
import TransactionManager from '../../components/admin/TransactionManager';
import Badge from '../../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import { supabaseClient } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

// Import standardized dashboard components
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import TabNavigation from '../../components/dashboard/TabNavigation';
import StatCard from '../../components/dashboard/StatCard';
import DashboardTable from '../../components/dashboard/DashboardTable';
import DashboardEmptyState from '../../components/dashboard/DashboardEmptyState';
import { useNavigate, useLocation } from 'react-router-dom';

// Admin tabs for navigation
const ADMIN_TABS = [
  { id: 'overview', label: 'admin.tabs.overview' },
  { id: 'users', label: 'admin.users' },
  { id: 'auctions', label: 'admin.auctions' },
  { id: 'transactions', label: 'admin.transactions' },
  { id: 'settings', label: 'admin.tabs.settings' }
];

type AdminTabType = 'overview' | 'users' | 'auctions' | 'transactions' | 'settings';

interface AdminDashboardProps {
  defaultTab?: AdminTabType;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ defaultTab = 'overview' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTabType>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeAuctions: number;
    completedAuctions: number;
    totalRevenue: number;
    transactionVolume: number;
    pendingTransactions: number;
  } | null>(null);
  
  // Set the active tab based on URL when component mounts or when URL changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/users')) {
      setActiveTab('users');
    } else if (path.includes('/admin/auctions')) {
      setActiveTab('auctions');
    } else if (path.includes('/admin/transactions')) {
      setActiveTab('transactions');
    } else if (path.includes('/admin/settings')) {
      setActiveTab('settings');
    } else {
      setActiveTab(defaultTab);
    }
  }, [location, defaultTab]);

  // Fetch dashboard statistics from the API
  React.useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get users count
      const { count: usersCount, error: usersError } = await supabaseClient
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      if (usersError) throw usersError;
      
      // Get active auctions count
      const { count: activeAuctionsCount, error: activeAuctionsError } = await supabaseClient
        .from('auction_slots')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        
      if (activeAuctionsError) throw activeAuctionsError;
      
      // Get completed auctions count
      const { count: completedAuctionsCount, error: completedAuctionsError } = await supabaseClient
        .from('auction_slots')
        .select('*', { count: 'exact', head: true })
        .is('product_id', null)
        .eq('is_active', false);
        
      if (completedAuctionsError) throw completedAuctionsError;
      
      // Get transactions data
      const { data: transactions, error: transactionsError } = await supabaseClient
        .from('transactions')
        .select('amount, commission_amount, status');
        
      if (transactionsError) throw transactionsError;
      
      // Calculate revenue from commissions
      const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.commission_amount || 0), 0);
      
      // Calculate transaction volume
      const transactionVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Count pending transactions
      const pendingTransactions = transactions.filter(tx => 
        ['payment_pending', 'shipping_pending'].includes(tx.status)
      ).length;
      
      setStats({
        totalUsers: usersCount || 0,
        activeAuctions: activeAuctionsCount || 0,
        completedAuctions: completedAuctionsCount || 0,
        totalRevenue,
        transactionVolume,
        pendingTransactions
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard statistics');
      
      // Set mock stats for development
      if (process.env.NODE_ENV !== 'production') {
        setStats({
          totalUsers: 156,
          activeAuctions: 24,
          completedAuctions: 85,
          totalRevenue: 12500,
          transactionVolume: 125000,
          pendingTransactions: 8
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Format tabs with translations
  const tabs = useMemo(() => 
    ADMIN_TABS.map(tab => ({
      ...tab,
      label: t(tab.label)
    })), 
  [t]);
  
  // Handle tab change, update the URL
  const handleTabChange = (tabId: string) => {
    const newTab = tabId as AdminTabType;
    setActiveTab(newTab);
    
    // Update URL to match the selected tab
    if (newTab === 'overview') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/admin/${newTab}`);
    }
  };
  
  // Render the content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'auctions':
        return renderAuctions();
      case 'transactions':
        return renderTransactions();
      case 'settings':
        return renderSettings();
      default:
        return <div>{t('admin.tabNotFound')}</div>;
    }
  };
  
  // Render the overview tab with statistics
  const renderOverview = () => {
    if (loading) {
      return <LoadingState message={t('admin.loadingDashboard')} />;
    }
    
    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
          <p className="font-bold">{t('admin.errorLoadingDashboard')}:</p>
          <p>{error}</p>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={fetchStats} 
            className="mt-3"
          >
            <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('common.retry')}
          </Button>
        </div>
      );
    }
    
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">{t('admin.dashboardOverview')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title={t('admin.stats.totalUsers')} 
            value={formatNumber(stats.totalUsers)}
            change={{
              value: 12.5,
              isPositive: true
            }}
            helperText={t('admin.stats.lastWeek')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard 
            title={t('admin.stats.activeAuctions')} 
            value={stats.activeAuctions}
            change={{
              value: 8.1,
              isPositive: true
            }}
            helperText={t('admin.stats.currentlyRunning')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title={t('admin.stats.totalRevenue')} 
            value={formatCurrency(stats.totalRevenue, 'XAF')}
            change={{
              value: 23.4,
              isPositive: true
            }}
            helperText={t('admin.stats.fromCommissions')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title={t('admin.stats.pendingTransactions')} 
            value={stats.pendingTransactions}
            helperText={t('admin.stats.needsAttention')}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">{t('admin.recentActivity')}</h3>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('admin.activity.newAuction')}</p>
                  <p className="text-sm text-gray-500">{t('admin.activity.timeAgo', { time: '2h' })}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('admin.activity.newUser')}</p>
                  <p className="text-sm text-gray-500">{t('admin.activity.timeAgo', { time: '3h' })}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-yellow-100 rounded-full p-2 mr-4">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('admin.activity.transactionCompleted')}</p>
                  <p className="text-sm text-gray-500">{t('admin.activity.timeAgo', { time: '5h' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">{t('admin.quickActions')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-4 border-2"
              onClick={() => setActiveTab('auctions')}
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('admin.actionOptions.assignProduct')}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-4 border-2"
              onClick={() => setActiveTab('users')}
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t('admin.actionOptions.manageUsers')}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-center py-4 border-2"
              onClick={() => setActiveTab('transactions')}
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('admin.actionOptions.viewTransactions')}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the users tab with user management
  const renderUsers = () => {
    return <UserManager />;
  };
  
  // Render the auctions tab with slot management
  const renderAuctions = () => {
    return <SlotManager />;
  };
  
  // Render the transactions tab
  const renderTransactions = () => {
    return <TransactionManager />;
  };
  
  // Render the settings tab
  const renderSettings = () => {
    const [exportLoading, setExportLoading] = useState(false);
    const toast = useToast();
    
    const handleExportData = async () => {
      try {
        setExportLoading(true);
        // Collect data from multiple tables
        const { data: users, error: usersError } = await supabaseClient.from('users').select('*');
        if (usersError) throw usersError;
        
        const { data: products, error: productsError } = await supabaseClient.from('products').select('*');
        if (productsError) throw productsError;
        
        const { data: slots, error: slotsError } = await supabaseClient.from('auction_slots').select('*');
        if (slotsError) throw slotsError;
        
        const { data: transactions, error: transactionsError } = await supabaseClient.from('transactions').select('*');
        if (transactionsError) throw transactionsError;
        
        // Prepare the export data
        const exportData = {
          exported_at: new Date().toISOString(),
          users,
          products,
          auction_slots: slots,
          transactions
        };
        
        // Create a Blob and download link
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `sokoclick-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        toast.success(t('admin.exportSuccess'));
      } catch (error) {
        console.error('Error exporting data:', error);
        toast.error(t('admin.exportError'));
      } finally {
        setExportLoading(false);
      }
    };
    
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">{t('admin.settings.title')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.platformName')}</label>
              <input
                type="text"
                value={t('admin.dashboardSokoClick')}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.supportEmail')}</label>
              <input
                type="email"
                value="support@sokoclick.com"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.defaultCurrency')}</label>
              <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md">
                <option value="KES">{t('admin.dashboardKES')} - {t('currencies.kes')}</option>
                <option value="XAF">{t('admin.dashboardXAF')} - {t('currencies.xaf')}</option>
                <option value="USD">{t('admin.dashboardUSD')} - {t('currencies.usd')}</option>
              </select>
            </div>
          </div>
          <Button className="mt-4" variant="primary">
            {t('common.save')}
          </Button>
        </div>
        
        {/* Language Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('languages.title', 'Language Settings')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.defaultLanguage')}</label>
              <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md">
                <option value="en">{t('languages.english')}</option>
                <option value="fr">{t('languages.french')}</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Auction Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('auction.settings', 'Auction Settings')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.defaultBidIncrement')}</label>
              <div className="flex max-w-md">
                <select className="w-24 px-3 py-2 border border-gray-300 rounded-l-md">
                  <option value="XAF">{t('admin.dashboardXAF')}</option>
                  <option value="KES">{t('admin.dashboardKES')}</option>
                  <option value="USD">{t('admin.dashboardUSD')}</option>
                </select>
                <input type="number" className="flex-1 px-3 py-2 border-t border-b border-gray-300" value="500" />
                <span className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50">
                  {t('common.or')} 5%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.defaultAuctionDuration')}</label>
              <div className="flex max-w-md">
                <input type="number" className="w-24 px-3 py-2 border border-gray-300 rounded-l-md" value="48" />
                <span className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-md bg-gray-50">
                  {t('common.hours')}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.settings.commissionRate')}</label>
              <div className="flex max-w-md">
                <input type="number" className="w-24 px-3 py-2 border border-gray-300 rounded-l-md" value="10" />
                <span className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-md bg-gray-50">
                  %
                </span>
              </div>
            </div>
          </div>
          <Button className="mt-4" variant="primary">
            {t('common.save')}
          </Button>
        </div>
        
        {/* Backup & Restore */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('admin.settings.backupAndRestore')}</h3>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleExportData}
              isLoading={exportLoading}
              disabled={exportLoading}
            >
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('admin.actionOptions.exportData')}
            </Button>
            
            <div className="relative">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('admin.actionOptions.importData')}
              </Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".json"
                onChange={() => toast.info(t('admin.importNotImplemented'))}
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-primary-50 rounded-md text-sm text-primary-700 border border-primary-200">
            <p className="flex items-start">
              <svg className="w-5 h-5 mr-2 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('admin.exportDataNote')}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Admin-specific links
  const adminLinks = [
    {
      label: t('admin.dashboardSokoClick'),
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      exact: true
    },
    {
      label: t('admin.tabs.overview'),
      href: '/admin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      exact: true
    },
    {
      label: t('admin.users'),
      href: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      count: stats?.totalUsers
    },
    {
      label: t('admin.auctions'),
      href: '/admin/auctions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: stats?.activeAuctions
    },
    {
      label: t('admin.transactions'),
      href: '/admin/transactions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: stats?.pendingTransactions
    },
    {
      label: t('admin.tabs.settings'),
      href: '/admin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];
  
  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="Admin Dashboard"
          description={t('admin.dashboardDescription')}
        />
      }
      sidebar={
        <DashboardSidebar 
          navItems={adminLinks}
          logoText={t('appName')}
        />
      }
    >
      <div className="space-y-6">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard; 