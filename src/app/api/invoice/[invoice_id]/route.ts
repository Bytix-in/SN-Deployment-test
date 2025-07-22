import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { invoice_id: string } }
) {
  try {
    const { invoice_id } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const autoPrint = searchParams.get('auto_print') === 'true'

    // Fetch invoice details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single()

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (format === 'html') {
      const htmlContent = generateInvoiceHTML(invoice, autoPrint)
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    return NextResponse.json({
      success: true,
      invoice: invoice
    })

  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

function generateInvoiceHTML(invoice: any, autoPrint: boolean = false): string {
  const items = Array.isArray(invoice.items) ? invoice.items : []
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
        }
        .invoice-number {
            font-size: 18px;
            color: #666;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .detail-section h3 {
            margin-bottom: 10px;
            color: #2563eb;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
        }
        .detail-section p {
            margin: 5px 0;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2563eb;
        }
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .total-section {
            margin-left: auto;
            width: 300px;
            border: 2px solid #e0e0e0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .total-row.final {
            border-top: 2px solid #2563eb;
            padding-top: 10px;
            font-weight: bold;
            font-size: 18px;
            color: #2563eb;
        }
        .payment-status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .payment-status.paid {
            background-color: #dcfce7;
            color: #166534;
        }
        .payment-status.pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .print-button {
            background-color: #2563eb;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .print-button:hover {
            background-color: #1d4ed8;
        }
        @media print {
            .print-button {
                display: none;
            }
            body {
                margin: 0;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">Print Invoice</button>
    
    <div class="invoice-header">
        <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">${invoice.invoice_number}</div>
        </div>
        <div>
            <span class="payment-status ${invoice.payment_status}">${invoice.payment_status}</span>
        </div>
    </div>

    <div class="invoice-details">
        <div class="detail-section">
            <h3>Restaurant Details</h3>
            <p><strong>${invoice.restaurant_name}</strong></p>
            <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
            <p>Time: ${new Date(invoice.created_at).toLocaleTimeString()}</p>
        </div>
        
        <div class="detail-section">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> ${invoice.customer_name}</p>
            <p><strong>Email:</strong> ${invoice.customer_email}</p>
            <p><strong>Phone:</strong> ${invoice.customer_phone}</p>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item: any) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Tax (18% GST):</span>
            <span>₹${invoice.tax_amount.toFixed(2)}</span>
        </div>
        <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${invoice.total_amount.toFixed(2)}</span>
        </div>
    </div>

    <div style="margin-top: 40px; text-align: center; color: #666; font-size: 14px;">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice.</p>
    </div>

    ${autoPrint ? `
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
    ` : ''}
</body>
</html>
  `
}