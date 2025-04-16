import { Database as SupabaseDatabase } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      auction_slots: {
        Row: {
          id: number;
          product_id: string | null;
          is_active: boolean;
          start_time: string | null;
          end_time: string | null;
          featured: boolean;
          view_count: number;
        };
        Insert: {
          id?: number;
          product_id?: string | null;
          is_active?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          featured?: boolean;
          view_count?: number;
        };
        Update: {
          id?: number;
          product_id?: string | null;
          is_active?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          featured?: boolean;
          view_count?: number;
        };
      };
      products: {
        Row: {
          id: string;
          name_en: string;
          name_fr: string;
          description_en: string;
          description_fr: string;
          image_urls: string[];
          starting_price: number;
          currency: string;
          condition: string;
          seller_id: string | null;
          seller_whatsapp: string;
        };
        Insert: {
          id?: string;
          name_en: string;
          name_fr: string;
          description_en: string;
          description_fr: string;
          image_urls?: string[];
          starting_price: number;
          currency?: string;
          condition?: string;
          seller_id?: string | null;
          seller_whatsapp: string;
        };
        Update: {
          id?: string;
          name_en?: string;
          name_fr?: string;
          description_en?: string;
          description_fr?: string;
          image_urls?: string[];
          starting_price?: number;
          currency?: string;
          condition?: string;
          seller_id?: string | null;
          seller_whatsapp?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          whatsapp_number: string;
        };
        Insert: {
          id: string;
          email: string;
          whatsapp_number: string;
        };
        Update: {
          id?: string;
          email?: string;
          whatsapp_number?: string;
        };
      };
    };
  };
}

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
};

export type Product = {
  id: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  image_urls: string[];
  starting_price: number;
  currency: string;
  condition: string;
  seller_id?: string;
  seller_whatsapp?: string;
  seller?: Profile | null;
  category?: string;
  approved?: boolean;
};

export type Profile = {
  id: string;
  email: string;
  whatsapp_number: string;
  display_name?: string;
  location?: string;
  rating?: number;
  joined_date?: string;
  bio?: string;
  profile_image?: string;
  verified?: boolean;
};

export type SupabaseClientWithTypes = SupabaseDatabase<Database>; 