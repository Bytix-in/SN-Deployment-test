const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlvrvlrrqerzemmujyva.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdnJ2bHJycWVyemVtbXVqeXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODM1NTUsImV4cCI6MjA2ODY1OTU1NX0.iKkbtTChuT11VvXwUy8lMC9JIxd4ve6GD7CDPmzjeH8'
);

async function cleanupDuplicateInvoices() {
  console.log('🧹 Starting cleanup of duplicate invoices...');
  
  try {
    // Get all invoices ordered by creation time
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, order_id, invoice_number, created_at')
      .order('created_at', { ascending: true }); // Oldest first
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }
    
    console.log(`📊 Total invoices found: ${invoices.length}`);
    
    // Group by order_id
    const orderGroups = {};
    invoices.forEach(invoice => {
      if (!orderGroups[invoice.order_id]) {
        orderGroups[invoice.order_id] = [];
      }
      orderGroups[invoice.order_id].push(invoice);
    });
    
    // Find orders with duplicates
    const duplicateOrders = Object.keys(orderGroups).filter(orderId => 
      orderGroups[orderId].length > 1
    );
    
    if (duplicateOrders.length === 0) {
      console.log('✅ No duplicate invoices found');
      return;
    }
    
    console.log(`🔍 Found ${duplicateOrders.length} orders with duplicate invoices`);
    
    let totalDeleted = 0;
    
    for (const orderId of duplicateOrders) {
      const duplicates = orderGroups[orderId];
      const keepInvoice = duplicates[0]; // Keep the oldest (first created)
      const deleteInvoices = duplicates.slice(1); // Delete the rest
      
      console.log(`\n📋 Order ${orderId.slice(0, 8)}...:`);
      console.log(`  ✅ Keeping: ${keepInvoice.invoice_number} (${keepInvoice.created_at})`);
      console.log(`  🗑️  Deleting ${deleteInvoices.length} duplicates:`);
      
      for (const invoice of deleteInvoices) {
        console.log(`     - ${invoice.invoice_number} (${invoice.created_at})`);
        
        // Delete the duplicate invoice
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoice.id);
        
        if (deleteError) {
          console.error(`     ❌ Error deleting ${invoice.invoice_number}:`, deleteError);
        } else {
          console.log(`     ✅ Deleted ${invoice.invoice_number}`);
          totalDeleted++;
        }
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Orders with duplicates: ${duplicateOrders.length}`);
    console.log(`   - Total invoices deleted: ${totalDeleted}`);
    console.log(`   - Remaining invoices: ${invoices.length - totalDeleted}`);
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: remainingInvoices, error: verifyError } = await supabase
      .from('invoices')
      .select('order_id')
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('Error verifying cleanup:', verifyError);
      return;
    }
    
    const remainingGroups = {};
    remainingInvoices.forEach(invoice => {
      remainingGroups[invoice.order_id] = (remainingGroups[invoice.order_id] || 0) + 1;
    });
    
    const stillDuplicated = Object.keys(remainingGroups).filter(orderId => 
      remainingGroups[orderId] > 1
    );
    
    if (stillDuplicated.length === 0) {
      console.log('✅ Verification passed: No duplicate invoices remain');
    } else {
      console.log(`❌ Verification failed: ${stillDuplicated.length} orders still have duplicates`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupDuplicateInvoices();