import { Profile } from './supabase';

/**
 * Product interface representing an item that can be auctioned
 */
export interface Product {
  id: string;
  name_en: string;
  name_fr?: string;
  description_en: string;
  description_fr?: string;
  image_urls: string[];
  starting_price: number;
  currency: string;
  condition: string;
  category: string;
  seller_id: string;
  seller_whatsapp?: string;
  seller?: Profile;
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Auction state type
 */
export type AuctionState = 
  | 'upcoming'
  | 'scheduled'
  | 'active'
  | 'pending'
  | 'ended'
  | 'completed'
  | 'cancelled'
  | 'failed';

/**
 * AuctionSlot interface representing a scheduled auction
 */
export interface AuctionSlot {
  id: number;
  product_id: string | null;
  seller_id?: string;
  buyer_id?: string | null;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  featured: boolean;
  view_count: number;
  bid_count?: number;
  current_price?: number;
  currency?: string;
  auction_state: AuctionState;
  product: Product | null;
  seller?: Profile;
  buyer?: Profile | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Bid interface representing a bid placed on an auction
 */
export interface Bid {
  id: string;
  auction_id: number;
  bidder_id: string;
  amount: number;
  currency: string;
  created_at: string;
  bidder?: Profile;
}

/**
 * AuctionFilter interface for filtering auctions
 */
export interface AuctionFilter {
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  state?: AuctionState[];
  sellerId?: string;
} 