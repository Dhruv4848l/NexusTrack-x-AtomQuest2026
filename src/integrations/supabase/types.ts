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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          actual_date: string | null
          actual_value: number | null
          computed_score: number | null
          goal_id: string
          id: string
          notes: string | null
          quarter: Database["public"]["Enums"]["quarter"]
          status: Database["public"]["Enums"]["achievement_status"]
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          actual_value?: number | null
          computed_score?: number | null
          goal_id: string
          id?: string
          notes?: string | null
          quarter: Database["public"]["Enums"]["quarter"]
          status?: Database["public"]["Enums"]["achievement_status"]
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          actual_value?: number | null
          computed_score?: number | null
          goal_id?: string
          id?: string
          notes?: string | null
          quarter?: Database["public"]["Enums"]["quarter"]
          status?: Database["public"]["Enums"]["achievement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_comments: {
        Row: {
          comment: string
          created_at: string
          goal_id: string
          id: string
          manager_id: string
          quarter: Database["public"]["Enums"]["quarter"]
        }
        Insert: {
          comment: string
          created_at?: string
          goal_id: string
          id?: string
          manager_id: string
          quarter: Database["public"]["Enums"]["quarter"]
        }
        Update: {
          comment?: string
          created_at?: string
          goal_id?: string
          id?: string
          manager_id?: string
          quarter?: Database["public"]["Enums"]["quarter"]
        }
        Relationships: [
          {
            foreignKeyName: "checkin_comments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_comments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phase1_close: string
          phase1_open: string
          q1_close: string
          q1_open: string
          q2_close: string
          q2_open: string
          q3_close: string
          q3_open: string
          q4_close: string
          q4_open: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phase1_close: string
          phase1_open: string
          q1_close: string
          q1_open: string
          q2_close: string
          q2_open: string
          q3_close: string
          q3_open: string
          q4_close: string
          q4_open: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phase1_close?: string
          phase1_open?: string
          q1_close?: string
          q1_open?: string
          q2_close?: string
          q2_open?: string
          q3_close?: string
          q3_open?: string
          q4_close?: string
          q4_open?: string
        }
        Relationships: []
      }
      goal_sheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          cycle_id: string
          id: string
          owner_id: string
          status: Database["public"]["Enums"]["sheet_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          owner_id: string
          status?: Database["public"]["Enums"]["sheet_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["sheet_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_sheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_sheets_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_sheets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          shared_parent_id: string | null
          sheet_id: string
          target: number | null
          target_date: string | null
          thrust_area: string
          title: string
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at: string
          weightage: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          shared_parent_id?: string | null
          sheet_id: string
          target?: number | null
          target_date?: string | null
          thrust_area: string
          title: string
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
          weightage?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          shared_parent_id?: string | null
          sheet_id?: string
          target?: number | null
          target_date?: string | null
          thrust_area?: string
          title?: string
          uom_type?: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_shared_parent_id_fkey"
            columns: ["shared_parent_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "goal_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string
          id: string
          manager_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id: string
          manager_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_color?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          manager_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      return_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          manager_id: string
          sheet_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          manager_id: string
          sheet_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          manager_id?: string
          sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_comments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_comments_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "goal_sheets"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _employee_id: string; _manager_id: string }
        Returns: boolean
      }
    }
    Enums: {
      achievement_status: "not_started" | "on_track" | "completed"
      app_role: "employee" | "manager" | "admin"
      quarter: "Q1" | "Q2" | "Q3" | "Q4"
      sheet_status:
        | "draft"
        | "submitted"
        | "approved_locked"
        | "returned"
        | "completed"
      uom_type:
        | "numeric_min"
        | "numeric_max"
        | "percent_min"
        | "percent_max"
        | "timeline"
        | "zero"
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
      achievement_status: ["not_started", "on_track", "completed"],
      app_role: ["employee", "manager", "admin"],
      quarter: ["Q1", "Q2", "Q3", "Q4"],
      sheet_status: [
        "draft",
        "submitted",
        "approved_locked",
        "returned",
        "completed",
      ],
      uom_type: [
        "numeric_min",
        "numeric_max",
        "percent_min",
        "percent_max",
        "timeline",
        "zero",
      ],
    },
  },
} as const
