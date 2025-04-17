import React, { useState } from 'react';
import { Container, Card, Button } from '../components/ui';
import Badge, { BadgeColor } from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import FormField from '../components/ui/FormField';
import { useTranslation } from 'react-i18next';
import { 
  useAuctionSlots,
  useFeaturedSlots,
  useAdminSlotActions
} from '../hooks/useSupabaseData';
import { AUCTION_STATES } from '../services/mockData';
import { AuctionSlot, Product } from '../types/supabase';

const SupabaseTest: React.FC = () => {
  const { t } = useTranslation();
  const [productId, setProductId] = useState<string>('');
  const [slotId, setSlotId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Get all auction slots
  const { 
    slots: auctionSlots,
    loading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots
  } = useAuctionSlots();
  
  // Get featured auction slots
  const {
    featuredSlots,
    loading: featuredLoading,
    error: featuredError
  } = useFeaturedSlots();
  
  // Get admin actions
  const {
    assignProductToSlot,
    removeProductFromSlot,
    updateSlotDetails,
    loading: actionLoading,
    error: actionError
  } = useAdminSlotActions();
  
  const handleAssignProduct = async () => {
    if (slotId && productId) {
      try {
        await assignProductToSlot(parseInt(slotId, 10), productId);
        setProductId('');
        setSlotId(null);
        // Use refetch method instead of reloading
        refetchSlots();
      } catch (error) {
        console.error('Error assigning product:', error);
      }
    }
  };
  
  const handleRemoveProduct = async (slotId: string) => {
    try {
      await removeProductFromSlot(parseInt(slotId, 10));
      // Use refetch method instead of reloading
      refetchSlots();
    } catch (error) {
      console.error('Error removing product:', error);
    }
  };
  
  const handleUpdateSlot = async (slotId: string, data: Partial<AuctionSlot>) => {
    try {
      await updateSlotDetails(parseInt(slotId, 10), data);
      // Use refetch method instead of reloading
      refetchSlots();
    } catch (error) {
      console.error('Error updating slot:', error);
    }
  };
  
  const filteredSlots = auctionSlots?.filter(slot => 
    slot.id.toString().includes(searchTerm) || 
    (slot.product as Product)?.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusBadgeColor = (status: string | undefined): BadgeColor => {
    switch (status) {
      case AUCTION_STATES.ACTIVE:
        return 'success';
      case AUCTION_STATES.COMPLETED:
        return 'info';
      case AUCTION_STATES.CANCELLED:
        return 'danger';
      default:
        return 'warning';
    }
  };
  
  if (slotsLoading || featuredLoading) {
    return <LoadingState size="lg" />;
  }
  
  if (slotsError || featuredError) {
    return <div className="text-red-500 p-4">{slotsError?.message || featuredError?.message}</div>;
  }
  
  return (
    <Container>
      <h1 className="text-2xl font-bold mb-6">Supabase Test Page</h1>
      
      {/* Featured Slots */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Featured Slots</h2>
        {featuredSlots && featuredSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSlots.map(slot => (
              <div key={slot.id} className="border rounded p-4">
                <h3 className="font-medium">{(slot.product as Product)?.name_en || 'No product assigned'}</h3>
                <p>ID: {slot.id}</p>
                <Badge color="success">Featured</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p>No featured slots available</p>
        )}
      </Card>
      
      {/* Slot Management */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Slot Management</h2>
        
        {/* Search */}
        <div className="mb-4">
          <FormField
            label={t('common.search')}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            placeholder={t('search.placeholders.searchSlots')}
          />
        </div>
        
        {/* Assign Product Form */}
        <div className="mb-6 p-4 border rounded">
          <h3 className="font-medium mb-2">Assign Product to Slot</h3>
          <div className="flex flex-col space-y-3">
            <FormField
              label="Slot ID"
              value={slotId || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlotId(e.target.value)}
              placeholder="Enter slot ID"
            />
            <FormField
              label="Product ID"
              value={productId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductId(e.target.value)}
              placeholder="Enter product ID"
            />
            <Button 
              onClick={handleAssignProduct}
              disabled={!slotId || !productId || actionLoading}
            >
              {actionLoading ? 'Assigning...' : 'Assign Product'}
            </Button>
          </div>
        </div>
        
        {/* Slots Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSlots && filteredSlots.map(slot => (
                <tr key={slot.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{slot.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slot.product ? (
                      <div>
                        <div>{(slot.product as Product)?.name_en}</div>
                        <div className="text-sm text-gray-500">ID: {(slot.product as Product)?.id}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No product</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getStatusBadgeColor(slot.auction_state)}>
                      {slot.auction_state || 'pending'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>Start: {slot.start_time ? new Date(slot.start_time).toLocaleString() : 'Not set'}</div>
                    <div>End: {slot.end_time ? new Date(slot.end_time).toLocaleString() : 'Not set'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{slot.view_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slot.featured ? (
                      <Badge color="success">Featured</Badge>
                    ) : (
                      <Badge color="secondary">Not Featured</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slot.product ? (
                      <Button 
                        variant="outline" 
                        onClick={() => handleRemoveProduct(slot.id.toString())}
                        disabled={actionLoading}
                      >
                        Remove Product
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setSlotId(slot.id.toString())}
                        disabled={actionLoading}
                      >
                        Assign Product
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {actionError && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {actionError.message}
        </div>
      )}
    </Container>
  );
};

export default SupabaseTest; 