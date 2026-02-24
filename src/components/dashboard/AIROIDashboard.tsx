'use client'

/**
 * AIROIDashboard — AI Spend & ROI Tracker
 * "Plausible Analytics for your AI stack"
 *
 * AIDEN INTEGRATION NOTE:
 * This component is designed as the frontend for AIDEN (AI Executive Navigator).
 * When AIDEN is built, replace the /api/ai-metrics fetch with an AIDEN-powered
 * stream that includes: real API call logging, budget alerts, anomaly detection,
 * and cross-tool optimization recommendations.
 * Data already flows to Supabase ai_metrics table — AIDEN just needs to read it.
 */

import { useState, useEffect } from 'react'
import React from 'react'
import { Badge } from '@/components/ui/badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolMetric {
  tool_name: string
  total_calls: number
  total_cost: number
  total_minutes_saved: number
  avg_daily_cost: number
  days: number
}

interface MonthSummary {
  cost: number
  calls: number
  minutesSaved: number
  timeSavedHours: number
}

interface AIMetricsData {
  dataSource: 'live' | 'mock'
  thisMonth: { tools: ToolMetric[]; summary: MonthSummary }
  lastMonth: { tools: ToolMetric[]; summary: MonthSummary }
  roi: { multiple: number; timeSavedValueUsd: number; hourlyRateAssumed: number }
  trend: { costDelta: number; costDeltaPct: number; savedDelta: number }
}

// ─── Tool Config ──────────────────────────────────────────────────────────────

const TOOL_CONFIG: Record<string, { emoji: string; color: string; accent: string; bg: string }> = {
  'Anthropic/Claude': {
    emoji: '🧠',
    color: 'text-amber-300',
    accent: 'border-amber-500/40',
    bg: 'bg-amber-900/10',
  },
  'OpenAI': {
    emoji: '🤖',
    color: 'text-emerald-300',
    accent: 'border-emerald-500/40',
    bg: 'bg-emerald-900/10',
  },
  'xAI/Grok': {
    emoji: '⚡',
    color: 'text-blue-300',
    accent: 'border-blue-500/40',
    bg: 'bg-blue-900/10',
  },
  'ElevenLabs TTS': {
    emoji: '🎙️',
    color: 'text-purple-300',
    accent: 'border-purple-500/40',
    bg: 'bg-purple-900/10',
  },
  'Firecrawl': {
    emoji: '🔥',
    color: 'text-orange-300',
    accent: 'border-orange-500/40',
    bg: 'bg-orange-900/10',
  },
  'OpenClaw': {
    emoji: '🦞',
    color: 'text-red-300',
    accent: 'border-red-500/40',
    bg: 'bg-red-900/10',
  },
}

const DEFAULT_CONFIG = { emoji: '🔧', color: 'text-slate-300', accent: 'border-slate-600/40', bg: 'bg-slate-800/30' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = 'text-white', icon,
}: {
  label: string; value: string; sub?: React.ReactNode; color?: string; icon?: string
}) {
  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

function TrendBadge({ delta, suffix = '' }: { delta: number; suffix?: string }) {
  if (delta === 0) return <span className="text-slate-500 text-xs">→ flat</span>
  const up = delta > 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-red-400' : 'text-emerald-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}{suffix}
    </span>
  )
}

function CostBar({ cost, maxCost }: { cost: number; maxCost: number }) {
  const pct = maxCost > 0 ? Math.round((cost / maxCost) * 100) : 0
  return (
    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden flex-1">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function ToolRow({ tool, maxCost }: { tool: ToolMetric; maxCost: number }) {
  const config = TOOL_CONFIG[tool.tool_name] || DEFAULT_CONFIG
  const hoursSaved = (tool.total_minutes_saved / 60).toFixed(1)
  const roi = tool.total_cost > 0 ? ((tool.total_minutes_saved / 60) * 150 / tool.total_cost).toFixed(1) : '∞'

  return (
    <div className={`border rounded-lg p-3.5 ${config.accent} ${config.bg} transition-all hover:border-opacity-70`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <span className={`font-semibold text-sm ${config.color}`}>{tool.tool_name}</span>
        </div>
        <span className="text-white font-bold text-sm">${tool.total_cost.toFixed(2)}</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <CostBar cost={tool.total_cost} maxCost={maxCost} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-slate-500">API Calls</div>
          <div className="text-slate-200 font-medium">{tool.total_calls.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-slate-500">Time Saved</div>
          <div className="text-slate-200 font-medium">{hoursSaved}h</div>
        </div>
        <div>
          <div className="text-slate-500">ROI</div>
          <div className={`font-bold ${parseFloat(roi) >= 10 ? 'text-emerald-400' : parseFloat(roi) >= 5 ? 'text-amber-400' : 'text-slate-300'}`}>
            {roi}×
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIROIDashboard() {
  const [data, setData] = useState<AIMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/ai-metrics')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError('Failed to load AI metrics')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="border border-slate-700/50 bg-slate-800/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">💰</span>
          <h3 className="text-lg font-semibold text-white">AI ROI Dashboard</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full mr-3" />
          <span className="text-slate-400 text-sm">Loading metrics...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="border border-red-500/30 bg-red-900/10 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-semibold text-white">AI ROI Dashboard</h3>
            <p className="text-sm text-red-300">{error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { thisMonth, lastMonth, roi, trend } = data
  const maxCost = Math.max(...thisMonth.tools.map(t => t.total_cost), 1)
  const costDeltaIsUp = trend.costDelta > 0
  const savedDeltaIsUp = trend.savedDelta > 0
  const monthLabel = new Date().toLocaleString('default', { month: 'long' })
  const lastMonthLabel = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toLocaleString('default', { month: 'short' })

  return (
    <div className="border border-slate-700/50 bg-slate-800/20 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <h3 className="text-lg font-semibold text-white">AI ROI Dashboard</h3>
            <p className="text-xs text-slate-400">
              {monthLabel} spend & productivity · {data.dataSource === 'live' ? '🟢 Live data' : '🟡 Mock data'}
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-900/30 text-emerald-300 border border-emerald-500/30 text-xs">
          {roi.multiple}× ROI
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon="💸"
          label="AI Spend"
          value={`$${thisMonth.summary.cost.toFixed(2)}`}
          sub={
            <span className="flex items-center gap-1">
              vs {lastMonthLabel}: <TrendBadge delta={trend.costDelta} suffix="" />
            </span>
          }
          color="text-white"
        />
        <StatCard
          icon="⏱️"
          label="Time Saved"
          value={`${thisMonth.summary.timeSavedHours}h`}
          sub={
            <span className="flex items-center gap-1">
              vs {lastMonthLabel}: <TrendBadge delta={-(trend.savedDelta / 60)} suffix="h" />
            </span>
          }
          color="text-emerald-300"
        />
        <StatCard
          icon="📈"
          label="ROI Multiple"
          value={`${roi.multiple}×`}
          sub={`$${roi.timeSavedValueUsd.toFixed(0)} value @ $${roi.hourlyRateAssumed}/hr`}
          color="text-amber-300"
        />
        <StatCard
          icon="🔢"
          label="API Calls"
          value={thisMonth.summary.calls.toLocaleString()}
          sub="this month"
          color="text-blue-300"
        />
      </div>

      {/* Per-Tool Breakdown */}
      <div>
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🔧</span> Per-Tool Breakdown
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {thisMonth.tools
            .sort((a, b) => b.total_cost - a.total_cost)
            .map(tool => (
              <ToolRow key={tool.tool_name} tool={tool} maxCost={maxCost} />
            ))}
        </div>
      </div>

      {/* Month vs Month Trend */}
      <div className="border border-slate-700/50 bg-slate-900/40 rounded-lg p-4">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
          📊 This Month vs Last Month ({lastMonthLabel})
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-500 mb-1">Spend</div>
            <div className="text-lg font-bold text-white">${thisMonth.summary.cost.toFixed(0)}</div>
            <div className={`text-xs font-medium mt-1 ${costDeltaIsUp ? 'text-red-400' : 'text-emerald-400'}`}>
              {costDeltaIsUp ? '↑' : '↓'} {Math.abs(trend.costDeltaPct)}% vs ${lastMonth.summary.cost.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Hours Saved</div>
            <div className="text-lg font-bold text-emerald-300">{thisMonth.summary.timeSavedHours}h</div>
            <div className={`text-xs font-medium mt-1 ${savedDeltaIsUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {savedDeltaIsUp ? '↑' : '↓'} {Math.abs(trend.savedDelta / 60).toFixed(1)}h vs {lastMonth.summary.timeSavedHours}h
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Top Tool</div>
            {(() => {
              const top = thisMonth.tools.sort((a, b) => b.total_cost - a.total_cost)[0]
              const cfg = top ? (TOOL_CONFIG[top.tool_name] || DEFAULT_CONFIG) : DEFAULT_CONFIG
              return (
                <>
                  <div className={`text-lg font-bold ${cfg.color}`}>{top ? cfg.emoji : '—'}</div>
                  <div className="text-xs text-slate-400 mt-1">{top?.tool_name ?? '—'}</div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* AIDEN teaser */}
      <div className="border border-purple-500/20 bg-purple-900/10 rounded-lg p-3 flex items-center gap-3">
        <span className="text-lg">🧭</span>
        <div>
          <div className="text-xs font-semibold text-purple-300">AIDEN Integration Ready</div>
          <div className="text-xs text-slate-500">
            This module is pre-wired for AIDEN (AI Executive Navigator) — budget alerts, spend forecasting, and optimization recommendations coming soon.
          </div>
        </div>
      </div>
    </div>
  )
}
