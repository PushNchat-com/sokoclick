import { supabaseClient } from '../lib/supabase';

// Type for injecting a different client (useful for testing)
export type SupabaseClient = typeof supabaseClient;

// API class with injectable client for testing
export class UserAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabaseClient) {
    this.client = client;
  }

  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string) {
    if (!userId) throw new Error('User ID is required');
    
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update a user profile
   */
  async updateUserProfile(userId: string, updates: any) {
    if (!userId) throw new Error('User ID is required');
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Updates object is required');
    }
    
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  }
}

// Product API with injectable client
export class ProductAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabaseClient) {
    this.client = client;
  }

  /**
   * Get all products with optional pagination
   */
  async getProducts(limit = 20, offset = 0) {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  /**
   * Get products by seller ID
   */
  async getProductsBySellerId(sellerId: string, limit = 20, offset = 0) {
    if (!sellerId) throw new Error('Seller ID is required');
    
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  /**
   * Get a single product by ID
   */
  async getProductById(productId: string) {
    if (!productId) throw new Error('Product ID is required');
    
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Create a new product
   */
  async createProduct(productData: any) {
    if (!productData) throw new Error('Product data is required');
    if (!productData.seller_id) throw new Error('Seller ID is required in product data');
    
    const { data, error } = await this.client
      .from('products')
      .insert([productData]);
    
    if (error) throw error;
    return data?.[0];
  }

  /**
   * Update a product
   */
  async updateProduct(productId: string, updates: any) {
    if (!productId) throw new Error('Product ID is required');
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Updates object is required');
    }
    
    const { data, error } = await this.client
      .from('products')
      .update(updates)
      .eq('id', productId);
    
    if (error) throw error;
    return data;
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string) {
    if (!productId) throw new Error('Product ID is required');
    
    const { data, error } = await this.client
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
    return true;
  }
}

// Auction API with injectable client
export class AuctionAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabaseClient) {
    this.client = client;
  }

  /**
   * Get all auction slots
   */
  async getAuctionSlots(limit = 20, offset = 0) {
    const { data, error } = await this.client
      .from('auction_slots')
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  /**
   * Get active auction slots
   */
  async getActiveAuctionSlots(limit = 20, offset = 0) {
    const { data, error } = await this.client
      .from('auction_slots')
      .select('*')
      .eq('is_active', true)
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  /**
   * Get featured auction slots
   */
  async getFeaturedAuctionSlots(limit = 10) {
    const { data, error } = await this.client
      .from('auction_slots')
      .select('*')
      .eq('featured', true)
      .eq('is_active', true)
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  /**
   * Get auction slots by seller ID
   */
  async getAuctionSlotsBySellerId(sellerId: string, limit = 20, offset = 0) {
    if (!sellerId) throw new Error('Seller ID is required');
    
    // For this function, we'll need to join with products to get seller info
    const { data, error } = await this.client
      .from('auction_slots')
      .select(`
        *,
        product:products(*)
      `)
      .eq('product.seller_id', sellerId)
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  /**
   * Get a single auction slot by ID
   */
  async getAuctionSlotById(slotId: number) {
    if (!slotId) throw new Error('Slot ID is required');
    
    const { data, error } = await this.client
      .from('auction_slots')
      .select(`
        *,
        product:products(*)
      `)
      .eq('id', slotId)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Increment the view count for an auction slot
   */
  async incrementViewCount(slotId: number) {
    if (!slotId) throw new Error('Slot ID is required');
    
    // First get current view count
    const { data: slot, error: fetchError } = await this.client
      .from('auction_slots')
      .select('view_count')
      .eq('id', slotId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Then increment it
    const { data, error } = await this.client
      .from('auction_slots')
      .update({ view_count: (slot?.view_count || 0) + 1 })
      .eq('id', slotId);
    
    if (error) throw error;
    return data;
  }
}

// Export instances
export const userApi = new UserAPI();
export const productApi = new ProductAPI();
export const auctionApi = new AuctionAPI(); 