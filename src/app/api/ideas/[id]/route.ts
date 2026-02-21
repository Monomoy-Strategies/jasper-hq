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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  try {
    const body = await request.json()

    // First fetch current metadata
    const { data: current, error: fetchErr } = await supabase
      .from('agent_documents')
      .select('metadata')
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr

    const updatedMetadata = { ...(current?.metadata || {}) }
    if (body.status) updatedMetadata.status = body.status
    if (body.rating) updatedMetadata.rating = body.rating

    const { error } = await supabase
      .from('agent_documents')
      .update({ metadata: updatedMetadata })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
