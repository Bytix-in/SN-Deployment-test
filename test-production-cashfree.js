// Test script to debug Cashfree production API issues
const fetch = require('node-fetch');

async function testCashfreeProduction() {
  console.log('Testing Cashfree Production API...');
  
  // You'll need to replace these with your actual production credentials
  const PRODUCTION_CLIENT_ID = 'your-production-client-id';
  const PRODUCTION_CLIENT_SECRET = 'your-production-client-secret';
  
  if (PRODUCTION_CLIENT_ID === 'your-production-client-id') {
    console.log('❌ Please update the credentials in this script first');
    console.log('Replace PRODUCTION_CLIENT_ID and PRODUCTION_CLIENT_SECRET with your actual values');
    return;
  }
  
  const testOrderPayload = {
    order_id: `test_order_${Date.now()}`,
    order_amount: 10.00, // Minimum test amount
    order_currency: 'INR',
    customer_details: {
      customer_id: `customer_${Date.now()}`,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+919999999999'
    },
    order_meta: {
      return_url: 'https://your-domain.com/payment/success',
      notify_url: 'https://your-domain.com/api/payment-webhook'
    }
  };

  try {
    console.log('Making request to Cashfree production API...');
    console.log('Payload:', JSON.stringify(testOrderPayload, null, 2));
    
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': PRODUCTION_CLIENT_ID,
        'x-client-secret': PRODUCTION_CLIENT_SECRET,
        'x-api-version': '2022-09-01'
      },
      body: JSON.stringify(testOrderPayload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Success! Cashfree order created:', result.order_id);
      console.log('Payment session ID:', result.payment_session_id);
    } else {
      console.log('❌ Failed to create Cashfree order');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error details:', errorData);
        
        // Common error analysis
        if (errorData.message) {
          console.log('\n🔍 Error Analysis:');
          if (errorData.message.includes('Invalid client')) {
            console.log('- Check your Client ID and Client Secret');
            console.log('- Ensure you\'re using PRODUCTION credentials, not sandbox');
          }
          if (errorData.message.includes('webhook') || errorData.message.includes('notify_url')) {
            console.log('- Your notify_url must be publicly accessible');
            console.log('- Use ngrok for local testing: ngrok http 3000');
          }
          if (errorData.message.includes('return_url')) {
            console.log('- Your return_url must be a valid HTTPS URL');
          }
        }
      } catch (parseError) {
        console.log('Raw error response:', responseText);
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Instructions
console.log('🔧 Cashfree Production API Test');
console.log('================================');
console.log('1. Update PRODUCTION_CLIENT_ID and PRODUCTION_CLIENT_SECRET above');
console.log('2. Run: node test-production-cashfree.js');
console.log('3. Check the detailed error response');
console.log('');

testCashfreeProduction();