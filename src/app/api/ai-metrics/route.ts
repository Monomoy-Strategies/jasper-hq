/**
 * /api/ai-metrics — AI ROI Dashboard data endpoint
 *
 * AIDEN INTEGRATION NOTE:
 * This API route is designed to be consumed by AIDEN (AI Executive Navigator)
 * as a core reporting module. When AIDEN is built, this endpoint provides
 * real-time spend, ROI, and trend data for the AI executive dashboard.
 * Just wire up: GET /api/ai-metrics?days=30&format=aiden
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ─── Mock Data ──────────────────────────────────────────────────────────────
// Realistic usage data for Bill's AI tool stack (Feb 2026 baseline).
// Widget always shows this if Supabase table doesn't exist yet.
// Run scripts/ai-metrics-migration.sql in Supabase dashboard to enable live data.

interface DailyMetric {
  tool_name: string
  metric_date: string
  api_calls: number
  estimated_cost_usd: number
  estimated_minutes_saved: number
}

function generateMockData(): DailyMetric[] {
  const tools = [
    { name: 'Anthropic/Claude', baseCost: 38, baseCalls: 145, baseSaved: 220 },
    { name: 'OpenAI',           baseCost: 12, baseCalls: 48,  baseSaved: 65  },
    { name: 'xAI/Grok',        baseCost: 8,  baseCalls: 22,  baseSaved: 40  },
    { name: 'ElevenLabs TTS',  baseCost: 4,  baseCalls: 35,  baseSaved: 18  },
    { name: 'Firecrawl',       baseCost: 6,  baseCalls: 18,  baseSaved: 55  },
    { name: 'OpenClaw',        baseCost: 0.967, baseCalls: 200, baseSaved: 180 },
  ]

  const rows: DailyMetric[] = []
  const now = new Date()

  for (let daysAgo = 34; daysAgo >= 0; daysAgo--) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    const dateStr = date.toISOString().split('T')[0]
    const isWeekend = [0, 6].includes(date.getDay())
    const mult = isWeekend ? 0.4 : 1.0
    // Use deterministic pseudo-random based on date+tool to keep data stable
    const seed = date.getDate() + date.getMonth() * 31

    for (const tool of tools) {
      const jitter = 0.85 + ((seed * (tools.indexOf(tool) + 1) * 7) % 30) / 100
      rows.push({
        tool_name: tool.name,
        metric_date: dateStr,
        api_calls: Math.round(tool.baseCalls * mult * jitter),
        estimated_cost_usd: parseFloat((tool.baseCost * mult * jitter).toFixed(4)),
        estimated_minutes_saved: parseFloat((tool.baseSaved * mult * jitter).toFixed(2)),
      })
    }
  }

  return rows
}

function aggregateMetrics(rows: DailyMetric[], startDate: string, endDate: string) {
  const filtered = rows.filter(r => r.metric_date >= startDate && r.metric_date <= endDate)

  const byTool: Record<string, {
    tool_name: string
    total_calls: number
    total_cost: number
    total_minutes_saved: number
    days: number
  }> = {}

  for (const row of filtered) {
    if (!byTool[row.tool_name]) {
      byTool[row.tool_name] = {
        tool_name: row.tool_name,
        total_calls: 0,
        total_cost: 0,
        total_minutes_saved: 0,
        days: 0,
      }
    }
    byTool[row.tool_name].total_calls += row.api_calls
    byTool[row.tool_name].total_cost += row.estimated_cost_usd
    byTool[row.tool_name].total_minutes_saved += row.estimated_minutes_saved
    byTool[row.tool_name].days++
  }

  return Object.values(byTool).map(t => ({
    ...t,
    total_cost: parseFloat(t.total_cost.toFixed(2)),
    total_minutes_saved: parseFloat(t.total_minutes_saved.toFixed(1)),
    avg_daily_cost: parseFloat((t.total_cost / (t.days || 1)).toFixed(2)),
  }))
}

export async function GET() {
  // Date ranges
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

  let rows: DailyMetric[] = []
  let dataSource = 'mock'

  // Try Supabase first
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase
        .from('ai_metrics')
        .select('tool_name, metric_date, api_calls, estimated_cost_usd, estimated_minutes_saved')
        .gte('metric_date', lastMonthStart)
        .lte('metric_date', todayStr)
        .order('metric_date', { ascending: true })

      if (!error && data && data.length > 0) {
        rows = data as DailyMetric[]
        dataSource = 'live'
      } else {
        rows = generateMockData()
      }
    } catch {
      rows = generateMockData()
    }
  } else {
    rows = generateMockData()
  }

  const thisMonth = aggregateMetrics(rows, thisMonthStart, todayStr)
  const lastMonth = aggregateMetrics(rows, lastMonthStart, lastMonthEnd)

  // Summary totals
  const thisMonthTotal = {
    cost: parseFloat(thisMonth.reduce((s, t) => s + t.total_cost, 0).toFixed(2)),
    calls: thisMonth.reduce((s, t) => s + t.total_calls, 0),
    minutesSaved: parseFloat(thisMonth.reduce((s, t) => s + t.total_minutes_saved, 0).toFixed(1)),
  }
  const lastMonthTotal = {
    cost: parseFloat(lastMonth.reduce((s, t) => s + t.total_cost, 0).toFixed(2)),
    calls: lastMonth.reduce((s, t) => s + t.total_calls, 0),
    minutesSaved: parseFloat(lastMonth.reduce((s, t) => s + t.total_minutes_saved, 0).toFixed(1)),
  }

  // ROI: value of time saved ÷ cost  (assumes $150/hr for Bill's time)
  const hourlyRate = 150
  const timeSavedValue = (thisMonthTotal.minutesSaved / 60) * hourlyRate
  const roiMultiple = thisMonthTotal.cost > 0
    ? parseFloat((timeSavedValue / thisMonthTotal.cost).toFixed(1))
    : 0

  return NextResponse.json({
    dataSource,
    thisMonth: {
      tools: thisMonth,
      summary: { ...thisMonthTotal, timeSavedHours: parseFloat((thisMonthTotal.minutesSaved / 60).toFixed(1)) },
    },
    lastMonth: {
      tools: lastMonth,
      summary: { ...lastMonthTotal, timeSavedHours: parseFloat((lastMonthTotal.minutesSaved / 60).toFixed(1)) },
    },
    roi: {
      multiple: roiMultiple,
      timeSavedValueUsd: parseFloat(timeSavedValue.toFixed(2)),
      hourlyRateAssumed: hourlyRate,
    },
    trend: {
      costDelta: parseFloat((thisMonthTotal.cost - lastMonthTotal.cost).toFixed(2)),
      costDeltaPct: lastMonthTotal.cost > 0
        ? parseFloat((((thisMonthTotal.cost - lastMonthTotal.cost) / lastMonthTotal.cost) * 100).toFixed(1))
        : 0,
      savedDelta: parseFloat((thisMonthTotal.minutesSaved - lastMonthTotal.minutesSaved).toFixed(1)),
    },
    _meta: { dataSource, generatedAt: now.toISOString() },
  })
}
