import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminMockAuctionSlots, useAdminMockSlotActions } from '../../hooks/useMockData';
import { AUCTION_STATES, AuctionState } from '../../services/mockData';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { H1, H2, H3, Text } from '../../components/ui/Typography';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { USER_ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import SlotManager from '../../components/admin/SlotManager';
import UserManager from '../../components/admin/UserManager';
import TransactionManager from './TransactionManager';

// Admin Dashboard Tabs
const ADMIN_TABS: { id: AdminTabType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'auctions', label: 'Auctions' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'settings', label: 'Settings' },
];

type AdminTabType = 'overview' | 'users' | 'auctions' | 'transactions' | 'settings';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTabType>('overview');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const { slots, loading, error } = useAdminMockAuctionSlots(true); // Include all slots, not just active ones
  const { assignProductToSlot, removeProductFromSlot, updateSlotDetails, loading: actionLoading, error: actionError, success } = useAdminMockSlotActions();
  const { userWithRole } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (userWithRole && userWithRole.role !== USER_ROLES.ADMIN) {
      window.location.href = '/';
    }
  }, [userWithRole]);

  // Statistics for the overview
  const stats = {
    totalSlots: slots.length,
    activeSlots: slots.filter(slot => slot.auction_state === AUCTION_STATES.ACTIVE).length,
    emptySlots: slots.filter(slot => !slot.product).length,
    scheduledSlots: slots.filter(slot => slot.auction_state === AUCTION_STATES.SCHEDULED).length,
    completedSlots: slots.filter(slot => slot.auction_state === AUCTION_STATES.COMPLETED).length
  };

  // Filter slots by auction state
  const getSlotsByState = (state: AuctionState) => {
    return slots.filter(slot => slot.auction_state === state);
  };

  // Get badge color based on auction state
  const getStateColor = (state: AuctionState) => {
    switch (state) {
      case AUCTION_STATES.ACTIVE:
        return 'success';
      case AUCTION_STATES.SCHEDULED:
        return 'info';
      case AUCTION_STATES.PENDING:
        return 'warning';
      case AUCTION_STATES.COMPLETED:
        return 'success';
      case AUCTION_STATES.CANCELLED:
        return 'danger';
      case AUCTION_STATES.FAILED:
        return 'danger';
      default:
        return 'default';
    }
  };

  // Calculate dashboard stats
  const totalAuctions = slots?.length || 0;
  const activeAuctions = slots?.filter(a => a.auction_state === AUCTION_STATES.ACTIVE).length || 0;
  const completedAuctions = slots?.filter(a => a.auction_state === AUCTION_STATES.COMPLETED).length || 0;
  const totalUsers = 120; // This would be fetched from a hook in a real application
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  // Get total platform revenue (sum of all completed auction values)
  const platformRevenue = slots
    ?.filter(a => a.auction_state === AUCTION_STATES.COMPLETED)
    .reduce((sum, auction) => sum + (auction.current_price || 0), 0) || 0;

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return <UserManager />;
      case 'auctions':
        return <SlotManager />;
      case 'transactions':
        return <TransactionManager />;
      case 'settings':
        return renderSettingsTab();
      default:
        return <div>Select a tab</div>;
    }
  };

  // Overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">{t('admin.dashboardOverview')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('admin.totalUsers')}
          value={totalUsers}
          trend="up"
          trendValue="12% from last month"
        />
        <StatCard 
          title={t('admin.activeAuctions')}
          value={activeAuctions}
          trend="up"
          trendValue="8% from last week"
        />
        <StatCard 
          title={t('admin.completedAuctions')}
          value={completedAuctions}
        />
        <StatCard 
          title={t('admin.platformRevenue')}
          value={formatCurrency(platformRevenue)}
          trend="up"
          trendValue="15% from last month"
        />
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">{t('admin.recentActivity')}</h3>
        <Card>
          <div className="p-4">
            <ul className="space-y-4">
              {slots?.slice(0, 5).map((slot, index) => (
                <li key={index} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{slot.product ? slot.product.name_en : t('emptySlot')}</p>
                    <p className="text-sm text-gray-500">
                      {slot.auction_state === AUCTION_STATES.ACTIVE ? 
                        t('admin.auctionStarted') : 
                        slot.auction_state === AUCTION_STATES.COMPLETED ? 
                        t('admin.auctionEnded') : 
                        t('admin.auctionScheduled')}
                    </p>
                  </div>
                  <div className="flex items-center mt-2 sm:mt-0">
                    <Badge 
                      variant={
                        slot.auction_state === AUCTION_STATES.ACTIVE ? 'success' :
                        slot.auction_state === AUCTION_STATES.COMPLETED ? 'primary' :
                        'warning'
                      }
                      size="sm"
                    >
                      {slot.auction_state}
                    </Badge>
                    {slot.auction_state === AUCTION_STATES.COMPLETED && (
                      <span className="ml-4 text-sm">{formatCurrency(slot.current_price || 0)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );

  // Settings tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">{t('admin.systemSettings')}</h2>
      <Card>
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">{t('admin.generalSettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.platformName')}
                </label>
                <input 
                  type="text" 
                  className="border border-gray-300 rounded-md w-full px-3 py-2"
                  defaultValue="SokoClick"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.supportEmail')}
                </label>
                <input 
                  type="email" 
                  className="border border-gray-300 rounded-md w-full px-3 py-2"
                  defaultValue="support@sokoclick.co.ke"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.maintenanceMode')}
                </label>
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  <label className="ml-2 block text-sm text-gray-900">
                    {t('admin.enableMaintenanceMode')}
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-2">{t('admin.auctionSettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.defaultBidIncrement')} (KES)
                </label>
                <input 
                  type="number" 
                  className="border border-gray-300 rounded-md w-full px-3 py-2"
                  defaultValue="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.auctionDuration')} ({t('admin.hours')})
                </label>
                <input 
                  type="number" 
                  className="border border-gray-300 rounded-md w-full px-3 py-2"
                  defaultValue="24"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-2">{t('admin.securitySettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.twoFactorAuth')}
                </label>
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                  <label className="ml-2 block text-sm text-gray-900">
                    {t('admin.requireTwoFactorForAdmins')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
          <Button variant="outline" className="mr-2">
            {t('admin.cancel')}
          </Button>
          <Button>
            {t('admin.saveSettings')}
          </Button>
        </div>
      </Card>
    </div>
  );

  // State for slot filtering
  const [selectedSlotState, setSelectedSlotState] = useState<AuctionState | 'all'>('all');

  // Filter slots based on selected state
  const filteredSlots = selectedSlotState === 'all' 
    ? slots 
    : slots.filter(slot => slot.auction_state === selectedSlotState);

  // Handle edit slot
  const handleEditSlot = (slotId: number) => {
    setSelectedSlot(slotId);
    navigate(`/admin/edit-slot/${slotId}`);
  };

  // Handle remove product from slot
  const handleRemoveProduct = async (slotId: number) => {
    if (window.confirm(t('confirmRemoveProduct'))) {
      await removeProductFromSlot(slotId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {t('common.error')}: {error instanceof Error ? error.message : String(error)}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-6 md:py-10 bg-gray-50">
        <div className="max-container px-4">
          <div className="flex flex-col md:flex-row items-start mb-8">
            <div className="w-full md:w-auto mb-4 md:mb-0">
              <H1 className="text-2xl md:text-3xl">{t('admin.dashboard')}</H1>
              <Text className="text-gray-600">{t('admin.dashboardDescription')}</Text>
            </div>
            
            <div className="md:ml-auto flex flex-wrap gap-2">
              <Button 
                variant="primary"
                onClick={() => navigate('/admin/create-slot')}
              >
                {t('createNewSlot')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
              >
                {t('viewSite')}
              </Button>
            </div>
          </div>
          
          {/* Mobile Tab Selector */}
          <div className="block md:hidden mb-4">
            <select
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as AdminTabType)}
            >
              {ADMIN_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {t(`admin.tab${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex mb-6 border-b border-gray-200">
            {ADMIN_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {t(`admin.tab${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`)}
              </button>
            ))}
          </div>
          
          {/* Tab content */}
          <div className="mb-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Stat card component
const StatCard = ({ title, value, trend, trendValue }: { title: string; value: string | number; trend?: 'up' | 'down' | 'neutral'; trendValue?: string }) => (
  <Card className="h-full">
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold mb-2">{value}</p>
      {trend && (
        <div className="mt-auto flex items-center">
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        </div>
      )}
    </div>
  </Card>
);

export default AdminDashboard; 