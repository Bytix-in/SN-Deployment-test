// Simple script to create some test invoices for testing
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://qlvrvlrrqerzemmujyva.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdnJ2bHJycWVyemVtbXVqeXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4MzU1NSwiZXhwIjoyMDY4NjU5NTU1fQ.vHgnum06sodAs4iVAabkEL5ef-_7TI2wmqb5W3eee4s'
)

async function setupInvoicesTable() {
  console.log('🔧 Setting up invoices table...')

  try {
    // First, let's check if we can access any tables
    console.log('1. Checking database connection...')
    const { data: tables, error: tablesError } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(1)

    if (tablesError) {
      console.error('❌ Database connection failed:', tablesError)
      return
    }

    console.log('✅ Database connection successful')
    console.log('Found restaurant:', tables[0]?.name || 'No restaurants')

    // Check if invoices table exists by trying to query it
    console.log('2. Checking if invoices table exists...')
    const { data: invoiceCheck, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .limit(1)

    if (invoiceError && invoiceError.code === '42P01') {
      console.log('❌ Invoices table does not exist')
      console.log('📝 Please create the invoices table manually in Supabase:')
      console.log('')
      console.log('1. Go to https://supabase.com/dashboard/project/qlvrvlrrqerzemmujyva')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run this SQL:')
      console.log('')
      console.log(`
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  restaurant_name VARCHAR(255) NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_restaurant_id ON invoices(restaurant_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own invoices" ON invoices 
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Enable insert for authenticated users" ON invoices 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON invoices 
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
      `)
      console.log('')
      console.log('4. After creating the table, run this script again')
      return
    }

    if (invoiceError) {
      console.error('❌ Error checking invoices table:', invoiceError)
      return
    }

    console.log('✅ Invoices table exists!')
    console.log('Current invoices count:', invoiceCheck?.length || 0)

    // Create a test invoice if none exist
    if (!invoiceCheck || invoiceCheck.length === 0) {
      console.log('3. Creating test invoice...')
      
      // Get a restaurant for the test
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name')
        .limit(1)
        .single()

      if (!restaurant) {
        console.log('❌ No restaurants found. Please create a restaurant first.')
        return
      }

      const testInvoice = {
        restaurant_id: restaurant.id,
        invoice_number: `INV-${Date.now()}-TEST`,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '+91 9876543210',
        restaurant_name: restaurant.name,
        items: [
          {
            dish_name: 'Test Dish 1',
            price: 150,
            quantity: 2
          },
          {
            dish_name: 'Test Dish 2',
            price: 200,
            quantity: 1
          }
        ],
        subtotal: 500,
        tax_amount: 90,
        total_amount: 590,
        payment_status: 'paid'
      }

      const { data: invoice, error: createError } = await supabase
        .from('invoices')
        .insert([testInvoice])
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating test invoice:', createError)
      } else {
        console.log('✅ Test invoice created:', invoice.invoice_number)
      }
    }

    console.log('🎉 Setup complete! You can now test the dashboard.')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupInvoicesTable()