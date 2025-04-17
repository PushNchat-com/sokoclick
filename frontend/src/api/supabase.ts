import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase-generated';
import { getErrorMessage } from '../utils/error';
import { AuctionSlot } from '../types/auctions';
import { supabaseClient as supabase, handleError } from '../lib/supabase';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env file.');
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// Create Supabase client with types
export const supabaseClient = supabase;

// Type for auction slot insert/update
type AuctionSlotInsert = Omit<Database['public']['Tables']['auction_slots']['Insert'], 'id'> & { id?: number };
type AuctionSlotUpdate = Database['public']['Tables']['auction_slots']['Update'];

// Helper functions for common database operations
export const supabaseHelper = {
  // Authentication helpers
  auth: {
    getCurrentUser: async () => {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) throw handleError(error);
      return data.user;
    },
  },
  
  // User helpers
  users: {
    getUser: async (userId: string) => {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw handleError(error);
      return data;
    },
    
    updateUser: async (userId: string, updates: any) => {
      const { data, error } = await supabaseClient
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw handleError(error);
      return data;
    },
  },
  
  // Products helpers
  products: {
    getProducts: async (limit = 20, offset = 0) => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (error) throw handleError(error);
      return data;
    },
    
    getProductById: async (productId: string) => {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw handleError(error);
      return data;
    },
    
    createProduct: async (productData: any) => {
      const { data, error } = await supabaseClient
        .from('products')
        .insert([productData])
        .select();
      
      if (error) throw handleError(error);
      return data[0];
    },
  },
  
  // Auction slots helpers
  auctionSlots: {
    /**
     * Get auction slots with optional filtering
     * @param limit Number of auction slots to get
     * @param filter Optional filter: 'active', 'scheduled', 'ended', 'featured'
     */
    getAuctionSlots: async (limit = 25, filter = '') => {
      let query = supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(id, name, description, price, image_url, category, condition),
          seller:users!seller_id(id, full_name, email, avatar_url, phone_number),
          buyer:users!buyer_id(id, full_name, email, avatar_url)
        `)
        .order('id', { ascending: false })
        .limit(limit);
      
      // Apply filters based on auction_state column
      if (filter === 'active') {
        query = query.eq('auction_state', 'active');
      } else if (filter === 'scheduled') {
        query = query.eq('auction_state', 'scheduled');
      } else if (filter === 'ended') {
        query = query.eq('auction_state', 'ended');
      } else if (filter === 'featured') {
        query = query.eq('featured', true);
      }

      const { data, error } = await query;
      
      if (error) throw handleError(error);
      return data || [];
    },

    /**
     * Get a single auction slot by ID
     */
    getAuctionSlotById: async (id: number) => {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(id, name, description, price, image_url, category, condition),
          seller:users!seller_id(id, full_name, email, avatar_url, phone_number),
          buyer:users!buyer_id(id, full_name, email, avatar_url)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw handleError(error);
      return data;
    },

    /**
     * Get auction slots for a specific seller
     */
    getSellerAuctions: async (sellerId: string) => {
      const { data, error } = await supabaseClient
        .from('auction_slots')
        .select(`
          *,
          product:products(id, name, description, price, image_url, category, condition),
          seller:users!seller_id(id, full_name, email, avatar_url, phone_number),
          buyer:users!buyer_id(id, full_name, email, avatar_url)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw handleError(error);
      return data;
    },
  },
};