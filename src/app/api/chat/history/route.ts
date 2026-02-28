import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const chat_session_id = searchParams.get('chat_session_id')
    const session_id = searchParams.get('session_id') || 'main'
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('jasper_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit)

    if (chat_session_id) {
      query = query.eq('chat_session_id', chat_session_id)
    } else {
      query = query.eq('session_id', session_id)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ messages: data || [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
