import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Payment webhook received:', body)

    const { 
      order_id, 
      payment_status, 
      payment_amount, 
      payment_currency,
      payment_time,
      payment_id,
      payment_method
    } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Extract original order ID from Cashfree order ID (format: originalId_timestamp)
    const originalOrderId = order_id.includes('_') ? order_id.split('_')[0] : order_id

    // Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: payment_status,
        payment_id: payment_id,
        status: payment_status === 'SUCCESS' ? 'confirmed' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', originalOrderId)

    if (orderError) {
      console.error('Error updating order:', orderError)
    }

    // Update transaction status
    const { error: transactionError } = await supabase
      .from('transactions')
      .update({
        status: payment_status === 'SUCCESS' ? 'completed' : 'failed',
        gateway_transaction_id: payment_id,
        gateway_response: body,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_order_id', order_id)

    if (transactionError) {
      console.error('Error updating transaction:', transactionError)
    }

    // Generate invoice for successful payments
    if (payment_status === 'SUCCESS') {
      try {
        console.log('Generating invoice for successful payment:', originalOrderId)
        
        // Use the original fetch approach which was working before
        const invoiceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_id: originalOrderId })
        })

        if (invoiceResponse.ok) {
          console.log('Invoice generated successfully for order:', order_id)
        } else {
          console.error('Failed to generate invoice for order:', order_id)
        }
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError)
        // Don't fail the webhook if invoice generation fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing payment webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}