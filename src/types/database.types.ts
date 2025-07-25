export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string | null
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          price: number
          description: string
          preparation_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          price: number
          description: string
          preparation_time: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          price?: number
          description?: string
          preparation_time?: number
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          table_number: string
          items: any
          total_amount: number
          status: string
          payment_status: string
          payment_id: string | null
          payment_gateway_order_id: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          table_number: string
          items: any
          total_amount: number
          status?: string
          payment_status?: string
          payment_id?: string | null
          payment_gateway_order_id?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          table_number?: string
          items?: any
          total_amount?: number
          status?: string
          payment_status?: string
          payment_id?: string | null
          payment_gateway_order_id?: string | null
          user_id?: string | null
          updated_at?: string
        }
      }
      payment_settings: {
        Row: {
          id: string
          restaurant_id: string
          cashfree_client_id: string | null
          cashfree_client_secret_encrypted: string | null
          cashfree_environment: string
          is_payment_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          cashfree_client_id?: string | null
          cashfree_client_secret_encrypted?: string | null
          cashfree_environment?: string
          is_payment_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          cashfree_client_id?: string | null
          cashfree_client_secret_encrypted?: string | null
          cashfree_environment?: string
          is_payment_enabled?: boolean
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          restaurant_id: string
          order_id: string
          payment_gateway: string
          gateway_transaction_id: string | null
          gateway_order_id: string | null
          amount: number
          currency: string
          status: string
          gateway_response: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          order_id: string
          payment_gateway?: string
          gateway_transaction_id?: string | null
          gateway_order_id?: string | null
          amount: number
          currency?: string
          status?: string
          gateway_response?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          order_id?: string
          payment_gateway?: string
          gateway_transaction_id?: string | null
          gateway_order_id?: string | null
          amount?: number
          currency?: string
          status?: string
          gateway_response?: any | null
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          order_id: string
          restaurant_id: string
          user_id: string | null
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          restaurant_name: string
          items: any
          subtotal: number
          tax_amount: number
          total_amount: number
          payment_status: string
          invoice_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          restaurant_id: string
          user_id?: string | null
          invoice_number: string
          invoice_date?: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          restaurant_name: string
          items: any
          subtotal: number
          tax_amount?: number
          total_amount: number
          payment_status?: string
          invoice_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          restaurant_id?: string
          user_id?: string | null
          invoice_number?: string
          invoice_date?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          restaurant_name?: string
          items?: any
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          payment_status?: string
          invoice_url?: string | null
          updated_at?: string
        }
      }
    }
  }
}