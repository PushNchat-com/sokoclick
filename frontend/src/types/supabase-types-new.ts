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
      analytics_events: {
        Row: {
          additional_data: Json | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          language: string | null
          session_id: string | null
          slot_id: number | null
          user_id: string | null
          whatsapp_contact: boolean | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          language?: string | null
          session_id?: string | null
          slot_id?: number | null
          user_id?: string | null
          whatsapp_contact?: boolean | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          language?: string | null
          session_id?: string | null
          slot_id?: number | null
          user_id?: string | null
          whatsapp_contact?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "auction_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auction_slots: {
        Row: {
          created_at: string
          draft_product_categories: string[] | null
          draft_product_currency: string | null
          draft_product_delivery_options: Json | null
          draft_product_description_en: string | null
          draft_product_description_fr: string | null
          draft_product_image_urls: string[] | null
          draft_product_name_en: string | null
          draft_product_name_fr: string | null
          draft_product_price: number | null
          draft_product_tags: string[] | null
          draft_seller_whatsapp_number: string | null
          draft_status: string
          draft_updated_at: string | null
          end_time: string | null
          featured: boolean | null
          id: number
          live_product_categories: string[] | null
          live_product_currency: string | null
          live_product_delivery_options: Json | null
          live_product_description_en: string | null
          live_product_description_fr: string | null
          live_product_image_urls: string[] | null
          live_product_name_en: string | null
          live_product_name_fr: string | null
          live_product_price: number | null
          live_product_seller_id: string | null
          live_product_tags: string[] | null
          slot_status: string
          start_time: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          draft_product_categories?: string[] | null
          draft_product_currency?: string | null
          draft_product_delivery_options?: Json | null
          draft_product_description_en?: string | null
          draft_product_description_fr?: string | null
          draft_product_image_urls?: string[] | null
          draft_product_name_en?: string | null
          draft_product_name_fr?: string | null
          draft_product_price?: number | null
          draft_product_tags?: string[] | null
          draft_seller_whatsapp_number?: string | null
          draft_status?: string
          draft_updated_at?: string | null
          end_time?: string | null
          featured?: boolean | null
          id: number
          live_product_categories?: string[] | null
          live_product_currency?: string | null
          live_product_delivery_options?: Json | null
          live_product_description_en?: string | null
          live_product_description_fr?: string | null
          live_product_image_urls?: string[] | null
          live_product_name_en?: string | null
          live_product_name_fr?: string | null
          live_product_price?: number | null
          live_product_seller_id?: string | null
          live_product_tags?: string[] | null
          slot_status?: string
          start_time?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          draft_product_categories?: string[] | null
          draft_product_currency?: string | null
          draft_product_delivery_options?: Json | null
          draft_product_description_en?: string | null
          draft_product_description_fr?: string | null
          draft_product_image_urls?: string[] | null
          draft_product_name_en?: string | null
          draft_product_name_fr?: string | null
          draft_product_price?: number | null
          draft_product_tags?: string[] | null
          draft_seller_whatsapp_number?: string | null
          draft_status?: string
          draft_updated_at?: string | null
          end_time?: string | null
          featured?: boolean | null
          id?: number
          live_product_categories?: string[] | null
          live_product_currency?: string | null
          live_product_delivery_options?: Json | null
          live_product_description_en?: string | null
          live_product_description_fr?: string | null
          live_product_image_urls?: string[] | null
          live_product_name_en?: string | null
          live_product_name_fr?: string | null
          live_product_price?: number | null
          live_product_seller_id?: string | null
          live_product_tags?: string[] | null
          slot_status?: string
          start_time?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_slots_live_product_seller_id_fkey"
            columns: ["live_product_seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_verified: boolean | null
          joined_date: string | null
          location: string | null
          name: string | null
          role: string
          updated_at: string
          verification_date: string | null
          verification_level: string | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_verified?: boolean | null
          joined_date?: string | null
          location?: string | null
          name?: string | null
          role?: string
          updated_at?: string
          verification_date?: string | null
          verification_level?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_verified?: boolean | null
          joined_date?: string | null
          location?: string | null
          name?: string | null
          role?: string
          updated_at?: string
          verification_date?: string | null
          verification_level?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// --- Add Enums for Statuses ---
export enum SlotStatus {
  Empty = 'empty',
  Live = 'live',
  Maintenance = 'maintenance'
}

export enum DraftStatus {
  Empty = 'empty',
  Drafting = 'drafting',
  ReadyToPublish = 'ready_to_publish'
}
// --- End Enums --- 