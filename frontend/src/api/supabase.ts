import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env file.');
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// Create Supabase client with types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Helper functions for common database operations
export const supabaseHelper = {
  // Authentication helpers
  auth: {
    getCurrentUser: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  },
  
  // User profile helpers
  profiles: {
    getProfile: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    updateProfile: async (userId: string, updates: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
      return data;
    },
  },
  
  // Products helpers
  products: {
    getProducts: async (limit = 20, offset = 0) => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data;
    },
    
    getProductById: async (productId: string) => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    createProduct: async (productData: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();
      
      if (error) throw error;
      return data[0];
    },
  },
  
  // Auction slots helpers
  auctionSlots: {
    getAuctionSlots: async (limit = 25) => {
      const { data, error } = await supabase
        .from('auction_slots')
        .select(`
          *,
          product:products(*)
        `)
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
    
    getAuctionSlotById: async (slotId: number) => {
      const { data, error } = await supabase
        .from('auction_slots')
        .select(`
          *,
          product:products(*)
        `)
        .eq('id', slotId)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    updateAuctionSlot: async (slotId: number, updates: any) => {
      const { data, error } = await supabase
        .from('auction_slots')
        .update(updates)
        .eq('id', slotId)
        .select();
      
      if (error) throw error;
      return data[0];
    },
  },
  
  // Bids helpers
  bids: {
    createBid: async (bidData: any) => {
      const { data, error } = await supabase
        .from('bids')
        .insert([bidData])
        .select();
      
      if (error) throw error;
      return data[0];
    },
    
    getBidsForProduct: async (productId: string) => {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('product_id', productId)
        .order('amount', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  },
};

export default supabase;
