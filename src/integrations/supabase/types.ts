export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      car_reviews: {
        Row: {
          car_id: string
          created_at: string
          id: string
          rating: number
          review_text: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          rating: number
          review_text: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          car_id: string | null
          created_at: string
          customer_id: string
          customer_unread_count: number
          dealer_id: string
          dealer_unread_count: number
          id: string
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string
          customer_id: string
          customer_unread_count?: number
          dealer_id: string
          dealer_unread_count?: number
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          car_id?: string | null
          created_at?: string
          customer_id?: string
          customer_unread_count?: number
          dealer_id?: string
          dealer_unread_count?: number
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "dealer_cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_typing_status: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_typing_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_history: {
        Row: {
          car_ids: string[]
          car_names: string[]
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          car_ids: string[]
          car_names: string[]
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          car_ids?: string[]
          car_names?: string[]
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dealer_car_notifications: {
        Row: {
          car_id: string
          created_at: string
          dealer_id: string
          id: string
          is_read: boolean
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          dealer_id: string
          id?: string
          is_read?: boolean
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          dealer_id?: string
          id?: string
          is_read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_car_notifications_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "dealer_cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_car_notifications_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_cars: {
        Row: {
          brand: string
          category: string
          created_at: string
          dealer_id: string
          description: string | null
          engine: string | null
          fuel_type: string
          id: string
          image_url: string | null
          is_active: boolean
          mileage: string | null
          name: string
          power: string | null
          price: number
          seating_capacity: number
          transmission: string
          updated_at: string
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          dealer_id: string
          description?: string | null
          engine?: string | null
          fuel_type: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          mileage?: string | null
          name: string
          power?: string | null
          price: number
          seating_capacity?: number
          transmission: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          dealer_id?: string
          description?: string | null
          engine?: string | null
          fuel_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          mileage?: string | null
          name?: string
          power?: string | null
          price?: number
          seating_capacity?: number
          transmission?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_cars_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_reviews: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          rating: number
          review_text: string | null
          test_drive_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id?: string
          rating: number
          review_text?: string | null
          test_drive_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          rating?: number
          review_text?: string | null
          test_drive_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_reviews_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_reviews_test_drive_id_fkey"
            columns: ["test_drive_id"]
            isOneToOne: true
            referencedRelation: "test_drive_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      dealers: {
        Row: {
          address: string | null
          city: string
          created_at: string
          dealership_name: string
          id: string
          is_active: boolean
          phone: string | null
          profile_image_url: string | null
          subscription_end_date: string | null
          subscription_plan: string
          subscription_start_date: string | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          address?: string | null
          city: string
          created_at?: string
          dealership_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          profile_image_url?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string
          subscription_start_date?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          address?: string | null
          city?: string
          created_at?: string
          dealership_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          profile_image_url?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string
          subscription_start_date?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      email_branding: {
        Row: {
          company_name: string
          created_at: string
          facebook_url: string | null
          footer_text: string
          id: string
          instagram_url: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          facebook_url?: string | null
          footer_text?: string
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          facebook_url?: string | null
          footer_text?: string
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_template_versions: {
        Row: {
          body_html: string
          change_description: string | null
          changed_by: string
          created_at: string
          id: string
          subject: string
          template_id: string
          version_number: number
        }
        Insert: {
          body_html: string
          change_description?: string | null
          changed_by: string
          created_at?: string
          id?: string
          subject: string
          template_id: string
          version_number?: number
        }
        Update: {
          body_html?: string
          change_description?: string | null
          changed_by?: string
          created_at?: string
          id?: string
          subject?: string
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          description: string | null
          id: string
          name: string
          subject: string
          template_key: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          body_html: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          subject: string
          template_key: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body_html?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subject?: string
          template_key?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      favorite_dealers: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_dealers_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          car_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          car_id: string
          created_at: string
          id: string
          is_triggered: boolean
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          is_triggered?: boolean
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          is_triggered?: boolean
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "dealer_cars"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          car_id: string
          dealer_id: string
          id: string
          price: number
          recorded_at: string
        }
        Insert: {
          car_id: string
          dealer_id: string
          id?: string
          price: number
          recorded_at?: string
        }
        Update: {
          car_id?: string
          dealer_id?: string
          id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "dealer_cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_replies: {
        Row: {
          created_at: string
          id: string
          reply_text: string
          review_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_text: string
          review_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_text?: string
          review_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "car_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "car_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_upgrade_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_plan: string
          dealer_id: string
          id: string
          requested_plan: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_plan: string
          dealer_id: string
          id?: string
          requested_plan: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_plan?: string
          dealer_id?: string
          id?: string
          requested_plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_upgrade_requests_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      test_drive_inquiries: {
        Row: {
          car_id: string
          car_name: string
          completed_at: string | null
          created_at: string
          dealer_id: string | null
          dealer_review: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string
          preferred_date: string
          preferred_time: string
          status: string
          user_id: string | null
        }
        Insert: {
          car_id: string
          car_name: string
          completed_at?: string | null
          created_at?: string
          dealer_id?: string | null
          dealer_review?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone: string
          preferred_date: string
          preferred_time: string
          status?: string
          user_id?: string | null
        }
        Update: {
          car_id?: string
          car_name?: string
          completed_at?: string | null
          created_at?: string
          dealer_id?: string | null
          dealer_review?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drive_inquiries_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dealer_car_count: { Args: { _dealer_id: string }; Returns: number }
      get_dealer_car_limit: { Args: { _dealer_id: string }; Returns: number }
      get_dealer_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_dealer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "dealer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "dealer"],
    },
  },
} as const
