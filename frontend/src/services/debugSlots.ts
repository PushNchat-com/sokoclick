import { useState, useEffect, useCallback } from 'react';
import supabase from './supabase';
import { PostgrestError } from '@supabase/postgrest-js';
import { Product } from './products';
import { Slot, SlotStatus } from './slots';

/**
 * Debug version of useSlots hook with enhanced logging
 */
export const useDebugSlots = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  const fetchSlots = useCallback(async () => {
    console.log('DEBUG - fetchSlots: Starting fetch');
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch all slots
      console.log('DEBUG - fetchSlots: Fetching slots from database');
      const { data: slotsData, error: slotsError } = await supabase
        .from('auction_slots')
        .select('*')
        .order('id');
      
      if (slotsError) {
        console.error('DEBUG - fetchSlots: Error fetching slots:', slotsError);
        throw slotsError;
      }
      
      console.log(`DEBUG - fetchSlots: Fetched ${slotsData?.length || 0} slots from database`);
      
      // Then, for slots with products, fetch product details separately
      const transformedSlots = await Promise.all((slotsData || []).map(async (slot) => {
        if (slot.product_id) {
          console.log(`DEBUG - fetchSlots: Slot ${slot.id} has product_id ${slot.product_id}`);
          try {
            // Fetch product with seller and category
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select(`
                *,
                seller:users (
                  id,
                  name,
                  whatsapp_number,
                  location,
                  is_verified
                ),
                category:categories (
                  id,
                  name_en,
                  name_fr
                )
              `)
              .eq('id', slot.product_id)
              .single();
            
            if (productError) {
              console.error(`DEBUG - fetchSlots: Error fetching product for slot ${slot.id}:`, productError);
            }
            
            if (productData) {
              console.log(`DEBUG - fetchSlots: Found product for slot ${slot.id}: ${productData.name_en} (status: ${productData.status})`);
              slot.product = productData;
            } else {
              console.warn(`DEBUG - fetchSlots: No product data found for slot ${slot.id} with product_id ${slot.product_id}`);
            }
          } catch (err) {
            console.warn(`DEBUG - fetchSlots: Exception fetching product for slot ${slot.id}:`, err);
          }
        } else {
          console.log(`DEBUG - fetchSlots: Slot ${slot.id} has no product_id`);
        }
        
        // Determine slot status
        let status: SlotStatus;
        
        if (slot.is_maintenance) {
          status = SlotStatus.MAINTENANCE;
        } else if (slot.product_id && slot.is_active) {
          status = SlotStatus.OCCUPIED;
        } else if (slot.reservedUntil && new Date(slot.reservedUntil) > new Date()) {
          status = SlotStatus.RESERVED;
        } else {
          status = SlotStatus.AVAILABLE;
        }
        
        console.log(`DEBUG - fetchSlots: Slot ${slot.id} has status ${status}, is_active: ${slot.is_active}`);
        
        return {
          ...slot,
          status,
          maintenance: slot.is_maintenance || false
        } as Slot;
      }));
      
      // Print summary stats
      const slotsWithProducts = transformedSlots.filter(slot => slot.product_id).length;
      const slotsWithProductData = transformedSlots.filter(slot => slot.product).length;
      const activeSlots = transformedSlots.filter(slot => slot.is_active).length;
      const occupiedSlots = transformedSlots.filter(slot => slot.status === SlotStatus.OCCUPIED).length;
      
      console.log('DEBUG - fetchSlots: Summary stats', {
        total: transformedSlots.length,
        withProductId: slotsWithProducts,
        withProductData: slotsWithProductData,
        active: activeSlots,
        occupied: occupiedSlots
      });
      
      // Log product statuses
      const productStatuses = transformedSlots
        .filter(slot => slot.product)
        .reduce((acc, slot) => {
          const status = slot.product?.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      console.log('DEBUG - fetchSlots: Product statuses:', productStatuses);
      
      setSlots(transformedSlots);
    } catch (err) {
      console.error('DEBUG - fetchSlots: Error in main try/catch:', err);
      setError(isPostgrestError(err) ? err.message : 'Failed to fetch slots');
    } finally {
      setLoading(false);
      console.log('DEBUG - fetchSlots: Fetch complete');
    }
  }, []);
  
  useEffect(() => {
    console.log('DEBUG - useDebugSlots: Running fetchSlots');
    fetchSlots();
  }, [fetchSlots, refreshTrigger]);
  
  return { slots, loading, error, refresh };
};

// Add type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'details' in error &&
    'hint' in error &&
    'code' in error
  );
} 