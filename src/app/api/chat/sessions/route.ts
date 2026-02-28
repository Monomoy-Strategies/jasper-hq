import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const USER_ID = process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc'

// GET — list all sessions
export async function GET() {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, created_at, updated_at')
    .eq('user_id', USER_ID)
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data || [] })
}

// POST — create new session
export async function POST(req: NextRequest) {
  const { title = 'New Chat' } = await req.json().catch(() => ({}))
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: USER_ID, title })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}
