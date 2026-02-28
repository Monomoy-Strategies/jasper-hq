import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const USER_ID = process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc'

export async function POST(req: NextRequest) {
  try {
    const { id, title, type = 'mindmap', data, project } = await req.json()
    if (!title || !data) return NextResponse.json({ error: 'title and data required' }, { status: 400 })

    if (id) {
      // Update existing
      const { data: row, error } = await supabase
        .from('canvas_maps')
        .update({ title, data, project, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', USER_ID)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ map: row })
    } else {
      // Insert new
      const { data: row, error } = await supabase
        .from('canvas_maps')
        .insert({ user_id: USER_ID, title, type, data, project })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json({ map: row })
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Save failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('canvas_maps')
      .select('id, title, type, project, created_at, updated_at')
      .eq('user_id', USER_ID)
      .order('updated_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return NextResponse.json({ maps: data || [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Load failed' }, { status: 500 })
  }
}
