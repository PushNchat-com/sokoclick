import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabaseClient } from '../../api/supabase';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { AuctionSlot } from '../../types/auctions';

interface SellerStats {
  productCount: number;
  activeAuctions: number;
  completedAuctions: number;
  totalSales: number;
  pendingTransactions: number;
}

const SellerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SellerStats>({
    productCount: 0,
    activeAuctions: 0,
    completedAuctions: 0,
    totalSales: 0,
    pendingTransactions: 0
  });
  
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentAuctions, setRecentAuctions] = useState<AuctionSlot[]>([]);
  
  // Fetch seller statistics and data
  const fetchSellerData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch product count
      const { count: productCount, error: productError } = await supabaseClient
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id);
        
      if (productError) throw productError;
      
      // Fetch auction statistics
      const { data: auctionData, error: auctionError } = await supabaseClient
        .from('auction_slots')
        .select('id, auction_state')
        .eq('seller_id', user.id);
        
      if (auctionError) throw auctionError;
      
      // Calculate auction stats
      const activeAuctions = auctionData?.filter(a => a.auction_state === 'active').length || 0;
      const completedAuctions = auctionData?.filter(a => a.auction_state === 'completed').length || 0;
      
      // Fetch transaction data
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from('transactions')
        .select('amount, status')
        .eq('seller_id', user.id);
        
      if (transactionError) throw transactionError;
      
      // Calculate transaction stats
      const totalSales = transactionData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      const pendingTransactions = transactionData?.filter(tx => 
        tx.status && ['payment_pending', 'shipping_pending'].includes(tx.status)
      ).length || 0;
      
      // Fetch recent products
      const { data: recentProductsData, error: recentProductsError } = await supabaseClient
        .from('products')
        .select('id, name_en, name_fr, category, created_at, image_urls')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recentProductsError) throw recentProductsError;
      
      // Fetch recent auctions
      const { data: recentAuctionsData, error: recentAuctionsError } = await supabaseClient
        .from('auction_slots')
        .select(`
          id, 
          auction_state, 
          created_at, 
          start_time, 
          end_time, 
          final_price,
          product:products(id, name_en, name_fr, image_urls)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recentAuctionsError) throw recentAuctionsError;
      
      // Update state with fetched data
      setStats({
        productCount: productCount || 0,
        activeAuctions,
        completedAuctions,
        totalSales,
        pendingTransactions
      });
      
      setRecentProducts(recentProductsData || []);
      setRecentAuctions(recentAuctionsData || []);
      
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred fetching seller data');
      toast.error(t('seller.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSellerData();
    }
  }, [user?.id]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">{t('seller.errorLoadingDashboard')}</h3>
        <p className="mb-4">{error}</p>
        <Button onClick={fetchSellerData}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t('seller.products')}</h3>
          <p className="text-2xl font-bold">{stats.productCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t('seller.activeAuctions')}</h3>
          <p className="text-2xl font-bold">{stats.activeAuctions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t('seller.completedAuctions')}</h3>
          <p className="text-2xl font-bold">{stats.completedAuctions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t('seller.totalSales')}</h3>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">{t('seller.pendingTransactions')}</h3>
          <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
        </div>
      </div>
      
      {/* Recent Products */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('seller.recentProducts')}</h3>
        </div>
        
        {recentProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>{t('seller.noProducts')}</p>
            <Button className="mt-4" onClick={() => window.location.href = '/seller/products/new'}>
              {t('seller.addProduct')}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentProducts.map(product => (
              <li key={product.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center">
                  {product.image_urls && product.image_urls[0] && (
                    <img 
                      src={product.image_urls[0]} 
                      alt={product.name_en}
                      className="w-12 h-12 object-cover rounded-md mr-4"
                    />
                  )}
                  <div>
                    <div className="font-medium">{product.name_en}</div>
                    <div className="text-sm text-gray-500">{product.category}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <a 
                      href={`/seller/products/${product.id}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {t('common.view')}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Recent Auctions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('seller.recentAuctions')}</h3>
        </div>
        
        {recentAuctions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>{t('seller.noAuctions')}</p>
            <Button className="mt-4" onClick={() => window.location.href = '/seller/auctions/new'}>
              {t('seller.createAuction')}
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentAuctions.map(auction => (
              <li key={auction.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center">
                  {auction.product?.image_urls && auction.product.image_urls[0] && (
                    <img 
                      src={auction.product.image_urls[0]} 
                      alt={auction.product.name_en}
                      className="w-12 h-12 object-cover rounded-md mr-4"
                    />
                  )}
                  <div>
                    <div className="font-medium">{auction.product?.name_en}</div>
                    <div className="text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        auction.auction_state === 'active' ? 'bg-green-100 text-green-800' :
                        auction.auction_state === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        auction.auction_state === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`auction.state.${auction.auction_state}`)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {auction.start_time 
                        ? new Date(auction.start_time).toLocaleString() 
                        : t('auction.notScheduled')}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    {auction.final_price && (
                      <div className="font-medium">
                        {formatCurrency(auction.final_price)}
                      </div>
                    )}
                    <a 
                      href={`/seller/auctions/${auction.id}`}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      {t('common.view')}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard; 