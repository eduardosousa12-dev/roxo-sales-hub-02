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
      atividades: {
        Row: {
          bdr_id: string | null
          canal: Database["public"]["Enums"]["canal_type"]
          closer_id: string
          created_at: string | null
          data: string
          evolucao_funil: Database["public"]["Enums"]["evolucao_funil"] | null
          id: string
          lead_id: string
          observacoes: string | null
          proposta_enviada: boolean | null
          qualificacao: Database["public"]["Enums"]["qualificacao_type"]
          reuniao_resgatada: boolean | null
          status_atividade: Database["public"]["Enums"]["status_atividade"]
          tipo_reuniao: Database["public"]["Enums"]["reuniao_tipo"]
          updated_at: string | null
          valor_proposta: number | null
        }
        Insert: {
          bdr_id?: string | null
          canal: Database["public"]["Enums"]["canal_type"]
          closer_id: string
          created_at?: string | null
          data?: string
          evolucao_funil?: Database["public"]["Enums"]["evolucao_funil"] | null
          id?: string
          lead_id: string
          observacoes?: string | null
          proposta_enviada?: boolean | null
          qualificacao: Database["public"]["Enums"]["qualificacao_type"]
          reuniao_resgatada?: boolean | null
          status_atividade: Database["public"]["Enums"]["status_atividade"]
          tipo_reuniao: Database["public"]["Enums"]["reuniao_tipo"]
          updated_at?: string | null
          valor_proposta?: number | null
        }
        Update: {
          bdr_id?: string | null
          canal?: Database["public"]["Enums"]["canal_type"]
          closer_id?: string
          created_at?: string | null
          data?: string
          evolucao_funil?: Database["public"]["Enums"]["evolucao_funil"] | null
          id?: string
          lead_id?: string
          observacoes?: string | null
          proposta_enviada?: boolean | null
          qualificacao?: Database["public"]["Enums"]["qualificacao_type"]
          reuniao_resgatada?: boolean | null
          status_atividade?: Database["public"]["Enums"]["status_atividade"]
          tipo_reuniao?: Database["public"]["Enums"]["reuniao_tipo"]
          updated_at?: string | null
          valor_proposta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_bdr_id_fkey"
            columns: ["bdr_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          created_by: string | null
          faturamento_empresa: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          faturamento_empresa?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          faturamento_empresa?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome_completo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nome_completo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome_completo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      propostas: {
        Row: {
          closer_id: string
          created_at: string | null
          data_envio: string
          data_fechamento: string | null
          id: string
          lead_id: string
          status: Database["public"]["Enums"]["status_proposta"] | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          closer_id: string
          created_at?: string | null
          data_envio?: string
          data_fechamento?: string | null
          id?: string
          lead_id: string
          status?: Database["public"]["Enums"]["status_proposta"] | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          closer_id?: string
          created_at?: string | null
          data_envio?: string
          data_fechamento?: string | null
          id?: string
          lead_id?: string
          status?: Database["public"]["Enums"]["status_proposta"] | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      recebiveis: {
        Row: {
          created_at: string | null
          data_venda: string
          id: string
          proposta_id: string
          saldo_devedor: number | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          updated_at: string | null
          valor_recebido: number | null
          valor_venda: number
        }
        Insert: {
          created_at?: string | null
          data_venda: string
          id?: string
          proposta_id: string
          saldo_devedor?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          updated_at?: string | null
          valor_recebido?: number | null
          valor_venda: number
        }
        Update: {
          created_at?: string | null
          data_venda?: string
          id?: string
          proposta_id?: string
          saldo_devedor?: number | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          updated_at?: string | null
          valor_recebido?: number | null
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebiveis_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "closer"
        | "bdr"
        | "financeiro"
        | "gestor"
      canal_type: "Inbound" | "Outbound" | "Webinar" | "Vanguarda"
      evolucao_funil: "R1 > R2" | "R2 > R3" | "R3 > R4" | "R4 > R5" | "Nenhuma"
      qualificacao_type:
        | "Qualificado"
        | "Não Qualificado"
        | "Não Identificado"
        | "Desconhecido"
      reuniao_tipo:
        | "R1"
        | "R2"
        | "R3"
        | "R4"
        | "R5"
        | "-Sa"
        | "acima de 750k"
        | "150k a 750k"
      status_atividade: "Reunião Realizada" | "No Show" | "Reagendada"
      status_pagamento: "Pago" | "Pendente" | "Parcial" | "Não Pago"
      status_proposta: "Em Aberto" | "Ganho" | "Perdido"
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
      app_role: [
        "super_admin",
        "admin",
        "closer",
        "bdr",
        "financeiro",
        "gestor",
      ],
      canal_type: ["Inbound", "Outbound", "Webinar", "Vanguarda"],
      evolucao_funil: ["R1 > R2", "R2 > R3", "R3 > R4", "R4 > R5", "Nenhuma"],
      qualificacao_type: [
        "Qualificado",
        "Não Qualificado",
        "Não Identificado",
        "Desconhecido",
      ],
      reuniao_tipo: [
        "R1",
        "R2",
        "R3",
        "R4",
        "R5",
        "-Sa",
        "acima de 750k",
        "150k a 750k",
      ],
      status_atividade: ["Reunião Realizada", "No Show", "Reagendada"],
      status_pagamento: ["Pago", "Pendente", "Parcial", "Não Pago"],
      status_proposta: ["Em Aberto", "Ganho", "Perdido"],
    },
  },
} as const
