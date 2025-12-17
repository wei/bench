export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          name: string;
          status: string;
          program: string | null;
          starts_at: string | null;
          ends_at: string | null;
          event_format: string | null;
          type: string | null;
          website_url: string | null;
          registration_url: string | null;
          logo_url: string | null;
          background_url: string | null;
          event_staff_emails: string | null;
          judging_end_time: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug: string;
          name: string;
          status: string;
          program?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          event_format?: string | null;
          type?: string | null;
          website_url?: string | null;
          registration_url?: string | null;
          logo_url?: string | null;
          background_url?: string | null;
          event_staff_emails?: string | null;
          judging_end_time?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug?: string;
          name?: string;
          status?: string;
          program?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          event_format?: string | null;
          type?: string | null;
          website_url?: string | null;
          registration_url?: string | null;
          logo_url?: string | null;
          background_url?: string | null;
          event_staff_emails?: string | null;
          judging_end_time?: string | null;
        };
        Relationships: [];
      };
      prize_categories: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          slug: string;
          name: string;
          short_name: string;
          find_words: string[];
          system_prompt: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug: string;
          name: string;
          short_name?: string;
          find_words?: string[];
          system_prompt: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          slug?: string;
          name?: string;
          short_name?: string;
          find_words?: string[];
          system_prompt?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          event_id: string;
          created_at: string;
          updated_at: string;
          project_title: string | null;
          submission_url: string | null;
          project_created_at: string | null;
          about_the_project: string | null;
          try_it_out_links: string[];
          video_demo_link: string | null;
          opt_in_prizes: string;
          built_with: string;
          standardized_opt_in_prizes: string[];
          submitter_first_name: string | null;
          submitter_last_name: string | null;
          submitter_email: string | null;
          notes: string | null;
          team_size: number | null;
          github_url: string | null;
          csv_row: Json;
          judging_shortlist: boolean;
          judging_rating: number | null;
          judging_notes: string | null;
          status: Database["public"]["Enums"]["project_processing_status"];
          project_processing_status_message: string | null;
          process_started_at: string | null;
          description_accuracy_level:
            | Database["public"]["Enums"]["description_accuracy_level"]
            | null;
          description_accuracy_message: string | null;
          technical_complexity:
            | Database["public"]["Enums"]["complexity_rating"]
            | null;
          technical_complexity_message: string | null;
          tech_stack: string[];
          prize_results: Json;
        };
        Insert: {
          id?: string;
          event_id: string;
          created_at?: string;
          updated_at?: string;
          project_title?: string | null;
          submission_url?: string | null;
          project_created_at?: string | null;
          about_the_project?: string | null;
          try_it_out_links?: string[];
          video_demo_link?: string | null;
          opt_in_prizes?: string;
          built_with?: string;
          standardized_opt_in_prizes?: string[];
          submitter_first_name?: string | null;
          submitter_last_name?: string | null;
          submitter_email?: string | null;
          notes?: string | null;
          team_size?: number | null;
          github_url?: string | null;
          csv_row?: Json;
          judging_shortlist?: boolean;
          judging_rating?: number | null;
          judging_notes?: string | null;
          status?: Database["public"]["Enums"]["project_processing_status"];
          project_processing_status_message?: string | null;
          process_started_at?: string | null;
          description_accuracy_level?:
            | Database["public"]["Enums"]["description_accuracy_level"]
            | null;
          description_accuracy_message?: string | null;
          technical_complexity?:
            | Database["public"]["Enums"]["complexity_rating"]
            | null;
          technical_complexity_message?: string | null;
          tech_stack?: string[];
          prize_results?: Json;
        };
        Update: {
          id?: string;
          event_id?: string;
          created_at?: string;
          updated_at?: string;
          project_title?: string | null;
          submission_url?: string | null;
          project_created_at?: string | null;
          about_the_project?: string | null;
          try_it_out_links?: string[];
          video_demo_link?: string | null;
          opt_in_prizes?: string;
          built_with?: string;
          standardized_opt_in_prizes?: string[];
          submitter_first_name?: string | null;
          submitter_last_name?: string | null;
          submitter_email?: string | null;
          notes?: string | null;
          team_size?: number | null;
          github_url?: string | null;
          csv_row?: Json;
          judging_shortlist?: boolean;
          judging_rating?: number | null;
          judging_notes?: string | null;
          status?: Database["public"]["Enums"]["project_processing_status"];
          project_processing_status_message?: string | null;
          process_started_at?: string | null;
          description_accuracy_level?:
            | Database["public"]["Enums"]["description_accuracy_level"]
            | null;
          description_accuracy_message?: string | null;
          technical_complexity?:
            | Database["public"]["Enums"]["complexity_rating"]
            | null;
          technical_complexity_message?: string | null;
          tech_stack?: string[];
          prize_results?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "projects_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_processing_status:
        | "unprocessed"
        | "processing:code_review"
        | "processing:prize_category_review"
        | "invalid:github_inaccessible"
        | "invalid:rule_violation"
        | "processed"
        | "errored";
      run_status: "queued" | "running" | "succeeded" | "failed" | "canceled";
      complexity_rating: "invalid" | "beginner" | "intermediate" | "advanced";
      description_accuracy_level: "low" | "medium" | "high";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

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
} as const;
