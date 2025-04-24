import { useState, useEffect, useCallback } from 'react';
import supabase from './supabase';
import { PostgrestError } from '@supabase/postgrest-js';
import { Product } from './products';

/**
 * Slot status enum
 */
export enum SlotStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance'
}

/**
 * Slot type definition matching the database structure
 */
export interface Slot {
  id: number;
  product_id?: string;
  product?: Product;
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  status: SlotStatus;
  // Additional fields for UI state management
  reservedUntil?: string;
  reservedBy?: string;
  maintenance: boolean;
  product_name?: string;
  product_image?: string;
  price?: number;
  currency?: string;
  is_maintenance?: boolean;
}

interface ServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

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

/**
 * Hook for fetching slots with optional filtering
 */
export const useSlots = (filterStatus?: SlotStatus, searchTerm?: string) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch all slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('auction_slots')
        .select('*')
        .order('id');
      
      if (slotsError) throw slotsError;
      
      // Then, for slots with products, fetch product details separately
      const transformedSlots = await Promise.all((slotsData || []).map(async (slot) => {
        if (slot.product_id) {
          try {
            // Fetch product with seller and category
            const { data: productData } = await supabase
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
            
            if (productData) {
              slot.product = productData;
            }
          } catch (err) {
            console.warn('Error fetching product for slot:', slot.id, err);
          }
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
        
        return {
          ...slot,
          status,
          maintenance: slot.is_maintenance || false
        } as Slot;
      }));
      
      // Apply filters
      let filteredSlots = transformedSlots;
      
      if (filterStatus) {
        filteredSlots = filteredSlots.filter(slot => slot.status === filterStatus);
      }
      
      if (searchTerm?.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filteredSlots = filteredSlots.filter(slot => {
          if (slot.id.toString().includes(term)) return true;
          if (!slot.product) return false;
          
          return (
            slot.product.name_en?.toLowerCase().includes(term) ||
            slot.product.name_fr?.toLowerCase().includes(term) ||
            slot.product.description_en?.toLowerCase().includes(term) ||
            slot.product.description_fr?.toLowerCase().includes(term)
          );
        });
      }
      
      setSlots(filteredSlots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(isPostgrestError(err) ? err.message : 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);
  
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, refreshTrigger]);
  
  return { slots, loading, error, refresh };
};

/**
 * Hook for fetching stats about slots (counts by status)
 */
