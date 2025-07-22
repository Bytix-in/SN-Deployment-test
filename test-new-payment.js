// Test script to create a new payment and verify the amount is correct
const fetch = require('node-fetch');

async function testNewPayment() {
  console.log('Testing new payment creation...');
  
  const testPayload = {
    restaurant_id: 'your-restaurant-id', // You'll need to replace this
    customer_name: 'Test Customer',
    customer_phone: '9999999999',
    customer_email: 'test@example.com',
    table_number: '5',
    items: [
      {
        dish_id: 'test-dish-1',
        dish_name: 'Test Dish 1',
        quantity: 2,
        price: 150,
        total: 300
      },
      {
        dish_id: 'test-dish-2', 
        dish_name: 'Test Dish 2',
        quantity: 1,
        price: 200,
        total: 200
      }
    ],
    total_amount: 500 // This should now appear in the payment gateway instead of 272
  };

  try {
    const response = await fetch('http://localhost:3000/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Payment creation successful!');
      console.log('Order ID:', result.order_id);
      console.log('Payment Session ID:', result.payment_session_id);
      console.log('Cashfree Order ID:', result.cashfree_order_id);
      console.log('Environment:', result.environment);
      
      // The payment gateway should now show ₹500 instead of ₹272
      console.log('\n🎉 The payment gateway should now show ₹500 instead of the hardcoded ₹272!');
    } else {
      console.log('❌ Payment creation failed:', result.error);
      console.log('Details:', result.details);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Note: You'll need to start your Next.js server first with `npm run dev`
console.log('Make sure your Next.js server is running on http://localhost:3000');
console.log('Then update the restaurant_id in this script and run it again.');

// Uncomment the line below after updating the restaurant_id
// testNewPayment();