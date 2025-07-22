const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qlvrvlrrqerzemmujyva.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdnJ2bHJycWVyemVtbXVqeXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODM1NTUsImV4cCI6MjA2ODY1OTU1NX0.iKkbtTChuT11VvXwUy8lMC9JIxd4ve6GD7CDPmzjeH8'
);

async function checkOrders() {
  console.log('Checking recent orders...');
  
  const { data, error } = await supabase
    .from('orders')
    .select('id, total_amount, created_at, customer_name, items, payment_gateway_order_id')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Recent orders:');
  if (data.length === 0) {
    console.log('No orders found');
  } else {
    data.forEach(order => {
      console.log(`ID: ${order.id.slice(0, 8)}..., Amount: ${order.total_amount}, Customer: ${order.customer_name}, Created: ${order.created_at}`);
    });
  }
  
  // Check for orders with amount 272
  const ordersWithAmount272 = data.filter(order => order.total_amount === 272);
  if (ordersWithAmount272.length > 0) {
    console.log('\nOrders with amount 272:');
    ordersWithAmount272.forEach(order => {
      console.log(`ID: ${order.id}`);
      console.log(`Customer: ${order.customer_name}`);
      console.log(`Created: ${order.created_at}`);
      console.log(`Items: ${JSON.stringify(order.items, null, 2)}`);
      console.log(`Payment Gateway Order ID: ${order.payment_gateway_order_id}`);
      console.log('---');
    });
  }
}

checkOrders().catch(console.error);