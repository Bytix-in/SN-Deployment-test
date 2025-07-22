import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDecryptedCredentials } from '../payment-settings/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurant_id,
      customer_name,
      customer_phone,
      customer_email,
      table_number,
      items,
      total_amount,
      user_id
    } = body

    console.log('Create payment request:', {
      restaurant_id,
      customer_name,
      customer_email,
      user_id,
      total_amount,
      items,
      full_body: body
    })

    // Validate required fields more thoroughly
    const missingFields = []
    if (!restaurant_id) missingFields.push('restaurant_id')
    if (!customer_name) missingFields.push('customer_name')
    if (!customer_phone) missingFields.push('customer_phone')
    if (!table_number) missingFields.push('table_number')
    if (!items || !Array.isArray(items) || items.length === 0) missingFields.push('items')
    if (!total_amount || total_amount <= 0) missingFields.push('total_amount')

    if (missingFields.length > 0) {
      console.error('Missing or invalid fields:', missingFields)
      return NextResponse.json(
        { 
          error: 'Missing or invalid required fields',
          missing_fields: missingFields,
          received_data: { restaurant_id, customer_name, customer_phone, table_number, items, total_amount }
        },
        { status: 400 }
      )
    }

    if (!restaurant_id || !customer_name || !customer_phone || !table_number || !items || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get restaurant's payment credentials
    let credentials
    try {
      credentials = await getDecryptedCredentials(restaurant_id)
      console.log('Credentials check result:', credentials ? 'Found' : 'Not found')
    } catch (credError) {
      console.error('Error getting credentials:', credError)
      credentials = null
    }

    if (!credentials) {
      console.log('No payment credentials found for restaurant:', restaurant_id)

      // Fallback: Create order without payment processing for testing
      try {
        const orderData: any = {
          restaurant_id,
          customer_name,
          customer_phone,
          table_number,
          items,
          total_amount,
          status: 'pending',
          payment_status: 'SUCCESS' // Auto-approve payment for testing
        }

        // Add optional fields if they exist
        if (customer_email) orderData.customer_email = customer_email
        if (user_id) orderData.user_id = user_id

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single()

        if (orderError) {
          console.error('Order creation error:', orderError)
          throw new Error(`Failed to create order: ${orderError.message}`)
        }

        console.log('Order created without payment:', order.id)

        return NextResponse.json({
          success: true,
          order_id: order.id,
          message: 'Order created successfully. Payment processing not configured.',
          redirect_url: `/payment/success?order_id=${order.id}`
        })
      } catch (fallbackError) {
        console.error('Fallback order creation failed:', fallbackError)
        return NextResponse.json(
          { error: `Payment not configured and order creation failed: ${fallbackError.message}` },
          { status: 400 }
        )
      }
    }

    // Create order in database first
    const orderData: any = {
      restaurant_id,
      customer_name,
      customer_phone,
      table_number,
      items,
      total_amount,
      status: 'pending',
      payment_status: 'pending'
    }

    // Add optional fields if they exist
    if (customer_email) orderData.customer_email = customer_email
    if (user_id) orderData.user_id = user_id

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    console.log('Order created:', order.id)

    // Create Cashfree order directly (no separate auth needed)
    const baseUrl = credentials.environment === 'production'
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com'

    console.log('Creating Cashfree order...')
    console.log('Base URL:', baseUrl)
    console.log('Client ID:', credentials.client_id)
    console.log('Environment:', credentials.environment)

    // Create unique Cashfree order ID to avoid conflicts with existing payment sessions
    const cashfreeOrderId = `${order.id}_${Date.now()}`
    
    // Format phone number for production (ensure it starts with country code)
    const formattedPhone = customer_phone.startsWith('+91') 
      ? customer_phone 
      : customer_phone.startsWith('91') 
        ? `+${customer_phone}`
        : `+91${customer_phone}`

    // Ensure URLs are absolute and accessible for production
    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseAppUrl}/payment/success?order_id=${order.id}`
    const notifyUrl = `${baseAppUrl}/api/payment-webhook`

    console.log('URLs for Cashfree:', { returnUrl, notifyUrl, environment: credentials.environment })

    // Create Cashfree order
    const orderPayload = {
      order_id: cashfreeOrderId,
      order_amount: parseFloat(total_amount.toString()), // Ensure it's a number
      order_currency: 'INR',
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: customer_name.trim(),
        customer_email: customer_email || `${customer_phone}@servenow.app`,
        customer_phone: formattedPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl
      }
    }

    console.log('Order payload:', JSON.stringify(orderPayload, null, 2))

    // Make a real API call to Cashfree to create a payment order
    console.log('Creating real Cashfree payment order...')
    
    const createOrderResponse = await fetch(`${baseUrl}/pg/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': credentials.client_id,
        'x-client-secret': credentials.client_secret,
        'x-api-version': credentials.environment === 'production' ? '2022-09-01' : '2023-08-01'
      },
      body: JSON.stringify(orderPayload)
    })

    console.log('Cashfree order response status:', createOrderResponse.status)
    console.log('Cashfree response headers:', Object.fromEntries(createOrderResponse.headers.entries()))

    if (!createOrderResponse.ok) {
      const errorText = await createOrderResponse.text()
      console.error('Cashfree error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (parseError) {
        errorData = { message: errorText, raw_response: errorText }
      }
      
      console.error('Parsed Cashfree error:', errorData)
      
      // Return more detailed error information
      return NextResponse.json(
        {
          error: 'Failed to create payment with Cashfree',
          details: errorData.message || 'Unknown Cashfree error',
          cashfree_error: errorData,
          status_code: createOrderResponse.status,
          environment: credentials.environment
        },
        { status: 400 }
      )
    }

    const cashfreeOrder = await createOrderResponse.json()
    console.log('Cashfree order created:', cashfreeOrder)

    // Update order with Cashfree order ID
    await supabase
      .from('orders')
      .update({
        payment_gateway_order_id: cashfreeOrder.order_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    // Create transaction record
    await supabase
      .from('transactions')
      .insert([{
        restaurant_id,
        order_id: order.id,
        payment_gateway: 'cashfree',
        gateway_order_id: cashfreeOrder.order_id,
        amount: total_amount,
        currency: 'INR',
        status: 'pending',
        gateway_response: cashfreeOrder
      }])

    return NextResponse.json({
      success: true,
      order_id: order.id,
      payment_session_id: cashfreeOrder.payment_session_id,
      cashfree_order_id: cashfreeOrder.order_id,
      environment: credentials.environment
    })

  } catch (error: any) {
    console.error('Error creating payment:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      {
        error: 'Failed to create payment',
        details: error.message || 'Unknown error',
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}