import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const USER_ID = process.env.NEXT_PUBLIC_USER_ID || process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc'

export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  try {
    const { command, params } = await request.json()

    // Store command as a pending task that Jasper will pick up
    const { data, error } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: USER_ID,
        title: `[COMMAND] ${command}`,
        status: 'todo',
        priority: 'high',
        notes: JSON.stringify({ command, params, requestedAt: new Date().toISOString(), source: 'jasper-hq-dashboard' }),
        tags: ['command', 'quick-action'],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, taskId: data?.id, message: `Command "${command}" queued. Jasper will execute it shortly.` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
