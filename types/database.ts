/**
 * Database type definitions for Lumina Dreams.
 *
 * These types are hand-written to match supabase/schema.sql exactly.
 * They are used as the generic parameter for all Supabase client calls,
 * giving you end-to-end type safety on queries, inserts, and updates.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('dreams').select('*')
 *   // data is typed as Database['public']['Tables']['dreams']['Row'][]
 */

/* ── JSON scalar ─────────────────────────────────────────── */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ── Dream mood enum (mirrors CHECK constraint in schema) ── */
export type DreamMoodValue =
  | "peaceful"
  | "mysterious"
  | "anxious"
  | "joyful"
  | "frightening"
  | "neutral"
  | "surreal"
  | "romantic"
  | "adventurous";

/* ── Main Database interface ─────────────────────────────── */
export interface Database {
  public: {
    Tables: {
      /* ────────────────────────────────────────────────────
         profiles
         ──────────────────────────────────────────────────── */
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          membership_tier: string;
          subscription_status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          membership_updated_at: string | null;
          abuse_score: number;
          is_limited: boolean;
          is_banned: boolean;
          last_sign_in_ip: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          /** Must match auth.users.id */
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          membership_tier?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          membership_updated_at?: string | null;
          abuse_score?: number;
          is_limited?: boolean;
          is_banned?: boolean;
          last_sign_in_ip?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          membership_tier?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          membership_updated_at?: string | null;
          abuse_score?: number;
          is_limited?: boolean;
          is_banned?: boolean;
          last_sign_in_ip?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ────────────────────────────────────────────────────
         dreams
         ──────────────────────────────────────────────────── */
      dreams: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          /** ISO date string "YYYY-MM-DD" */
          dream_date: string;
          mood: DreamMoodValue | null;
          tags: string[];
          is_lucid: boolean;
          interpretation: string | null;
          symbols: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          dream_date?: string;
          mood?: DreamMoodValue | null;
          tags?: string[];
          is_lucid?: boolean;
          interpretation?: string | null;
          symbols?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          dream_date?: string;
          mood?: DreamMoodValue | null;
          tags?: string[];
          is_lucid?: boolean;
          interpretation?: string | null;
          symbols?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dreams_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ────────────────────────────────────────────────────
         dream_images
         ──────────────────────────────────────────────────── */
      dream_images: {
        Row: {
          id: string;
          dream_id: string;
          user_id: string;
          url: string;
          storage_path: string | null;
          prompt: string;
          model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          dream_id: string;
          user_id: string;
          url: string;
          storage_path?: string | null;
          prompt: string;
          model?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          dream_id?: string;
          user_id?: string;
          url?: string;
          storage_path?: string | null;
          prompt?: string;
          model?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dream_images_dream_id_fkey";
            columns: ["dream_id"];
            referencedRelation: "dreams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dream_images_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ────────────────────────────────────────────────────
         dream_videos
         ──────────────────────────────────────────────────── */
      dream_videos: {
        Row: {
          id: string;
          dream_id: string;
          user_id: string;
          url: string;
          storage_path: string | null;
          prompt: string;
          model: string;
          /** Duration in seconds, null while still rendering */
          duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dream_id: string;
          user_id: string;
          url: string;
          storage_path?: string | null;
          prompt: string;
          model: string;
          duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dream_id?: string;
          user_id?: string;
          url?: string;
          storage_path?: string | null;
          prompt?: string;
          model?: string;
          duration?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dream_videos_dream_id_fkey";
            columns: ["dream_id"];
            referencedRelation: "dreams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dream_videos_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ────────────────────────────────────────────────────
         dream_insights
         ──────────────────────────────────────────────────── */
      dream_insights: {
        Row: {
          id: string;
          user_id: string;
          dream_count: number;
          patterns: string[];
          recurring_symbols: string[];
          themes: string[];
          mind_state_diagnosis: string;
          actionable_advice: string[];
          generated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dream_count: number;
          patterns?: string[];
          recurring_symbols?: string[];
          themes?: string[];
          mind_state_diagnosis: string;
          actionable_advice?: string[];
          generated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dream_count?: number;
          patterns?: string[];
          recurring_symbols?: string[];
          themes?: string[];
          mind_state_diagnosis?: string;
          actionable_advice?: string[];
          generated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dream_insights_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ────────────────────────────────────────────────────
         ai_usage_events
         ──────────────────────────────────────────────────── */
      ai_usage_events: {
        Row: {
          id: string;
          user_id: string;
          dream_id: string | null;
          usage_type: "interpretation" | "image_generation" | "video_generation";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dream_id?: string | null;
          usage_type: "interpretation" | "image_generation" | "video_generation";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dream_id?: string | null;
          usage_type?: "interpretation" | "image_generation" | "video_generation";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_dream_id_fkey";
            columns: ["dream_id"];
            referencedRelation: "dreams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /* ────────────────────────────────────────────────────
         abuse_events
         ──────────────────────────────────────────────────── */
      abuse_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          scope_type: "ip" | "email" | "user";
          scope_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          scope_type: "ip" | "email" | "user";
          scope_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          scope_type?: "ip" | "email" | "user";
          scope_key?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "abuse_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      get_user_dream_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

/* ── Convenience row-type aliases ────────────────────────── */
export type ProfileRow      = Database["public"]["Tables"]["profiles"]["Row"];
export type DreamRow        = Database["public"]["Tables"]["dreams"]["Row"];
export type DreamImageRow   = Database["public"]["Tables"]["dream_images"]["Row"];
export type DreamVideoRow   = Database["public"]["Tables"]["dream_videos"]["Row"];
export type DreamInsightRow = Database["public"]["Tables"]["dream_insights"]["Row"];

/* ── Insert / Update helpers ─────────────────────────────── */
export type DreamInsert       = Database["public"]["Tables"]["dreams"]["Insert"];
export type DreamUpdate       = Database["public"]["Tables"]["dreams"]["Update"];
export type ProfileUpdate     = Database["public"]["Tables"]["profiles"]["Update"];
export type DreamImageInsert  = Database["public"]["Tables"]["dream_images"]["Insert"];
export type DreamVideoInsert  = Database["public"]["Tables"]["dream_videos"]["Insert"];
export type DreamInsightInsert = Database["public"]["Tables"]["dream_insights"]["Insert"];
