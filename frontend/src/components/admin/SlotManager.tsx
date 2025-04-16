import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuctionSlot as AuctionSlotType } from '../../types/supabase';
import { AuctionSlot } from '../auction';
import { H2, Text } from '../ui/Typography';
import Button from '../ui/Button';
import Card, { CardBody } from '../ui/Card';
import { useAdminMockAuctionSlots, useAdminMockSlotActions } from '../../hooks/useMockData';

const SlotManager: React.FC = () => {
  const { t } = useTranslation();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [totalSlots, setTotalSlots] = useState(15); // Default number of slots

  // Use mock data hooks
  const { slots, loading, error, refetch } = useAdminMockAuctionSlots(true);
  const { assignProductToSlot, removeProductFromSlot, updateSlotDetails } = useAdminMockSlotActions();

  // Create empty slots to fill the grid
  const emptySlots: AuctionSlotType[] = [];
  for (let i = slots.length; i < totalSlots; i++) {
    emptySlots.push({ 
      id: -(i + 1),  // Use negative IDs for empty slots
      product_id: null, 
      is_active: false, 
      featured: false, 
      view_count: 0,
      start_time: null,
      end_time: null,
      product: null 
    });
  }

  // Combine real and empty slots
  const allSlots = [...slots, ...emptySlots];

  const handleAssignProductClick = (slotId: number) => {
    setSelectedSlot(slotId);
    setIsAssignModalOpen(true);
  };

  const handleEditSlotClick = (slotId: number) => {
    setSelectedSlot(slotId);
    setIsEditModalOpen(true);
  };

  const handleRemoveProductClick = async (slotId: number) => {
    if (window.confirm(t('admin.confirmRemoveProduct'))) {
      try {
        await removeProductFromSlot(slotId);
        refetch();
      } catch (err) {
        console.error('Error removing product:', err);
      }
    }
  };

  const handleAddSlot = async () => {
    try {
      // In a real app, this would call an API to create a new slot
      // For now, we'll just increment the total slots
      setTotalSlots(totalSlots + 1);
    } catch (err) {
      console.error('Error adding slot:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card variant="bordered">
          <CardBody>
            <div className="text-center py-4">
              <svg className="w-10 h-10 text-error-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2 text-error-600">{t('error')}</h3>
              <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                {t('tryAgain')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <H2 className="mb-1">{t('admin.manageAuctionSlots')}</H2>
          <Text variant="body-sm" className="text-gray-500">
            {t('admin.totalSlots', { count: totalSlots })}
          </Text>
        </div>
        <Button variant="primary" onClick={handleAddSlot}>
          {t('admin.addNewSlot')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allSlots.map((slot) => (
          <AuctionSlot 
            key={slot.id} 
            slot={slot} 
            showEditOptions={true}
            onEditClick={handleEditSlotClick}
            onAssignProductClick={handleAssignProductClick}
            onRemoveProductClick={handleRemoveProductClick}
          />
        ))}
      </div>

      {/* Modals would be implemented here */}
      {/* A modal for assigning products to slots */}
      {/* A modal for editing slot details */}
    </div>
  );
};

export default SlotManager; 