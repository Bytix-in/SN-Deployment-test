const { Client } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env.local') })

async function createInvoicesTable() {
  console.log('Environment variables:')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
  
  // Use the direct connection string for Supabase
  const connectionString = "postgresql://postgres:Bytix%40222024@db.qlvrvlrrqerzemmujyva.supabase.co:5432/postgres"
  
  const client = new Client({
    connectionString: connectionString
  })

  try {
    await client.connect()
    console.log('Connected to database')

    const createTableSQL = `
      -- Create invoices table to store invoice information
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

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_restaurant_id ON invoices(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

      -- Enable RLS
      ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
      DROP POLICY IF EXISTS "Enable insert for authenticated users" ON invoices;
      DROP POLICY IF EXISTS "Enable update for authenticated users" ON invoices;

      -- Create proper RLS policies
      CREATE POLICY "Users can view their own invoices" ON invoices 
        FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
      
      CREATE POLICY "Enable insert for authenticated users" ON invoices 
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY "Enable update for authenticated users" ON invoices 
        FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
    `

    console.log('Creating invoices table...')
    await client.query(createTableSQL)
    console.log('✅ Invoices table created successfully!')

    // Check if table was created
    const checkResult = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'invoices' AND table_schema = 'public'
    `)
    
    console.log('Table exists:', checkResult.rows[0].count > 0)

  } catch (error) {
    console.error('❌ Error creating invoices table:', error)
  } finally {
    await client.end()
  }
}

// Install pg if not already installed
try {
  require('pg')
} catch (e) {
  console.log('Installing pg package...')
  require('child_process').execSync('npm install pg', { stdio: 'inherit' })
}

createInvoicesTable()