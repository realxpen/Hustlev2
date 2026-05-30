export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      onboarding_status: {
        Row: {
          completed_at: string | null
          step: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          step?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          step?: string
          user_id?: string
        }
        Relationships: []
      }
      buyer_restrictions: {
        Row: {
          id: string
          seller_id: string
          buyer_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          buyer_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          buyer_id?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_restrictions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_restrictions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          has_completed_onboarding: boolean | null
          has_completed_initial_onboarding: boolean | null
          has_completed_profile_setup: boolean | null
          profile_completion_percentage: number | null
          date_of_birth: string | null
          id: string
          interests: string[] | null
          role: string | null
          username: string | null
          updated_at: string | null
          verified: boolean | null
          location: string | null
          profession: string | null
          hustle_name: string | null
          primary_skill: string | null
          secondary_skills: string[] | null
          is_hustler: boolean | null
          review_count: number | null
          rating_average: number | null
          has_reviews: boolean | null
          follower_count: number | null
          following_count: number | null
          mutual_count: number | null
          is_available: boolean | null
          availability_status: string | null
          capacity: number | null
          schedule: Json[] | null
          default_currency: string | null
          display_currency: string | null
          location_country: string | null
          is_agent: boolean
          agency_name: string | null
          managed_hustlers_count: number
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          has_completed_initial_onboarding?: boolean | null
          has_completed_profile_setup?: boolean | null
          profile_completion_percentage?: number | null
          date_of_birth?: string | null
          id: string
          interests?: string[] | null
          role?: string | null
          username?: string | null
          updated_at?: string | null
          verified?: boolean | null
          location?: string | null
          profession?: string | null
          hustle_name?: string | null
          primary_skill?: string | null
          secondary_skills?: string[] | null
          is_hustler?: boolean | null
          review_count?: number | null
          rating_average?: number | null
          has_reviews?: boolean | null
          follower_count?: number | null
          following_count?: number | null
          mutual_count?: number | null
          is_available?: boolean | null
          availability_status?: string | null
          capacity?: number | null
          schedule?: Json[] | null
          default_currency?: string | null
          display_currency?: string | null
          location_country?: string | null
          is_agent?: boolean
          agency_name?: string | null
          managed_hustlers_count?: number
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          has_completed_initial_onboarding?: boolean | null
          has_completed_profile_setup?: boolean | null
          profile_completion_percentage?: number | null
          date_of_birth?: string | null
          id?: string
          interests?: string[] | null
          role?: string | null
          username?: string | null
          updated_at?: string | null
          verified?: boolean | null
          location?: string | null
          profession?: string | null
          hustle_name?: string | null
          primary_skill?: string | null
          secondary_skills?: string[] | null
          is_hustler?: boolean | null
          review_count?: number | null
          rating_average?: number | null
          has_reviews?: boolean | null
          follower_count?: number | null
          following_count?: number | null
          mutual_count?: number | null
          is_available?: boolean | null
          availability_status?: string | null
          capacity?: number | null
          schedule?: Json[] | null
          default_currency?: string | null
          display_currency?: string | null
          location_country?: string | null
          is_agent?: boolean
          agency_name?: string | null
          managed_hustlers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          description: string | null
          id: string
        }
        Insert: {
          description?: string | null
          id: string
        }
        Update: {
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          id: string
          event_type: string
          actor_id: string | null
          target_id: string | null
          entity_id: string | null
          entity_type: string | null
          payload: Json | null
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          actor_id?: string | null
          target_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          payload?: Json | null
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          actor_id?: string | null
          target_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          payload?: Json | null
          idempotency_key?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_events_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_log: {
        Row: {
          id: string
          profile_id: string
          action_type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          action_type: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          action_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          provider_id: string
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          provider_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          provider_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          category: string | null
          pricing_type: string | null
          base_price: number
          delivery_time: string | null
          media: Json | null
          tags: string[] | null
          is_active: boolean | null
          views_count: number | null
          saves_count: number | null
          orders_count: number | null
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          category?: string | null
          pricing_type?: string | null
          base_price?: number
          delivery_time?: string | null
          media?: Json | null
          tags?: string[] | null
          is_active?: boolean | null
          views_count?: number | null
          saves_count?: number | null
          orders_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          category?: string | null
          pricing_type?: string | null
          base_price?: number
          delivery_time?: string | null
          media?: Json | null
          tags?: string[] | null
          is_active?: boolean | null
          views_count?: number | null
          saves_count?: number | null
          orders_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          category: string | null
          product_type: "physical" | "digital" | null
          price: number
          inventory_count: number | null
          media: Json | null
          tags: string[] | null
          is_active: boolean | null
          views_count: number | null
          saves_count: number | null
          orders_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          category?: string | null
          product_type?: "physical" | "digital" | null
          price?: number
          inventory_count?: number | null
          media?: Json | null
          tags?: string[] | null
          is_active?: boolean | null
          views_count?: number | null
          saves_count?: number | null
          orders_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          category?: string | null
          product_type?: "physical" | "digital" | null
          price?: number
          inventory_count?: number | null
          media?: Json | null
          tags?: string[] | null
          is_active?: boolean | null
          views_count?: number | null
          saves_count?: number | null
          orders_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      training: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          category: string | null
          price: number
          training_type: "live" | "recorded" | "mentorship" | null
          media: Json | null
          tags: string[] | null
          is_active: boolean | null
          views_count: number | null
          saves_count: number | null
          orders_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          category?: string | null
          price?: number
          training_type?: "live" | "recorded" | "mentorship" | null
          media?: Json | null
          tags?: string[] | null
          is_active?: boolean | null
          views_count?: number | null
          saves_count?: number | null
          orders_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          category?: string | null
          price?: number
          training_type?: "live" | "recorded" | "mentorship" | null
          media?: Json | null
          tags?: string[] | null
          is_active?: boolean | null
          views_count?: number | null
          saves_count?: number | null
          orders_count?: number | null
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          listing_id: string
          listing_type: "service" | "product" | "training"
          quantity: number
          unit_price: number
          total_price: number
          status: "pending" | "accepted" | "rejected" | "in_progress" | "completed" | "cancelled" | "refunded"
          payment_status: "unpaid" | "paid" | "failed" | "refunded"
          escrow_status: "none" | "held" | "released" | "refunded"
          release_status: "pending" | "released" | "disputed"
          notes: string | null
          location_lat: number | null
          location_lng: number | null
          location_address: string | null
          delivery_mode: "online" | "physical" | "home_service" | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          listing_id: string
          listing_type: "service" | "product" | "training"
          quantity?: number
          unit_price: number
          total_price: number
          status?: "pending" | "accepted" | "rejected" | "in_progress" | "completed" | "cancelled" | "refunded"
          payment_status?: "unpaid" | "paid" | "failed" | "refunded"
          escrow_status?: "none" | "held" | "released" | "refunded"
          release_status?: "pending" | "released" | "disputed"
          notes?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          delivery_mode?: "online" | "physical" | "home_service" | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          listing_id?: string
          listing_type?: "service" | "product" | "training"
          quantity?: number
          unit_price?: number
          total_price?: number
          status?: "pending" | "accepted" | "rejected" | "in_progress" | "completed" | "cancelled" | "refunded"
          payment_status?: "unpaid" | "paid" | "failed" | "refunded"
          escrow_status?: "none" | "held" | "released" | "refunded"
          release_status?: "pending" | "released" | "disputed"
          notes?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_address?: string | null
          delivery_mode?: "online" | "physical" | "home_service" | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      milestones: {
        Row: {
          id: string
          booking_id: string
          title: string
          description: string | null
          amount: number
          status: "pending" | "in_progress" | "awaiting_approval" | "released" | "disputed"
          delivered_at: string | null
          released_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          title: string
          description?: string | null
          amount: number
          status?: "pending" | "in_progress" | "awaiting_approval" | "released" | "disputed"
          delivered_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          title?: string
          description?: string | null
          amount?: number
          status?: "pending" | "in_progress" | "awaiting_approval" | "released" | "disputed"
          delivered_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          training_id: string
          booking_id: string | null
          progress: number | null
          status: "active" | "completed" | "dropped" | null
          enrolled_at: string
          last_accessed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          training_id: string
          booking_id?: string | null
          progress?: number | null
          status?: "active" | "completed" | "dropped" | null
          enrolled_at?: string
          last_accessed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          training_id?: string
          booking_id?: string | null
          progress?: number | null
          status?: "active" | "completed" | "dropped" | null
          enrolled_at?: string
          last_accessed_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          amount: number
          currency: string
          method: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          amount: number
          currency?: string
          method: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          amount?: number
          currency?: string
          method?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          user_id: string
          caption: string | null
          media_url: string | null
          media_type: string
          media: any[]
          music_data: any | null
          reference_payload: any | null
          comments_count: number
          shares_count: number
          is_repost: boolean
          original_post_id: string | null
          likes_count: number
          saves_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          caption?: string | null
          media_url?: string | null
          media_type?: string
          media?: any[]
          music_data?: any | null
          reference_payload?: any | null
          comments_count?: number
          shares_count?: number
          is_repost?: boolean
          original_post_id?: string | null
          likes_count?: number
          saves_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          caption?: string | null
          media_url?: string | null
          media_type?: string
          media?: any[]
          music_data?: any | null
          reference_payload?: any | null
          comments_count?: number
          shares_count?: number
          is_repost?: boolean
          original_post_id?: string | null
          likes_count?: number
          saves_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      post_shares: {
        Row: {
          id: string
          post_id: string
          user_id: string
          share_type: string
          target_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          share_type: string
          target_user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          share_type?: string
          target_user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          parent_comment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content?: string
          parent_comment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string | null
          message_type: string
          media_url: string | null
          media_metadata: Json | null
          shared_post_id: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content?: string | null
          message_type?: string
          media_url?: string | null
          media_metadata?: Json | null
          shared_post_id?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string | null
          message_type?: string
          media_url?: string | null
          media_metadata?: Json | null
          shared_post_id?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          available_balance: number
          escrow_balance: number
          lifetime_earnings: number
          lifetime_spending: number
          currency: string
          wallet_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          available_balance?: number
          escrow_balance?: number
          lifetime_earnings?: number
          lifetime_spending?: number
          currency?: string
          wallet_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          available_balance?: number
          escrow_balance?: number
          lifetime_earnings?: number
          lifetime_spending?: number
          currency?: string
          wallet_status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          user_id: string
          booking_id: string | null
          type: string
          amount: number
          currency: string
          status: string
          reference: string | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          user_id: string
          booking_id?: string | null
          type: string
          amount: number
          currency?: string
          status?: string
          reference?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          user_id?: string
          booking_id?: string | null
          type?: string
          amount?: number
          currency?: string
          status?: string
          reference?: string | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      gigs: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          pricing_type: string
          base_price: number
          delivery_time: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          pricing_type?: string
          base_price: number
          delivery_time?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          pricing_type?: string
          base_price?: number
          delivery_time?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      booking_deliveries: {
        Row: {
          id: string
          booking_id: string
          message: string | null
          file_url: string | null
          delivered_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          message?: string | null
          file_url?: string | null
          delivered_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          message?: string | null
          file_url?: string | null
          delivered_at?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          id: string
          booking_id: string
          payer_id: string
          receiver_id: string
          amount: number
          platform_fee: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          payer_id: string
          receiver_id: string
          amount: number
          platform_fee?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          payer_id?: string
          receiver_id?: string
          amount?: number
          platform_fee?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          recipient_id: string
          actor_id: string | null
          title: string | null
          message: string | null
          type: string
          entity_id: string | null
          entity_type: string | null
          data: any
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          actor_id?: string | null
          title?: string | null
          message?: string | null
          type: string
          entity_id?: string | null
          entity_type?: string | null
          data?: any
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          actor_id?: string | null
          title?: string | null
          message?: string | null
          type?: string
          entity_id?: string | null
          entity_type?: string | null
          data?: any
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          wallet_id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow_hold' | 'escrow_release'
          amount: number
          status: 'pending' | 'completed' | 'failed'
          reference_id: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          user_id: string
          type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow_hold' | 'escrow_release'
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          reference_id?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          user_id?: string
          type?: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow_hold' | 'escrow_release'
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          reference_id?: string | null
          metadata?: any
          created_at?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          id: string
          transaction_id: string | null
          debit: number
          credit: number
          balance_after: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id?: string | null
          debit?: number
          credit?: number
          balance_after: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string | null
          debit?: number
          credit?: number
          balance_after?: number
          description?: string
          created_at?: string
        }
        Relationships: []
      }
      escrow_accounts: {
        Row: {
          id: string
          booking_id: string
          amount: number
          status: 'held' | 'released' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          amount: number
          status: 'held' | 'released' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          amount?: number
          status?: 'held' | 'released' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          id: string
          user_id: string
          media_url: string | null
          media_type: string
          caption: string | null
          background_music_url: string | null
          sticker_data: any | null
          story_type: string | null
          linked_id: string | null
          created_at: string
          expires_at: string
          is_active: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          media_url?: string | null
          media_type: string
          caption?: string | null
          background_music_url?: string | null
          sticker_data?: any | null
          story_type?: string | null
          linked_id?: string | null
          created_at?: string
          expires_at?: string
          is_active?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          media_url?: string | null
          media_type?: string
          caption?: string | null
          background_music_url?: string | null
          sticker_data?: any | null
          story_type?: string | null
          linked_id?: string | null
          created_at?: string
          expires_at?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewer_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          viewer_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          viewer_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_posts: {
        Row: {
          id: string
          user_id: string
          post_id: string
          collection_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          collection_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          collection_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_applications: {
        Row: {
          id: string
          user_id: string
          agency_name: string
          status: 'pending' | 'approved' | 'rejected'
          submission_metadata: Json | null
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          agency_name: string
          status?: 'pending' | 'approved' | 'rejected'
          submission_metadata?: Json | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          agency_name?: string
          status?: 'pending' | 'approved' | 'rejected'
          submission_metadata?: Json | null
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      hustler_agents: {
        Row: {
          id: string
          hustler_id: string
          agent_id: string
          status: 'pending' | 'active' | 'revoked'
          commission_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          hustler_id: string
          agent_id: string
          status?: 'pending' | 'active' | 'revoked'
          commission_percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          hustler_id?: string
          agent_id?: string
          status?: 'pending' | 'active' | 'revoked'
          commission_percentage?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hustler_agents_hustler_id_fkey"
            columns: ["hustler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hustler_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_permissions: {
        Row: {
          id: string
          relationship_id: string
          manage_bookings: boolean
          manage_listings: boolean
          message_clients: boolean
          analytics_access: boolean
        }
        Insert: {
          id?: string
          relationship_id: string
          manage_bookings?: boolean
          manage_listings?: boolean
          message_clients?: boolean
          analytics_access?: boolean
        }
        Update: {
          id?: string
          relationship_id?: string
          manage_bookings?: boolean
          manage_listings?: boolean
          message_clients?: boolean
          analytics_access?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_permissions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: true
            referencedRelation: "hustler_agents"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_commissions: {
        Row: {
          id: string
          booking_id: string
          agent_id: string
          hustler_id: string
          commission_amount: number
          status: 'pending' | 'paid'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          agent_id: string
          hustler_id: string
          commission_amount: number
          status?: 'pending' | 'paid'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          agent_id?: string
          hustler_id?: string
          commission_amount?: number
          status?: 'pending' | 'paid'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_hustler_id_fkey"
            columns: ["hustler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
