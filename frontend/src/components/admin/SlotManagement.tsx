import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import SlotGrid from './SlotGrid';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SlotStatus, useSlots, slotService, Slot } from '../../services/slots';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { toast } from '../../utils/toast';
import { RefreshIcon, SearchIcon, CheckIcon, CalendarIcon, UndoIcon } from '../ui/Icons';
import useUndo from '../../hooks/useUndo';
import Tooltip from '../ui/Tooltip';

interface SlotState {
  slots: Slot[];
  activeTab: string;
  searchTerm: string;
}

const SlotManagement: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Calculate filter status based on active tab
  const filterStatus = activeTab !== "all" 
    ? activeTab as SlotStatus 
    : undefined;
  
  // Use the updated useSlots hook with filtering and search
  const { slots, loading, error, refresh } = useSlots(filterStatus, searchTerm);
  
  // Initialize undo functionality
  const {
    state: undoState,
    set: setUndoState,
    undo,
    canUndo,
    text: undoText,
    cleanup: cleanupUndo
  } = useUndo<SlotState>({
    slots: [],
    activeTab,
    searchTerm
  });
  
  // Stats for tabs
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    maintenance: 0
  });
  
  // Cleanup undo on unmount
  useEffect(() => {
    return () => {
      cleanupUndo();
    };
  }, [cleanupUndo]);
  
  // Update undo state when slots change
  useEffect(() => {
    setUndoState({
      slots,
      activeTab,
      searchTerm
    });
  }, [slots, activeTab, searchTerm, setUndoState]);
  
  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      const stats = await slotService.getSlotStats();
      setStats(stats);
    };
    
    fetchStats();
  }, [slots]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refresh();
    toast.success(t({ 
      en: 'Slots refreshed successfully',
      fr: 'Emplacements actualisés avec succès'
    }));
  };
  
  // Handle creating a new product
  const handleCreateProduct = () => {
    // Navigate to product creation page
    window.location.href = '/admin/products/create';
  };
  
  // Handle scheduling a slot
  const handleScheduleSlot = () => {
    // Navigate to slot scheduling page
    window.location.href = '/admin/slots/schedule';
  };
  
  // Handle slot actions with undo support
  const handleReserveSlot = async (slotId: number) => {
    setIsLoading(true);
    const reserveUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = await slotService.reserveSlot(
      slotId,
      reserveUntil,
      'admin'
    );
    
    if (result.success) {
      toast.success(t({
        en: `Slot ${slotId} reserved successfully`,
        fr: `Emplacement ${slotId} réservé avec succès`
      }));
      
      // Setup event handler for undo
      if (canUndo) {
        const undoHandler = () => {
          undo();
          handleCancelReservation(slotId);
        };
        
        // Use setTimeout to give user time to see undo button
        setTimeout(undoHandler, 5000);
      }
      
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to reserve slot',
        fr: 'Échec de la réservation de l\'emplacement'
      }));
    }
    setIsLoading(false);
  };
  
  const handleCancelReservation = async (slotId: number) => {
    setIsLoading(true);
    const result = await slotService.cancelReservation(slotId);
    
    if (result.success) {
      toast.success(t({
        en: 'Reservation cancelled successfully',
        fr: 'Réservation annulée avec succès'
      }));
      
      // Setup event handler for undo
      if (canUndo) {
        const undoHandler = () => {
          undo();
          handleReserveSlot(slotId);
        };
        
        // Use setTimeout to give user time to see undo button
        setTimeout(undoHandler, 5000);
      }
      
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to cancel reservation',
        fr: 'Échec de l\'annulation de la réservation'
      }));
    }
    setIsLoading(false);
  };
  
  const handleMaintenanceToggle = async (slotId: number, currentStatus: boolean) => {
    setIsLoading(true);
    const result = await slotService.setSlotMaintenance(slotId, !currentStatus);
    
    if (result.success) {
      toast.success(t({
        en: currentStatus ? 'Maintenance mode cleared' : 'Maintenance mode set',
        fr: currentStatus ? 'Mode maintenance désactivé' : 'Mode maintenance activé'
      }));
      
      // Setup event handler for undo
      if (canUndo) {
        const undoHandler = () => {
          undo();
          handleMaintenanceToggle(slotId, !currentStatus);
        };
        
        // Use setTimeout to give user time to see undo button
        setTimeout(undoHandler, 5000);
      }
      
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to toggle maintenance mode',
        fr: 'Échec du changement de mode maintenance'
      }));
    }
    setIsLoading(false);
  };
  
  const handleRemoveProduct = async (slotId: number) => {
    setIsLoading(true);
    const result = await slotService.removeProductFromSlot(slotId);
    
    if (result.success) {
      toast.success(t({
        en: 'Product removed successfully',
        fr: 'Produit retiré avec succès'
      }));
      
      // Setup event handler for undo
      if (canUndo) {
        const undoHandler = () => {
          undo();
          refresh();
        };
        
        // Use setTimeout to give user time to see undo button
        setTimeout(undoHandler, 5000);
      }
      
      refresh();
    } else {
      toast.error(result.error || t({
        en: 'Failed to remove product',
        fr: 'Échec du retrait du produit'
      }));
    }
    setIsLoading(false);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t({
          en: 'Slot Management',
          fr: 'Gestion des Emplacements'
        })}</h1>
        
        <div className="flex space-x-3">
          <Tooltip content={t({
            en: 'Create a new product',
            fr: 'Créer un nouveau produit'
          })}>
            <Button
              onClick={handleCreateProduct}
              variant="primary"
              size="sm"
              className="flex items-center"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              {t({
                en: 'Create Product',
                fr: 'Créer un Produit'
              })}
            </Button>
          </Tooltip>
          
          <Tooltip content={t({
            en: 'Schedule a slot',
            fr: 'Planifier un emplacement'
          })}>
            <Button
              onClick={handleScheduleSlot}
              variant="secondary"
              size="sm"
              className="flex items-center"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {t({
                en: 'Schedule Slot',
                fr: 'Planifier un Emplacement'
              })}
            </Button>
          </Tooltip>
          
          {canUndo && (
            <Tooltip content={undoText.undo}>
              <Button
                onClick={undo}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <UndoIcon className="w-4 h-4 mr-2" />
                {undoText.undo}
              </Button>
            </Tooltip>
          )}
          
          <Tooltip content={t({
            en: 'Refresh slots',
            fr: 'Actualiser les emplacements'
          })}>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center"
              disabled={loading || isLoading}
            >
              <RefreshIcon className="w-4 h-4 mr-2" />
              {t({
                en: 'Refresh',
                fr: 'Actualiser'
              })}
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={t({
            en: 'Search slots...',
            fr: 'Rechercher des emplacements...'
          })}
          className="pl-10 w-full max-w-md"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
            
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all">
            {t({
              en: `All Slots (${stats.total})`,
              fr: `Tous les Emplacements (${stats.total})`
            })}
          </TabsTrigger>
          <TabsTrigger value={SlotStatus.AVAILABLE}>
            {t({
              en: `Available (${stats.available})`,
              fr: `Disponibles (${stats.available})`
            })}
          </TabsTrigger>
          <TabsTrigger value={SlotStatus.OCCUPIED}>
            {t({
              en: `Occupied (${stats.occupied})`,
              fr: `Occupés (${stats.occupied})`
            })}
          </TabsTrigger>
          <TabsTrigger value={SlotStatus.RESERVED}>
            {t({
              en: `Reserved (${stats.reserved})`,
              fr: `Réservés (${stats.reserved})`
            })}
          </TabsTrigger>
          <TabsTrigger value={SlotStatus.MAINTENANCE}>
            {t({
              en: `Maintenance (${stats.maintenance})`,
              fr: `Maintenance (${stats.maintenance})`
            })}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <p className="mb-4 text-gray-600">
            {t({
              en: 'Drag and drop products to assign them to slots. You can also use the action buttons to manage slots.',
              fr: 'Glissez et déposez les produits pour les assigner aux emplacements. Vous pouvez également utiliser les boutons d\'action pour gérer les emplacements.'
            })}
          </p>
          <SlotGrid 
            slots={slots} 
            loading={loading || isLoading} 
            onReserveSlot={handleReserveSlot}
            onCancelReservation={handleCancelReservation}
            onToggleMaintenance={handleMaintenanceToggle}
            onRemoveProduct={handleRemoveProduct}
          />
        </TabsContent>
        
        <TabsContent value={SlotStatus.AVAILABLE} className="mt-0">
          <SlotGrid 
            slots={slots} 
            loading={loading || isLoading} 
            onReserveSlot={handleReserveSlot}
            onCancelReservation={handleCancelReservation}
            onToggleMaintenance={handleMaintenanceToggle}
            onRemoveProduct={handleRemoveProduct}
          />
        </TabsContent>
        
        <TabsContent value={SlotStatus.OCCUPIED} className="mt-0">
          <SlotGrid 
            slots={slots} 
            loading={loading || isLoading} 
            onReserveSlot={handleReserveSlot}
            onCancelReservation={handleCancelReservation}
            onToggleMaintenance={handleMaintenanceToggle}
            onRemoveProduct={handleRemoveProduct}
          />
        </TabsContent>
        
        <TabsContent value={SlotStatus.RESERVED} className="mt-0">
          <SlotGrid 
            slots={slots} 
            loading={loading || isLoading} 
            onReserveSlot={handleReserveSlot}
            onCancelReservation={handleCancelReservation}
            onToggleMaintenance={handleMaintenanceToggle}
            onRemoveProduct={handleRemoveProduct}
          />
        </TabsContent>
        
        <TabsContent value={SlotStatus.MAINTENANCE} className="mt-0">
          <SlotGrid 
            slots={slots} 
            loading={loading || isLoading} 
            onReserveSlot={handleReserveSlot}
            onCancelReservation={handleCancelReservation}
            onToggleMaintenance={handleMaintenanceToggle}
            onRemoveProduct={handleRemoveProduct}
          />
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default SlotManagement;
