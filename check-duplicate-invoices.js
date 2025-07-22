const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlvrvlrrqerzemmujyva.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdnJ2bHJycWVyemVtbXVqeXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODM1NTUsImV4cCI6MjA2ODY1OTU1NX0.iKkbtTChuT11VvXwUy8lMC9JIxd4ve6GD7CDPmzjeH8'
);

async function checkDuplicateInvoices() {
  console.log('Checking for duplicate invoices...');
  
  try {
    // Get all invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, order_id, invoice_number, created_at, total_amount')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }
    
    console.log(`Total invoices found: ${invoices.length}`);
    
    // Group by order_id to find duplicates
    const orderGroups = {};
    invoices.forEach(invoice => {
      if (!orderGroups[invoice.order_id]) {
        orderGroups[invoice.order_id] = [];
      }
      orderGroups[invoice.order_id].push(invoice);
    });
    
    // Find orders with multiple invoices
    const duplicateOrders = Object.keys(orderGroups).filter(orderId => 
      orderGroups[orderId].length > 1
    );
    
    if (duplicateOrders.length === 0) {
      console.log('✅ No duplicate invoices found');
      return;
    }
    
    console.log(`❌ Found ${duplicateOrders.length} orders with duplicate invoices:`);
    
    duplicateOrders.forEach(orderId => {
      const duplicates = orderGroups[orderId];
      console.log(`\nOrder ID: ${orderId}`);
      console.log(`Number of invoices: ${duplicates.length}`);
      duplicates.forEach((invoice, index) => {
        console.log(`  ${index + 1}. Invoice: ${invoice.invoice_number}, Amount: ₹${invoice.total_amount}, Created: ${invoice.created_at}`);
      });
    });
    
    // Show recent invoices for context
    console.log('\nRecent invoices:');
    invoices.slice(0, 10).forEach(invoice => {
      console.log(`${invoice.invoice_number} - Order: ${invoice.order_id.slice(0, 8)}... - ₹${invoice.total_amount} - ${invoice.created_at}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDuplicateInvoices();