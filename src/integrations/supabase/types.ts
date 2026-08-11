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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target?: string | null
        }
        Relationships: []
      }
      agent_activity: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          job_id: string | null
          provider: string | null
          status: string
          summary: string | null
          task: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          provider?: string | null
          status?: string
          summary?: string | null
          task: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          provider?: string | null
          status?: string
          summary?: string | null
          task?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_activity_owned_job_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          task: string
          tokens: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task: string
          tokens?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task?: string
          tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          ai_mode: string
          ai_provider: string | null
          created_at: string
          default_language: string
          id: string
          logo_url: string | null
          maintenance: boolean
          max_resumes: number
          site_name: string
          updated_at: string
        }
        Insert: {
          ai_mode?: string
          ai_provider?: string | null
          created_at?: string
          default_language?: string
          id?: string
          logo_url?: string | null
          maintenance?: boolean
          max_resumes?: number
          site_name?: string
          updated_at?: string
        }
        Update: {
          ai_mode?: string
          ai_provider?: string | null
          created_at?: string
          default_language?: string
          id?: string
          logo_url?: string | null
          maintenance?: boolean
          max_resumes?: number
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      application_assets: {
        Row: {
          asset_type: string
          content: Json
          cover_letter_id: string | null
          created_at: string
          id: string
          job_id: string
          resume_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          content?: Json
          cover_letter_id?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          content?: Json
          cover_letter_id?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_assets_cover_letter_id_fkey"
            columns: ["cover_letter_id"]
            isOneToOne: false
            referencedRelation: "cover_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assets_owned_job_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "application_assets_owned_letter_fk"
            columns: ["cover_letter_id", "user_id"]
            isOneToOne: false
            referencedRelation: "cover_letters"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "application_assets_owned_resume_fk"
            columns: ["resume_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "application_assets_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      career_evidence: {
        Row: {
          created_at: string
          description: string
          evidence_type: string
          fact_id: string | null
          file_ref: string | null
          id: string
          metadata: Json
          metric_unit: string | null
          metric_value: string | null
          source_url: string | null
          title: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          description?: string
          evidence_type?: string
          fact_id?: string | null
          file_ref?: string | null
          id?: string
          metadata?: Json
          metric_unit?: string | null
          metric_value?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          evidence_type?: string
          fact_id?: string | null
          file_ref?: string | null
          id?: string
          metadata?: Json
          metric_unit?: string | null
          metric_value?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "career_evidence_fact_id_fkey"
            columns: ["fact_id"]
            isOneToOne: false
            referencedRelation: "career_facts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_evidence_owned_fact_fk"
            columns: ["fact_id", "user_id"]
            isOneToOne: false
            referencedRelation: "career_facts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      career_facts: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          source_label: string | null
          source_type: string
          title: string
          type: string
          updated_at: string
          user_id: string
          value: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          source_label?: string | null
          source_type?: string
          title?: string
          type?: string
          updated_at?: string
          user_id: string
          value?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          source_label?: string | null
          source_type?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          value?: string
          verification_status?: string
        }
        Relationships: []
      }
      career_profiles: {
        Row: {
          achievements: Json
          certifications: Json
          completion_score: number
          created_at: string
          education: Json
          id: string
          identity: Json
          import_meta: Json
          languages: Json
          links: Json
          preferences: Json
          projects: Json
          skills: Json
          story_bank: Json
          targets: Json
          updated_at: string
          user_id: string
          verified_facts: Json
          work_history: Json
        }
        Insert: {
          achievements?: Json
          certifications?: Json
          completion_score?: number
          created_at?: string
          education?: Json
          id?: string
          identity?: Json
          import_meta?: Json
          languages?: Json
          links?: Json
          preferences?: Json
          projects?: Json
          skills?: Json
          story_bank?: Json
          targets?: Json
          updated_at?: string
          user_id: string
          verified_facts?: Json
          work_history?: Json
        }
        Update: {
          achievements?: Json
          certifications?: Json
          completion_score?: number
          created_at?: string
          education?: Json
          id?: string
          identity?: Json
          import_meta?: Json
          languages?: Json
          links?: Json
          preferences?: Json
          projects?: Json
          skills?: Json
          story_bank?: Json
          targets?: Json
          updated_at?: string
          user_id?: string
          verified_facts?: Json
          work_history?: Json
        }
        Relationships: []
      }
      career_tasks: {
        Row: {
          created_at: string
          done: boolean
          due_at: string | null
          id: string
          job_id: string | null
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_at?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_at?: string | null
          id?: string
          job_id?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_tasks_owned_job_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          body: string
          closing: string
          created_at: string
          id: string
          job_id: string | null
          language: string
          opening: string
          resume_id: string | null
          title: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          closing?: string
          created_at?: string
          id?: string
          job_id?: string | null
          language?: string
          opening?: string
          resume_id?: string | null
          title?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          closing?: string
          created_at?: string
          id?: string
          job_id?: string | null
          language?: string
          opening?: string
          resume_id?: string | null
          title?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_owned_job_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "cover_letters_owned_resume_fk"
            columns: ["resume_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "cover_letters_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          answers: Json
          created_at: string
          feedback: Json
          id: string
          job_id: string | null
          mode: string
          questions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          feedback?: Json
          id?: string
          job_id?: string | null
          mode?: string
          questions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          feedback?: Json
          id?: string
          job_id?: string | null
          mode?: string
          questions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_sessions_owned_job_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      job_application_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          job_id: string
          metadata: Json
          notes: string | null
          occurred_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          job_id: string
          metadata?: Json
          notes?: string | null
          occurred_at?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          metadata?: Json
          notes?: string | null
          occurred_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_application_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_application_events_owned_job_fk"
            columns: ["job_id", "user_id"]
            isOneToOne: false
            referencedRelation: "job_workspaces"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      job_workspaces: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          id: string
          job_description: string
          job_title: string
          job_url: string | null
          location: string | null
          match_analysis: Json
          match_score: number
          next_action_at: string | null
          notes: string | null
          requirements: Json
          salary: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company?: string
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
          job_url?: string | null
          location?: string | null
          match_analysis?: Json
          match_score?: number
          next_action_at?: string | null
          notes?: string | null
          requirements?: Json
          salary?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string
          job_url?: string | null
          location?: string | null
          match_analysis?: Json
          match_score?: number
          next_action_at?: string | null
          notes?: string | null
          requirements?: Json
          salary?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          industry: string | null
          onboarded: boolean
          target_role: string | null
          updated_at: string
          years_experience: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          industry?: string | null
          onboarded?: boolean
          target_role?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          industry?: string | null
          onboarded?: boolean
          target_role?: string | null
          updated_at?: string
          years_experience?: string | null
        }
        Relationships: []
      }
      protected_terms: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          term: string
          translation_policy: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          term: string
          translation_policy?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          term?: string
          translation_policy?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          change_summary: string
          created_at: string
          id: string
          label: string
          parent_version_id: string | null
          resume_id: string
          snapshot: Json
          user_id: string
        }
        Insert: {
          change_summary?: string
          created_at?: string
          id?: string
          label?: string
          parent_version_id?: string | null
          resume_id: string
          snapshot?: Json
          user_id: string
        }
        Update: {
          change_summary?: string
          created_at?: string
          id?: string
          label?: string
          parent_version_id?: string | null
          resume_id?: string
          snapshot?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_owned_parent_fk"
            columns: ["parent_version_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "resume_versions_owned_resume_fk"
            columns: ["resume_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "resume_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          ats_score: number
          completion_score: number
          created_at: string
          data: Json
          id: string
          language: string
          last_viewed_at: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ats_score?: number
          completion_score?: number
          created_at?: string
          data?: Json
          id?: string
          language?: string
          last_viewed_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ats_score?: number
          completion_score?: number
          created_at?: string
          data?: Json
          id?: string
          language?: string
          last_viewed_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          active: boolean
          ats_friendly: boolean
          category: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          design: Json
          display_order: number
          id: string
          name_ar: string
          name_en: string
          supports_rtl: boolean
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          ats_friendly?: boolean
          category: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          design?: Json
          display_order?: number
          id: string
          name_ar: string
          name_en: string
          supports_rtl?: boolean
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          ats_friendly?: boolean
          category?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          design?: Json
          display_order?: number
          id?: string
          name_ar?: string
          name_en?: string
          supports_rtl?: boolean
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
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
      admin_get_app_settings: {
        Args: never
        Returns: {
          ai_mode: string
          ai_provider: string | null
          created_at: string
          default_language: string
          id: string
          logo_url: string | null
          maintenance: boolean
          max_resumes: number
          site_name: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "app_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      current_max_resumes: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
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
