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
      atp_supervisions: {
        Row: {
          a1: number
          b2: number
          b3: number
          b4: number
          c5: number
          c6: number
          c7: number
          created_at: string
          created_by: string
          d10: number
          d11: number
          d12: number
          d8: number
          d9: number
          id: string
          kelas_semester: string | null
          mata_pelajaran: string | null
          notes: string | null
          school_id: string
          supervision_date: string
          teacher_id: string
          tindak_lanjut: string | null
          updated_at: string
        }
        Insert: {
          a1?: number
          b2?: number
          b3?: number
          b4?: number
          c5?: number
          c6?: number
          c7?: number
          created_at?: string
          created_by: string
          d10?: number
          d11?: number
          d12?: number
          d8?: number
          d9?: number
          id?: string
          kelas_semester?: string | null
          mata_pelajaran?: string | null
          notes?: string | null
          school_id: string
          supervision_date?: string
          teacher_id: string
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Update: {
          a1?: number
          b2?: number
          b3?: number
          b4?: number
          c5?: number
          c6?: number
          c7?: number
          created_at?: string
          created_by?: string
          d10?: number
          d11?: number
          d12?: number
          d8?: number
          d9?: number
          id?: string
          kelas_semester?: string | null
          mata_pelajaran?: string | null
          notes?: string | null
          school_id?: string
          supervision_date?: string
          teacher_id?: string
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atp_supervisions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atp_supervisions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          coaching_date: string
          created_at: string
          created_by: string
          findings: string | null
          follow_up: string | null
          id: string
          recommendations: string | null
          school_id: string
          teacher_id: string
          topic: string
          updated_at: string
        }
        Insert: {
          coaching_date?: string
          created_at?: string
          created_by: string
          findings?: string | null
          follow_up?: string | null
          id?: string
          recommendations?: string | null
          school_id: string
          teacher_id: string
          topic: string
          updated_at?: string
        }
        Update: {
          coaching_date?: string
          created_at?: string
          created_by?: string
          findings?: string | null
          follow_up?: string | null
          id?: string
          recommendations?: string | null
          school_id?: string
          teacher_id?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          npsn: string | null
          owner_id: string
          phone: string | null
          principal_name: string
          principal_nip: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          npsn?: string | null
          owner_id: string
          phone?: string | null
          principal_name: string
          principal_nip: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          npsn?: string | null
          owner_id?: string
          phone?: string | null
          principal_name?: string
          principal_nip?: string
          updated_at?: string
        }
        Relationships: []
      }
      supervision_observations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          mata_pelajaran: string | null
          materi_topik: string | null
          notes: string | null
          observation_date: string
          school_id: string
          scores: Json
          teacher_id: string
          tindak_lanjut: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          mata_pelajaran?: string | null
          materi_topik?: string | null
          notes?: string | null
          observation_date?: string
          school_id: string
          scores?: Json
          teacher_id: string
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          mata_pelajaran?: string | null
          materi_topik?: string | null
          notes?: string | null
          observation_date?: string
          school_id?: string
          scores?: Json
          teacher_id?: string
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_observations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_observations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisions: {
        Row: {
          absensi_siswa: number | null
          agenda_mengajar: number | null
          alur_tujuan_pembelajaran: number | null
          assessment_tools: boolean | null
          buku_pegangan_guru: number | null
          buku_teks_siswa: number | null
          created_at: string
          created_by: string
          daftar_nilai: number | null
          id: string
          jadwal_tatap_muka: number | null
          kalender_pendidikan: number | null
          kktp: number | null
          lesson_plan: boolean | null
          mata_pelajaran: string | null
          modul_ajar: number | null
          notes: string | null
          program_semester: number | null
          program_tahunan: number | null
          school_id: string
          student_attendance: boolean | null
          supervision_date: string
          syllabus: boolean | null
          teacher_id: string
          teaching_materials: boolean | null
          tindak_lanjut: string | null
          updated_at: string
        }
        Insert: {
          absensi_siswa?: number | null
          agenda_mengajar?: number | null
          alur_tujuan_pembelajaran?: number | null
          assessment_tools?: boolean | null
          buku_pegangan_guru?: number | null
          buku_teks_siswa?: number | null
          created_at?: string
          created_by: string
          daftar_nilai?: number | null
          id?: string
          jadwal_tatap_muka?: number | null
          kalender_pendidikan?: number | null
          kktp?: number | null
          lesson_plan?: boolean | null
          mata_pelajaran?: string | null
          modul_ajar?: number | null
          notes?: string | null
          program_semester?: number | null
          program_tahunan?: number | null
          school_id: string
          student_attendance?: boolean | null
          supervision_date?: string
          syllabus?: boolean | null
          teacher_id: string
          teaching_materials?: boolean | null
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Update: {
          absensi_siswa?: number | null
          agenda_mengajar?: number | null
          alur_tujuan_pembelajaran?: number | null
          assessment_tools?: boolean | null
          buku_pegangan_guru?: number | null
          buku_teks_siswa?: number | null
          created_at?: string
          created_by?: string
          daftar_nilai?: number | null
          id?: string
          jadwal_tatap_muka?: number | null
          kalender_pendidikan?: number | null
          kktp?: number | null
          lesson_plan?: boolean | null
          mata_pelajaran?: string | null
          modul_ajar?: number | null
          notes?: string | null
          program_semester?: number | null
          program_tahunan?: number | null
          school_id?: string
          student_attendance?: boolean | null
          supervision_date?: string
          syllabus?: boolean | null
          teacher_id?: string
          teaching_materials?: boolean | null
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          teacher_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          teacher_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          teacher_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_accounts_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          gender: string | null
          id: string
          name: string
          nip: string
          rank: Database["public"]["Enums"]["teacher_rank"]
          school_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          gender?: string | null
          id?: string
          name: string
          nip: string
          rank: Database["public"]["Enums"]["teacher_rank"]
          school_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          gender?: string | null
          id?: string
          name?: string
          nip?: string
          rank?: Database["public"]["Enums"]["teacher_rank"]
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_administration: {
        Row: {
          annual_program_link: string | null
          assessment_program_link: string | null
          assessment_use_link: string | null
          attendance_link: string | null
          calendar_link: string | null
          created_at: string
          daily_agenda_link: string | null
          grade_list_link: string | null
          id: string
          learning_flow_link: string | null
          schedule_link: string | null
          school_id: string
          semester_class: string | null
          status: string | null
          teacher_account_id: string
          teacher_id: string
          teaching_hours: string | null
          teaching_material_link: string | null
          teaching_module_link: string | null
          updated_at: string
        }
        Insert: {
          annual_program_link?: string | null
          assessment_program_link?: string | null
          assessment_use_link?: string | null
          attendance_link?: string | null
          calendar_link?: string | null
          created_at?: string
          daily_agenda_link?: string | null
          grade_list_link?: string | null
          id?: string
          learning_flow_link?: string | null
          schedule_link?: string | null
          school_id: string
          semester_class?: string | null
          status?: string | null
          teacher_account_id: string
          teacher_id: string
          teaching_hours?: string | null
          teaching_material_link?: string | null
          teaching_module_link?: string | null
          updated_at?: string
        }
        Update: {
          annual_program_link?: string | null
          assessment_program_link?: string | null
          assessment_use_link?: string | null
          attendance_link?: string | null
          calendar_link?: string | null
          created_at?: string
          daily_agenda_link?: string | null
          grade_list_link?: string | null
          id?: string
          learning_flow_link?: string | null
          schedule_link?: string | null
          school_id?: string
          semester_class?: string | null
          status?: string | null
          teacher_account_id?: string
          teacher_id?: string
          teaching_hours?: string | null
          teaching_material_link?: string | null
          teaching_module_link?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_teacher_school_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
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
      is_teacher_account: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "teacher"
      employment_type: "PNS" | "PPPK" | "Guru Honorer"
      teacher_rank:
        | "III.A"
        | "III.B"
        | "III.C"
        | "III.D"
        | "IV.A"
        | "IV.B"
        | "IV.C"
        | "IV.D"
        | "IX"
        | "Tidak Ada"
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
      app_role: ["admin", "teacher"],
      employment_type: ["PNS", "PPPK", "Guru Honorer"],
      teacher_rank: [
        "III.A",
        "III.B",
        "III.C",
        "III.D",
        "IV.A",
        "IV.B",
        "IV.C",
        "IV.D",
        "IX",
        "Tidak Ada",
      ],
    },
  },
} as const
