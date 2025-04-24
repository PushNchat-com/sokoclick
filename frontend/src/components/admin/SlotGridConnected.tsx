import React, { useState } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { toast } from 'react-hot-toast';
import SlotGrid from './SlotGrid';
import { useSlots, useSlotStats, SlotStatus, slotService } from '../../services/slots';
import ErrorMessage from '../ui/ErrorMessage';
import { Button } from '../ui/Button';
import { RefreshIcon } from '../ui/Icons';

interface SlotGridConnectedProps {
  /**
   * Optional status filter to show only slots with specific status
   */
  filterStatus?: SlotStatus;
  
  /**
   * Whether admin actions should be enabled
   */
  enableActions?: boolean;
  
  /**
   * Optional classname for styling
   */
  className?: string;
  
  /**
   * Optional search term to filter slots
   */
  searchTerm?: string;
}

/**
 * Connected version of SlotGrid that fetches data from the slots service
 */
const SlotGridConnected: React.FC<SlotGridConnectedProps> = ({
  filterStatus,
  enableActions = true,
  className,
  searchTerm = '',
}) => {
  const { t } = useLanguage();
  
  // Fetch slots data
  const { slots, loading, error, refresh } = useSlots(filterStatus, searchTerm);
  
  // Fetch slot statistics
  const { stats, loading: statsLoading } = useSlotStats();
  
  // Track component mounting state to avoid state updates on unmounted component
  const [isMounted, setIsMounted] = useState(true);
  
  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Slot action handlers
  const handleReserveSlot = async (slotId: number) => {
    // Using a default 24-hour reservation period
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await slotService.reserveSlot(
      slotId,
      tomorrow.toISOString(),
      'admin'
    );
    
    if (result.success) {
      toast.success(t({
        en: 'Slot reserved successfully',
        fr: 'Emplacement réservé avec succès'
      }));
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to reserve slot',
        fr: 'Échec de la réservation de l\'emplacement'
      }));
    }
  };

  const handleCancelReservation = async (slotId: number) => {
    const result = await slotService.cancelReservation(slotId);
    if (result.success) {
      toast.success(t({
        en: 'Reservation cancelled successfully',
        fr: 'Réservation annulée avec succès'
      }));
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to cancel reservation',
        fr: 'Échec de l\'annulation de la réservation'
      }));
    }
  };

  const handleToggleMaintenance = async (slotId: number, currentStatus: boolean) => {
    const result = await slotService.setSlotMaintenance(slotId, !currentStatus);
    
    if (result.success) {
      toast.success(currentStatus 
        ? t({
            en: 'Maintenance mode cleared successfully',
            fr: 'Mode maintenance désactivé avec succès'
          })
        : t({
            en: 'Maintenance mode set successfully',
            fr: 'Mode maintenance activé avec succès'
          })
      );
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to toggle maintenance mode',
        fr: 'Échec du changement de mode maintenance'
      }));
    }
  };

  const handleRemoveProduct = async (slotId: number) => {
    const result = await slotService.removeProductFromSlot(slotId);
    if (result.success) {
      toast.success(t({
        en: 'Product removed successfully',
        fr: 'Produit retiré avec succès'
      }));
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to remove product',
        fr: 'Échec du retrait du produit'
      }));
    }
  };
  
  // Show loading state for initial load
  if (loading && slots.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse grid grid-cols-5 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="aspect-square rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Show error state with retry button
  if (error) {
    return (
      <ErrorMessage
        message={error}
        variant="block"
        title={t({
          en: 'Failed to load slots',
          fr: 'Échec du chargement des emplacements'
        })}
        className={className}
        onRetry={() => {
          if (isMounted) {
            refresh();
          }
        }}
      />
    );
  }
  
  // Stats bar for slot information
  const StatsBar = () => (
    <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center">
        <span className="text-gray-600 font-medium">{t({
          en: 'Total:',
          fr: 'Total :'
        })}</span>
        <span className="ml-1 font-semibold">{statsLoading ? '...' : stats.total}</span>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 font-medium">{t({
          en: 'Available:',
          fr: 'Disponible :'
        })}</span>
        <span className="ml-1 font-semibold text-green-600">{statsLoading ? '...' : stats.available}</span>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 font-medium">{t({
          en: 'Occupied:',
          fr: 'Occupé :'
        })}</span>
        <span className="ml-1 font-semibold text-blue-600">{statsLoading ? '...' : stats.occupied}</span>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 font-medium">{t({
          en: 'Reserved:',
          fr: 'Réservé :'
        })}</span>
        <span className="ml-1 font-semibold text-orange-600">{statsLoading ? '...' : stats.reserved}</span>
      </div>
      <div className="flex items-center">
        <span className="text-gray-600 font-medium">{t({
          en: 'Maintenance:',
          fr: 'Maintenance :'
        })}</span>
        <span className="ml-1 font-semibold text-red-600">{statsLoading ? '...' : stats.maintenance}</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-auto"
        onClick={() => refresh()}
        disabled={loading}
      >
        <RefreshIcon className="w-4 h-4 mr-1" />
        {t({
          en: 'Refresh',
          fr: 'Actualiser'
        })}
      </Button>
    </div>
  );
  
  return (
    <div className={className}>
      <StatsBar />
      
      <SlotGrid 
        slots={slots}
        loading={loading}
        onReserveSlot={handleReserveSlot}
        onCancelReservation={handleCancelReservation}
        onToggleMaintenance={handleToggleMaintenance}
        onRemoveProduct={handleRemoveProduct}
      />
      
      {/* Show message when no slots match filter */}
      {!loading && slots.length === 0 && (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-gray-500">{t({
            en: 'No slots match the current filter',
            fr: 'Aucun emplacement ne correspond au filtre actuel'
          })}</p>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-400">
              {t({
                en: 'Try adjusting your search term or clear filters',
                fr: 'Essayez d\'ajuster votre recherche ou de supprimer les filtres'
              })}
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refresh()}>
            <RefreshIcon className="w-4 h-4 mr-1" />
            {t({
              en: 'Refresh',
              fr: 'Actualiser'
            })}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SlotGridConnected; 