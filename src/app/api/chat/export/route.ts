import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const USER_ID = process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc'

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  // Get session info
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('title, created_at')
    .eq('id', sessionId)
    .eq('user_id', USER_ID)
    .single()

  // Get messages
  const { data: messages } = await supabase
    .from('jasper_chat')
    .select('role, content, created_at')
    .eq('chat_session_id', sessionId)
    .order('created_at', { ascending: true })

  if (!messages) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const title = session?.title || 'Jasper Chat'
  const date = session?.created_at
    ? new Date(session.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString()

  // Build Obsidian-ready markdown
  const lines = [
    `# ${title}`,
    ``,
    `**Date:** ${date}  `,
    `**Source:** Jasper HQ Chat  `,
    `**Tags:** #jasper #chat`,
    ``,
    `---`,
    ``,
  ]

  for (const msg of messages) {
    const speaker = msg.role === 'user' ? '**Bill**' : '**Jasper 🦞**'
    const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    lines.push(`### ${speaker} _(${time})_`)
    lines.push(``)
    lines.push(msg.content || '')
    lines.push(``)
  }

  const markdown = lines.join('\n')

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '-')}.md"`,
    },
  })
}
