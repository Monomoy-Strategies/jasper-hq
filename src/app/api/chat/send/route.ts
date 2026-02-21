import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { content, session_id = 'main' } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('jasper_chat')
      .insert({
        role: 'user',
        content: content.trim(),
        status: 'complete',
        session_id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: data })
  } catch (err: any) {
    console.error('Chat send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
