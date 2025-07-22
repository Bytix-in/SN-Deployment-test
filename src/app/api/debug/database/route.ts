import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') || 'invoices'

    // Check if table exists and get some basic info
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(5)

    if (error) {
      return NextResponse.json({
        error: error.message,
        details: error,
        table: table
      }, { status: 500 })
    }

    // Also check current user session
    const { data: { session } } = await supabase.auth.getSession()

    return NextResponse.json({
      success: true,
      table: table,
      count: count,
      sampleData: data,
      currentUser: session?.user?.id || 'No user session',
      userEmail: session?.user?.email || 'No email'
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}