export const useSlotStats = () => {
  const [stats, setStats] = useState({
    total: 25,
    available: 0,
    occupied: 0,
    reserved: 0,
    maintenance: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('auction_slots')
        .select(`
          *,
          reservedUntil:reserved_until,
          maintenance
        `);
      
      if (fetchError) {
        throw fetchError;
      }
      
      const slots = data || [];
      const now = new Date();
      
      // Calculate counts
      let occupied = 0;
      let reserved = 0;
      let maintenance = 0;
      
      for (const slot of slots) {
        if (slot.maintenance) {
          maintenance++;
        } else if (slot.product_id) {
          occupied++;
        } else if (slot.reservedUntil && new Date(slot.reservedUntil) > now) {
          reserved++;
        }
      }
      
      setStats({
        total: 25,
        available: 25 - (occupied + reserved + maintenance),
        occupied,
        reserved,
        maintenance
      });
    } catch (err: unknown) {
      console.error('Error fetching slot stats:', err);
      setError(isPostgrestError(err) ? err.message : 'Failed to fetch slot stats');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch stats on mount and when refresh trigger changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);
  
  return { stats, loading, error, refresh };
};

/**
 * Hook for fetching a single slot by ID
 */
export const useSlot = (slotId: number) => {
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  const fetchSlot = useCallback(async () => {
    if (!slotId) {
      setError('Slot ID is required');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('auction_slots')
        .select(`
          *,
          product:products(
            *,
            seller:users(*),
            category:categories(*)
          )
        `)
        .eq('id', slotId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!data) {
        setSlot(null);
        return;
      }
      
      // Determine status
      let status: SlotStatus;
      
      if (!data.is_active) {
        status = SlotStatus.AVAILABLE;
      } else if (data.product_id) {
        status = SlotStatus.OCCUPIED;
      } else if (data.reservedUntil && new Date(data.reservedUntil) > new Date()) {
        status = SlotStatus.RESERVED;
      } else {
        status = SlotStatus.AVAILABLE;
      }
      
      // Check maintenance flag
      if (data.maintenance) {
        status = SlotStatus.MAINTENANCE;
      }
      
      setSlot({
        ...data,
        status,
        product: data.product || undefined
      } as Slot);
    } catch (err: unknown) {
      console.error('Error fetching slot:', err);
      setError(isPostgrestError(err) ? err.message : 'Failed to fetch slot');
    } finally {
      setLoading(false);
    }
  }, [slotId, refreshTrigger]);
  
  // Fetch slot on mount and when slotId or refresh trigger changes
  useEffect(() => {
    fetchSlot();
  }, [fetchSlot]);
  
  return { slot, loading, error, refresh };
};

/**
 * Service object with slot management functions
 */
export const slotService = {
  /**
   * Reserve a slot for a specified duration
   */
  async reserveSlot(
    slotId: number,
    endTime: string,
    reservedBy: string
  ): Promise<ServiceResponse> {
    try {
      // Check if slot is available
      const { data: slotData, error: slotError } = await supabase
        .from('auction_slots')
        .select('*')
        .eq('id', slotId)
        .single();
      
      if (slotError) {
        throw slotError;
      }
      
      if (!slotData) {
        return { success: false, error: 'Slot not found' };
      }
      
      if (slotData.product_id) {
        return { success: false, error: 'Slot is already occupied' };
      }
      
      if (slotData.maintenance) {
        return { success: false, error: 'Slot is under maintenance' };
      }
      
      if (slotData.reservedUntil && new Date(slotData.reservedUntil) > new Date()) {
        return { success: false, error: 'Slot is already reserved' };
      }
      
      // Reserve the slot
      const { error: updateError } = await supabase
        .from('auction_slots')
        .update({
          reserved_until: endTime,
          reserved_by: reservedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      
      if (updateError) {
        throw updateError;
      }
      
      return { success: true };
    } catch (err: unknown) {
      console.error('Error reserving slot:', err);
      throw isPostgrestError(err) ? err.message : 'Failed to reserve slot';
    }
  },
  
  /**
   * Cancel a slot reservation
   */
  async cancelReservation(slotId: number): Promise<ServiceResponse> {
    try {
      const { error } = await supabase
        .from('auction_slots')
        .update({
          reserved_until: null,
          reserved_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (err: unknown) {
      console.error('Error canceling reservation:', err);
      throw isPostgrestError(err) ? err.message : 'Failed to cancel reservation';
    }
  },
  
  /**
   * Set or clear maintenance mode for a slot
   */
  async setSlotMaintenance(
    slotId: number,
    maintenance: boolean
  ): Promise<ServiceResponse> {
    try {
      const { error } = await supabase
        .from('auction_slots')
        .update({
          maintenance: maintenance,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (err: unknown) {
      console.error('Error setting maintenance:', err);
      throw isPostgrestError(err) ? err.message : 'Failed to set maintenance';
    }
  },
  
  /**
   * Remove a product from a slot
   */
  async removeProductFromSlot(slotId: number): Promise<ServiceResponse> {
    try {
      // First update the product's auction_slot_id to null
      const { data: slotData, error: slotError } = await supabase
        .from('auction_slots')
        .select('product_id')
        .eq('id', slotId)
        .single();
      
      if (slotError) {
        throw slotError;
      }
      
      if (slotData?.product_id) {
        const { error: productError } = await supabase
          .from('products')
          .update({ auction_slot_id: null })
          .eq('id', slotData.product_id);
        
        if (productError) {
          throw productError;
        }
      }
      
      // Then update the slot
      const { error: updateError } = await supabase
        .from('auction_slots')
        .update({
          product_id: null,
          is_active: false,
          start_time: null,
          end_time: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      
      if (updateError) {
        throw updateError;
      }
      
      return { success: true };
    } catch (err: unknown) {
      console.error('Error removing product:', err);
      throw isPostgrestError(err) ? err.message : 'Failed to remove product';
    }
  },
  
  /**
   * Assign a product to a slot
   */
  async assignProductToSlot(
    slotId: number,
    productId: string,
    duration: number = 7
  ): Promise<ServiceResponse> {
    try {
      // Check if slot is available
      const { data: slotData, error: slotError } = await supabase
        .from('auction_slots')
        .select('*')
        .eq('id', slotId)
        .single();
      
      if (slotError) {
        throw slotError;
      }
      
      if (!slotData) {
        return { success: false, error: 'Slot not found' };
      }
      
      if (slotData.product_id) {
        return { success: false, error: 'Slot is already occupied' };
      }
      
      if (slotData.maintenance) {
        return { success: false, error: 'Slot is under maintenance' };
      }
      
      // Check if product exists and doesn't already have a slot
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('auction_slot_id, status')
        .eq('id', productId)
        .single();
      
      if (productError) {
        throw productError;
      }
      
      if (!productData) {
        return { success: false, error: 'Product not found' };
      }
      
      if (productData.auction_slot_id) {
        return { success: false, error: 'Product is already assigned to a slot' };
      }
      
      if (productData.status !== 'approved') {
        return { success: false, error: 'Only approved products can be assigned to slots' };
      }
      
      // Calculate start and end times
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + duration);
      
      // Update product with slot ID
      const { error: updateProductError } = await supabase
        .from('products')
        .update({ auction_slot_id: slotId })
        .eq('id', productId);
      
      if (updateProductError) {
        throw updateProductError;
      }
      
      // Update slot with product ID and timing information
      const { error: updateSlotError } = await supabase
        .from('auction_slots')
        .update({
          product_id: productId,
          is_active: true,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);
      
      if (updateSlotError) {
        throw updateSlotError;
      }
      
      return { success: true, data: slotData };
    } catch (err: unknown) {
      console.error('Error assigning product:', err);
      throw isPostgrestError(err) ? err.message : 'Failed to assign product';
    }
  },
  
  /**
   * Get statistics about slots
   */
  async getSlotStats(): Promise<{
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    maintenance: number;
  }> {
    try {
      // Fetch all slots without trying to join to categories
      const { data, error } = await supabase
        .from('auction_slots')
        .select(`
          id,
          product_id,
          is_active,
          reserved_until,
          maintenance
        `);
      
      if (error) {
        throw error;
      }
      
      // Initialize counters
      let stats = {
        total: data?.length || 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0
      };
      
      // Count slots by status
      (data || []).forEach(slot => {
        if (slot.maintenance) {
          stats.maintenance++;
        } else if (slot.product_id) {
          stats.occupied++;
        } else if (slot.reserved_until && new Date(slot.reserved_until) > new Date()) {
          stats.reserved++;
        } else {
          stats.available++;
        }
      });
      
      return stats;
    } catch (err) {
      console.error('Error fetching slot stats:', err);
      // Return default empty stats on error
      return {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        maintenance: 0
      };
    }
  }
};

/**
 * Get available slots safely for product form
 * This is a fallback method to get available slots even when there are RLS errors
 */
export const getAvailableSlotsForProductForm = async (): Promise<number[]> => {
  try {
    // Try the normal way first
    const { data, error } = await supabase
      .from('auction_slots')
      .select('id, product_id, maintenance')
      .is('product_id', null)
      .eq('maintenance', false)
      .order('id');
    
    // If successful, return the slot IDs
    if (!error && data) {
      return data.map(slot => slot.id);
    }
    
    // If there's an error, especially the recursion error, fallback to a workaround
    console.warn('Using fallback method to get available slots due to error:', error?.message);
    
    // Fallback to a simpler query that avoids the problematic RLS policy
    const { data: fallbackData, error: fallbackError } = await supabase.rpc(
      'get_available_slots',
      {}
    );
    
    if (fallbackError) {
      console.error('Fallback slot query failed:', fallbackError);
      // If even the fallback fails, provide a simple array of defaults (slots 1-25)
      return Array.from({ length: 25 }, (_, i) => i + 1);
    }
    
    return fallbackData || [];
  } catch (err) {
    console.error('Error getting available slots:', err);
    // Return default slots as a last resort
    return Array.from({ length: 25 }, (_, i) => i + 1);
  }
};

export default slotService;
