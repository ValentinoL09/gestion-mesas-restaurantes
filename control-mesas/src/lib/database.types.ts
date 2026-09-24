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
      mesas: {
        Row: {
          estado: string
          id: string
          numero: number
          qr_url: string | null
          restaurante_id: string
          sucursal_id: string
        }
        Insert: {
          estado?: string
          id?: string
          numero: number
          qr_url?: string | null
          restaurante_id: string
          sucursal_id: string
        }
        Update: {
          estado?: string
          id?: string
          numero?: number
          qr_url?: string | null
          restaurante_id?: string
          sucursal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesas_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesas_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mesas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      peticiones: {
        Row: {
          creado_en: string
          estado: string
          id: string
          mesa_id: string
          metodo_pago: string | null
          restaurante_id: string
          sucursal_id: string
          tipo: string
        }
        Insert: {
          creado_en?: string
          estado?: string
          id?: string
          mesa_id: string
          metodo_pago?: string | null
          restaurante_id: string
          sucursal_id: string
          tipo: string
        }
        Update: {
          creado_en?: string
          estado?: string
          id?: string
          mesa_id?: string
          metodo_pago?: string | null
          restaurante_id?: string
          sucursal_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "peticiones_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peticiones_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peticiones_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peticiones_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurantes: {
        Row: {
          color_primario: string
          color_secundario: string
          creado_en: string
          id: string
          link_menu: string | null
          logo_url: string | null
          nombre: string
          url_carta: string | null
          url_resenas: string | null
          usuario_id: string | null
        }
        Insert: {
          color_primario?: string
          color_secundario?: string
          creado_en?: string
          id?: string
          link_menu?: string | null
          logo_url?: string | null
          nombre: string
          url_carta?: string | null
          url_resenas?: string | null
          usuario_id?: string | null
        }
        Update: {
          color_primario?: string
          color_secundario?: string
          creado_en?: string
          id?: string
          link_menu?: string | null
          logo_url?: string | null
          nombre?: string
          url_carta?: string | null
          url_resenas?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      sesiones_clientes: {
        Row: {
          activa: boolean
          creado_en: string
          id: string
          mesa_id: string
        }
        Insert: {
          activa?: boolean
          creado_en?: string
          id?: string
          mesa_id: string
        }
        Update: {
          activa?: boolean
          creado_en?: string
          id?: string
          mesa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_clientes_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          restaurante_id: string
        }
        Insert: {
          creado_en?: string
          id?: string
          nombre: string
          restaurante_id: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          restaurante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_restaurante_id_fkey"
            columns: ["restaurante_id"]
            isOneToOne: false
            referencedRelation: "restaurantes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      restaurantes_publico: {
        Row: {
          color_primario: string | null
          color_secundario: string | null
          id: string | null
          logo_url: string | null
          nombre: string | null
          url_carta: string | null
          url_resenas: string | null
        }
        Insert: {
          color_primario?: string | null
          color_secundario?: string | null
          id?: string | null
          logo_url?: string | null
          nombre?: string | null
          url_carta?: string | null
          url_resenas?: string | null
        }
        Update: {
          color_primario?: string | null
          color_secundario?: string | null
          id?: string | null
          logo_url?: string | null
          nombre?: string | null
          url_carta?: string | null
          url_resenas?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      eliminar_sucursal: { Args: { p_sucursal_id: string }; Returns: undefined }
      is_owner: { Args: never; Returns: boolean }
      liberar_mesa: { Args: { p_mesa_id: string }; Returns: undefined }
      ocupar_mesa: { Args: { p_mesa_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
