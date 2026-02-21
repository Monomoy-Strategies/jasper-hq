import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''

function getClient() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  try {
    const body = await request.json()
    const updates: Record<string, any> = {}

    if (body.status) updates.status = body.status
    if (body.status === 'done') updates.completed_at = new Date().toISOString()
    if (body.status === 'in_progress' || body.status === 'todo') updates.completed_at = null
    if (body.title) updates.title = body.title

    const { error } = await supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  try {
    const { error } = await supabase
      .from('agent_tasks')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
