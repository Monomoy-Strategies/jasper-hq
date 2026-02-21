import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
const USER_ID = process.env.NEXT_PUBLIC_USER_ID || process.env.USER_ID || '1cfef549-ae52-4824-808b-7bfafb303adc'

const PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  'claude-sonnet-4-6': { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-sonnet-4-5': { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-opus-4-6':   { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  'claude-opus-4-5':   { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
  'claude-haiku-4-5':  { input: 0.80, output: 4.00, cacheWrite: 1.00, cacheRead: 0.08 },
}

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Fetch all cost events from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: costDocs, error } = await supabase
      .from('agent_documents')
      .select('metadata, created_at, title')
      .eq('user_id', USER_ID)
      .eq('category', 'cost-event')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const events = (costDocs || []).map(d => ({
      ...d.metadata,
      recorded_at: d.metadata?.recorded_at || d.created_at,
    }))

    // Calculate totals
    const totalCost = events.reduce((s: number, e: any) => s + (e.cost_usd || 0), 0)

    // By model
    const byModel: Record<string, { cost: number; count: number }> = {}
    events.forEach((e: any) => {
      const m = e.model || 'unknown'
      if (!byModel[m]) byModel[m] = { cost: 0, count: 0 }
      byModel[m].cost += e.cost_usd || 0
      byModel[m].count++
    })

    // By source
    const bySource: Record<string, { cost: number; count: number }> = {}
    events.forEach((e: any) => {
      const s = e.source || 'other'
      if (!bySource[s]) bySource[s] = { cost: 0, count: 0 }
      bySource[s].cost += e.cost_usd || 0
      bySource[s].count++
    })

    // By token type (cache breakdown)
    const tokenBreakdown = {
      input: 0,
      output: 0,
      cacheWrite: 0,
      cacheRead: 0,
    }
    const costBreakdown = {
      input: 0,
      output: 0,
      cacheWrite: 0,
      cacheRead: 0,
    }
    events.forEach((e: any) => {
      const p = PRICING[e.model] || PRICING['claude-sonnet-4-6']
      tokenBreakdown.input += e.input_tokens || 0
      tokenBreakdown.output += e.output_tokens || 0
      tokenBreakdown.cacheWrite += e.cache_write_tokens || 0
      tokenBreakdown.cacheRead += e.cache_read_tokens || 0
      costBreakdown.input += ((e.input_tokens || 0) / 1e6) * p.input
      costBreakdown.output += ((e.output_tokens || 0) / 1e6) * p.output
      costBreakdown.cacheWrite += ((e.cache_write_tokens || 0) / 1e6) * p.cacheWrite
      costBreakdown.cacheRead += ((e.cache_read_tokens || 0) / 1e6) * p.cacheRead
    })

    // Daily spend (last 7 days)
    const daily: Record<string, number> = {}
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    for (let i = 0; i <= 6; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      daily[d.toISOString().split('T')[0]] = 0
    }

    events.forEach((e: any) => {
      const day = (e.recorded_at || e.created_at || '').split('T')[0]
      if (day in daily) {
        daily[day] = (daily[day] || 0) + (e.cost_usd || 0)
      }
    })

    // Today and yesterday
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const todayCost = daily[today] || 0
    const yesterdayCost = daily[yesterday] || 0
    const weekCost = events
      .filter((e: any) => {
        const d = (e.recorded_at || '').split('T')[0]
        return d >= sevenDaysAgo.toISOString().split('T')[0]
      })
      .reduce((s: number, e: any) => s + (e.cost_usd || 0), 0)

    // Top expensive sessions
    const byDesc: Record<string, number> = {}
    events.forEach((e: any) => {
      const key = `${e.description || 'Unknown'} (${e.model?.split('-').slice(1, 3).join('-') || '?'})`
      byDesc[key] = (byDesc[key] || 0) + (e.cost_usd || 0)
    })
    const topSessions = Object.entries(byDesc)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, cost]) => ({ name, cost }))

    return NextResponse.json({
      summary: {
        today: todayCost,
        yesterday: yesterdayCost,
        week: weekCost,
        total: totalCost,
        totalEvents: events.length,
        avgPerDay: weekCost / 7,
      },
      byModel: Object.entries(byModel)
        .sort(([, a], [, b]) => b.cost - a.cost)
        .map(([model, data]) => ({
          model,
          cost: data.cost,
          count: data.count,
          pct: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
        })),
      bySource: Object.entries(bySource)
        .sort(([, a], [, b]) => b.cost - a.cost)
        .map(([source, data]) => ({
          source,
          cost: data.cost,
          count: data.count,
          pct: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
        })),
      costBreakdown: {
        input: { cost: costBreakdown.input, tokens: tokenBreakdown.input, pct: totalCost > 0 ? (costBreakdown.input / totalCost) * 100 : 0 },
        output: { cost: costBreakdown.output, tokens: tokenBreakdown.output, pct: totalCost > 0 ? (costBreakdown.output / totalCost) * 100 : 0 },
        cacheWrite: { cost: costBreakdown.cacheWrite, tokens: tokenBreakdown.cacheWrite, pct: totalCost > 0 ? (costBreakdown.cacheWrite / totalCost) * 100 : 0 },
        cacheRead: { cost: costBreakdown.cacheRead, tokens: tokenBreakdown.cacheRead, pct: totalCost > 0 ? (costBreakdown.cacheRead / totalCost) * 100 : 0 },
      },
      dailySpend: Object.entries(daily)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, cost]) => ({ date, cost })),
      topExpensive: topSessions,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Record a new cost event
export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  try {
    const body = await request.json()
    const { model, source, description, inputTokens, outputTokens, cacheWriteTokens = 0, cacheReadTokens = 0 } = body

    const p = PRICING[model] || PRICING['claude-sonnet-4-6']
    const costUsd = (inputTokens / 1e6) * p.input +
      (outputTokens / 1e6) * p.output +
      (cacheWriteTokens / 1e6) * p.cacheWrite +
      (cacheReadTokens / 1e6) * p.cacheRead

    const { error } = await supabase.from('agent_documents').insert({
      user_id: USER_ID,
      title: `Cost: ${description}`,
      category: 'cost-event',
      tags: ['cost', source, model],
      content: description,
      metadata: {
        model, source, description,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cache_write_tokens: cacheWriteTokens,
        cache_read_tokens: cacheReadTokens,
        cost_usd: costUsd,
        recorded_at: new Date().toISOString(),
      },
    })

    if (error) throw error
    return NextResponse.json({ ok: true, cost_usd: costUsd })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
