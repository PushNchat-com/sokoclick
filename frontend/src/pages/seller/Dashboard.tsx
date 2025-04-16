import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSellerMockProducts, useSellerMockAuctions } from '../../hooks/useMockData';
import { AUCTION_STATES } from '../../services/mockData';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { H1, H2, H3, Text } from '../../components/ui/Typography';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Container from '../../components/ui/Container';
import { AuctionSlot, Product } from '../../types/auctions';

// Seller Dashboard Tabs
const SELLER_TABS = {
  OVERVIEW: 'overview',
  PRODUCTS: 'products',
  AUCTIONS: 'auctions',
  SALES: 'sales',
  ACCOUNT: 'account',
};

const SellerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(SELLER_TABS.OVERVIEW);
  const { products, isLoading: productsLoading, error: productsError } = useSellerMockProducts();
  const { auctions, isLoading: auctionsLoading, error: auctionsError } = useSellerMockAuctions();

  // Product filter state
  const [productFilter, setProductFilter] = useState('all');
  
  // Filtered products based on status
  const filteredProducts = products && (
    productFilter === 'all'
      ? products
      : products.filter(product => product.status === productFilter)
  );

  // Auction filter state
  const [auctionFilter, setAuctionFilter] = useState('all');
  
  // Filtered auctions based on state
  const filteredAuctions = auctions && (
    auctionFilter === 'all'
      ? auctions
      : auctions.filter(auction => auction.auction_state === auctionFilter)
  );

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    activeAuctions: auctions.filter(auction => auction.auction_state === AUCTION_STATES.ACTIVE).length,
    completedAuctions: auctions.filter(auction => auction.auction_state === AUCTION_STATES.COMPLETED).length,
    pendingApproval: products.filter(product => product.status === 'pending').length,
  };

  // Get the total sales amount
  const totalSales = auctions
    .filter(auction => auction.auction_state === AUCTION_STATES.COMPLETED)
    .reduce((sum, auction) => sum + (auction.final_price || 0), 0);

  // Filter auctions by state
  const getAuctionsByState = (state: string) => {
    return auctions.filter(auction => auction.auction_state === state);
  };

  // Get badge color based on auction state
  const getStateColor = (state: string) => {
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

  // Get status badge color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Handle delete product
  const handleDeleteProduct = (productId: string) => {
    if (window.confirm(t('confirmDeleteProduct'))) {
      // In a real app, you would delete the product here
      console.log('Deleting product', productId);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case SELLER_TABS.OVERVIEW:
        return renderOverview();
      case SELLER_TABS.PRODUCTS:
        return renderProducts();
      case SELLER_TABS.AUCTIONS:
        return renderAuctions();
      case SELLER_TABS.SALES:
        return renderSales();
      case SELLER_TABS.ACCOUNT:
        return renderAccount();
      default:
        return renderOverview();
    }
  };

  // Overview tab
  const renderOverview = () => (
    <div>
      <div className="mb-8">
        <H2 className="mb-6">{t('sellerDashboardOverview')}</H2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title={t('totalProducts')} 
            value={stats.totalProducts} 
            icon="📦" 
            className="bg-primary-50"
          />
          <StatCard 
            title={t('activeAuctions')} 
            value={stats.activeAuctions} 
            icon="🔥" 
            className="bg-success-50"
          />
          <StatCard 
            title={t('totalSales')} 
            value={`$${totalSales.toFixed(2)}`} 
            icon="💰" 
            className="bg-accent-50"
          />
          <StatCard 
            title={t('pendingApproval')} 
            value={stats.pendingApproval} 
            icon="⏳" 
            className="bg-warning-50"
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
              onClick={() => navigate('/seller/add-product')}
              className="justify-start text-left"
            >
              <span className="mr-2">➕</span> {t('addNewProduct')}
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setActiveTab(SELLER_TABS.PRODUCTS)}
              className="justify-start text-left"
            >
              <span className="mr-2">📋</span> {t('manageProducts')}
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/seller/conversations')}
              className="justify-start text-left"
            >
              <span className="mr-2">💬</span> {t('viewConversations')}
            </Button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <H3 className="mb-4">{t('activeAuctions')}</H3>
          {getAuctionsByState(AUCTION_STATES.ACTIVE).length > 0 ? (
            <div className="space-y-4">
              {getAuctionsByState(AUCTION_STATES.ACTIVE).slice(0, 3).map(auction => (
                <div key={auction.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0">
                  {auction.product && auction.product.image_urls && auction.product.image_urls[0] && (
                    <img 
                      src={auction.product.image_urls[0]} 
                      alt={auction.product.name_en}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                  )}
                  <div className="flex-1">
                    <Text className="font-medium">
                      {auction.product ? auction.product.name_en : t('emptySlot')}
                    </Text>
                    <div className="flex justify-between">
                      <Text className="text-sm text-gray-500">
                        {t('currentBid')}: ${auction.current_price || auction.product?.starting_price || 0}
                      </Text>
                      <Text className="text-sm">
                        {t('bids')}: {auction.bid_count || 0}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <Text className="text-xs text-gray-500">
                        {auction.end_time ? `${t('endsIn')}: ${new Date(auction.end_time).toLocaleString()}` : ''}
                      </Text>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => navigate(`/auction/${auction.id}`)}
                      >
                        {t('view')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {getAuctionsByState(AUCTION_STATES.ACTIVE).length > 3 && (
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab(SELLER_TABS.AUCTIONS)}
                  className="w-full"
                >
                  {t('viewAllActiveAuctions')}
                </Button>
              )}
            </div>
          ) : (
            <Text className="text-gray-500">{t('noActiveAuctions')}</Text>
          )}
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <H3>{t('recentSales')}</H3>
          <Button 
            variant="link" 
            onClick={() => setActiveTab(SELLER_TABS.SALES)}
          >
            {t('viewAll')}
          </Button>
        </div>
        {getAuctionsByState(AUCTION_STATES.COMPLETED).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('product')}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('finalPrice')}
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('soldOn')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getAuctionsByState(AUCTION_STATES.COMPLETED).slice(0, 5).map(auction => (
                  <tr key={auction.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {auction.product && auction.product.image_urls && auction.product.image_urls[0] && (
                          <img 
                            src={auction.product.image_urls[0]} 
                            alt={auction.product.name_en} 
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {auction.product ? auction.product.name_en : t('unknownProduct')}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-right font-medium text-success-600">
                      ${auction.final_price || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {auction.end_time ? new Date(auction.end_time).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Text className="text-gray-500">{t('noCompletedSales')}</Text>
        )}
      </div>
    </div>
  );

  // Products tab
  const renderProducts = () => (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <H2 className="mb-4 md:mb-0">{t('myProducts')}</H2>
        <Button
          variant="primary"
          onClick={() => navigate('/seller/add-product')}
        >
          {t('addNewProduct')}
        </Button>
      </div>

      {/* Product filters */}
      <div className="mb-6 bg-white p-3 rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={productFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setProductFilter('all')}
          >
            {t('allProducts')}
          </Button>
          <Button
            variant={productFilter === 'approved' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setProductFilter('approved')}
          >
            {t('approved')}
          </Button>
          <Button
            variant={productFilter === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setProductFilter('pending')}
          >
            {t('pendingReview')}
          </Button>
          <Button
            variant={productFilter === 'rejected' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setProductFilter('rejected')}
          >
            {t('rejected')}
          </Button>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredProducts?.map((product: Product) => (
          <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-40 overflow-hidden relative">
              {product.image_urls && product.image_urls[0] ? (
                <img 
                  src={product.image_urls[0]} 
                  alt={product.name_en}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">📷</span>
                </div>
              )}
              <Badge 
                color={getStatusColor(product.status)}
                className="absolute top-2 right-2"
              >
                {t(product.status || 'pending')}
              </Badge>
            </div>
            <div className="p-4">
              <Text className="font-medium mb-1 line-clamp-1">{product.name_en}</Text>
              <Text className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description_en}</Text>
              <div className="flex justify-between items-center">
                <Text className="font-bold">${product.starting_price}</Text>
                <div className="space-x-1">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate(`/seller/edit-product/${product.id}`)}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts?.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <Text className="text-gray-500">{t('noProductsFound')}</Text>
          </div>
        )}
      </div>
    </div>
  );

  // Auctions tab
  const renderAuctions = () => (
    <div>
      <H2 className="mb-6">{t('myAuctions')}</H2>

      {/* Auction state filter tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="inline-flex rounded-md border border-gray-200 p-1 bg-white">
          <button
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              auctionFilter === 'all'
                ? 'bg-primary-100 text-primary-800'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setAuctionFilter('all')}
          >
            {t('all')}
          </button>
          {Object.values(AUCTION_STATES).map((state: string) => (
            <button
              key={state}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                auctionFilter === state
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setAuctionFilter(state)}
            >
              {t(`auctionState.${state}`)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Auctions list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('currentPrice')}
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('bids')}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('endTime')}
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAuctions?.map((auction: AuctionSlot) => (
                <tr key={auction.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {auction.product && auction.product.image_urls && auction.product.image_urls[0] && (
                        <img 
                          src={auction.product.image_urls[0]} 
                          alt={auction.product.name_en} 
                          className="w-8 h-8 rounded-full mr-2 object-cover"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {auction.product ? auction.product.name_en : t('unknownProduct')}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge color={getStateColor(auction.auction_state || '')}>
                      {t(`auctionState.${auction.auction_state}`)}
                    </Badge>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-right">
                    <div className="font-medium">
                      ${auction.current_price || auction.product?.starting_price || 0}
                    </div>
                    {auction.auction_state === AUCTION_STATES.COMPLETED && auction.final_price && (
                      <div className="text-xs text-success-600">
                        {t('final')}: ${auction.final_price}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    {auction.bid_count || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auction.end_time ? new Date(auction.end_time).toLocaleString() : '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate(`/auction/${auction.id}`)}
                    >
                      {t('view')}
                    </Button>
                    {auction.auction_state === AUCTION_STATES.COMPLETED && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => navigate(`/seller/conversations/${auction.id}`)}
                      >
                        {t('contact')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAuctions?.length === 0 && (
          <div className="py-8 text-center">
            <Text className="text-gray-500">{t('noAuctionsFound')}</Text>
          </div>
        )}
      </div>
    </div>
  );

  // Sales tab (placeholder)
  const renderSales = () => (
    <div>
      <H2 className="mb-6">{t('salesHistory')}</H2>
      <div className="bg-white shadow rounded-lg p-6">
        <p>{t('salesHistoryComingSoon')}</p>
      </div>
    </div>
  );

  // Account tab (placeholder)
  const renderAccount = () => (
    <div>
      <H2 className="mb-6">{t('accountSettings')}</H2>
      <div className="bg-white shadow rounded-lg p-6">
        <p>{t('accountSettingsComingSoon')}</p>
      </div>
    </div>
  );

  // Loading state
  const loading = productsLoading || auctionsLoading;
  
  // Error state
  const error = productsError || auctionsError;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-6 md:py-10 bg-gray-50">
        <Container>
          <div className="flex flex-col md:flex-row items-start mb-8">
            <div className="w-full md:w-auto mb-4 md:mb-0">
              <H1 className="text-2xl md:text-3xl">{t('sellerDashboard')}</H1>
              <Text className="text-gray-600">{t('sellerDashboardDescription')}</Text>
            </div>
            
            <div className="md:ml-auto flex flex-wrap gap-2">
              <Button 
                variant="primary"
                onClick={() => navigate('/seller/add-product')}
              >
                {t('addNewProduct')}
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
              {Object.entries(SELLER_TABS).map(([key, value]) => (
                <option key={key} value={value}>
                  {t(`sellerTabs.${value}`)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Desktop Tabs */}
          <div className="hidden md:flex mb-6 border-b border-gray-200">
            {Object.entries(SELLER_TABS).map(([key, value]) => (
              <button
                key={key}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${
                  activeTab === value
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(value)}
              >
                {t(`sellerTabs.${value}`)}
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
        </Container>
      </main>
      
      <Footer />
    </div>
  );
};

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, className = '' }) => (
  <div className={`p-4 rounded-lg shadow-sm ${className}`}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default SellerDashboard; 