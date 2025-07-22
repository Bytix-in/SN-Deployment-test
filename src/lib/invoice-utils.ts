import { supabase } from './supabase'

export async function generateInvoiceForOrder(orderId: string) {
  try {
    console.log('Generating invoice for order:', orderId)
    
    const response = await fetch('/api/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId })
    })

    if (!response.ok) {
      throw new Error('Failed to generate invoice')
    }

    const result = await response.json()
    console.log('Invoice generated successfully:', result.invoice?.invoice_number)
    
    return result.invoice
  } catch (error) {
    console.error('Error generating invoice:', error)
    throw error
  }
}

export async function getInvoiceByOrderId(orderId: string) {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return null
    }

    return invoice
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return null
  }
}

export function downloadInvoiceAsPDF(invoiceId: string, invoiceNumber: string) {
  // Open the HTML invoice in a new window with auto-print
  const printWindow = window.open(
    `/api/invoice/${invoiceId}?format=html&auto_print=true`,
    '_blank',
    'width=800,height=600'
  )
  
  if (printWindow) {
    printWindow.focus()
  }
}

export function viewInvoiceHTML(invoiceId: string) {
  // Open the HTML invoice in a new tab
  window.open(`/api/invoice/${invoiceId}?format=html`, '_blank')
}