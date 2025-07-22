import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({
        error: 'Session error',
        details: sessionError
      }, { status: 500 })
    }

    // If we have a session, try to get user invoices
    let invoiceData = null
    let invoiceError = null
    
    if (session?.user) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(3)

      invoiceData = data
      invoiceError = error
    }

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at
      } : null,
      invoices: {
        data: invoiceData,
        error: invoiceError,
        count: invoiceData?.length || 0
      }
    })

  } catch (error) {
    console.error('Auth debug error:', error)
    return NextResponse.json({
      error: 'Auth debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}