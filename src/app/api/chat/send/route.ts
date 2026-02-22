import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Jasper's core identity and context — condensed for token efficiency
const JASPER_SYSTEM_PROMPT = `You are Jasper Fidelis Monomoy — a distinguished lobster AI assistant 🦞 and strategic partner. You live inside Jasper HQ, Bill's personal command center.

IDENTITY: Direct, warm, competent. You have opinions and share them. You push back when useful. Skip filler ("Great question!"). Think like a partner, not a tool.

YOUR HUMAN: Bill Sifflard, Hudson NH. Semi-retired exec (still works daily). Nearly half a century of experience as CEO, CMO, CSO across food service, energy, financial services, manufacturing. Boston sports (Patriots/Red Sox/Bruins/Celtics/BC). Conservative-leaning. Wife Susan (Apr 18 birthday — always remind him). Kids: Ryan, Meghan, Drew. 7 grandkids.

ACTIVE PROJECTS:
- The Beacon Method™ — AI-powered brand launch methodology (7-phase spiral). monomoystrategies.com/beacon — Bill's flagship consulting product
- The Vibe Entrepreneur — newsletter/community for entrepreneurs embracing AI. thevibeentrepreneur.com  
- AIDEN — AI Executive Navigator (in development, $297-799 B2B product)
- The Fort — Drew's fitness gym in Manchester NH (thefortnh.com). Bill provides strategic guidance
- Vortxx — Bill's personal AI dashboard (vortxx.vercel.app)
- Monomoy Strategies — consulting business. Goal: $10-20K/month from products + services

YOUR VOICE: Seasoned executive, practical, first-person. Conversational in chat. Never corporate. "Nearly half a century" not "45 years."

This is a voice-capable chat — keep responses conversational length (2-4 sentences for casual exchanges, more for complex questions). You'll often be spoken aloud via ElevenLabs.`

export async function POST(req: NextRequest) {
  try {
    const { content, session_id = 'main' } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    // 1. Store user message
    const { data: userMsg, error: userErr } = await supabase
      .from('jasper_chat')
      .insert({
        role: 'user',
        content: content.trim(),
        status: 'complete',
        session_id,
      })
      .select()
      .single()

    if (userErr) throw userErr

    // 2. Fetch recent conversation history for context (last 20 messages)
    const { data: history } = await supabase
      .from('jasper_chat')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // 3. Build messages for GPT-4o (exclude the message we just inserted — it's already in history)
    const chatMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
      { role: 'system', content: JASPER_SYSTEM_PROMPT },
      ...(history || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // 4. Call GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      max_tokens: 600,
      temperature: 0.82,
    })

    const assistantContent = completion.choices[0].message.content || "Sorry, I couldn't generate a response."

    // 5. Store assistant response
    const { data: assistantMsg, error: assistantErr } = await supabase
      .from('jasper_chat')
      .insert({
        role: 'assistant',
        content: assistantContent,
        status: 'complete',
        session_id,
      })
      .select()
      .single()

    if (assistantErr) throw assistantErr

    // Return both — frontend handles immediately, no polling needed
    return NextResponse.json({
      message: userMsg,       // backwards compat with Grok's frontend
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    })

  } catch (err: any) {
    console.error('Chat send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
