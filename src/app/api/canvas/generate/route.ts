import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { prompt, project } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt required' }, { status: 400 })

    const context = project ? `Project context: ${project}\n\nTopic to map: ${prompt}` : prompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Jasper, a strategic AI assistant for Bill Sifflard, an experienced entrepreneur and exec building multiple businesses including The Helm Method™ consulting, GiftHQ, HeartbeatGuard, YTidy, The Fort gym, and Vortxx AI hub.

Generate a comprehensive mind map structure for the given project or topic. Return ONLY valid JSON with this exact shape:
{
  "title": "string — the map title",
  "nodes": [
    { "id": "string", "label": "string", "type": "root|branch|leaf", "parent": "string or omit for root", "notes": "optional brief note" }
  ]
}

Rules:
- Exactly ONE root node (no parent field)
- 4-8 top-level branch nodes (parent = root id)
- 2-5 leaf nodes per branch
- Labels should be concise (2-5 words max)
- Make it strategic and actionable: include Goals, Features, Audience/Market, Challenges, Opportunities, Revenue/Monetization, Next Steps, Metrics
- Adapt the branches to what makes sense for the specific topic
- Total nodes: 25-50`,
        },
        { role: 'user', content: context },
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content || '{}'
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Canvas generate error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
