import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { useSellerProducts, useSellerAuctions } from '../../hooks/useSupabaseData';
import { useAuth } from '../../context/AuthContext';
import { supabaseClient } from '../../api/supabase';
import { Product, AuctionSlot } from '../../types/supabase';
import LoadingState from '../../components/ui/LoadingState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProductFormModal from '../../components/seller/ProductFormModal';
import AuctionSlotFormModal from '../../components/seller/AuctionSlotFormModal';

// Import dashboard components
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import TabNavigation from '../../components/dashboard/TabNavigation';
import StatCard from '../../components/dashboard/StatCard';
import DashboardTable from '../../components/dashboard/DashboardTable';
import DashboardEmptyState from '../../components/dashboard/DashboardEmptyState';

// Available tabs for the seller dashboard
const SELLER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'auctions', label: 'Auctions' },
  { id: 'sales', label: 'Sales' },
  { id: 'account', label: 'Account' }
];

type SellerTabType = 'overview' | 'products' | 'auctions' | 'sales' | 'account';

const SellerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SellerTabType>('overview');
  const { user } = useAuth();
  
  // Use real seller ID from auth context
  const sellerId = user?.id || '';
  
  // Fetch seller's products and auctions from Supabase
  const { products, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useSellerProducts(sellerId);
  const { auctions, loading: loadingAuctions, error: auctionsError, refetch: refetchAuctions } = useSellerAuctions(sellerId);
  
  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  
  // Auction slot modal state
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState<boolean>(false);
  const [selectedAuction, setSelectedAuction] = useState<AuctionSlot | undefined>(undefined);
  
  const loading = loadingProducts || loadingAuctions;
  const error = productsError || auctionsError;
  
  // Calculate statistics for the overview page
  const stats = useMemo(() => {
    if (!products || !auctions) return null;
    
    const activeAuctions = auctions.filter(slot => slot.auction_state === 'active').length;
    const scheduledAuctions = auctions.filter(slot => slot.auction_state === 'scheduled').length;
    const totalRevenue = auctions
      .filter(slot => slot.auction_state === 'completed')
      .reduce((sum, slot) => sum + (slot.current_price || 0), 0);
    
    return {
      totalProducts: products.length,
      activeAuctions,
      scheduledAuctions,
      totalRevenue
    };
  }, [products, auctions]);
  
  // Open modal to add a new product
  const openAddProductModal = () => {
    setSelectedProduct(undefined);
    setIsProductModalOpen(true);
  };
  
  // Open modal to edit an existing product
  const openEditProductModal = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };
  
  // Handle product form success
  const handleProductSuccess = (productId: string) => {
    refetchProducts();
  };
  
  // Open modal to add a new auction slot
  const openAddAuctionModal = () => {
    setSelectedAuction(undefined);
    setIsAuctionModalOpen(true);
  };
  
  // Open modal to edit an existing auction slot
  const openEditAuctionModal = (auction: AuctionSlot) => {
    setSelectedAuction(auction);
    setIsAuctionModalOpen(true);
  };
  
  // Handle auction form success
  const handleAuctionSuccess = (slotId: number) => {
    refetchAuctions();
  };
  
  // Render different content based on active tab
  const renderContent = () => {
    if (loading) {
      return <LoadingState message={t('loading.dashboardData')} />;
    }
    
    if (error) {
      return (
        <div className="text-center text-red-500 p-8">
          <p>{t('errors.loadingData')}</p>
          <Button variant="primary" className="mt-4">
            {t('common.retry')}
          </Button>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'products':
        return renderProducts();
      case 'auctions':
        return renderAuctions();
      case 'sales':
        return renderSales();
      case 'account':
        return renderAccount();
      default:
        return renderOverview();
    }
  };
  
  // Render the overview tab with statistics
  const renderOverview = () => {
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">{t('seller.dashboardOverview')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title={t('seller.stats.totalProducts')} 
            value={formatNumber(stats.totalProducts)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatCard 
            title={t('seller.stats.activeAuctions')} 
            value={stats.activeAuctions}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard 
            title={t('seller.stats.scheduledAuctions')} 
            value={stats.scheduledAuctions}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard 
            title={t('seller.stats.totalRevenue')} 
            value={formatCurrency(stats.totalRevenue)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">{t('seller.quickActions')}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="primary" className="py-3 px-4 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('seller.actions.addProduct')}
            </Button>
            
            <Button variant="outline" className="py-3 px-4 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('seller.actions.scheduleAuction')}
            </Button>
            
            <Button variant="outline" className="py-3 px-4 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('seller.actions.editProfile')}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the products tab
  const renderProducts = () => {
    if (!products) return null;
    
    const productColumns = [
      {
        key: 'name',
        header: t('product.title'),
        renderCell: (product: any) => (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded mr-4">
              {product.image_urls && product.image_urls.length > 0 ? (
                <img src={product.image_urls[0]} alt={product.name_en} className="h-10 w-10 object-cover rounded" />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{product.name_en}</div>
              <div className="text-sm text-gray-500">{formatCurrency(product.starting_price)}</div>
            </div>
          </div>
        )
      },
      {
        key: 'category',
        header: t('product.category'),
        renderCell: (product: any) => (
          <span>{t(`categories.${product.category}`)}</span>
        )
      },
      {
        key: 'condition',
        header: t('product.condition'),
        renderCell: (product: any) => (
          <span>{product.condition}</span>
        )
      },
      {
        key: 'status',
        header: t('common.status'),
        renderCell: (product: any) => (
          <Badge 
            color={product.approved ? 'success' : 'warning'}
          >
            {product.approved ? t('product.status.approved') : t('product.status.pending')}
          </Badge>
        )
      }
    ];
    
    const productActions = [
      {
        label: t('common.edit'),
        variant: 'primary' as const,
        onClick: (product: any) => openEditProductModal(product as Product)
      },
      {
        label: t('common.delete'),
        variant: 'danger' as const,
        onClick: (product: any) => {
          if (confirm(t('confirmations.deleteProduct'))) {
            supabaseClient
              .from('products')
              .delete()
              .eq('id', product.id)
              .then(({ error }) => {
                if (error) {
                  console.error('Error deleting product:', error);
                  alert(error.message);
                } else {
                  refetchProducts();
                }
              });
          }
        }
      }
    ];
    
    return (
      <div>
        <DashboardHeader
          title={t('seller.myProducts')}
          actions={
            <Button 
              variant="primary" 
              onClick={openAddProductModal}
            >
              {t('seller.actions.addProduct')}
            </Button>
          }
        />
        
        {products.length === 0 ? (
          <DashboardEmptyState
            title={t('product.noProducts')}
            description={t('product.addProductToStart')}
            action={{
              label: t('seller.actions.addProduct'),
              onClick: openAddProductModal
            }}
          />
        ) : (
          <DashboardTable
            data={products}
            columns={productColumns}
            keyField="id"
            actions={productActions}
            onRowClick={(product) => openEditProductModal(product as Product)}
          />
        )}
      </div>
    );
  };
  
  // Render the auctions tab
  const renderAuctions = () => {
    if (!auctions) return null;
    
    const auctionColumns = [
      {
        key: 'product',
        header: t('product.title'),
        renderCell: (auction: any) => (
          <div className="flex items-center">
            {auction.product ? (
              <>
                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded mr-4">
                  {auction.product.image_urls && auction.product.image_urls.length > 0 ? (
                    <img 
                      src={auction.product.image_urls[0]} 
                      alt={auction.product.name_en} 
                      className="h-10 w-10 object-cover rounded" 
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{auction.product.name_en}</div>
                  <div className="text-sm text-gray-500">
                    {auction.current_price 
                      ? formatCurrency(auction.current_price) 
                      : formatCurrency(auction.product.starting_price)
                    }
                  </div>
                </div>
              </>
            ) : (
              <span className="text-gray-500">{t('emptySlot')}</span>
            )}
          </div>
        )
      },
      {
        key: 'state',
        header: t('auction.status'),
        renderCell: (auction: any) => (
          <Badge 
            color={
              auction.auction_state === 'active' ? 'success' :
              auction.auction_state === 'scheduled' ? 'info' :
              auction.auction_state === 'completed' ? 'primary' :
              'warning'
            }
          >
            {t(`auctionState.${auction.auction_state}`)}
          </Badge>
        )
      },
      {
        key: 'startTime',
        header: t('auction.startDate'),
        renderCell: (auction: any) => (
          <span>{auction.start_time ? new Date(auction.start_time).toLocaleString() : '-'}</span>
        )
      },
      {
        key: 'endTime',
        header: t('auction.endDate'),
        renderCell: (auction: any) => (
          <span>{auction.end_time ? new Date(auction.end_time).toLocaleString() : '-'}</span>
        )
      },
      {
        key: 'views',
        header: t('views'),
        renderCell: (auction: any) => (
          <span>{auction.view_count}</span>
        )
      }
    ];
    
    const auctionActions = [
      {
        label: t('common.edit'),
        variant: 'primary' as const,
        onClick: (auction: any) => openEditAuctionModal(auction as AuctionSlot)
      },
      {
        label: t('common.delete'),
        variant: 'danger' as const,
        onClick: (auction: any) => {
          if (confirm(t('confirmations.deleteAuction'))) {
            supabaseClient
              .from('auction_slots')
              .delete()
              .eq('id', auction.id)
              .then(({ error }) => {
                if (error) {
                  console.error('Error deleting auction slot:', error);
                  alert(error.message);
                } else {
                  refetchAuctions();
                }
              });
          }
        }
      }
    ];
    
    return (
      <div>
        <DashboardHeader
          title={t('seller.myAuctions')}
          actions={
            <Button 
              variant="primary" 
              onClick={openAddAuctionModal}
            >
              {t('seller.actions.scheduleAuction')}
            </Button>
          }
        />
        
        {auctions.length === 0 ? (
          <DashboardEmptyState
            title={t('auction.noAuctions')}
            description={t('auction.scheduleAuctionToStart')}
            action={{
              label: t('seller.actions.scheduleAuction'),
              onClick: openAddAuctionModal
            }}
          />
        ) : (
          <DashboardTable
            data={auctions}
            columns={auctionColumns}
            keyField="id"
            actions={auctionActions}
            onRowClick={(auction) => openEditAuctionModal(auction as AuctionSlot)}
          />
        )}
      </div>
    );
  };
  
  // Render the sales tab
  const renderSales = () => {
    // Filter completed auctions that have a buyer (i.e., were sold)
    const sales = auctions?.filter(auction => 
      auction.auction_state === 'completed' && auction.buyer_id
    ) || [];
    
    const saleColumns = [
      {
        key: 'product',
        header: t('product.title'),
        renderCell: (sale: any) => (
          <div className="flex items-center">
            {sale.product ? (
              <>
                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded mr-4">
                  {sale.product.image_urls && sale.product.image_urls.length > 0 ? (
                    <img 
                      src={sale.product.image_urls[0]} 
                      alt={sale.product.name_en} 
                      className="h-10 w-10 object-cover rounded" 
                    />
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center text-gray-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium">{sale.product.name_en}</div>
                </div>
              </>
            ) : (
              <span className="text-gray-500">{t('product.unknown')}</span>
            )}
          </div>
        )
      },
      {
        key: 'price',
        header: t('sale.price'),
        renderCell: (sale: any) => (
          <span className="font-semibold">{formatCurrency(sale.current_price || 0)}</span>
        )
      },
      {
        key: 'date',
        header: t('sale.date'),
        renderCell: (sale: any) => (
          <span>{sale.end_time ? new Date(sale.end_time).toLocaleDateString() : '-'}</span>
        )
      },
      {
        key: 'buyer',
        header: t('sale.buyer'),
        renderCell: (sale: any) => (
          <span>
            {sale.buyer?.full_name || t('sale.anonymousBuyer')}
          </span>
        )
      }
    ];
    
    return (
      <div>
        <DashboardHeader
          title={t('seller.salesHistory')}
        />
        
        {sales.length === 0 ? (
          <DashboardEmptyState
            title={t('seller.noCompletedSales')}
            description={t('seller.salesWillAppearHere')}
          />
        ) : (
          <DashboardTable
            data={sales}
            columns={saleColumns}
            keyField="id"
            onRowClick={(sale) => console.log('View sale details', sale.id)}
          />
        )}
      </div>
    );
  };
  
  // Render the account tab
  const renderAccount = () => {
    const [name, setName] = useState<string>(user?.user_metadata?.full_name || '');
    const [whatsappNumber, setWhatsappNumber] = useState<string>(user?.user_metadata?.whatsapp_number || '');
    const [saving, setSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    
    const handleSaveProfile = async () => {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      
      try {
        const { error } = await supabaseClient.auth.updateUser({
          data: {
            full_name: name,
            whatsapp_number: whatsappNumber
          }
        });
        
        if (error) throw error;
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    };
    
    const handlePasswordReset = async () => {
      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(user?.email || '', {
          redirectTo: window.location.origin + '/reset-password',
        });
        
        if (error) throw error;
        
        alert(t('auth.passwordResetSent'));
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      }
    };
    
    return (
      <div className="space-y-8">
        <DashboardHeader
          title={t('seller.accountSettings')}
        />
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">{t('seller.profileInformation')}</h3>
          
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
              {t('common.changesSaved')}
            </div>
          )}
          
          {saveError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
              {saveError}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.name')}</label>
              <input
                type="text"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
              <input
                type="email"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">{t('seller.emailCannotBeChanged')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('seller.whatsAppNumber')}</label>
              <input
                type="tel"
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+237 XXXXXXXXX"
              />
            </div>
            <Button 
              variant="primary" 
              className="mt-2"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">{t('seller.accountSecurity')}</h3>
          <div className="space-y-4">
            <Button 
              variant="outline"
              onClick={handlePasswordReset}
            >
              {t('seller.actions.changePassword')}
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  // Define sidebar navigation items
  const sidebarNavItems = [
    {
      label: t('seller.dashboard'),
      href: '/seller/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: t('product.title') + 's',
      href: '/seller/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      badge: products?.length
    },
    {
      label: t('auction.title') + 's',
      href: '/seller/auctions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: stats?.activeAuctions
    },
    {
      label: t('menu.profile'),
      href: '/seller/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];
  
  // Map tabs for TabNavigation component
  const tabs = SELLER_TABS.map(tab => ({
    id: tab.id,
    label: t(`seller.tabs.${tab.id}`),
  }));
  
  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title={t('seller.dashboard')}
          description={t('seller.dashboardDescription')}
        />
      }
      sidebar={
        <DashboardSidebar 
          navItems={sidebarNavItems}
          logoText={t('app.title')}
        />
      }
    >
      <div className="space-y-6">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as SellerTabType)}
        />
        
        {renderContent()}
      </div>
      
      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        product={selectedProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={handleProductSuccess}
      />
      
      {/* Auction Slot Form Modal */}
      <AuctionSlotFormModal
        isOpen={isAuctionModalOpen}
        slot={selectedAuction}
        onClose={() => setIsAuctionModalOpen(false)}
        onSuccess={handleAuctionSuccess}
      />
    </DashboardLayout>
  );
};

export default SellerDashboard; 