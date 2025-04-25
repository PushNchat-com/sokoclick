import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../store/LanguageContext';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { logAdminAction, AuditAction, AuditResource } from '../../services/auditLog';
import { SlotStatus, useSlots, slotService } from '../../services/slots';
import { toast } from '../../utils/toast';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Checkbox from '../ui/Checkbox';

/**
 * Component for performing batch operations on slots
 * - Select multiple slots by status or manual selection
 * - Perform bulk operations (maintenance mode, reservation, clear)
 * - Show operation progress and results
 */
const BatchSlotOperations: React.FC = () => {
  const { isAdmin } = useUnifiedAuth();
  const { t } = useLanguage();
  const { slots, loading: slotsLoading, error: slotsError, refresh: refreshSlots } = useSlots();
  
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [operationProgress, setOperationProgress] = useState<number>(0);
  const [operationTotal, setOperationTotal] = useState<number>(0);
  const [operationResults, setOperationResults] = useState<{
    success: number;
    failed: number;
    messages: string[];
  }>({ success: 0, failed: 0, messages: [] });
  
  // If not admin, don't render the component
  if (!isAdmin) {
    return null;
  }

  // Group slots by status
  const slotsByStatus = {
    [SlotStatus.AVAILABLE]: slots?.filter(slot => slot.status === SlotStatus.AVAILABLE) || [],
    [SlotStatus.OCCUPIED]: slots?.filter(slot => slot.status === SlotStatus.OCCUPIED) || [],
    [SlotStatus.RESERVED]: slots?.filter(slot => slot.status === SlotStatus.RESERVED) || [],
    [SlotStatus.MAINTENANCE]: slots?.filter(slot => slot.status === SlotStatus.MAINTENANCE) || [],
  };
  
  // Handle individual slot selection
  const handleSlotSelection = (slotId: number, selected: boolean) => {
    if (selected) {
      setSelectedSlots(prev => [...prev, slotId]);
    } else {
      setSelectedSlots(prev => prev.filter(id => id !== slotId));
    }
  };
  
  // Handle select all slots by status
  const handleSelectByStatus = (status: SlotStatus) => {
    const slotsWithStatus = slotsByStatus[status].map(slot => slot.id);
    setSelectedSlots(slotsWithStatus);
  };
  
  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedSlots([]);
  };
  
  // Invert current selection
  const handleInvertSelection = () => {
    const allSlotIds = slots?.map(slot => slot.id) || [];
    const newSelection = allSlotIds.filter(id => !selectedSlots.includes(id));
    setSelectedSlots(newSelection);
  };
  
  // Perform bulk operation: Set maintenance mode
  const handleSetMaintenance = async (maintenance: boolean) => {
    if (selectedSlots.length === 0) {
      toast.warning(t({
        en: 'No slots selected. Please select at least one slot.',
        fr: 'Aucun slot sélectionné. Veuillez sélectionner au moins un slot.'
      }));
      return;
    }
    
    try {
      setIsProcessing(true);
      setOperationProgress(0);
      setOperationTotal(selectedSlots.length);
      setOperationResults({ success: 0, failed: 0, messages: [] });
      
      let successCount = 0;
      let failCount = 0;
      const messages: string[] = [];
      
      // Process slots sequentially to avoid overwhelming the API
      for (let i = 0; i < selectedSlots.length; i++) {
        const slotId = selectedSlots[i];
        
        try {
          const result = await slotService.setSlotMaintenance(slotId, maintenance);
          
          if (result.success) {
            successCount++;
            messages.push(t({
              en: `Slot ${slotId}: Maintenance mode ${maintenance ? 'enabled' : 'disabled'}`,
              fr: `Slot ${slotId}: Mode maintenance ${maintenance ? 'activé' : 'désactivé'}`
            }));
          } else {
            failCount++;
            messages.push(t({
              en: `Slot ${slotId}: Failed - ${result.error}`,
              fr: `Slot ${slotId}: Échec - ${result.error}`
            }));
          }
        } catch (error) {
          failCount++;
          messages.push(t({
            en: `Slot ${slotId}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`,
            fr: `Slot ${slotId}: Erreur - ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          }));
        }
        
        // Update progress
        setOperationProgress(i + 1);
      }
      
      // Log the batch action
      await logAdminAction(
        AuditAction.UPDATE,
        AuditResource.SLOT,
        selectedSlots.join(','),
        { 
          operation: maintenance ? 'enable_maintenance' : 'disable_maintenance',
          success: successCount,
          failed: failCount
        }
      );
      
      // Update results
      setOperationResults({
        success: successCount,
        failed: failCount,
        messages
      });
      
      // Show result notification
      if (failCount === 0) {
        toast.success(t({
          en: `Successfully ${maintenance ? 'enabled' : 'disabled'} maintenance mode for ${successCount} slots`,
          fr: `Le mode maintenance a été ${maintenance ? 'activé' : 'désactivé'} avec succès pour ${successCount} slots`
        }));
      } else {
        toast.warning(t({
          en: `Completed with issues: ${successCount} succeeded, ${failCount} failed`,
          fr: `Terminé avec des problèmes: ${successCount} réussis, ${failCount} échoués`
        }));
      }
      
      // Refresh slot data
      refreshSlots();
      
    } catch (error) {
      console.error('Batch operation error:', error);
      toast.error(t({
        en: 'Failed to perform batch operation',
        fr: 'Échec de l\'opération par lots'
      }));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Perform bulk operation: Remove products from slots
  const handleRemoveProducts = async () => {
    if (selectedSlots.length === 0) {
      toast.warning(t({
        en: 'No slots selected. Please select at least one slot.',
        fr: 'Aucun slot sélectionné. Veuillez sélectionner au moins un slot.'
      }));
      return;
    }
    
    // Filter only slots that have products
    const slotsWithProducts = selectedSlots.filter(slotId => {
      const slot = slots?.find(s => s.id === slotId);
      return slot && slot.product_id;
    });
    
    if (slotsWithProducts.length === 0) {
      toast.warning(t({
        en: 'None of the selected slots contain products',
        fr: 'Aucun des slots sélectionnés ne contient de produits'
      }));
      return;
    }
    
    // Confirm before proceeding
    const confirmed = window.confirm(t({
      en: `Are you sure you want to remove products from ${slotsWithProducts.length} slots? This will delete all images as well.`,
      fr: `Êtes-vous sûr de vouloir supprimer les produits de ${slotsWithProducts.length} slots? Cela supprimera également toutes les images.`
    }));
    
    if (!confirmed) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setOperationProgress(0);
      setOperationTotal(slotsWithProducts.length);
      setOperationResults({ success: 0, failed: 0, messages: [] });
      
      let successCount = 0;
      let failCount = 0;
      const messages: string[] = [];
      
      // Process slots sequentially
      for (let i = 0; i < slotsWithProducts.length; i++) {
        const slotId = slotsWithProducts[i];
        
        try {
          const result = await slotService.removeProductFromSlot(slotId);
          
          if (result.success) {
            successCount++;
            messages.push(t({
              en: `Slot ${slotId}: Product removed successfully`,
              fr: `Slot ${slotId}: Produit supprimé avec succès`
            }));
          } else {
            failCount++;
            messages.push(t({
              en: `Slot ${slotId}: Failed - ${result.error}`,
              fr: `Slot ${slotId}: Échec - ${result.error}`
            }));
          }
        } catch (error) {
          failCount++;
          messages.push(t({
            en: `Slot ${slotId}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`,
            fr: `Slot ${slotId}: Erreur - ${error instanceof Error ? error.message : 'Erreur inconnue'}`
          }));
        }
        
        // Update progress
        setOperationProgress(i + 1);
      }
      
      // Log the batch action
      await logAdminAction(
        AuditAction.DELETE,
        AuditResource.PRODUCT,
        slotsWithProducts.join(','),
        { 
          operation: 'remove_products_from_slots',
          success: successCount,
          failed: failCount
        }
      );
      
      // Update results
      setOperationResults({
        success: successCount,
        failed: failCount,
        messages
      });
      
      // Show result notification
      if (failCount === 0) {
        toast.success(t({
          en: `Successfully removed products from ${successCount} slots`,
          fr: `Produits supprimés avec succès de ${successCount} slots`
        }));
      } else {
        toast.warning(t({
          en: `Completed with issues: ${successCount} succeeded, ${failCount} failed`,
          fr: `Terminé avec des problèmes: ${successCount} réussis, ${failCount} échoués`
        }));
      }
      
      // Refresh slot data
      refreshSlots();
      
    } catch (error) {
      console.error('Batch operation error:', error);
      toast.error(t({
        en: 'Failed to perform batch operation',
        fr: 'Échec de l\'opération par lots'
      }));
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-6">
        {t({
          en: 'Batch Slot Operations',
          fr: 'Opérations par lots sur les slots'
        })}
      </h2>
      
      {/* Selection tools */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">
          {t({
            en: 'Select Slots',
            fr: 'Sélectionner des slots'
          })}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => handleSelectByStatus(SlotStatus.AVAILABLE)}
            variant="secondary"
            className="text-sm"
          >
            {t({
              en: 'Select Available',
              fr: 'Sélectionner disponibles'
            })} ({slotsByStatus[SlotStatus.AVAILABLE].length})
          </Button>
          <Button
            onClick={() => handleSelectByStatus(SlotStatus.OCCUPIED)}
            variant="secondary"
            className="text-sm"
          >
            {t({
              en: 'Select Occupied',
              fr: 'Sélectionner occupés'
            })} ({slotsByStatus[SlotStatus.OCCUPIED].length})
          </Button>
          <Button
            onClick={() => handleSelectByStatus(SlotStatus.RESERVED)}
            variant="secondary"
            className="text-sm"
          >
            {t({
              en: 'Select Reserved',
              fr: 'Sélectionner réservés'
            })} ({slotsByStatus[SlotStatus.RESERVED].length})
          </Button>
          <Button
            onClick={() => handleSelectByStatus(SlotStatus.MAINTENANCE)}
            variant="secondary"
            className="text-sm"
          >
            {t({
              en: 'Select Maintenance',
              fr: 'Sélectionner maintenance'
            })} ({slotsByStatus[SlotStatus.MAINTENANCE].length})
          </Button>
          <Button
            onClick={handleInvertSelection}
            variant="secondary"
            className="text-sm"
          >
            {t({
              en: 'Invert Selection',
              fr: 'Inverser la sélection'
            })}
          </Button>
          <Button
            onClick={handleClearSelection}
            variant="secondary"
            className="text-sm"
          >
            {t({
              en: 'Clear Selection',
              fr: 'Effacer la sélection'
            })}
          </Button>
        </div>
        
        <div className="text-sm mb-2">
          <span className="font-medium">
            {t({
              en: 'Selected:',
              fr: 'Sélectionnés:'
            })}
          </span>{' '}
          {selectedSlots.length} / {slots?.length || 0} {t({
            en: 'slots',
            fr: 'slots'
          })}
        </div>
        
        {/* Slot selection grid */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {slotsLoading ? (
            <div className="col-span-5 flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-2">
                {t({
                  en: 'Loading slots...',
                  fr: 'Chargement des slots...'
                })}
              </span>
            </div>
          ) : slotsError ? (
            <div className="col-span-5 text-center text-red-600 py-8">
              {t({
                en: 'Error loading slots',
                fr: 'Erreur lors du chargement des slots'
              })}
            </div>
          ) : (
            Array.from({ length: 25 }, (_, i) => i + 1).map(slotId => {
              const slot = slots?.find(s => s.id === slotId);
              const isSelected = selectedSlots.includes(slotId);
              
              return (
                <div 
                  key={slotId}
                  className={`
                    p-2 border rounded-md cursor-pointer
                    ${isSelected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200'}
                    ${slot?.status === SlotStatus.OCCUPIED ? 'ring-1 ring-green-400' : ''}
                    ${slot?.status === SlotStatus.MAINTENANCE ? 'ring-1 ring-red-400' : ''}
                    ${slot?.status === SlotStatus.RESERVED ? 'ring-1 ring-yellow-400' : ''}
                  `}
                  onClick={() => handleSlotSelection(slotId, !isSelected)}
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSlotSelection(slotId, e.target.checked)}
                      id={`slot-${slotId}`}
                      className="mr-2"
                    />
                    <label htmlFor={`slot-${slotId}`} className="text-sm cursor-pointer">
                      {t({
                        en: `Slot ${slotId}`,
                        fr: `Slot ${slotId}`
                      })}
                    </label>
                  </div>
                  <div className="text-xs mt-1 truncate">
                    {slot?.product?.name_en || t({
                      en: 'Empty',
                      fr: 'Vide'
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Operations */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">
          {t({
            en: 'Batch Operations',
            fr: 'Opérations par lots'
          })}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => handleSetMaintenance(true)}
            variant="secondary"
            disabled={isProcessing || selectedSlots.length === 0}
            className="flex items-center gap-2"
          >
            {isProcessing && <Spinner size="sm" />}
            {t({
              en: 'Enable Maintenance Mode',
              fr: 'Activer mode maintenance'
            })}
          </Button>
          <Button
            onClick={() => handleSetMaintenance(false)}
            variant="secondary"
            disabled={isProcessing || selectedSlots.length === 0}
            className="flex items-center gap-2"
          >
            {isProcessing && <Spinner size="sm" />}
            {t({
              en: 'Disable Maintenance Mode',
              fr: 'Désactiver mode maintenance'
            })}
          </Button>
          <Button
            onClick={handleRemoveProducts}
            variant="danger"
            disabled={isProcessing || selectedSlots.length === 0}
            className="flex items-center gap-2"
          >
            {isProcessing && <Spinner size="sm" />}
            {t({
              en: 'Remove Products',
              fr: 'Supprimer produits'
            })}
          </Button>
        </div>
        
        {/* Progress indicator */}
        {isProcessing && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>
                {t({
                  en: 'Processing...',
                  fr: 'Traitement en cours...'
                })}
              </span>
              <span>
                {operationProgress} / {operationTotal}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${(operationProgress / operationTotal) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Results */}
        {!isProcessing && operationResults.messages.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">
              {t({
                en: 'Operation Results',
                fr: 'Résultats de l\'opération'
              })}
            </h4>
            <div className="flex gap-4 mb-2">
              <span className="text-green-600">
                {t({
                  en: 'Success:',
                  fr: 'Succès:'
                })} {operationResults.success}
              </span>
              <span className="text-red-600">
                {t({
                  en: 'Failed:',
                  fr: 'Échecs:'
                })} {operationResults.failed}
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
              {operationResults.messages.map((message, index) => (
                <div 
                  key={index}
                  className={`text-xs py-1 ${
                    message.includes('Failed') || message.includes('Error') || 
                    message.includes('Échec') || message.includes('Erreur')
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        <p>
          {t({
            en: 'Note: Operations are performed sequentially to ensure data integrity.',
            fr: 'Remarque: Les opérations sont effectuées séquentiellement pour garantir l\'intégrité des données.'
          })}
        </p>
      </div>
    </div>
  );
};

export default BatchSlotOperations; 