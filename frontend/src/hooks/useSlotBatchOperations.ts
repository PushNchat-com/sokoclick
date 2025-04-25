import { useState, useCallback } from 'react';
import slotBatchOperations, { 
  SlotOperationResponse, 
  BatchOperationResult, 
  MaintenanceOperation,
  SlotErrorType
} from '../services/slotBatchOperations';
import { Slot, SlotStatus } from '../services/slots';
import { toast } from '../utils/toast';
import { useLanguage } from '../store/LanguageContext';

interface SlotBatchState {
  loading: boolean;
  operationInProgress: string | null;
  lastResult: BatchOperationResult | null;
  lastError: Error | null;
}

interface UseSlotBatchOperationsReturn extends SlotBatchState {
  // Batch operation methods
  setMaintenanceStatus: (slotIds: number[], operation: MaintenanceOperation) => Promise<BatchOperationResult>;
  clearMultipleSlots: (slotIds: number[]) => Promise<BatchOperationResult>;
  reserveMultipleSlots: (slotIds: number[], endTime: Date, reservedBy: string) => Promise<BatchOperationResult>;
  cancelMultipleReservations: (slotIds: number[]) => Promise<BatchOperationResult>;
  getMultipleSlotsStatus: (slotIds: number[]) => Promise<SlotOperationResponse<Slot[]>>;
  verifyAvailability: (slotIds: number[]) => Promise<BatchOperationResult<{
    slotId: number;
    available: boolean;
    status: SlotStatus;
  }[]>>;
  
  // Helpers
  clearState: () => void;
  getErrorMessage: (error: unknown) => string;
  showResultToast: (result: BatchOperationResult, successMessage: string) => void;
}

/**
 * Hook for managing slot batch operations with loading states and error handling
 */
