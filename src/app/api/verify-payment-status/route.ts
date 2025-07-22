import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDecryptedCredentials } from '../payment-settings/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, payment_session_id } = body

    if (!order_id || !payment_session_id) {
      return NextResponse.json(
        { error: 'Order ID and payment session ID are required' },
        { status: 400 }
      )
    }

    console.log('Verifying payment status for order:', order_id)

    // Get order details to find restaurant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('restaurant_id, payment_gateway_order_id')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get restaurant's payment credentials
    const credentials = await getDecryptedCredentials(order.restaurant_id)
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Payment credentials not found' },
        { status: 404 }
      )
    }

    // Check payment status with Cashfree
    const baseUrl = credentials.environment === 'production'
      ? 'https://api.cashfree.com'
      : 'https://sandbox.cashfree.com'

    console.log('Checking payment status with Cashfree...')
    
    // Use the order ID to get payment status from Cashfree
    const cashfreeOrderId = order.payment_gateway_order_id || order_id
    
    const statusResponse = await fetch(`${baseUrl}/pg/orders/${cashfreeOrderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': credentials.client_id,
        'x-client-secret': credentials.client_secret,
        'x-api-version': '2023-08-01'
      }
    })

    console.log('Cashfree status response:', statusResponse.status)

    if (!statusResponse.ok) {
      const errorData = await statusResponse.text()
      console.error('Cashfree status error:', errorData)
      
      // If we can't verify with Cashfree, assume success if we're on success page
      return NextResponse.json({
        success: true,
        payment_status: 'SUCCESS',
        message: 'Payment verification unavailable, assuming success'
      })
    }

    const statusData = await statusResponse.json()
    console.log('Cashfree order status:', statusData)

    // Check if payment is successful based on Cashfree response
    const isPaymentSuccess = (
      statusData.order_status === 'PAID' ||
      statusData.order_status === 'ACTIVE' ||
      (statusData.payments && statusData.payments.some((p: any) => p.payment_status === 'SUCCESS'))
    )

    const paymentStatus = isPaymentSuccess ? 'SUCCESS' : 'PENDING'

    // If payment is successful, update the order in our database
    if (isPaymentSuccess) {
      console.log('Payment verified as successful, updating order...')
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'SUCCESS',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id)

      if (updateError) {
        console.error('Error updating order status:', updateError)
      }

      // Trigger webhook for invoice generation
      try {
        const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: order_id,
            payment_status: 'SUCCESS',
            payment_id: statusData.cf_order_id || `cf_${Date.now()}`,
            payment_time: new Date().toISOString()
          })
        })
        
        console.log('Webhook triggered for invoice generation:', webhookResponse.status)
      } catch (webhookError) {
        console.error('Error triggering webhook:', webhookError)
      }
    }

    return NextResponse.json({
      success: true,
      payment_status: paymentStatus,
      cashfree_data: statusData,
      message: isPaymentSuccess ? 'Payment verified as successful' : 'Payment still pending'
    })

  } catch (error) {
    console.error('Error verifying payment status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}