import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge, { BadgeColor } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import LoadingState from '../ui/LoadingState';
import { supabaseClient } from '../../lib/supabase';
import { AuctionSlot as SupabaseAuctionSlot, Product as SupabaseProduct } from '../../types/supabase';

// Define proper types to match the component's expected shape
interface AuctionSlot {
  id: string | number;
  status: string;
  productId: string | null;
  productName?: string;
  productNameFr?: string;
  startTime: string;
  endTime: string;
  price?: number;
  currency?: string;
  sellerId?: string;
  sellerName?: string;
  whatsappNumber?: string;
  featured?: boolean;
}

interface Product {
  id: string;
  name_en: string;
  name_fr: string;
  starting_price: number;
  currency: string;
  seller_id: string;
  seller_whatsapp: string;
}

const SlotManager: React.FC = () => {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [slotToRemove, setSlotToRemove] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AuctionSlot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    startTime: new Date().toISOString().substring(0, 16),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
    featured: false
  });
  const currentLanguage = i18n.language;

  // Fetch available products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          id, 
          name_en, 
          name_fr, 
          starting_price, 
          currency, 
          seller_id,
          seller_whatsapp
        `)
        .is('is_sold', false)
        .is('auction_slot_id', null);

      if (error) throw error;

      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error(t('admin.productsLoadError'));
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch auction slots and available products
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get auction slots with product data
      const { data: slotsData, error: slotsError } = await supabaseClient
        .from('auction_slots')
        .select(`
          id,
          product_id,
          is_active,
          start_time,
          end_time,
          featured,
          pricing_model,
          fee_amount,
          commission_percentage,
          view_count,
          product:products(
            id, 
            name_en, 
            name_fr, 
            starting_price, 
            currency, 
            seller_id,
            seller_whatsapp
          )
        `);
        
      if (slotsError) throw slotsError;
      
      // Transform the data to match our component's expected structure
      const transformedSlots = slotsData.map(slot => {
        // Determine auction status based on start/end time
        let status = 'pending';
        const now = new Date();
        const startTime = slot.start_time ? new Date(slot.start_time) : null;
        const endTime = slot.end_time ? new Date(slot.end_time) : null;
        
        if (slot.is_active) {
          if (startTime && endTime) {
            if (now < startTime) {
              status = 'scheduled';
            } else if (now >= startTime && now <= endTime) {
              status = 'active';
            } else if (now > endTime) {
              status = 'completed';
            }
          } else {
            status = slot.is_active ? 'active' : 'pending';
          }
        } else {
          status = 'pending';
        }
        
        return {
          id: slot.id,
          status,
          productId: slot.product_id,
          productName: slot.product ? slot.product.name_en : undefined,
          productNameFr: slot.product ? slot.product.name_fr : undefined,
          startTime: slot.start_time || '',
          endTime: slot.end_time || '',
          price: slot.product ? slot.product.starting_price : undefined,
          currency: slot.product ? slot.product.currency : undefined,
          sellerId: slot.product ? slot.product.seller_id : undefined,
          sellerName: '', // We would need to join with the users table for this
          whatsappNumber: slot.product ? slot.product.seller_whatsapp : undefined,
          featured: slot.featured
        };
      });
      
      setSlots(transformedSlots);
      
      // Fetch available products
      await fetchProducts();
    } catch (err) {
      console.error('Error fetching auction slots:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auction slots');
      
      // For testing purposes in non-production environments
      if (!import.meta.env.PROD) {
        // Load mock data
        const { slots: mockSlots } = useAdminMockAuctionSlots();
        setSlots(mockSlots || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

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

  const handleAssignProductClick = useCallback((slotId: string | number) => {
    setSelectedSlotId(String(slotId));
    setIsModalOpen(true);
  }, []);

  const handleScheduleSlotClick = useCallback((slotId: string | number) => {
    setSelectedSlotId(String(slotId));
    setIsScheduleModalOpen(true);
  }, []);

  const handleRemoveProductClick = useCallback((slotId: string | number) => {
    setSlotToRemove(slotId);
    setIsDeleteConfirmModalOpen(true);
  }, []);

  const confirmRemoveProduct = useCallback(async () => {
    if (!slotToRemove) return;
    
    setSubmitLoading(true);
    try {
      const { error } = await supabaseClient
        .from('auction_slots')
        .update({ 
          product_id: null,
          is_active: false,
          start_time: null,
          end_time: null,
          featured: false
        })
        .eq('id', slotToRemove);
        
      if (error) throw error;
      
      // Update local state
      setSlots(slots.map(slot => 
        String(slot.id) === String(slotToRemove) 
          ? { 
              ...slot, 
              productId: null,
              productName: undefined,
              productNameFr: undefined,
              status: 'pending',
              startTime: '',
              endTime: '',
              featured: false
            } 
          : slot
      ));
      
      setSuccessMessage(t('admin.productRemovedSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error(t('admin.productRemoveError'));
    } finally {
      setSubmitLoading(false);
      setIsDeleteConfirmModalOpen(false);
      setSlotToRemove(null);
    }
  }, [slotToRemove, slots, t, toast]);

  const handleAssignProduct = useCallback(async (productId: string) => {
    if (selectedSlotId) {
      setSubmitLoading(true);
      try {
        const { error } = await supabaseClient
          .from('auction_slots')
          .update({ 
            product_id: productId,
            is_active: false // Not active until scheduled
          })
          .eq('id', selectedSlotId);
          
        if (error) throw error;
        
        // Find the product from our products list
        const selectedProduct = products.find(p => p.id === productId);
        
        // Update local state
        if (selectedProduct) {
          setSlots(slots.map(slot => 
            String(slot.id) === selectedSlotId 
              ? { 
                  ...slot, 
                  productId: productId,
                  productName: selectedProduct.name_en,
                  productNameFr: selectedProduct.name_fr,
                  price: selectedProduct.starting_price,
                  currency: selectedProduct.currency,
                  sellerId: selectedProduct.seller_id,
                  whatsappNumber: selectedProduct.seller_whatsapp,
                  status: 'pending' // Not active until scheduled
                } 
              : slot
          ));
        }
        
        setIsModalOpen(false);
        setSuccessMessage(t('admin.productAssignedSuccess'));
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Prompt to schedule the auction
        handleScheduleSlotClick(selectedSlotId);
      } catch (error) {
        console.error('Error assigning product:', error);
        toast.error(t('admin.productAssignError'));
      } finally {
        setSubmitLoading(false);
      }
    }
  }, [selectedSlotId, products, slots, t, toast, handleScheduleSlotClick]);

  const handleScheduleSlot = useCallback(async () => {
    if (!selectedSlotId) return;
    
    setSubmitLoading(true);
    try {
      const { error } = await supabaseClient
        .from('auction_slots')
        .update({ 
          start_time: new Date(scheduleData.startTime).toISOString(),
          end_time: new Date(scheduleData.endTime).toISOString(),
          is_active: true,
          featured: scheduleData.featured
        })
        .eq('id', selectedSlotId);
        
      if (error) throw error;
      
      // Update local state
      setSlots(slots.map(slot => {
        if (String(slot.id) === selectedSlotId) {
          // Determine auction status based on start/end time
          let status = 'pending';
          const now = new Date();
          const startTime = new Date(scheduleData.startTime);
          const endTime = new Date(scheduleData.endTime);
          
          if (now < startTime) {
            status = 'scheduled';
          } else if (now >= startTime && now <= endTime) {
            status = 'active';
          }
          
          return { 
            ...slot, 
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            status,
            featured: scheduleData.featured
          };
        }
        return slot;
      }));
      
      setIsScheduleModalOpen(false);
      setSuccessMessage(t('admin.auctionScheduledSuccess'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error scheduling auction:', error);
      toast.error(t('admin.auctionScheduleError'));
    } finally {
      setSubmitLoading(false);
    }
  }, [selectedSlotId, scheduleData, slots, t, toast]);

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

  // Update the getStatusColor function to return the correct color prop
  const getStatusColor = (status: string): BadgeColor => {
    switch (status) {
      case 'available':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'completed':
        return 'info';
      case 'active':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState message={t('admin.loadingSlots')} />;
  if (error) return (
    <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
      <p className="font-bold">{t('admin.errorFetchingSlots')}:</p>
      <p>{error}</p>
      <Button 
        variant="outline" 
        className="mt-2" 
        onClick={handleRefresh}
      >
        {t('common.tryAgain')}
      </Button>
    </div>
  );

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
            <option value="pending">{t('admin.pendingState')}</option>
            <option value="completed">{t('admin.completedState')}</option>
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
            {t('common.refresh')}
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
                        {t('admin.slotId')}: {typeof slot.id === 'string' && slot.id.startsWith('empty') 
                          ? slot.id 
                          : `#${slot.id}`}
                        {slot.featured && (
                          <Badge variant="warning" className="ml-2">
                            {t('admin.featured')}
                          </Badge>
                        )}
                      </>
                    ) : (
                      t('admin.emptySlot')
                    )}
                  </p>
                  {slot.status !== 'empty' && (
                    <>
                      {slot.startTime && slot.endTime && (
                        <p className="text-sm text-gray-500">
                          {t('admin.period')}: {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleString()}
                        </p>
                      )}
                      {slot.whatsappNumber && (
                        <p className="text-sm text-gray-500">
                          {t('admin.whatsapp')}: {slot.whatsappNumber}
                        </p>
                      )}
                      <div className="mt-2">
                        <Badge 
                          className="ml-2"
                          color={getStatusColor(slot.status)}
                        >
                          {t(`admin.${slot.status}`)}
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
                
                <div className="flex space-x-2 items-center">
                  {slot.productId ? (
                    <>
                      <div className="text-right mr-3">
                        <p className="text-sm font-medium text-gray-900">
                          {currentLanguage === 'fr' && slot.productNameFr 
                            ? slot.productNameFr 
                            : slot.productName || t('admin.product')}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {slot.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleScheduleSlotClick(slot.id)}
                          >
                            {t('admin.schedule')}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveProductClick(slot.id)}
                          isLoading={submitLoading}
                          disabled={submitLoading}
                        >
                          {t('admin.removeProduct')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    slot.status !== 'empty' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAssignProductClick(slot.id)}
                        isLoading={submitLoading}
                        disabled={submitLoading}
                      >
                        {t('admin.assignProduct')}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal for assigning products */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('admin.assignProduct')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.searchProduct')}
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t('admin.searchProductPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto rounded-md border border-gray-300">
            {productsLoading ? (
              <div className="p-4 text-center">{t('admin.loadingProducts')}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">{t('admin.noProductsFound')}</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <li 
                    key={product.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAssignProduct(product.id)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {currentLanguage === 'fr' ? product.name_fr : product.name_en}
                        </p>
                        <p className="text-sm text-gray-500">ID: {product.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 font-medium">
                          {product.starting_price.toLocaleString()} {product.currency}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitLoading}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Modal for scheduling auctions */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={t('admin.scheduleAuction')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.startTime')}
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={scheduleData.startTime}
              onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.endTime')}
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={scheduleData.endTime}
              onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={scheduleData.featured}
              onChange={(e) => setScheduleData({ ...scheduleData, featured: e.target.checked })}
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
              {t('admin.featured')}
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={submitLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleScheduleSlot}
              disabled={submitLoading}
              isLoading={submitLoading}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Confirmation Modal for Product Removal */}
      <Modal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        title={t('admin.confirmAction')}
      >
        <div className="p-4">
          <p className="mb-4">{t('admin.removeProductConfirmation')}</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmModalOpen(false)}
              disabled={submitLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmRemoveProduct}
              disabled={submitLoading}
              isLoading={submitLoading}
            >
              {t('admin.removeProduct')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// These are fallback imports for development environments
const { useAdminMockAuctionSlots, useAdminMockProducts } = (() => {
  try {
    return require('../../hooks/useMockData');
  } catch (e) {
    return {
      useAdminMockAuctionSlots: () => ({ slots: [] }),
      useAdminMockProducts: () => ({ products: [] })
    };
  }
})();

export default SlotManager; 