export function useSlotBatchOperations(
  showToasts = true,
  initialState: Partial<SlotBatchState> = {}
): UseSlotBatchOperationsReturn {
  const { t } = useLanguage();
  const [state, setState] = useState<SlotBatchState>({
    loading: false,
    operationInProgress: null,
    lastResult: null,
    lastError: null,
    ...initialState
  });
  
  /**
   * Clear state for fresh operations
   */
  const clearState = useCallback(() => {
    setState({
      loading: false,
      operationInProgress: null,
      lastResult: null,
      lastError: null
    });
  }, []);
  
  /**
   * Extract error message from various error types
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    if (typeof error === 'string') return error;
    
    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      
      if ('error' in error && typeof error.error === 'object' && error.error && 'message' in error.error) {
        return String(error.error.message);
      }
    }
    
    return 'An unknown error occurred';
  }, []);
  
  /**
   * Show formatted toast based on operation result
   */
  const showResultToast = useCallback((result: BatchOperationResult, successMessage: string) => {
    if (!showToasts) return;
    
    if (result.overallSuccess) {
      toast.success(successMessage);
      return;
    }
    
    if (result.successCount > 0 && result.failureCount > 0) {
      // Partial success
      toast.warning(t({
        en: `Operation completed with issues. ${result.successCount} successful, ${result.failureCount} failed.`,
        fr: `Opération terminée avec des problèmes. ${result.successCount} réussis, ${result.failureCount} échoués.`
      }));
      return;
    }
    
    // Complete failure
    const errorMsg = result.errors?.[0]?.error?.message || 
      t({ en: 'Operation failed', fr: 'Échec de l\'opération' });
    
    toast.error(errorMsg);
  }, [showToasts, t]);
  
  /**
   * Set maintenance status for multiple slots
   */
  const setMaintenanceStatus = useCallback(async (
    slotIds: number[],
    operation: MaintenanceOperation
  ): Promise<BatchOperationResult> => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true,
        operationInProgress: 'setMaintenanceStatus',
        lastError: null 
      }));
      
      const result = await slotBatchOperations.setMaintenanceStatus(slotIds, operation);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastResult: result
      }));
      
      if (showToasts) {
        const statusText = operation === 'enable' ? 
          t({ en: 'enabled', fr: 'activée' }) : 
          t({ en: 'disabled', fr: 'désactivée' });
        
        showResultToast(
          result,
          t({
            en: `Maintenance ${statusText} for ${result.successCount} slot(s)`,
            fr: `Maintenance ${statusText} pour ${result.successCount} emplacement(s)`
          })
        );
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastError: error instanceof Error ? error : new Error(getErrorMessage(error))
      }));
      
      if (showToasts) {
        toast.error(getErrorMessage(error));
      }
      
      throw error;
    }
  }, [getErrorMessage, showResultToast, showToasts, t]);
  
  /**
   * Clear products from multiple slots
   */
  const clearMultipleSlots = useCallback(async (
    slotIds: number[]
  ): Promise<BatchOperationResult> => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true,
        operationInProgress: 'clearMultipleSlots',
        lastError: null 
      }));
      
      const result = await slotBatchOperations.clearMultipleSlots(slotIds);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastResult: result
      }));
      
      if (showToasts) {
        showResultToast(
          result,
          t({
            en: `Cleared ${result.successCount} slot(s)`,
            fr: `${result.successCount} emplacement(s) vidé(s)`
          })
        );
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastError: error instanceof Error ? error : new Error(getErrorMessage(error))
      }));
      
      if (showToasts) {
        toast.error(getErrorMessage(error));
      }
      
      throw error;
    }
  }, [getErrorMessage, showResultToast, showToasts, t]);
  
  /**
   * Reserve multiple slots
   */
  const reserveMultipleSlots = useCallback(async (
    slotIds: number[],
    endTime: Date,
    reservedBy: string
  ): Promise<BatchOperationResult> => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true,
        operationInProgress: 'reserveMultipleSlots',
        lastError: null 
      }));
      
      const result = await slotBatchOperations.reserveMultipleSlots(slotIds, endTime, reservedBy);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastResult: result
      }));
      
      if (showToasts) {
        showResultToast(
          result,
          t({
            en: `Reserved ${result.successCount} slot(s)`,
            fr: `${result.successCount} emplacement(s) réservé(s)`
          })
        );
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastError: error instanceof Error ? error : new Error(getErrorMessage(error))
      }));
      
      if (showToasts) {
        toast.error(getErrorMessage(error));
      }
      
      throw error;
    }
  }, [getErrorMessage, showResultToast, showToasts, t]);
  
  /**
   * Cancel reservations for multiple slots
   */
  const cancelMultipleReservations = useCallback(async (
    slotIds: number[]
  ): Promise<BatchOperationResult> => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true,
        operationInProgress: 'cancelMultipleReservations',
        lastError: null 
      }));
      
      const result = await slotBatchOperations.cancelMultipleReservations(slotIds);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastResult: result
      }));
      
      if (showToasts) {
        showResultToast(
          result,
          t({
            en: `Cancelled reservations for ${result.successCount} slot(s)`,
            fr: `Réservations annulées pour ${result.successCount} emplacement(s)`
          })
        );
      }
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastError: error instanceof Error ? error : new Error(getErrorMessage(error))
      }));
      
      if (showToasts) {
        toast.error(getErrorMessage(error));
      }
      
      throw error;
    }
  }, [getErrorMessage, showResultToast, showToasts, t]);
  
  /**
   * Get status of multiple slots
   */
  const getMultipleSlotsStatus = useCallback(async (
    slotIds: number[]
  ): Promise<SlotOperationResponse<Slot[]>> => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true,
        operationInProgress: 'getMultipleSlotsStatus',
        lastError: null 
      }));
      
      const result = await slotBatchOperations.getMultipleSlotsStatus(slotIds);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastError: error instanceof Error ? error : new Error(getErrorMessage(error))
      }));
      
      if (showToasts) {
        toast.error(getErrorMessage(error));
      }
      
      throw error;
    }
  }, [getErrorMessage, showToasts]);
  
  /**
   * Verify availability of multiple slots
   */
  const verifyAvailability = useCallback(async (
    slotIds: number[]
  ): Promise<BatchOperationResult<{
    slotId: number;
    available: boolean;
    status: SlotStatus;
  }[]>> => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true,
        operationInProgress: 'verifyAvailability',
        lastError: null 
      }));
      
      const result = await slotBatchOperations.verifyAvailability(slotIds);
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        operationInProgress: null,
        lastError: error instanceof Error ? error : new Error(getErrorMessage(error))
      }));
      
      if (showToasts) {
        toast.error(getErrorMessage(error));
      }
      
      throw error;
    }
  }, [getErrorMessage, showToasts]);
  
  return {
    // State
    ...state,
    
    // Batch operations
    setMaintenanceStatus,
    clearMultipleSlots,
    reserveMultipleSlots,
    cancelMultipleReservations,
    getMultipleSlotsStatus,
    verifyAvailability,
    
    // Utilities
    clearState,
    getErrorMessage,
    showResultToast
  };
} 