import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const USER_ID = process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc'

// PATCH — rename session
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { title } = await req.json()
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', USER_ID)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}

// DELETE — delete session (messages cascade via FK)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', USER_ID)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
