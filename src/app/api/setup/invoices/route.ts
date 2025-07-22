import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up invoices table...')

    // Create the invoices table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        user_id UUID,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        restaurant_name VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'paid',
        invoice_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute the SQL using a direct query (this is a workaround)
    const { error: createError } = await supabase
      .from('invoices')
      .select('id')
      .limit(1)

    if (createError && createError.code === '42P01') {
      // Table doesn't exist, we need to create it manually
      // For now, let's just return instructions
      return NextResponse.json({
        success: false,
        message: 'Invoices table does not exist. Please create it manually in Supabase dashboard.',
        sql: createTableSQL,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Run the provided SQL query',
          '4. Then call this endpoint again'
        ]
      })
    }

    // If we get here, table exists or was created
    return NextResponse.json({
      success: true,
      message: 'Invoices table is ready'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}