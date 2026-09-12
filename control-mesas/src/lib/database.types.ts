export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      restaurantes: {
        Row: {
          id: string
          usuario_id: string
          url_carta: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          url_carta?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          url_carta?: string | null
        }
        Relationships: []
      }
      mesas: {
        Row: {
          id: string
          numero: number
          restaurante_id: string
          estado: 'libre' | 'ocupada'
        }
        Insert: {
          id?: string
          numero: number
          restaurante_id: string
          estado?: 'libre' | 'ocupada'
        }
        Update: {
          id?: string
          numero?: number
          restaurante_id?: string
          estado?: 'libre' | 'ocupada'
        }
        Relationships: [
          {
            foreignKeyName: 'mesas_restaurante_id_fkey'
            columns: ['restaurante_id']
            isOneToOne: false
            referencedRelation: 'restaurantes'
            referencedColumns: ['id']
          },
        ]
      }
      peticiones: {
        Row: {
          id: string
          mesa_id: string
          restaurante_id: string
          tipo: 'llamar_mozo' | 'pedir_cuenta'
          estado: 'pendiente' | 'atendida'
          creado_en: string
        }
        Insert: {
          id?: string
          mesa_id: string
          restaurante_id: string
          tipo: 'llamar_mozo' | 'pedir_cuenta'
          estado: 'pendiente' | 'atendida'
          creado_en?: string
        }
        Update: {
          id?: string
          mesa_id?: string
          restaurante_id?: string
          tipo?: 'llamar_mozo' | 'pedir_cuenta'
          estado?: 'pendiente' | 'atendida'
          creado_en?: string
        }
        Relationships: [
          {
            foreignKeyName: 'peticiones_mesa_id_fkey'
            columns: ['mesa_id']
            isOneToOne: false
            referencedRelation: 'mesas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'peticiones_restaurante_id_fkey'
            columns: ['restaurante_id']
            isOneToOne: false
            referencedRelation: 'restaurantes'
            referencedColumns: ['id']
          },
        ]
      }
      sesiones_clientes: {
        Row: {
          id: string
          mesa_id: string
          activa: boolean
        }
        Insert: {
          id?: string
          mesa_id: string
          activa: boolean
        }
        Update: {
          id?: string
          mesa_id?: string
          activa?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'sesiones_clientes_mesa_id_fkey'
            columns: ['mesa_id']
            isOneToOne: false
            referencedRelation: 'mesas'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      restaurantes_publico: {
        Row: {
          id: string
          url_carta: string | null
        }
        Insert: {
          id?: never
          url_carta?: never
        }
        Update: {
          id?: never
          url_carta?: never
        }
        Relationships: []
      }
    }
    Functions: {
      liberar_mesa: {
        Args: {
          p_mesa_id: string
        }
        Returns: undefined
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never