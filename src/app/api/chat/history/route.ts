import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const since = searchParams.get('since') // message ID to poll from
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('jasper_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (since) {
      // Get messages created after the given message ID's timestamp
      const { data: pivot } = await supabase
        .from('jasper_chat')
        .select('created_at')
        .eq('id', since)
        .single()

      if (pivot) {
        query = query.gte('created_at', pivot.created_at)
      }
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ messages: data || [] })
  } catch (err: any) {
    console.error('Chat history error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
