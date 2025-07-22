# Invoice Generation System

This document outlines the complete invoice generation system implemented for ServeNow.

## 🎯 Features Implemented

### 1. Automatic Invoice Generation
- **Trigger**: Invoices are automatically generated when payment status becomes 'SUCCESS'
- **Location**: Payment webhook (`/api/payment-webhook/route.ts`) calls invoice generation
- **Data**: Includes order details, customer info, restaurant info, items, and tax calculations

### 2. Invoice API Endpoints

#### POST `/api/invoice`
- **Purpose**: Generate a new invoice for an order
- **Input**: `{ order_id: string }`
- **Output**: Invoice record with calculated totals and tax
- **Features**: 
  - Prevents duplicate invoices
  - Calculates 18% GST automatically
  - Generates unique invoice numbers

#### GET `/api/invoice?order_id=<id>`
- **Purpose**: Retrieve existing invoice by order ID
- **Output**: Invoice JSON data

#### GET `/api/invoice/<invoice_id>`
- **Purpose**: Retrieve invoice by invoice ID
- **Output**: Invoice JSON data

#### GET `/api/invoice/<invoice_id>?format=html`
- **Purpose**: Generate HTML invoice for viewing/printing
- **Features**:
  - Professional invoice layout
  - Print-friendly CSS
  - Responsive design
  - Auto-print option with `&auto_print=true`

### 3. Database Schema

#### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  restaurant_id UUID REFERENCES restaurants(id),
  user_id UUID,
  invoice_number TEXT UNIQUE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  restaurant_name TEXT,
  items JSONB,
  subtotal DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Frontend Components

#### User Dashboard (`/dashboard`)
- **Features**:
  - Lists all user invoices
  - View invoice in new tab
  - Download PDF functionality
  - Invoice statistics
  - Payment status indicators

#### Payment Success Page (`/payment/success`)
- **Features**:
  - Shows invoice after successful payment
  - Generate invoice button if not auto-generated
  - View and download options
  - Links to dashboard

#### PDF Download Component
- **Component**: `InvoicePDFDownload.tsx`
- **Features**:
  - Uses html2pdf.js for client-side PDF generation
  - Fallback to print dialog
  - Loading states
  - Error handling

### 5. Utility Functions

#### Invoice Utils (`/lib/invoice-utils.ts`)
- `generateInvoiceForOrder()`: Generate invoice for order
- `getInvoiceByOrderId()`: Retrieve invoice by order ID
- `downloadInvoiceAsPDF()`: Client-side PDF download
- `viewInvoiceHTML()`: Open HTML invoice

## 🚀 How It Works

### Automatic Flow
1. Customer places order and pays
2. Payment webhook receives success notification
3. Webhook automatically calls invoice generation API
4. Invoice is created with calculated totals and tax
5. Customer can view/download from dashboard or success page

### Manual Flow
1. Customer visits payment success page
2. If no invoice exists, "Generate Invoice" button appears
3. Click generates invoice via API call
4. Invoice becomes available for viewing/downloading

## 📋 Invoice Content

Each invoice includes:
- **Header**: Invoice number, payment status
- **Restaurant Details**: Name, date, time
- **Customer Details**: Name, email, phone
- **Items Table**: Item name, quantity, price, total
- **Totals Section**: Subtotal, tax (18% GST), final total
- **Footer**: Thank you message

## 🎨 Styling Features

- Professional business invoice design
- Print-friendly layout
- Responsive for mobile viewing
- Color-coded payment status
- Clean typography and spacing
- Company branding ready

## 🔧 Configuration

### Tax Calculation
- Currently set to 18% GST (Indian standard)
- Configurable in invoice generation logic
- Applied to subtotal before final total

### Invoice Numbering
- Format: `INV-{timestamp}-{order_id_prefix}`
- Example: `INV-1703123456789-ABC12345`
- Ensures uniqueness across all restaurants

### PDF Generation
- Client-side using html2pdf.js
- Fallback to browser print dialog
- Configurable page size and margins
- High-quality output (scale: 2)

## 🧪 Testing

### Test Files
- `test-invoice-api.js`: Tests API endpoints
- `test-invoice-generation.js`: Full system test (requires env setup)

### Manual Testing Steps
1. Start development server: `npm run dev`
2. Place a test order with successful payment
3. Check payment success page for invoice options
4. Visit `/dashboard` to see invoice list
5. Test view and download functionality

## 🔐 Security Features

- User-specific invoice access (RLS policies)
- Order ownership validation
- Secure API endpoints
- No sensitive data exposure in HTML

## 📱 Mobile Responsive

- Dashboard works on mobile devices
- Invoice HTML is mobile-friendly
- PDF generation works on mobile browsers
- Touch-friendly buttons and interfaces

## 🚀 Future Enhancements

### Potential Improvements
1. **Email Invoices**: Send invoices via email
2. **Bulk Download**: Download multiple invoices as ZIP
3. **Invoice Templates**: Multiple design options
4. **Tax Configuration**: Per-restaurant tax settings
5. **Invoice Analytics**: Revenue reporting
6. **Multi-language**: Localized invoices
7. **Digital Signatures**: Cryptographic invoice signing

### Integration Options
1. **Accounting Software**: QuickBooks, Tally integration
2. **Email Services**: SendGrid, AWS SES
3. **Cloud Storage**: AWS S3, Google Drive backup
4. **Analytics**: Google Analytics invoice tracking

## 📞 Support

For issues or questions about the invoice system:
1. Check the API endpoints are responding (run `node test-invoice-api.js`)
2. Verify database tables exist and have proper RLS policies
3. Ensure environment variables are set correctly
4. Check browser console for client-side errors

## 🎉 Success Metrics

The invoice system is working correctly when:
- ✅ Invoices generate automatically after successful payments
- ✅ Users can view invoices in their dashboard
- ✅ PDF downloads work without errors
- ✅ HTML invoices display properly
- ✅ Tax calculations are accurate
- ✅ Invoice numbers are unique
- ✅ Mobile experience is smooth