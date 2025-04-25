import React, { memo, useCallback } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { Slot, SlotStatus } from '../../services/slots';
import Badge from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  SettingsIcon, 
  CalendarIcon, 
  CheckIcon, 
  XIcon,
  TrashIcon 
} from '../ui/Icons';
import Skeleton from '../ui/Skeleton';

interface SlotGridProps {
  slots?: Slot[];
  loading?: boolean;
  compact?: boolean;
  viewMode?: 'grid' | 'table';
  selectedSlot?: number | null;
  filterStatus?: SlotStatus | undefined;
  searchTerm?: string;
  onReserveSlot?: (slotId: number) => void;
  onCancelReservation?: (slotId: number) => void;
  onToggleMaintenance?: (slotId: number, currentStatus: boolean) => void;
  onRemoveProduct?: (slotId: number) => void;
  onSlotSelect?: (slotId: number) => void;
  onError?: (error: Error) => void;
}

// Memoized slot item component
const SlotItem = memo(({ 
  slot, 
  onReserveSlot,
  onCancelReservation,
  onToggleMaintenance,
  onRemoveProduct,
  onSlotSelect,
  selectedSlot,
  getStatusBadge,
  formatTimeLeft,
  t
}: {
  slot: Slot;
  onReserveSlot?: (slotId: number) => void;
  onCancelReservation?: (slotId: number) => void;
  onToggleMaintenance?: (slotId: number, currentStatus: boolean) => void;
  onRemoveProduct?: (slotId: number) => void;
  onSlotSelect?: (slotId: number) => void;
  selectedSlot?: number | null;
  getStatusBadge: (status: SlotStatus) => React.ReactNode;
  formatTimeLeft: (slot: Slot) => string;
  t: (text: { en: string; fr: string }) => string;
}) => {
  const handleReserve = useCallback(() => onReserveSlot?.(slot.id), [slot.id, onReserveSlot]);
  const handleCancel = useCallback(() => onCancelReservation?.(slot.id), [slot.id, onCancelReservation]);
  const handleToggleMaintenance = useCallback(() => onToggleMaintenance?.(slot.id, slot.maintenance || false), 
    [slot.id, slot.maintenance, onToggleMaintenance]);
  const handleRemoveProduct = useCallback(() => onRemoveProduct?.(slot.id), [slot.id, onRemoveProduct]);
  const handleSelectSlot = useCallback(() => onSlotSelect?.(slot.id), [slot.id, onSlotSelect]);

  const isSelected = selectedSlot === slot.id;

  return (
    <div
      className={`
        bg-white p-4 rounded-lg shadow border cursor-pointer
        ${slot.status === SlotStatus.MAINTENANCE ? 'border-red-200 bg-red-50' : 'border-gray-200'}
        ${slot.status === SlotStatus.RESERVED ? 'border-yellow-200 bg-yellow-50' : ''}
        ${isSelected ? 'ring-2 ring-indigo-500' : ''}
        h-auto
      `}
      onClick={handleSelectSlot}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">
          {t({
            en: `Slot #${slot.id}`,
            fr: `Emplacement #${slot.id}`
          })}
        </h3>
        {getStatusBadge(slot.status)}
      </div>
      
      {slot.product_id && (
        <p className="text-sm font-medium mb-1 truncate" title={slot.product_id.toString()}>
          {slot.product_id}
        </p>
      )}
      
      {slot.end_time && (
        <p className="text-xs text-gray-500 mb-2">
          {formatTimeLeft(slot)}
        </p>
      )}
      
      <div className="mt-4 space-y-2">
        {slot.status === SlotStatus.AVAILABLE && onReserveSlot && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={e => {
              e.stopPropagation();
              handleReserve();
            }}
          >
            {t({
              en: 'Reserve Slot',
              fr: 'Réserver l\'emplacement'
            })}
          </Button>
        )}
        
        {slot.status === SlotStatus.RESERVED && onCancelReservation && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={e => {
              e.stopPropagation();
              handleCancel();
            }}
          >
            <XIcon className="w-4 h-4 mr-1" />
            {t({
              en: 'Cancel Reservation',
              fr: 'Annuler la réservation'
            })}
          </Button>
        )}
        
        {slot.status === SlotStatus.OCCUPIED && onRemoveProduct && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={e => {
              e.stopPropagation();
              handleRemoveProduct();
            }}
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            {t({
              en: 'Remove Product',
              fr: 'Retirer le produit'
            })}
          </Button>
        )}
        
        {onToggleMaintenance && (
          <Button
            variant={slot.maintenance ? "secondary" : "outline"}
            size="sm"
            className="w-full"
            onClick={e => {
              e.stopPropagation();
              handleToggleMaintenance();
            }}
          >
            {slot.maintenance ? (
              <>
                <CheckIcon className="w-4 h-4 mr-1" />
                {t({
                  en: 'Clear Maintenance',
                  fr: 'Terminer la maintenance'
                })}
              </>
            ) : (
              <>
                <SettingsIcon className="w-4 h-4 mr-1" />
                {t({
                  en: 'Set Maintenance',
                  fr: 'Mettre en maintenance'
                })}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
});

SlotItem.displayName = 'SlotItem';

const SlotGrid: React.FC<SlotGridProps> = memo(({
  slots = [],
  loading = false,
  compact = false,
  viewMode = 'grid',
  selectedSlot = null,
  onReserveSlot,
  onCancelReservation,
  onToggleMaintenance,
  onRemoveProduct,
  onSlotSelect,
  onError
}) => {
  const { t } = useLanguage();
  
  const getStatusBadge = useCallback((status: SlotStatus) => {
    try {
      switch (status) {
        case SlotStatus.AVAILABLE:
          return <Badge variant="success">{t({
            en: 'Available',
            fr: 'Disponible'
          })}</Badge>;
        case SlotStatus.OCCUPIED:
          return <Badge variant="primary">{t({
            en: 'Occupied',
            fr: 'Occupé'
          })}</Badge>;
        case SlotStatus.RESERVED:
          return <Badge variant="warning">{t({
            en: 'Reserved',
            fr: 'Réservé'
          })}</Badge>;
        case SlotStatus.MAINTENANCE:
          return <Badge variant="error">{t({
            en: 'Maintenance',
            fr: 'Maintenance'
          })}</Badge>;
        default:
          return null;
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      return null;
    }
  }, [t, onError]);
  
  const formatTimeLeft = useCallback((slot: Slot): string => {
    try {
      if (!slot.end_time) return '';
      
      const now = new Date();
      const endTime = new Date(slot.end_time);
      const diffMs = endTime.getTime() - now.getTime();
      
      if (diffMs <= 0) return t({
        en: 'Ended',
        fr: 'Terminé'
      });
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return t({
          en: `${diffHours}h ${diffMinutes}m left`,
          fr: `${diffHours}h ${diffMinutes}m restant`
        });
      }
      return t({
        en: `${diffMinutes}m left`,
        fr: `${diffMinutes}m restant`
      });
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
      return '';
    }
  }, [t, onError]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 25 }).map((_, index) => (
          <div 
            key={index} 
            className="bg-white p-4 rounded-lg shadow border border-gray-200 h-48"
          >
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  if (slots.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          {t({
            en: 'No slots available',
            fr: 'Aucun emplacement disponible'
          })}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t({
            en: 'Get started by creating new slots',
            fr: 'Commencez par créer de nouveaux emplacements'
          })}
        </p>
      </div>
    );
  }
  
  if (viewMode === 'table') {
    // Table view implementation
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t({ en: 'Slot ID', fr: 'ID Emplacement' })}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t({ en: 'Status', fr: 'Statut' })}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t({ en: 'Product', fr: 'Produit' })}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t({ en: 'Actions', fr: 'Actions' })}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {slots.map((slot) => (
              <tr 
                key={slot.id} 
                className={`${selectedSlot === slot.id ? 'bg-indigo-50' : 'hover:bg-gray-50'} cursor-pointer`}
                onClick={() => onSlotSelect?.(slot.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{slot.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(slot.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{slot.product_id || '-'}</div>
                  {slot.end_time && (
                    <div className="text-xs text-gray-500">{formatTimeLeft(slot)}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {slot.status === SlotStatus.AVAILABLE && onReserveSlot && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReserveSlot(slot.id);
                        }}
                      >
                        {t({ en: 'Reserve', fr: 'Réserver' })}
                      </Button>
                    )}
                    {slot.status === SlotStatus.RESERVED && onCancelReservation && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelReservation(slot.id);
                        }}
                      >
                        {t({ en: 'Cancel', fr: 'Annuler' })}
                      </Button>
                    )}
                    {onToggleMaintenance && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMaintenance(slot.id, slot.maintenance || false);
                        }}
                      >
                        {slot.maintenance ? 
                          t({ en: 'Clear', fr: 'Terminer' }) : 
                          t({ en: 'Maintain', fr: 'Maintenance' })
                        }
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Default grid view
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${compact ? 'lg:grid-cols-4' : ''}`}>
      {slots.map((slot) => (
        <SlotItem
          key={slot.id}
          slot={slot}
          onReserveSlot={onReserveSlot}
          onCancelReservation={onCancelReservation}
          onToggleMaintenance={onToggleMaintenance}
          onRemoveProduct={onRemoveProduct}
          onSlotSelect={onSlotSelect}
          selectedSlot={selectedSlot}
          getStatusBadge={getStatusBadge}
          formatTimeLeft={formatTimeLeft}
          t={t}
        />
      ))}
    </div>
  );
});

SlotGrid.displayName = 'SlotGrid';

export default SlotGrid;
