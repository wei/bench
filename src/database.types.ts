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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      events: {
        Row: {
          background_url: string | null
          created_at: string
          ends_at: string | null
          event_format: string | null
          id: string
          logo_url: string | null
          name: string
          program: string | null
          registration_url: string | null
          slug: string
          starts_at: string | null
          status: string
          type: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          ends_at?: string | null
          event_format?: string | null
          id?: string
          logo_url?: string | null
          name: string
          program?: string | null
          registration_url?: string | null
          slug: string
          starts_at?: string | null
          status: string
          type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          background_url?: string | null
          created_at?: string
          ends_at?: string | null
          event_format?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          program?: string | null
          registration_url?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          type?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      prize_categories: {
        Row: {
          created_at: string
          find_words: string[]
          id: string
          name: string
          short_name: string | null
          slug: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          find_words?: string[]
          id?: string
          name: string
          short_name?: string | null
          slug: string
          system_prompt: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          find_words?: string[]
          id?: string
          name?: string
          short_name?: string | null
          slug?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          about_the_project: string | null
          built_with: string
          created_at: string
          csv_row: Json
          description_accuracy_level:
            | Database["public"]["Enums"]["description_accuracy_level"]
            | null
          description_accuracy_message: string | null
          event_id: string
          github_url: string | null
          id: string
          judging_notes: string | null
          judging_rating: number | null
          judging_shortlist: boolean
          notes: string | null
          opt_in_prizes: string
          prize_results: Json
          process_started_at: string | null
          project_created_at: string | null
          project_processing_status_message: string | null
          project_title: string | null
          standardized_opt_in_prizes: string[]
          status: Database["public"]["Enums"]["project_processing_status"]
          submission_url: string | null
          submitter_email: string | null
          submitter_first_name: string | null
          submitter_last_name: string | null
          team_size: number | null
          tech_stack: string[]
          technical_complexity:
            | Database["public"]["Enums"]["complexity_rating"]
            | null
          technical_complexity_message: string | null
          try_it_out_links: string[]
          updated_at: string
          video_demo_link: string | null
        }
        Insert: {
          about_the_project?: string | null
          built_with?: string
          created_at?: string
          csv_row?: Json
          description_accuracy_level?:
            | Database["public"]["Enums"]["description_accuracy_level"]
            | null
          description_accuracy_message?: string | null
          event_id: string
          github_url?: string | null
          id?: string
          judging_notes?: string | null
          judging_rating?: number | null
          judging_shortlist?: boolean
          notes?: string | null
          opt_in_prizes?: string
          prize_results?: Json
          process_started_at?: string | null
          project_created_at?: string | null
          project_processing_status_message?: string | null
          project_title?: string | null
          standardized_opt_in_prizes?: string[]
          status?: Database["public"]["Enums"]["project_processing_status"]
          submission_url?: string | null
          submitter_email?: string | null
          submitter_first_name?: string | null
          submitter_last_name?: string | null
          team_size?: number | null
          tech_stack?: string[]
          technical_complexity?:
            | Database["public"]["Enums"]["complexity_rating"]
            | null
          technical_complexity_message?: string | null
          try_it_out_links?: string[]
          updated_at?: string
          video_demo_link?: string | null
        }
        Update: {
          about_the_project?: string | null
          built_with?: string
          created_at?: string
          csv_row?: Json
          description_accuracy_level?:
            | Database["public"]["Enums"]["description_accuracy_level"]
            | null
          description_accuracy_message?: string | null
          event_id?: string
          github_url?: string | null
          id?: string
          judging_notes?: string | null
          judging_rating?: number | null
          judging_shortlist?: boolean
          notes?: string | null
          opt_in_prizes?: string
          prize_results?: Json
          process_started_at?: string | null
          project_created_at?: string | null
          project_processing_status_message?: string | null
          project_title?: string | null
          standardized_opt_in_prizes?: string[]
          status?: Database["public"]["Enums"]["project_processing_status"]
          submission_url?: string | null
          submitter_email?: string | null
          submitter_first_name?: string | null
          submitter_last_name?: string | null
          team_size?: number | null
          tech_stack?: string[]
          technical_complexity?:
            | Database["public"]["Enums"]["complexity_rating"]
            | null
          technical_complexity_message?: string | null
          try_it_out_links?: string[]
          updated_at?: string
          video_demo_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      complexity_rating: "invalid" | "beginner" | "intermediate" | "advanced"
      description_accuracy_level: "low" | "medium" | "high"
      project_processing_status:
        | "unprocessed"
        | "processing:code_review"
        | "processing:prize_category_review"
        | "invalid:github_inaccessible"
        | "invalid:rule_violation"
        | "processed"
        | "errored"
      run_status: "queued" | "running" | "succeeded" | "failed" | "canceled"
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
      complexity_rating: ["invalid", "beginner", "intermediate", "advanced"],
      description_accuracy_level: ["low", "medium", "high"],
      project_processing_status: [
        "unprocessed",
        "processing:code_review",
        "processing:prize_category_review",
        "invalid:github_inaccessible",
        "invalid:rule_violation",
        "processed",
        "errored",
      ],
      run_status: ["queued", "running", "succeeded", "failed", "canceled"],
    },
  },
} as const
