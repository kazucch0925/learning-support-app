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
      users: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          streak_days: number
          total_points: number
          created_at: string
          updated_at: string
          bio: string | null
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          streak_days?: number
          total_points?: number
          created_at?: string
          updated_at?: string
          bio?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          streak_days?: number
          total_points?: number
          created_at?: string
          updated_at?: string
          bio?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_minutes_per_day: number
          current_minutes_per_day: number
          categories: string[]
          streak_days: number
          last_completed_at: string | null
          created_at: string
          updated_at: string
          max_streak_days: number
          deadline?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          target_minutes_per_day?: number
          current_minutes_per_day?: number
          categories?: string[] | null
          streak_days?: number
          last_completed_at?: string | null
          created_at?: string
          updated_at?: string
          max_streak_days?: number
          deadline?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_minutes_per_day?: number
          current_minutes_per_day?: number
          categories?: string[] | null
          streak_days?: number
          last_completed_at?: string | null
          created_at?: string
          updated_at?: string
          max_streak_days?: number
          deadline?: string | null
        }
      }
      learning_sessions: {
        Row: {
          id: string
          goal_id: string
          user_id: string
          duration: number
          notes: string | null
          completed_at: string
          created_at?: string
        }
        Insert: {
          id?: string
          goal_id: string
          user_id: string
          duration: number
          notes?: string | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          user_id?: string
          duration?: number
          notes?: string | null
          completed_at?: string
          created_at?: string
        }
      }
      ai_suggestions: {
        Row: {
          id: string
          user_id: string
          goal_id?: string | null
          title: string
          description: string
          type: string
          is_applied: boolean
          created_at: string
          expires_at: string
          metadata?: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          title: string
          description: string
          type: string
          is_applied?: boolean
          created_at?: string
          expires_at: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          title?: string
          description?: string
          type?: string
          is_applied?: boolean
          created_at?: string
          expires_at?: string
          metadata?: Json | null
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'declined'
          privacy_level: 'all' | 'goals_only' | 'summary_only'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'declined'
          privacy_level?: 'all' | 'goals_only' | 'summary_only'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          privacy_level?: 'all' | 'goals_only' | 'summary_only'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          message_type: 'support' | 'congratulation' | 'challenge' | 'general'
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          message_type: 'support' | 'congratulation' | 'challenge' | 'general'
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          message_type?: 'support' | 'congratulation' | 'challenge' | 'general'
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      shared_challenges: {
        Row: {
          id: string
          title: string
          description: string
          creator_id: string
          start_date: string
          end_date: string
          target_minutes: number
          category: string
          participants: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          creator_id: string
          start_date: string
          end_date: string
          target_minutes: number
          category: string
          participants?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          creator_id?: string
          start_date?: string
          end_date?: string
          target_minutes?: number
          category?: string
          participants?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_challenges_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      challenge_progress: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          minutes_completed: number
          last_activity: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          minutes_completed?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          minutes_completed?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            referencedRelation: "shared_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      reminders: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          reminder_time: string
          days_of_week: number[]
          is_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          reminder_time: string
          days_of_week: number[]
          is_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          reminder_time?: string
          days_of_week?: number[]
          is_enabled?: boolean
          created_at?: string
        }
      },
      anchoring_habits: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          existing_habit: string
          trigger_time: string | null
          notes: string | null
          is_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          existing_habit: string
          trigger_time?: string | null
          notes?: string | null
          is_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          existing_habit?: string
          trigger_time?: string | null
          notes?: string | null
          is_enabled?: boolean
          created_at?: string
        }
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