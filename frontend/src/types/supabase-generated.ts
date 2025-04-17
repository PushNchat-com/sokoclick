export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auction_slots: {
        Row: {
          commission_percentage: number | null
          end_time: string | null
          featured: boolean | null
          fee_amount: number | null
          id: number
          is_active: boolean | null
          pricing_model: string | null
          product_id: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          start_time: string | null
          view_count: number | null
        }
        Insert: {
          commission_percentage?: number | null
          end_time?: string | null
          featured?: boolean | null
          fee_amount?: number | null
          id: number
          is_active?: boolean | null
          pricing_model?: string | null
          product_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          start_time?: string | null
          view_count?: number | null
        }
        Update: {
          commission_percentage?: number | null
          end_time?: string | null
          featured?: boolean | null
          fee_amount?: number | null
          id?: number
          is_active?: boolean | null
          pricing_model?: string | null
          product_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          start_time?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_slots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          auction_slot_id: number | null
          id: string
          notification_sent: boolean | null
          product_id: string | null
          status: string | null
          time: string
          user_id: string | null
        }
        Insert: {
          amount: number
          auction_slot_id?: number | null
          id?: string
          notification_sent?: boolean | null
          product_id?: string | null
          status?: string | null
          time?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          auction_slot_id?: number | null
          id?: string
          notification_sent?: boolean | null
          product_id?: string | null
          status?: string | null
          time?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_auction_slot_id_fkey"
            columns: ["auction_slot_id"]
            isOneToOne: false
            referencedRelation: "auction_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content_en: string | null
          content_fr: string | null
          created_at: string
          id: string
          read: boolean | null
          related_product_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content_en?: string | null
          content_fr?: string | null
          created_at?: string
          id?: string
          read?: boolean | null
          related_product_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content_en?: string | null
          content_fr?: string | null
          created_at?: string
          id?: string
          read?: boolean | null
          related_product_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          auction_duration: number | null
          auction_end_time: string | null
          category: string | null
          condition: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_fr: string | null
          id: string
          image_urls: string[] | null
          name_en: string
          name_fr: string
          reserve_price: number | null
          seller_id: string | null
          seller_whatsapp: string
          shipping_options: Json | null
          starting_price: number
        }
        Insert: {
          auction_duration?: number | null
          auction_end_time?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_urls?: string[] | null
          name_en: string
          name_fr: string
          reserve_price?: number | null
          seller_id?: string | null
          seller_whatsapp: string
          shipping_options?: Json | null
          starting_price: number
        }
        Update: {
          auction_duration?: number | null
          auction_end_time?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_urls?: string[] | null
          name_en?: string
          name_fr?: string
          reserve_price?: number | null
          seller_id?: string | null
          seller_whatsapp?: string
          shipping_options?: Json | null
          starting_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string | null
          commission_amount: number | null
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          payment_method: string | null
          product_id: string | null
          seller_id: string | null
          status: string | null
          updated_at: string
          whatsapp_thread_id: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          commission_amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string
          whatsapp_thread_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          commission_amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_id?: string | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string
          whatsapp_thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          language_preference: string | null
          last_login: string | null
          location: string | null
          notification_preferences: Json | null
          payment_methods: Json | null
          phone_number: string | null
          role: string | null
          whatsapp_number: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language_preference?: string | null
          last_login?: string | null
          location?: string | null
          notification_preferences?: Json | null
          payment_methods?: Json | null
          phone_number?: string | null
          role?: string | null
          whatsapp_number: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language_preference?: string | null
          last_login?: string | null
          location?: string | null
          notification_preferences?: Json | null
          payment_methods?: Json | null
          phone_number?: string | null
          role?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          last_message: string | null
          last_message_timestamp: string | null
          product_id: string | null
          product_image: string | null
          product_name: string
          seller_id: string | null
          status: string | null
          thread_id: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_timestamp?: string | null
          product_id?: string | null
          product_image?: string | null
          product_name: string
          seller_id?: string | null
          status?: string | null
          thread_id: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_timestamp?: string | null
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          seller_id?: string | null
          status?: string | null
          thread_id?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          sender: string | null
          timestamp: string
          type: string | null
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          sender?: string | null
          timestamp?: string
          type?: string | null
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          sender?: string | null
          timestamp?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 