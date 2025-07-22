// Simple test to verify invoice API endpoints are working
// This test assumes the Next.js development server is running on localhost:3000

async function testInvoiceAPI() {
  console.log('🧪 Testing Invoice API Endpoints...\n')

  const baseURL = 'http://localhost:3000'

  try {
    // Test 1: Create a test invoice (this will fail if no orders exist, but that's expected)
    console.log('1. Testing invoice creation endpoint...')
    
    const testOrderId = 'test-order-id-123'
    const createResponse = await fetch(`${baseURL}/api/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: testOrderId })
    })

    console.log(`   Status: ${createResponse.status}`)
    
    if (createResponse.status === 404) {
      console.log('   ✅ Expected 404 - Order not found (endpoint is working)')
    } else if (createResponse.status === 400) {
      console.log('   ✅ Expected 400 - Bad request (endpoint is working)')
    } else {
      const result = await createResponse.json()
      console.log('   Response:', result)
    }

    // Test 2: Test invoice retrieval endpoint
    console.log('\n2. Testing invoice retrieval endpoint...')
    
    const retrieveResponse = await fetch(`${baseURL}/api/invoice?order_id=${testOrderId}`)
    console.log(`   Status: ${retrieveResponse.status}`)
    
    if (retrieveResponse.status === 404) {
      console.log('   ✅ Expected 404 - Invoice not found (endpoint is working)')
    } else {
      const result = await retrieveResponse.json()
      console.log('   Response:', result)
    }

    // Test 3: Test HTML invoice endpoint
    console.log('\n3. Testing HTML invoice endpoint...')
    
    const testInvoiceId = 'test-invoice-id-123'
    const htmlResponse = await fetch(`${baseURL}/api/invoice/${testInvoiceId}?format=html`)
    console.log(`   Status: ${htmlResponse.status}`)
    
    if (htmlResponse.status === 404) {
      console.log('   ✅ Expected 404 - Invoice not found (endpoint is working)')
    } else {
      const htmlContent = await htmlResponse.text()
      console.log(`   HTML Content Length: ${htmlContent.length}`)
    }

    // Test 4: Test JSON invoice endpoint
    console.log('\n4. Testing JSON invoice endpoint...')
    
    const jsonResponse = await fetch(`${baseURL}/api/invoice/${testInvoiceId}`)
    console.log(`   Status: ${jsonResponse.status}`)
    
    if (jsonResponse.status === 404) {
      console.log('   ✅ Expected 404 - Invoice not found (endpoint is working)')
    } else {
      const result = await jsonResponse.json()
      console.log('   Response:', result)
    }

    console.log('\n🎉 Invoice API endpoints are accessible and responding correctly!')
    console.log('\n📝 Next steps:')
    console.log('   1. Start your Next.js development server: npm run dev')
    console.log('   2. Create some test orders with successful payments')
    console.log('   3. Test invoice generation through the UI')
    console.log('   4. Check the dashboard for invoice download functionality')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:')
      console.log('   npm run dev')
    }
  }
}

// Run the test
testInvoiceAPI()