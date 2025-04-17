import { supabaseClient, handleError } from '../lib/supabase';
import { Product } from '../types/auctions';
import { AuctionSlot } from '../types/auctions';

/**
 * Service for managing auction-related operations with Supabase
 */
export const auctionService = {
  /**
   * Get products by seller ID
   */
  getProductsBySellerId: async (sellerId: string): Promise<Product[]> => {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          *,
          seller:users(
            id,
            email,
            whatsapp_number,
            role
          )
        `)
        .eq('seller_id', sellerId);

      if (error) throw handleError(error);
      
      return (data || []).map(product => ({
        ...product,
        seller: product.seller || null,
      }));
    } catch (error) {
      console.error('Error fetching products by seller ID:', error);
      throw error;
    }
  },

  /**
   * Get auction slots by seller ID
   */
  getAuctionSlotsBySellerId: async (sellerId: string): Promise<AuctionSlot[]> => {
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(
            *,
            seller:users(
              id,
              email,
              whatsapp_number,
              role
            )
          )
        `)
        .eq('product.seller_id', sellerId);

      if (error) throw handleError(error);
      
      return (data || []).map(slot => {
        // Determine auction state based on active and time fields
        let auction_state: 'scheduled' | 'active' | 'ended' | 'completed' | 'pending' = 'pending';
        
        const now = new Date();
        const startTime = slot.start_time ? new Date(slot.start_time) : null;
        const endTime = slot.end_time ? new Date(slot.end_time) : null;
        
        if (slot.is_active) {
          if (startTime && startTime > now) {
            auction_state = 'scheduled';
          } else if (endTime && endTime > now) {
            auction_state = 'active';
          } else if (endTime && endTime <= now) {
            auction_state = 'ended';
            // Further logic for completed state would be based on business rules 
            // (e.g., if a transaction was generated)
          }
        } else {
          auction_state = 'pending';
        }
        
        // Parse and format the slot to match the application's expected structure
        return {
          ...slot,
          id: slot.id,
          product_id: slot.product_id,
          product: slot.product || null,
          auction_state,
          view_count: slot.view_count || 0,
          is_active: !!slot.is_active,
          featured: !!slot.featured,
          seller: slot.product?.seller || null,
          seller_id: slot.product?.seller_id || null,
        } as AuctionSlot;
      });
    } catch (error) {
      console.error('Error fetching auction slots by seller ID:', error);
      throw error;
    }
  },
  
  /**
   * Get a single auction slot by ID
   */
  getAuctionSlotById: async (id: number): Promise<AuctionSlot | null> => {
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(
            *,
            seller:users(
              id,
              email,
              whatsapp_number,
              role
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw handleError(error);
      }
      
      if (!data) return null;
      
      // Determine auction state based on active and time fields
      let auction_state: 'scheduled' | 'active' | 'ended' | 'completed' | 'pending' = 'pending';
      
      const now = new Date();
      const startTime = data.start_time ? new Date(data.start_time) : null;
      const endTime = data.end_time ? new Date(data.end_time) : null;
      
      if (data.is_active) {
        if (startTime && startTime > now) {
          auction_state = 'scheduled';
        } else if (endTime && endTime > now) {
          auction_state = 'active';
        } else if (endTime && endTime <= now) {
          auction_state = 'ended';
        }
      } else {
        auction_state = 'pending';
      }
      
      // Increment view count
      await supabaseClient
        .from('auction_slots')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
      
      // Return the formatted auction slot
      return {
        ...data,
        id: data.id,
        product_id: data.product_id,
        product: data.product || null,
        auction_state,
        view_count: (data.view_count || 0) + 1, // Increment locally for immediate UI feedback
        is_active: !!data.is_active,
        featured: !!data.featured,
        seller: data.product?.seller || null,
        seller_id: data.product?.seller_id || null,
      } as AuctionSlot;
    } catch (error) {
      console.error('Error fetching auction slot by ID:', error);
      throw error;
    }
  },
  
  /**
   * Get all auction slots with pagination
   */
  getAuctionSlots: async (limit: number = 25, offset: number = 0): Promise<AuctionSlot[]> => {
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(
            *,
            seller:users(
              id,
              email,
              whatsapp_number,
              role
            )
          )
        `)
        .range(offset, offset + limit - 1);

      if (error) throw handleError(error);
      
      return (data || []).map(slot => {
        // Determine auction state
        let auction_state: 'scheduled' | 'active' | 'ended' | 'completed' | 'pending' = 'pending';
        
        const now = new Date();
        const startTime = slot.start_time ? new Date(slot.start_time) : null;
        const endTime = slot.end_time ? new Date(slot.end_time) : null;
        
        if (slot.is_active) {
          if (startTime && startTime > now) {
            auction_state = 'scheduled';
          } else if (endTime && endTime > now) {
            auction_state = 'active';
          } else if (endTime && endTime <= now) {
            auction_state = 'ended';
          }
        } else {
          auction_state = 'pending';
        }
        
        return {
          ...slot,
          auction_state,
          product: slot.product || null,
          view_count: slot.view_count || 0,
          is_active: !!slot.is_active,
          featured: !!slot.featured,
          seller: slot.product?.seller || null,
          seller_id: slot.product?.seller_id || null,
        } as AuctionSlot;
      });
    } catch (error) {
      console.error('Error fetching auction slots:', error);
      throw error;
    }
  },
  
  /**
   * Get featured auction slots
   */
  getFeaturedSlots: async (limit: number = 3): Promise<AuctionSlot[]> => {
    try {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(
            *,
            seller:users(
              id,
              email,
              whatsapp_number,
              role
            )
          )
        `)
        .eq('featured', true)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw handleError(error);
      
      return (data || []).map(slot => {
        // Determine auction state
        let auction_state: 'scheduled' | 'active' | 'ended' | 'completed' | 'pending' = 'pending';
        
        const now = new Date();
        const startTime = slot.start_time ? new Date(slot.start_time) : null;
        const endTime = slot.end_time ? new Date(slot.end_time) : null;
        
        if (slot.is_active) {
          if (startTime && startTime > now) {
            auction_state = 'scheduled';
          } else if (endTime && endTime > now) {
            auction_state = 'active';
          } else if (endTime && endTime <= now) {
            auction_state = 'ended';
          }
        } else {
          auction_state = 'pending';
        }
        
        return {
          ...slot,
          auction_state,
          product: slot.product || null,
          view_count: slot.view_count || 0,
          is_active: !!slot.is_active,
          featured: !!slot.featured,
          seller: slot.product?.seller || null,
          seller_id: slot.product?.seller_id || null,
        } as AuctionSlot;
      });
    } catch (error) {
      console.error('Error fetching featured auction slots:', error);
      throw error;
    }
  }
}; 