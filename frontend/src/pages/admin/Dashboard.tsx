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

// Admin Dashboard Tabs
const ADMIN_TABS = {
  OVERVIEW: 'overview',
  AUCTION_SLOTS: 'auction_slots',
  PRODUCTS: 'products',
  USERS: 'users',
  ANALYTICS: 'analytics',
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(ADMIN_TABS.OVERVIEW);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const { slots, loading, error } = useAdminMockAuctionSlots(true); // Include all slots, not just active ones
  const { assignProductToSlot, removeProductFromSlot, updateSlotDetails, loading: actionLoading, error: actionError, success } = useAdminMockSlotActions();

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

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case ADMIN_TABS.OVERVIEW:
        return renderOverview();
      case ADMIN_TABS.AUCTION_SLOTS:
        return renderAuctionSlots();
      case ADMIN_TABS.PRODUCTS:
        return renderProducts();
      case ADMIN_TABS.USERS:
        return renderUsers();
      case ADMIN_TABS.ANALYTICS:
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  // Overview tab
  const renderOverview = () => (
    <div>
      <div className="mb-8">
        <H2 className="mb-6">{t('dashboardOverview')}</H2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title={t('totalSlots')} 
            value={stats.totalSlots} 
            icon="🎯" 
            className="bg-primary-50"
          />
          <StatCard 
            title={t('activeAuctions')} 
            value={stats.activeSlots} 
            icon="🔥" 
            className="bg-success-50"
          />
          <StatCard 
            title={t('emptySlots')} 
            value={stats.emptySlots} 
            icon="🆓" 
            className="bg-warning-50"
          />
          <StatCard 
            title={t('completedAuctions')} 
            value={stats.completedSlots} 
            icon="✅" 
            className="bg-info-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <H3 className="mb-4">{t('quickActions')}</H3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setActiveTab(ADMIN_TABS.AUCTION_SLOTS)}
              className="justify-start text-left"
            >
              <span className="mr-2">📋</span> {t('manageAuctionSlots')}
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setActiveTab(ADMIN_TABS.PRODUCTS)}
              className="justify-start text-left"
            >
              <span className="mr-2">📦</span> {t('approveProducts')}
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/admin/whatsapp')}
              className="justify-start text-left"
            >
              <span className="mr-2">💬</span> {t('manageConversations')}
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <H3 className="mb-4">{t('recentActivity')}</H3>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start pb-3 border-b border-gray-100 last:border-0">
                <div className="bg-gray-100 rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm mr-3">
                  {['🔔', '✅', '🔄', '📢'][i]}
                </div>
                <div>
                  <Text className="font-medium">
                    {[
                      t('newBidNotification'),
                      t('auctionCompleted', { id: 12 }),
                      t('productAssigned', { id: 8 }),
                      t('featuredSlotExpired', { id: 3 })
                    ][i]}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {['2 hours ago', '4 hours ago', 'Yesterday', '2 days ago'][i]}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <H3>{t('activeAuctions')}</H3>
          <Button 
            variant="text" 
            onClick={() => setActiveTab(ADMIN_TABS.AUCTION_SLOTS)}
          >
            {t('viewAll')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('slotId')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('endTime')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('views')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSlotsByState(AUCTION_STATES.ACTIVE).slice(0, 5).map(slot => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    #{slot.id}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {slot.product ? (
                      <div className="flex items-center">
                        {slot.product.image_urls && slot.product.image_urls[0] && (
                          <img 
                            src={slot.product.image_urls[0]} 
                            alt={slot.product.name_en} 
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {slot.product.name_en}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">{t('emptySlot')}</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {slot.end_time ? new Date(slot.end_time).toLocaleString() : '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {slot.view_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Auction slots tab
  const renderAuctionSlots = () => (
    <div>
      <H2 className="mb-6">{t('auctionSlotManagement')}</H2>
      
      {/* Success/Error messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
          {success}
        </div>
      )}
      
      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
          {actionError.message}
        </div>
      )}

      {/* Slot state filter tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex rounded-md border border-gray-200 p-1 bg-white">
          {Object.values(AUCTION_STATES).map(state => (
            <button
              key={state}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                selectedSlotState === state
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedSlotState(state)}
            >
              {t(`auctionState.${state}`)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Auction slots list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('slotId')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('startEndTime')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('viewCount')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSlots.map(slot => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">#{slot.id}</div>
                    {slot.featured && (
                      <Badge color="accent" size="small" className="mt-1">
                        {t('featured')}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge color={getStateColor(slot.auction_state)}>
                      {t(`auctionState.${slot.auction_state}`)}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {slot.product ? (
                      <div className="flex items-center">
                        {slot.product.image_urls && slot.product.image_urls[0] && (
                          <img 
                            src={slot.product.image_urls[0]} 
                            alt={slot.product.name_en} 
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {slot.product.name_en}
                          </div>
                          <div className="text-xs text-gray-500">
                            {slot.product.starting_price} {slot.product.currency}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">{t('emptySlot')}</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500">
                      {slot.start_time ? (
                        <>
                          <div>{t('start')}: {new Date(slot.start_time).toLocaleString()}</div>
                          <div>{t('end')}: {slot.end_time ? new Date(slot.end_time).toLocaleString() : '-'}</div>
                        </>
                      ) : (
                        t('notScheduled')
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {slot.view_count || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleEditSlot(slot.id)}
                    >
                      {t('edit')}
                    </Button>
                    {slot.product ? (
                      <Button
                        variant="text"
                        size="small"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleRemoveProduct(slot.id)}
                        disabled={actionLoading}
                      >
                        {t('removeProduct')}
                      </Button>
                    ) : (
                      <Button
                        variant="text"
                        size="small"
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => navigate(`/admin/assign-product/${slot.id}`)}
                      >
                        {t('assignProduct')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Products tab (placeholder)
  const renderProducts = () => (
    <div>
      <H2 className="mb-6">{t('productManagement')}</H2>
      <div className="bg-white shadow rounded-lg p-6">
        <p>{t('productManagementComingSoon')}</p>
      </div>
    </div>
  );

  // Users tab (placeholder)
  const renderUsers = () => (
    <div>
      <H2 className="mb-6">{t('userManagement')}</H2>
      <div className="bg-white shadow rounded-lg p-6">
        <p>{t('userManagementComingSoon')}</p>
      </div>
    </div>
  );

  // Analytics tab (placeholder)
  const renderAnalytics = () => (
    <div>
      <H2 className="mb-6">{t('analytics')}</H2>
      <div className="bg-white shadow rounded-lg p-6">
        <p>{t('analyticsComingSoon')}</p>
      </div>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-6 md:py-10 bg-gray-50">
        <div className="max-container px-4">
          <div className="flex flex-col md:flex-row items-start mb-8">
            <div className="w-full md:w-auto mb-4 md:mb-0">
              <H1 className="text-2xl md:text-3xl">{t('adminDashboard')}</H1>
              <Text className="text-gray-600">{t('adminDashboardDescription')}</Text>
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
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {Object.entries(ADMIN_TABS).map(([key, value]) => (
                <option key={key} value={value}>
                  {t(`adminTabs.${value}`)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex mb-6 border-b border-gray-200">
            {Object.entries(ADMIN_TABS).map(([key, value]) => (
              <button
                key={key}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(value)}
              >
                {t(`adminTabs.${value}`)}
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
              {error.message}
            </div>
          ) : (
            <div>
              {renderTabContent()}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Stat card component
const StatCard = ({ title, value, icon, className = '' }) => (
  <div className={`p-4 rounded-lg shadow-sm ${className}`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default AdminDashboard; 