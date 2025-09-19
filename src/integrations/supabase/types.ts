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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
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
          created_at: string
          id: string
          status: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          agent_id: string
          content?: string | null
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          agent_id?: string
          content?: string | null
          created_at?: string
          id?: string
          status?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
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
          status: string | null
          updated_at: string
          user_id: string
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
          status?: string | null
          updated_at?: string
          user_id: string
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
          status?: string | null
          updated_at?: string
          user_id?: string
          widget_page_restrictions?: string[] | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      api_key_storage: {
        Row: {
          agent_id: string
          created_at: string | null
          encrypted_key: string
          id: string
          key_hash: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          encrypted_key: string
          id?: string
          key_hash: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          encrypted_key?: string
          id?: string
          key_hash?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          agent_id: string
          api_key_encrypted: string | null
          configuration_json: Json
          created_at: string
          id: string
          integration_mode: string
          is_active: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          api_key_encrypted?: string | null
          configuration_json?: Json
          created_at?: string
          id?: string
          integration_mode?: string
          is_active?: boolean
          provider: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          api_key_encrypted?: string | null
          configuration_json?: Json
          created_at?: string
          id?: string
          integration_mode?: string
          is_active?: boolean
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          session_id: string
          visitor_session_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          session_id: string
          visitor_session_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
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
          id: string
          lead_data_json: Json
        }
        Insert: {
          agent_id: string
          conversation_id: string
          created_at?: string
          id?: string
          lead_data_json?: Json
        }
        Update: {
          agent_id?: string
          conversation_id?: string
          created_at?: string
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
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          phone: string | null
          plan: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          phone?: string | null
          plan?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          phone?: string | null
          plan?: string | null
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
      site_content: {
        Row: {
          content_type: string
          created_at: string
          description: string | null
          display_order: number
          file_url: string
          id: string
          is_active: boolean
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          description?: string | null
          display_order?: number
          file_url: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          description?: string | null
          display_order?: number
          file_url?: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      security_audit_summary: {
        Row: {
          audit_date: string | null
          lead_operations: number | null
          security_events: number | null
          service_role_ops: number | null
          total_operations: number | null
          unique_ips: number | null
          visitor_operations: number | null
        }
        Relationships: []
      }
    }
    Functions: {
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
      anonymize_ip_address: {
        Args: { ip_addr: unknown }
        Returns: unknown
      }
      anonymize_pii_for_analytics: {
        Args: { email_input?: string; phone_input?: string }
        Returns: Json
      }
      automated_security_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      automated_security_maintenance_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      automated_security_maintenance_v2: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      cleanup_empty_conversations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_visitor_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_visitor_privacy_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      comprehensive_security_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      comprehensive_security_scan: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      detect_suspicious_pii_access: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      encrypt_pii_data: {
        Args: { data_text: string }
        Returns: string
      }
      encrypt_pii_field: {
        Args: { data_text: string; field_type: string }
        Returns: string
      }
      enforce_data_retention: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enhanced_pii_protection_check: {
        Args: { data_fields: Json; operation_type?: string }
        Returns: boolean
      }
      enhanced_privacy_data_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enhanced_rate_limit_check: {
        Args: {
          max_operations?: number
          operation_key: string
          track_ip?: boolean
          window_minutes?: number
        }
        Returns: boolean
      }
      enhanced_rate_limit_check_readonly: {
        Args: {
          max_operations?: number
          operation_key: string
          window_minutes?: number
        }
        Returns: boolean
      }
      enhanced_security_scan: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      parse_client_ip: {
        Args: { ip_header: string }
        Returns: unknown
      }
      rate_limit_check: {
        Args: {
          max_operations?: number
          operation_key: string
          window_minutes?: number
        }
        Returns: boolean
      }
      sanitize_text_input: {
        Args: { input_text: string }
        Returns: string
      }
      schedule_visitor_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      validate_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_edge_function_request: {
        Args: { client_ip?: unknown; function_name: string; request_data: Json }
        Returns: boolean
      }
      validate_email: {
        Args: { email_input: string }
        Returns: boolean
      }
      validate_phone: {
        Args: { phone_input: string }
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
