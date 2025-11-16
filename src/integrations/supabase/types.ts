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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          agent_id: string
          cart_items: Json
          cart_total: number
          conversation_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          products_mentioned_in_chat: Json | null
          recovered: boolean | null
          recovered_at: string | null
          recovery_attempted: boolean | null
          recovery_message_sent_at: string | null
          session_id: string
          shopify_checkout_url: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          cart_items: Json
          cart_total: number
          conversation_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          products_mentioned_in_chat?: Json | null
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_attempted?: boolean | null
          recovery_message_sent_at?: string | null
          session_id: string
          shopify_checkout_url?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          cart_items?: Json
          cart_total?: number
          conversation_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          products_mentioned_in_chat?: Json | null
          recovered?: boolean | null
          recovered_at?: string | null
          recovery_attempted?: boolean | null
          recovery_message_sent_at?: string | null
          session_id?: string
          shopify_checkout_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_actions: {
        Row: {
          action_type: string
          agent_id: string
          config_json: Json
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          action_type: string
          agent_id: string
          config_json?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          action_type?: string
          agent_id?: string
          config_json?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_agent_actions_agent_id"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversions: {
        Row: {
          agent_id: string
          attributed_revenue: number | null
          attribution_confidence: number | null
          attribution_type: string | null
          conversation_id: string | null
          conversation_ids: string[] | null
          conversion_type: string
          created_at: string | null
          currency: string | null
          id: string
          order_id: string | null
          order_total: number | null
          products_purchased: Json | null
          products_recommended: Json | null
          session_id: string
        }
        Insert: {
          agent_id: string
          attributed_revenue?: number | null
          attribution_confidence?: number | null
          attribution_type?: string | null
          conversation_id?: string | null
          conversation_ids?: string[] | null
          conversion_type: string
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          order_total?: number | null
          products_purchased?: Json | null
          products_recommended?: Json | null
          session_id: string
        }
        Update: {
          agent_id?: string
          attributed_revenue?: number | null
          attribution_confidence?: number | null
          attribution_type?: string | null
          conversation_id?: string | null
          conversation_ids?: string[] | null
          conversion_type?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          order_total?: number | null
          products_purchased?: Json | null
          products_recommended?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_crawl_pages: {
        Row: {
          agent_link_id: string
          content: string | null
          created_at: string
          id: string
          markdown: string | null
          metadata_json: Json | null
          status: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          agent_link_id: string
          content?: string | null
          created_at?: string
          id?: string
          markdown?: string | null
          metadata_json?: Json | null
          status?: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          agent_link_id?: string
          content?: string | null
          created_at?: string
          id?: string
          markdown?: string | null
          metadata_json?: Json | null
          status?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_crawl_pages_agent_link_id_fkey"
            columns: ["agent_link_id"]
            isOneToOne: false
            referencedRelation: "agent_links"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ecommerce_metrics: {
        Row: {
          agent_id: string
          average_order_value: number | null
          carts_recovered: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          id: string
          product_recommendations_shown: number | null
          products_clicked: number | null
          recovery_attempts_sent: number | null
          recovery_clicks: number | null
          recovery_conversions: number | null
          recovery_revenue: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Insert: {
          agent_id: string
          average_order_value?: number | null
          carts_recovered?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          id?: string
          product_recommendations_shown?: number | null
          products_clicked?: number | null
          recovery_attempts_sent?: number | null
          recovery_clicks?: number | null
          recovery_conversions?: number | null
          recovery_revenue?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Update: {
          agent_id?: string
          average_order_value?: number | null
          carts_recovered?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          id?: string
          product_recommendations_shown?: number | null
          products_clicked?: number | null
          recovery_attempts_sent?: number | null
          recovery_clicks?: number | null
          recovery_conversions?: number | null
          recovery_revenue?: number | null
          total_orders?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_ecommerce_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_chunks: {
        Row: {
          agent_id: string
          chunk_index: number
          chunk_text: string
          created_at: string
          id: string
          metadata_json: Json | null
          source_id: string
          source_type: string
          token_count: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          chunk_index: number
          chunk_text: string
          created_at?: string
          id?: string
          metadata_json?: Json | null
          source_id: string
          source_type: string
          token_count?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          id?: string
          metadata_json?: Json | null
          source_id?: string
          source_type?: string
          token_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_links: {
        Row: {
          agent_id: string
          content: string | null
          crawl_job_id: string | null
          crawl_limit: number | null
          crawl_mode: string
          created_at: string
          id: string
          pages_found: number | null
          pages_processed: number | null
          status: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          agent_id: string
          content?: string | null
          crawl_job_id?: string | null
          crawl_limit?: number | null
          crawl_mode?: string
          created_at?: string
          id?: string
          pages_found?: number | null
          pages_processed?: number | null
          status?: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          agent_id?: string
          content?: string | null
          crawl_job_id?: string | null
          crawl_limit?: number | null
          crawl_mode?: string
          created_at?: string
          id?: string
          pages_found?: number | null
          pages_processed?: number | null
          status?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      agent_monthly_visitors: {
        Row: {
          agent_id: string
          created_at: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          month: string
          session_count: number | null
          visitor_fingerprint: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          month: string
          session_count?: number | null
          visitor_fingerprint: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          month?: string
          session_count?: number | null
          visitor_fingerprint?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_monthly_visitors_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_product_catalog: {
        Row: {
          agent_id: string
          available_for_sale: boolean | null
          compare_at_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          handle: string | null
          id: string
          image_url: string | null
          inventory_quantity: number | null
          inventory_tracked: boolean | null
          is_active: boolean | null
          last_synced_at: string | null
          price: number | null
          product_data: Json | null
          product_id: string
          product_name: string | null
          product_sku: string | null
          product_type: string | null
          product_url: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          variants: Json | null
          vendor: string | null
        }
        Insert: {
          agent_id: string
          available_for_sale?: boolean | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          inventory_tracked?: boolean | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number | null
          product_data?: Json | null
          product_id: string
          product_name?: string | null
          product_sku?: string | null
          product_type?: string | null
          product_url?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          variants?: Json | null
          vendor?: string | null
        }
        Update: {
          agent_id?: string
          available_for_sale?: boolean | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          handle?: string | null
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          inventory_tracked?: boolean | null
          is_active?: boolean | null
          last_synced_at?: string | null
          price?: number | null
          product_data?: Json | null
          product_id?: string
          product_name?: string | null
          product_sku?: string | null
          product_type?: string | null
          product_url?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          variants?: Json | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_product_catalog_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_qna_knowledge: {
        Row: {
          agent_id: string
          answer: string
          created_at: string
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          answer: string
          created_at?: string
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          answer?: string
          created_at?: string
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_text_knowledge: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          chat_interface_theme: string | null
          created_at: string
          creativity_level: number | null
          description: string | null
          enable_lead_capture: boolean | null
          enable_proactive_engagement: boolean | null
          id: string
          initial_message: string | null
          instructions: string
          lead_capture_config: Json | null
          message_bubble_color: string | null
          name: string
          proactive_config: Json | null
          profile_image_url: string | null
          shopify_config: Json | null
          status: string | null
          updated_at: string
          user_id: string
          widget_excluded_pages: string[] | null
          widget_page_restrictions: string[] | null
          workspace_id: string | null
        }
        Insert: {
          chat_interface_theme?: string | null
          created_at?: string
          creativity_level?: number | null
          description?: string | null
          enable_lead_capture?: boolean | null
          enable_proactive_engagement?: boolean | null
          id?: string
          initial_message?: string | null
          instructions: string
          lead_capture_config?: Json | null
          message_bubble_color?: string | null
          name: string
          proactive_config?: Json | null
          profile_image_url?: string | null
          shopify_config?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          widget_excluded_pages?: string[] | null
          widget_page_restrictions?: string[] | null
          workspace_id?: string | null
        }
        Update: {
          chat_interface_theme?: string | null
          created_at?: string
          creativity_level?: number | null
          description?: string | null
          enable_lead_capture?: boolean | null
          enable_proactive_engagement?: boolean | null
          id?: string
          initial_message?: string | null
          instructions?: string
          lead_capture_config?: Json | null
          message_bubble_color?: string | null
          name?: string
          proactive_config?: Json | null
          profile_image_url?: string | null
          shopify_config?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          widget_excluded_pages?: string[] | null
          widget_page_restrictions?: string[] | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      cart_events: {
        Row: {
          agent_id: string
          cart_total: number | null
          created_at: string | null
          currency: string | null
          event_type: string
          id: string
          product_data: Json | null
          session_id: string
        }
        Insert: {
          agent_id: string
          cart_total?: number | null
          created_at?: string | null
          currency?: string | null
          event_type: string
          id?: string
          product_data?: Json | null
          session_id: string
        }
        Update: {
          agent_id?: string
          cart_total?: number | null
          created_at?: string | null
          currency?: string | null
          event_type?: string
          id?: string
          product_data?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          created_at: string
          deleted_at: string | null
          id: string
          session_id: string
          visitor_session_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          session_id: string
          visitor_session_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          session_id?: string
          visitor_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_visitor_session_id_fkey"
            columns: ["visitor_session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      customer_analytics: {
        Row: {
          agent_id: string
          average_order_value: number | null
          created_at: string | null
          customer_segment: string | null
          days_since_last_order: number | null
          email: string | null
          first_order_date: string | null
          id: string
          last_order_date: string | null
          shopify_customer_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          average_order_value?: number | null
          created_at?: string | null
          customer_segment?: string | null
          days_since_last_order?: number | null
          email?: string | null
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          shopify_customer_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          average_order_value?: number | null
          created_at?: string | null
          customer_segment?: string | null
          days_since_last_order?: number | null
          email?: string | null
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          shopify_customer_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_analytics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_id: string | null
          id: string
          processed: boolean
          processed_at: string | null
          request_payload: Json
          request_type: string
          shop_domain: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          processed?: boolean
          processed_at?: string | null
          request_payload?: Json
          request_type: string
          shop_domain: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          processed?: boolean
          processed_at?: string | null
          request_payload?: Json
          request_type?: string
          shop_domain?: string
        }
        Relationships: []
      }
      inventory_snapshot: {
        Row: {
          agent_id: string
          available: number | null
          id: string
          inventory_item_id: string
          product_id: string
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          agent_id: string
          available?: number | null
          id?: string
          inventory_item_id: string
          product_id: string
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          agent_id?: string
          available?: number | null
          id?: string
          inventory_item_id?: string
          product_id?: string
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshot_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_files: {
        Row: {
          agent_id: string
          content_type: string
          created_at: string
          file_path: string
          file_size: number
          filename: string
          id: string
          processed_content: string | null
        }
        Insert: {
          agent_id: string
          content_type: string
          created_at?: string
          file_path: string
          file_size: number
          filename: string
          id?: string
          processed_content?: string | null
        }
        Update: {
          agent_id?: string
          content_type?: string
          created_at?: string
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          processed_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          lead_data_json: Json
        }
        Insert: {
          agent_id: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_data_json?: Json
        }
        Update: {
          agent_id?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_data_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_agent_id"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leads_conversation_id"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_suggestions: {
        Row: {
          agent_id: string | null
          behavioral_triggers: Json | null
          confidence_score: number | null
          conversation_started: boolean | null
          created_at: string
          id: string
          session_id: string
          suggestion_message: string
          suggestion_type: string
          was_clicked: boolean | null
          was_shown: boolean | null
        }
        Insert: {
          agent_id?: string | null
          behavioral_triggers?: Json | null
          confidence_score?: number | null
          conversation_started?: boolean | null
          created_at?: string
          id?: string
          session_id: string
          suggestion_message: string
          suggestion_type: string
          was_clicked?: boolean | null
          was_shown?: boolean | null
        }
        Update: {
          agent_id?: string | null
          behavioral_triggers?: Json | null
          confidence_score?: number | null
          conversation_started?: boolean | null
          created_at?: string
          id?: string
          session_id?: string
          suggestion_message?: string
          suggestion_type?: string
          was_clicked?: boolean | null
          was_shown?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "proactive_suggestions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proactive_suggestions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          added_to_cart: boolean | null
          agent_id: string | null
          clicked: boolean | null
          clicked_at: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          product_id: string
          purchased: boolean | null
          recommendation_context: string | null
          recommended_at: string | null
          revenue_attributed: number | null
        }
        Insert: {
          added_to_cart?: boolean | null
          agent_id?: string | null
          clicked?: boolean | null
          clicked_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          purchased?: boolean | null
          recommendation_context?: string | null
          recommended_at?: string | null
          revenue_attributed?: number | null
        }
        Update: {
          added_to_cart?: boolean | null
          agent_id?: string | null
          clicked?: boolean | null
          clicked_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          purchased?: boolean | null
          recommendation_context?: string | null
          recommended_at?: string | null
          revenue_attributed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_provider: string | null
          cart_recovery_limit: number | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          monthly_visitors_limit: number | null
          phone: string | null
          plan: string | null
          products_limit: number | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          billing_provider?: string | null
          cart_recovery_limit?: number | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          monthly_visitors_limit?: number | null
          phone?: string | null
          plan?: string | null
          products_limit?: number | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          billing_provider?: string | null
          cart_recovery_limit?: number | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          monthly_visitors_limit?: number | null
          phone?: string | null
          plan?: string | null
          products_limit?: number | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_cache: {
        Row: {
          agent_id: string
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          query_hash: string
          response_text: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          query_hash: string
          response_text: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          query_hash?: string
          response_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "query_cache_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_connections: {
        Row: {
          agent_id: string
          connected_at: string | null
          deleted_at: string | null
          encrypted_access_token: string
          granted_scopes: string[] | null
          id: string
          last_verified: string | null
          revoked: boolean | null
          shop_domain: string
          shop_owner_email: string | null
          shop_owner_name: string | null
        }
        Insert: {
          agent_id: string
          connected_at?: string | null
          deleted_at?: string | null
          encrypted_access_token: string
          granted_scopes?: string[] | null
          id?: string
          last_verified?: string | null
          revoked?: boolean | null
          shop_domain: string
          shop_owner_email?: string | null
          shop_owner_name?: string | null
        }
        Update: {
          agent_id?: string
          connected_at?: string | null
          deleted_at?: string | null
          encrypted_access_token?: string
          granted_scopes?: string[] | null
          id?: string
          last_verified?: string | null
          revoked?: boolean | null
          shop_domain?: string
          shop_owner_email?: string | null
          shop_owner_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_connections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_oauth_states: {
        Row: {
          agent_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          shop_domain: string
          state: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          shop_domain: string
          state: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          shop_domain?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_oauth_states_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_orders: {
        Row: {
          agent_id: string
          attributed_conversation_id: string | null
          attribution_confidence: number | null
          attribution_type: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_shopify_id: string | null
          id: string
          line_items: Json
          note: string | null
          order_created_at: string
          order_id: string
          order_number: string | null
          tags: string[] | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          attributed_conversation_id?: string | null
          attribution_confidence?: number | null
          attribution_type?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_shopify_id?: string | null
          id?: string
          line_items?: Json
          note?: string | null
          order_created_at: string
          order_id: string
          order_number?: string | null
          tags?: string[] | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          attributed_conversation_id?: string | null
          attribution_confidence?: number | null
          attribution_type?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_shopify_id?: string | null
          id?: string
          line_items?: Json
          note?: string | null
          order_created_at?: string
          order_id?: string
          order_number?: string | null
          tags?: string[] | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopify_orders_attributed_conversation_id_fkey"
            columns: ["attributed_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_pending_installs: {
        Row: {
          completed: boolean
          created_at: string
          expires_at: string
          id: string
          shop_domain: string
          shop_owner_email: string | null
          shop_owner_name: string | null
          state: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          shop_domain: string
          shop_owner_email?: string | null
          shop_owner_name?: string | null
          state: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          shop_domain?: string
          shop_owner_email?: string | null
          shop_owner_name?: string | null
          state?: string
        }
        Relationships: []
      }
      shopify_subscriptions: {
        Row: {
          agent_id: string
          amount: number | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_name: string
          shop_domain: string
          status: string
          subscription_id: string
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          amount?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_name: string
          shop_domain: string
          status: string
          subscription_id: string
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_name?: string
          shop_domain?: string
          status?: string
          subscription_id?: string
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_webhook_events: {
        Row: {
          id: string
          payload: Json
          processed: boolean | null
          received_at: string | null
          shop_domain: string
          topic: string
        }
        Insert: {
          id?: string
          payload: Json
          processed?: boolean | null
          received_at?: string | null
          shop_domain: string
          topic: string
        }
        Update: {
          id?: string
          payload?: Json
          processed?: boolean | null
          received_at?: string | null
          shop_domain?: string
          topic?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          cart_recovery_attempts: number | null
          conversations_count: number | null
          created_at: string
          id: string
          message_credits_used: number | null
          messages_count: number | null
          month: string
          storage_used_bytes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cart_recovery_attempts?: number | null
          conversations_count?: number | null
          created_at?: string
          id?: string
          message_credits_used?: number | null
          messages_count?: number | null
          month: string
          storage_used_bytes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cart_recovery_attempts?: number | null
          conversations_count?: number | null
          created_at?: string
          id?: string
          message_credits_used?: number | null
          messages_count?: number | null
          month?: string
          storage_used_bytes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_usage_tracking_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          marketing_emails: boolean
          updated_at: string
          user_id: string
          weekly_reports: boolean
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          updated_at?: string
          user_id: string
          weekly_reports?: boolean
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          updated_at?: string
          user_id?: string
          weekly_reports?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      visitor_behavior_events: {
        Row: {
          created_at: string
          element_selector: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_url: string
          scroll_depth: number | null
          session_id: string
          time_on_page: number | null
        }
        Insert: {
          created_at?: string
          element_selector?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_url: string
          scroll_depth?: number | null
          session_id: string
          time_on_page?: number | null
        }
        Update: {
          created_at?: string
          element_selector?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string
          scroll_depth?: number | null
          session_id?: string
          time_on_page?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_behavior_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          agent_id: string | null
          country_code: string | null
          created_at: string
          current_page_url: string | null
          first_page_url: string | null
          id: string
          ip_address: unknown
          referrer: string | null
          session_id: string
          total_page_views: number | null
          total_time_spent: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          agent_id?: string | null
          country_code?: string | null
          created_at?: string
          current_page_url?: string | null
          first_page_url?: string | null
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id: string
          total_page_views?: number | null
          total_time_spent?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          agent_id?: string | null
          country_code?: string | null
          created_at?: string
          current_page_url?: string | null
          first_page_url?: string | null
          id?: string
          ip_address?: unknown
          referrer?: string | null
          session_id?: string
          total_page_views?: number | null
          total_time_spent?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_access_profile_data: {
        Args: { access_reason: string; target_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          id: string
          phone: string
          plan: string
          updated_at: string
          user_id: string
        }[]
      }
      admin_emergency_profile_access: {
        Args: { access_reason: string; target_user_id: string }
        Returns: {
          access_warning: string
          created_at: string
          display_name: string
          email: string
          user_id: string
        }[]
      }
      anonymize_ip_address: { Args: { ip_addr: unknown }; Returns: unknown }
      anonymize_pii_for_analytics: {
        Args: { email_input?: string; phone_input?: string }
        Returns: Json
      }
      automated_security_maintenance: { Args: never; Returns: undefined }
      automated_security_maintenance_enhanced: {
        Args: never
        Returns: undefined
      }
      automated_security_maintenance_v2: { Args: never; Returns: undefined }
      check_product_limit: {
        Args: { p_agent_id: string }
        Returns: {
          can_add_product: boolean
          current_products: number
          plan: string
          product_limit: number
        }[]
      }
      check_user_plan_limits: {
        Args: {
          p_agent_id?: string
          p_feature_type: string
          p_file_size?: number
          p_user_id: string
        }
        Returns: Json
      }
      check_visitor_limit: {
        Args: { p_user_id: string }
        Returns: {
          can_accept_visitor: boolean
          current_visitors: number
          plan: string
          visitor_limit: number
        }[]
      }
      cleanup_empty_conversations: { Args: never; Returns: undefined }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      cleanup_old_visitor_data: { Args: never; Returns: undefined }
      cleanup_old_visitor_data_extended: { Args: never; Returns: undefined }
      cleanup_visitor_privacy_data: { Args: never; Returns: undefined }
      comprehensive_security_maintenance: { Args: never; Returns: undefined }
      comprehensive_security_scan: { Args: never; Returns: Json }
      detect_profile_data_breach: { Args: never; Returns: undefined }
      detect_rapid_login_attempts: { Args: never; Returns: undefined }
      detect_suspicious_pii_access: { Args: never; Returns: undefined }
      encrypt_pii_data: { Args: { data_text: string }; Returns: string }
      encrypt_pii_field: {
        Args: { data_text: string; field_type: string }
        Returns: string
      }
      enforce_data_retention: { Args: never; Returns: undefined }
      enhanced_ip_anonymization: {
        Args: { ip_addr: unknown }
        Returns: unknown
      }
      enhanced_pii_protection_check: {
        Args: { data_fields: Json; operation_type?: string }
        Returns: boolean
      }
      enhanced_privacy_data_cleanup: { Args: never; Returns: undefined }
      enhanced_rate_limit_check_readonly: {
        Args: {
          max_operations?: number
          operation_key: string
          window_minutes?: number
        }
        Returns: boolean
      }
      enhanced_security_scan: { Args: never; Returns: Json }
      enhanced_visitor_privacy_cleanup: { Args: never; Returns: undefined }
      export_customer_data: {
        Args: { p_customer_email: string; p_shop_domain: string }
        Returns: Json
      }
      generate_daily_security_audit: { Args: never; Returns: undefined }
      get_agent_visitor_stats: {
        Args: { p_agent_id: string }
        Returns: {
          can_accept_visitors: boolean
          current_month_visitors: number
          plan: string
          visitor_limit: number
        }[]
      }
      get_public_agent_data: {
        Args: { agent_uuid: string }
        Returns: {
          chat_interface_theme: string
          description: string
          id: string
          initial_message: string
          message_bubble_color: string
          name: string
          profile_image_url: string
        }[]
      }
      get_security_audit_summary_secure: {
        Args: never
        Returns: {
          audit_date: string
          lead_operations: number
          security_events: number
          service_role_ops: number
          total_operations: number
          unique_ips: number
          visitor_operations: number
        }[]
      }
      get_top_revenue_conversations: {
        Args: {
          p_agent_id: string
          p_end_date: string
          p_limit?: number
          p_start_date: string
        }
        Returns: {
          avg_confidence: number
          conversation_id: string
          order_count: number
          session_id: string
          total_revenue: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_safe: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_cart_recovery_attempts: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_daily_metrics: {
        Args: {
          p_agent_id: string
          p_date: string
          p_orders: number
          p_revenue: number
        }
        Returns: undefined
      }
      log_pii_access: {
        Args: {
          access_reason?: string
          operation_type: string
          pii_fields?: Json
          record_id?: string
          table_name: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          details_param?: Json
          event_type: string
          user_id_param?: string
        }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: {
          additional_data?: Json
          operation_type: string
          record_id?: string
          table_name: string
        }
        Returns: undefined
      }
      log_service_role_operation: {
        Args: {
          context_data?: Json
          operation_type: string
          record_data?: Json
          table_name: string
        }
        Returns: undefined
      }
      parse_client_ip: { Args: { ip_header: string }; Returns: unknown }
      rate_limit_check: {
        Args: {
          max_operations?: number
          operation_key: string
          window_minutes?: number
        }
        Returns: boolean
      }
      redact_customer_data: {
        Args: { p_customer_email: string; p_shop_domain: string }
        Returns: undefined
      }
      redact_shop_data: { Args: { p_shop_domain: string }; Returns: undefined }
      sanitize_text_input: { Args: { input_text: string }; Returns: string }
      schedule_visitor_cleanup: { Args: never; Returns: undefined }
      security_health_check: { Args: never; Returns: Json }
      support_access_profile_basic: {
        Args: { target_user_id: string; ticket_number: string }
        Returns: {
          created_at: string
          display_name: string
          id: string
          plan: string
        }[]
      }
      track_unique_monthly_visitor: {
        Args: { p_agent_id: string; p_visitor_fingerprint: string }
        Returns: boolean
      }
      update_storage_usage: {
        Args: { p_size_change: number; p_user_id: string }
        Returns: undefined
      }
      update_usage_tracking: {
        Args: {
          p_conversation_id?: string
          p_message_count?: number
          p_user_id: string
        }
        Returns: undefined
      }
      update_user_profile_atomic: {
        Args: {
          p_display_name: string
          p_plan: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: Json
      }
      user_owns_workspace: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      validate_authenticated_user: { Args: never; Returns: string }
      validate_edge_function_request: {
        Args: { client_ip?: unknown; function_name: string; request_data: Json }
        Returns: boolean
      }
      validate_profile_input: {
        Args: {
          display_name_input?: string
          email_input: string
          phone_input?: string
        }
        Returns: boolean
      }
      validate_profile_input_readonly: {
        Args: { p_display_name?: string; p_email: string; p_phone?: string }
        Returns: boolean
      }
      validate_secure_profile_access: {
        Args: { operation_type?: string; target_user_id: string }
        Returns: boolean
      }
      validate_secure_profile_access_readonly: {
        Args: { operation_type: string; p_user_id: string }
        Returns: boolean
      }
      validate_sensitive_data_access: {
        Args: {
          operation_type: string
          table_name: string
          user_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      verify_admin_route_access: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
