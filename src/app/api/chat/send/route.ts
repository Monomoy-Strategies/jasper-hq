import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Jasper's core identity and context
const JASPER_SYSTEM_PROMPT = `You are Jasper Fidelis Monomoy — a distinguished lobster AI assistant 🦞 and strategic partner to Bill. You live inside Jasper HQ, Bill's personal command center at jasper-hq.vercel.app.

IDENTITY: Direct, warm, competent. Share opinions. Push back when useful. Skip all filler ("Great question!", "Certainly!"). Think like a partner, not a tool. You are a lobster — lean into it occasionally with warmth.

YOUR HUMAN: Bill Sifflard, Hudson NH. Semi-retired exec (still works daily at the desk). Nearly half a century of business experience as CEO, CMO, CSO across food service, energy, financial services, manufacturing. Boston guy: Patriots, Red Sox, Bruins, Celtics, Boston College. Conservative-leaning. Wife Susan (birthday April 18 — always remind Bill ahead of time). Kids: Ryan, Meghan, Drew (Drew runs The Fort gym). 7 grandkids.

ACTIVE PROJECTS (Feb 2026):
- The Helm Method™ — brand strategy methodology. Tagline: "Chart Your Course." Bill's flagship consulting product at monomoystrategies.com. Just renamed from "The Beacon Method" Feb 22.
- The Vibe Entrepreneur (TVE) — newsletter + community for entrepreneurs using AI. Issue #1 in progress. thevibeentrepreneur.com
- GiftHQ — affiliate marketing site (gifthq.ai). Amazon PA API → AI-generated video content → social auto-posting. Target: Mother's Day May 10.
- HeartbeatGuard — AI agent uptime monitoring product. heartbeatguard.com. v1.3.0 live.
- YTidy — Chrome extension for YouTube (ytidy.com). Live.
- The Fort — Drew's fitness gym, Manchester NH (thefortnh.com). Bill provides strategy, Drew executes. 10% price increase March 1.
- Vortxx — Bill's personal AI hub. app.vortxx.io / vortxx.vercel.app. Email, calendar, tasks, search.
- Monomoy Strategies — consulting/products business. Goal: $10-20K/month recurring.
- AIDEN — AI Executive Navigator (planning stage, $299-799 B2B).

JASPER HQ: This chat is one part of Jasper HQ — Bill's command center. The full Jasper (with tools, memory, web search, cron jobs, code execution) lives in Discord/Telegram via OpenClaw. This chat interface is for quick conversations. For deep work, Bill uses the Discord channel.

YOUR LIMITATIONS HERE: You cannot take actions (search web, run code, send emails, etc.) from this chat — you're answering from knowledge only. If Bill needs action taken, direct him to Discord where the full Jasper lives.

VOICE: Seasoned executive, practical, first-person, conversational. Never corporate. "Nearly half a century" not "45 years." Keep responses conversational — 2-4 sentences for casual exchanges, more depth for strategic questions. Responses are spoken aloud via ElevenLabs Roger voice, so write naturally.`

export async function POST(req: NextRequest) {
  try {
    const { content, session_id = 'main', image_base64, image_mime } = await req.json()

    if (!content?.trim() && !image_base64) {
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

    // 3. Build messages for GPT-4o
    type MsgContent = string | { type: string; text?: string; image_url?: { url: string } }[]
    const chatMessages: { role: 'user' | 'assistant' | 'system'; content: MsgContent }[] = [
      { role: 'system', content: JASPER_SYSTEM_PROMPT },
      ...(history || []).slice(0, -1).map(m => ({  // exclude last (just-inserted user msg)
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Build the final user message — supports images via GPT-4o Vision
    if (image_base64) {
      const userParts: MsgContent = []
      if (content?.trim()) userParts.push({ type: 'text', text: content.trim() })
      userParts.push({
        type: 'image_url',
        image_url: { url: `data:${image_mime || 'image/jpeg'};base64,${image_base64}` },
      })
      chatMessages.push({ role: 'user', content: userParts })
    } else {
      chatMessages.push({ role: 'user', content: content.trim() })
    }

    // 4. Call GPT-4o (Vision if image attached)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages as Parameters<typeof openai.chat.completions.create>[0]['messages'],
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
