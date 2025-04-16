import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { useAdminMockAuctionSlots, useAdminMockProducts } from '../../hooks/useMockData';
import { AuctionSlot as SupabaseAuctionSlot, Product as SupabaseProduct } from '../../types/supabase';

// Define proper types to match the component's expected shape
interface AuctionSlot {
  id: string;
  status: string;
  productId: string | null;
  productName?: string;
  productNameFr?: string; // Add French name support
  startTime: string;
  endTime: string;
  price?: number;
  currency?: string;
  sellerId?: string;
  sellerName?: string;
  whatsappNumber?: string; // Add WhatsApp number
}

const SlotManager: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const currentLanguage = i18n.language;

  // Get mock data from hooks and convert to component format
  const { slots: supabaseSlots, loading, error } = useAdminMockAuctionSlots();
  const { products: supabaseProducts, isLoading: productsLoading } = useAdminMockProducts();
  
  // Map supabase auction slots to the expected format
  const slots: AuctionSlot[] = supabaseSlots ? supabaseSlots.map(slot => ({
    id: String(slot.id),
    status: slot.auction_state || 'pending',
    productId: slot.product_id,
    productName: slot.product?.name_en,
    productNameFr: slot.product?.name_fr,
    startTime: slot.start_time || '',
    endTime: slot.end_time || '',
    price: slot.current_price || slot.product?.starting_price,
    currency: slot.product?.currency,
    sellerId: slot.product?.seller_id,
    sellerName: slot.product?.seller?.display_name,
    whatsappNumber: slot.product?.seller_whatsapp || slot.product?.seller?.whatsapp_number
  })) : [];
  
  // Map supabase products to the expected format
  const products = supabaseProducts || [];

  // Filter slots based on state
  const filteredSlots = slots ? slots.filter(slot => 
    stateFilter === 'all' || slot.status === stateFilter
  ) : [];

  // Fill with empty slots for UI if needed
  const emptySlots = Array.from({ length: Math.max(0, 25 - (filteredSlots?.length || 0)) }, (_, i) => ({
    id: `empty-${i}`,
    status: 'empty',
    productId: null,
    startTime: '',
    endTime: ''
  })) as AuctionSlot[];

  // Filter products based on search
  const filteredProducts = products ? 
    products.filter(product => {
      const searchTermLower = searchTerm.toLowerCase();
      return product.name_en.toLowerCase().includes(searchTermLower) ||
        (product.name_fr && product.name_fr.toLowerCase().includes(searchTermLower)) ||
        product.id.toLowerCase().includes(searchTermLower);
    }) : [];

  const allSlots = [...filteredSlots, ...(stateFilter === 'all' ? emptySlots : [])];

  const handleAssignProductClick = useCallback((slotId: string) => {
    setSelectedSlotId(slotId);
    setIsModalOpen(true);
  }, []);

  const handleRemoveProductClick = useCallback(async (slotId: string) => {
    if (window.confirm(t('admin.confirmRemoveProduct'))) {
      try {
        // In a real app, this would call an API
        console.log(`Removing product from slot ${slotId}`);
        setSuccessMessage(t('admin.productRemovedSuccess'));
        setTimeout(() => setSuccessMessage(null), 3000);
        // No refetch available in this implementation but would be added in a real app
      } catch (error) {
        console.error('Error removing product:', error);
      }
    }
  }, [t]);

  const handleAssignProduct = useCallback(async (productId: string) => {
    if (selectedSlotId) {
      try {
        // In a real app, this would call an API
        console.log(`Assigning product ${productId} to slot ${selectedSlotId}`);
        setIsModalOpen(false);
        setSuccessMessage(t('admin.productAssignedSuccess'));
        setTimeout(() => setSuccessMessage(null), 3000);
        // No refetch available in this implementation but would be added in a real app
      } catch (error) {
        console.error('Error assigning product:', error);
      }
    }
  }, [selectedSlotId, t]);

  // Get status variant for badge - aligned with database schema states
  const getStatusVariant = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'warning';
      case 'upcoming': return 'info';
      case 'pending': return 'info';
      case 'payment_pending': return 'warning';
      case 'payment_received': return 'success';
      case 'shipping_pending': return 'warning';
      case 'shipped': return 'info';
      case 'received': return 'info';
      case 'buyer_confirmed': return 'success';
      case 'seller_paid': return 'success';
      case 'seller_confirmed': return 'success';
      case 'completed': return 'primary';
      case 'agreement_reached': return 'success';
      case 'disputed': return 'danger';
      case 'cancelled': return 'danger';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const handleRefresh = useCallback(() => {
    // This would trigger a refetch in a real implementation
    console.log('Refreshing data...');
    window.location.reload(); // Simple fallback
  }, []);

  if (loading) return <div className="p-4 text-center">{t('loading')}</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error instanceof Error ? error.message : String(error)}</div>;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('admin.slotManagement')}</h2>
        <div className="flex space-x-2">
          <select
            className="form-select rounded-md border-gray-300 shadow-sm text-sm"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="all">{t('admin.allStates')}</option>
            <option value="active">{t('admin.activeState')}</option>
            <option value="scheduled">{t('admin.scheduledState')}</option>
            <option value="upcoming">{t('admin.upcomingState')}</option>
            <option value="pending">{t('admin.pendingState')}</option>
            <option value="payment_pending">{t('admin.paymentPendingState')}</option>
            <option value="completed">{t('admin.completedState')}</option>
            <option value="cancelled">{t('admin.cancelledState')}</option>
            <option value="disputed">{t('admin.disputedState')}</option>
            <option value="failed">{t('admin.failedState')}</option>
          </select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('refresh')}
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {allSlots.map((slot) => (
            <li key={slot.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {slot.status !== 'empty' ? (
                      <>
                        {t('admin.slotId')}: {typeof slot.id === 'string' ? slot.id.substring(0, 8) : slot.id}...
                      </>
                    ) : (
                      t('admin.emptySlot')
                    )}
                  </p>
                  {slot.status !== 'empty' && (
                    <>
                      <p className="text-sm text-gray-500">
                        {t('admin.period')}: {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                      </p>
                      {slot.sellerName && (
                        <p className="text-sm text-gray-500">
                          {t('admin.seller')}: {slot.sellerName} 
                          {slot.whatsappNumber && (
                            <span className="ml-1 text-xs text-primary-600">
                              ({slot.whatsappNumber})
                            </span>
                          )}
                        </p>
                      )}
                      <div className="mt-2">
                        <Badge variant={getStatusVariant(slot.status)}>
                          {t(`admin.${slot.status}State`)}
                        </Badge>
                        {slot.price && slot.currency && (
                          <span className="ml-2 text-sm text-gray-600">
                            {slot.price.toLocaleString()} {slot.currency}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {slot.productId ? (
                    <>
                      <div className="text-right mr-3">
                        <p className="text-sm font-medium text-gray-900">
                          {currentLanguage === 'fr' && slot.productNameFr 
                            ? slot.productNameFr 
                            : slot.productName || 'Product'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRemoveProductClick(slot.id)}
                      >
                        {t('admin.removeProduct')}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleAssignProductClick(slot.id)}
                      disabled={slot.status === 'empty'}
                    >
                      {t('admin.assignProduct')}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Product Assignment Modal */}
        <Modal
          isOpen={isModalOpen}
          title={t('admin.assignProduct')}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlotId(null);
            setSearchTerm('');
          }}
          size="lg"
        >
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder={t('admin.searchProductsPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="border border-gray-200 rounded-md p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleAssignProduct(product.id)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <img 
                        className="h-12 w-12 rounded-md object-cover" 
                        src={product.image_urls?.[0] || '/placeholder-product.jpg'} 
                        alt={currentLanguage === 'fr' && product.name_fr ? product.name_fr : product.name_en}
                      />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium">
                        {currentLanguage === 'fr' && product.name_fr ? product.name_fr : product.name_en}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {currentLanguage === 'fr' && product.description_fr 
                          ? product.description_fr?.substring(0, 60) || ''
                          : product.description_en?.substring(0, 60) || ''}...
                      </p>
                      <p className="text-sm text-gray-900 mt-1">{product.starting_price} {product.currency}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <p className="text-center py-4 text-gray-500">{t('admin.noProductsFound')}</p>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SlotManager; 