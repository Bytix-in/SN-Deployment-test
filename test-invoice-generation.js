const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qlvrvlrrqerzemmujyva.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdnJ2bHJycWVyemVtbXVqeXZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA4MzU1NSwiZXhwIjoyMDY4NjU5NTU1fQ.vHgnum06sodAs4iVAabkEL5ef-_7TI2wmqb5W3eee4s'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testInvoiceGeneration() {
  console.log('🧪 Testing Invoice Generation...')
  
  try {
    // Step 1: Find a successful order or create one
    console.log('1. Looking for a successful order...')
    
    let { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_status', 'SUCCESS')
      .limit(1)
    
    if (orderError) {
      console.error('Error fetching orders:', orderError)
      return
    }
    
    let testOrder
    
    if (!orders || orders.length === 0) {
      console.log('No successful orders found. Creating a test order...')
      
      // Get a restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .limit(1)
        .single()
      
      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError)
        return
      }
      
      // Create test order with SUCCESS payment status
      const orderData = {
        restaurant_id: restaurant.id,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '1234567890',
        table_number: '5',
        items: [
          {
            dish_id: '1',
            dish_name: 'Test Dish',
            quantity: 2,
            price: 100,
            total: 200
          }
        ],
        total_amount: 200,
        status: 'confirmed',
        payment_status: 'SUCCESS',
        payment_id: 'test-payment-' + Date.now()
      }
      
      const { data: newOrder, error: createError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating test order:', createError)
        return
      }
      
      console.log('✅ Test order created:', newOrder.id)
      testOrder = newOrder
    } else {
      testOrder = orders[0]
      console.log('✅ Found existing order:', testOrder.id)
    }
    
    // Step 2: Check if invoice exists for this order
    console.log('2. Checking if invoice exists...')
    
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', testOrder.id)
      .maybeSingle()
    
    if (invoiceError) {
      console.error('Error checking for existing invoice:', invoiceError)
      
      // If the error is that the table doesn't exist, create it
      if (invoiceError.code === '42P01') {
        console.log('Invoices table does not exist. Please create it first.')
        console.log('Run the SQL from create-invoice-table.sql')
        return
      }
    }
    
    if (existingInvoice) {
      console.log('✅ Invoice already exists:', existingInvoice.invoice_number)
      console.log('Invoice details:', {
        id: existingInvoice.id,
        total: existingInvoice.total_amount,
        status: existingInvoice.payment_status
      })
    } else {
      console.log('No invoice exists for this order. Generating one...')
      
      // Step 3: Manually trigger invoice generation via webhook
      console.log('3. Manually triggering invoice generation...')
      
      // Simulate webhook payload
      const webhookPayload = {
        order_id: testOrder.id,
        payment_status: 'SUCCESS',
        payment_id: testOrder.payment_id || 'test-payment-' + Date.now()
      }
      
      // Call the webhook endpoint directly
      const webhookResponse = await fetch('http://localhost:3000/api/payment-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      })
      
      if (!webhookResponse.ok) {
        console.error('❌ Webhook call failed:', webhookResponse.status)
        const errorText = await webhookResponse.text()
        console.error('Error details:', errorText)
        
        // Try direct invoice generation instead
        console.log('Trying direct invoice generation...')
        
        const invoiceResponse = await fetch('http://localhost:3000/api/invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order_id: testOrder.id })
        })
        
        if (!invoiceResponse.ok) {
          console.error('❌ Direct invoice generation failed:', invoiceResponse.status)
          const invoiceErrorText = await invoiceResponse.text()
          console.error('Error details:', invoiceErrorText)
          return
        }
        
        const invoiceResult = await invoiceResponse.json()
        console.log('✅ Invoice generated successfully:', invoiceResult.invoice.invoice_number)
      } else {
        console.log('✅ Webhook call successful')
        const result = await webhookResponse.json()
        console.log('Webhook response:', result)
        
        // Check if invoice was created
        const { data: newInvoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('order_id', testOrder.id)
          .maybeSingle()
        
        if (newInvoice) {
          console.log('✅ Invoice was created:', newInvoice.invoice_number)
        } else {
          console.log('❌ Invoice was not created after webhook call')
        }
      }
    }
    
    console.log('🎉 Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch...')
  // This is a simple way to ensure node-fetch is available
  try {
    global.fetch = require('node-fetch')
  } catch (e) {
    console.log('node-fetch not installed. Installing...')
    require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' })
    global.fetch = require('node-fetch')
  }
}

testInvoiceGeneration()