import supabase from '../lib/supabase';
import type { AuctionSlot } from '../types/supabase';
import { ToastService } from '../utils/toast';

/**
 * Fetch auction slots with pagination and filtering
 */
export const getAuctionSlots = async (
  limit = 20,
  offset = 0,
  filters?: {
    isActive?: boolean;
    featured?: boolean;
    status?: string;
  },
  showToast = true
): Promise<{ data: AuctionSlot[]; count: number }> => {
  try {
    let query = supabase
      .from('auction_slots')
      .select('*, products(*)', { count: 'exact' });

    // Apply filters if provided
    if (filters) {
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('id', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Get a single auction slot by ID
 */
export const getAuctionSlotById = async (
  id: number, 
  showToast = true
): Promise<AuctionSlot | null> => {
  try {
    const { data, error } = await supabase
      .from('auction_slots')
      .select('*, products(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Get featured auction slots
 */
export const getFeaturedAuctionSlots = async (
  limit = 5,
  showToast = true
): Promise<AuctionSlot[]> => {
  try {
    const { data, error } = await supabase
      .from('auction_slots')
      .select('*, products(*)')
      .eq('featured', true)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(limit);

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Update an auction slot
 */
export const updateAuctionSlot = async (
  id: number,
  updates: Partial<AuctionSlot>,
  showToast = true
): Promise<AuctionSlot> => {
  try {
    const { data, error } = await supabase
      .from('auction_slots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    if (showToast) ToastService.success('Auction slot updated successfully');
    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Assign a product to an auction slot
 */
export const assignProductToSlot = async (
  slotId: number,
  productId: string,
  showToast = true
): Promise<AuctionSlot> => {
  try {
    const { data, error } = await supabase
      .from('auction_slots')
      .update({ product_id: productId })
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    if (showToast) ToastService.success('Product assigned to slot successfully');
    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Remove a product from an auction slot
 */
export const removeProductFromSlot = async (
  slotId: number,
  showToast = true
): Promise<AuctionSlot> => {
  try {
    const { data, error } = await supabase
      .from('auction_slots')
      .update({ product_id: null })
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }

    if (showToast) ToastService.success('Product removed from slot successfully');
    return data;
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
};

/**
 * Increment view count for an auction slot
 */
export const incrementViewCount = async (slotId: number, showToast = false): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_slot_views', { slot_id: slotId });

    if (error) {
      if (showToast) ToastService.apiError(error);
      throw new Error(error.message);
    }
  } catch (error) {
    if (showToast) ToastService.apiError(error);
    throw error;
  }
}; 