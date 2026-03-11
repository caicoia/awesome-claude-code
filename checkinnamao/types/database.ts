// Tipos do banco de dados Supabase
// Regenerar após cada migration com: npx supabase gen types typescript --local > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          name: string
          stripe_price_id: string | null
          price_brl: number
          max_rooms: number | null
          max_staff: number | null
          has_ical_sync: boolean
          has_mini_site: boolean
          has_financial: boolean
          has_api: boolean
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      tenants: {
        Row: {
          id: string
          slug: string
          name: string
          email: string
          phone: string | null
          city: string | null
          state: string | null
          address: string | null
          logo_url: string | null
          cover_url: string | null
          plan_id: string | null
          trial_ends_at: string | null
          is_active: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }
      users: {
        Row: {
          id: string
          tenant_id: string | null
          role: 'super_admin' | 'owner' | 'staff'
          name: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      rooms: {
        Row: {
          id: string
          tenant_id: string
          number: string
          name: string | null
          type: string
          capacity: number
          beds: number | null
          price_brl: number
          description: string | null
          amenities: string[]
          photos: string[]
          floor: number | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      guests: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email: string | null
          phone: string | null
          cpf: string | null
          rg: string | null
          birth_date: string | null
          nationality: string
          address: string | null
          city: string | null
          state: string | null
          notes: string | null
          tags: string[]
          total_stays: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['guests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['guests']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          tenant_id: string
          room_id: string
          guest_id: string | null
          guest_name: string
          check_in_date: string
          check_out_date: string
          adults: number
          children: number
          nights: number
          price_per_night: number
          total_brl: number
          paid_brl: number
          status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
          channel: string
          channel_ref: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'nights' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      checkins: {
        Row: {
          id: string
          tenant_id: string
          booking_id: string
          guest_id: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checked_in_by: string | null
          checked_out_by: string | null
          key_delivered: boolean
          payment_status: 'pending' | 'partial' | 'paid'
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['checkins']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          type: 'general' | 'cleaning' | 'maintenance' | 'checkout_prep' | 'inspection'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'done' | 'cancelled'
          due_date: string | null
          due_time: string | null
          room_id: string | null
          assigned_to: string | null
          created_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      leads: {
        Row: {
          id: string
          source: 'vip' | 'diagnostico'
          name: string | null
          email: string
          phone: string | null
          pousada_name: string | null
          rooms_count: string | null
          city: string | null
          gestao_reservas: string | null
          reservas_mes: string | null
          taxa_ocupacao: string | null
          canais_venda: string | null
          principal_dificuldade: string | null
          tem_equipe: string | null
          impede_crescer: string | null
          expectativa: string | null
          status: 'novo' | 'diagnostico_enviado' | 'qualificado' | 'convertido' | 'perdido'
          tenant_id: string | null
          notes: string | null
          url_origem: string | null
          diagnostico_enviado: boolean
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      financial_transactions: {
        Row: {
          id: string
          tenant_id: string
          booking_id: string | null
          type: 'revenue' | 'expense' | 'refund'
          category: string | null
          description: string
          amount_brl: number
          method: string | null
          date: string
          paid_at: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['financial_transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['financial_transactions']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          tenant_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          plan_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
    }
    Functions: {
      check_room_availability: {
        Args: {
          p_room_id: string
          p_check_in: string
          p_check_out: string
          p_exclude_booking_id?: string
        }
        Returns: boolean
      }
      get_dashboard_kpis: {
        Args: { p_tenant_id: string }
        Returns: {
          occupancy_today: number
          checkins_today: number
          checkouts_today: number
          bookings_this_month: number
          revenue_this_month_brl: number
          total_rooms: number
          available_today: number
        }[]
      }
    }
  }
}

// Helpers de tipo para uso nos componentes
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Booking = Tables<'bookings'>
export type Room    = Tables<'rooms'>
export type Guest   = Tables<'guests'>
export type Task    = Tables<'tasks'>
export type Tenant  = Tables<'tenants'>
export type Lead    = Tables<'leads'>
export type User    = Tables<'users'>
export type FinancialTransaction = Tables<'financial_transactions'>
