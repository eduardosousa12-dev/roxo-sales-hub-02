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
      activities: {
        Row: {
          id: number
          created_at: string
          date: string | null
          closer: string | null
          closer_id: string | null
          lead: string | null
          bdr: string | null
          channel: string | null
          type: string | null
          status: string | null
          evolution: string | null
          sale_value: number | null
          proposal_value: number | null
          notes: string | null
          qualification: string | null
          company_revenue: string | null
          proposal_sent: string | null
          reuniao_resgatada: string | null
          deal_outcome: string | null
          sector: string | null
          sale_date: string | null
          valor_recebido: number | null
          data_recebimento: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          date?: string | null
          closer?: string | null
          closer_id?: string | null
          lead?: string | null
          bdr?: string | null
          channel?: string | null
          type?: string | null
          status?: string | null
          evolution?: string | null
          sale_value?: number | null
          proposal_value?: number | null
          notes?: string | null
          qualification?: string | null
          company_revenue?: string | null
          proposal_sent?: string | null
          reuniao_resgatada?: string | null
          deal_outcome?: string | null
          sector?: string | null
          sale_date?: string | null
          valor_recebido?: number | null
          data_recebimento?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          date?: string | null
          closer?: string | null
          closer_id?: string | null
          lead?: string | null
          bdr?: string | null
          channel?: string | null
          type?: string | null
          status?: string | null
          evolution?: string | null
          sale_value?: number | null
          proposal_value?: number | null
          notes?: string | null
          qualification?: string | null
          company_revenue?: string | null
          proposal_sent?: string | null
          reuniao_resgatada?: string | null
          deal_outcome?: string | null
          sector?: string | null
          sale_date?: string | null
          valor_recebido?: number | null
          data_recebimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string | null
          phone: string | null
          source: string | null
          interest: string | null
          notes: string | null
          consent: boolean | null
          status: string | null
          nome_bdr: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email?: string | null
          phone?: string | null
          source?: string | null
          interest?: string | null
          notes?: string | null
          consent?: boolean | null
          status?: string | null
          nome_bdr?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          source?: string | null
          interest?: string | null
          notes?: string | null
          consent?: boolean | null
          status?: string | null
          nome_bdr?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: number
          activity_id: number | null
          valor_pago: number | null
          data_pagamento: string | null
          meio_pagamento: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          activity_id?: number | null
          valor_pago?: number | null
          data_pagamento?: string | null
          meio_pagamento?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          activity_id?: number | null
          valor_pago?: number | null
          data_pagamento?: string | null
          meio_pagamento?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          updated_at: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          full_name?: string | null
          updated_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          full_name?: string | null
          updated_at?: string | null
          is_active?: boolean
        }
        Relationships: []
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

type PublicSchema = Database[keyof Database & "public"]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
