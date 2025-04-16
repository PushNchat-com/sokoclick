import { Profile } from './supabase';

export type Product = {
  id: string;
  name_en: string;
  name_fr?: string;
  description_en: string;
  description_fr?: string;
  image_urls: string[];
  starting_price: number;
  currency: string;
  condition: string;
  seller_id?: string;
  seller_whatsapp?: string;
  seller?: Profile | null;
  category?: string;
  approved?: boolean;
  status?: 'approved' | 'pending' | 'rejected';
};

export type AuctionSlot = {
  id: number;
  product_id: string | null;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  featured: boolean;
  view_count: number;
  product: Product | null;
  auction_state?: string;
  bid_count?: number;
  current_price?: number;
  seller_id?: string;
  buyer_id?: string | null;
  seller?: Profile | null;
  buyer?: Profile | null;
  final_price?: number;
  created_at?: string;
  updated_at?: string;
}; 