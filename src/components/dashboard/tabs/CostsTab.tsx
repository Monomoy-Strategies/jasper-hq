'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, TrendingDown, Zap, Clock, BarChart3, Cpu } from 'lucide-react'

interface CostData {
  summary: {
    today: number
    yesterday: number
    week: number
    total: number
    totalEvents: number
    avgPerDay: number
  }
  byModel: Array<{ model: string; cost: number; count: number; pct: number }>
  bySource: Array<{ source: string; cost: number; count: number; pct: number }>
  costBreakdown: {
    input: { cost: number; tokens: number; pct: number }
    output: { cost: number; tokens: number; pct: number }
    cacheWrite: { cost: number; tokens: number; pct: number }
    cacheRead: { cost: number; tokens: number; pct: number }
  }
  dailySpend: Array<{ date: string; cost: number }>
  topExpensive: Array<{ name: string; cost: number }>
}

function fmt(n: number) {
  return n < 0.01 ? '$' + n.toFixed(4) : '$' + n.toFixed(2)
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toString()
}

function shortModel(model: string) {
  return model.replace('claude-', '').replace('-4-6', ' 4.6').replace('-4-5', ' 4.5').replace('-4', ' 4')
}

function modelColor(model: string) {
  if (model.includes('opus')) return { bar: 'bg-purple-500', text: 'text-purple-300', badge: 'bg-purple-900/20 text-purple-300 border-purple-500/30' }
  if (model.includes('haiku')) return { bar: 'bg-amber-500', text: 'text-amber-300', badge: 'bg-amber-900/20 text-amber-300 border-amber-500/30' }
  return { bar: 'bg-blue-500', text: 'text-blue-300', badge: 'bg-blue-900/20 text-blue-300 border-blue-500/30' }
}

function sourceColor(source: string) {
  switch (source) {
    case 'discord': return 'bg-indigo-500'
    case 'cron': return 'bg-emerald-500'
    case 'telegram': return 'bg-sky-500'
    default: return 'bg-slate-500'
  }
}

function MiniChart({ data }: { data: Array<{ date: string; cost: number }> }) {
  const max = Math.max(...data.map(d => d.cost), 0.01)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d) => {
        const height = Math.max((d.cost / max) * 100, 4)
        const isToday = d.date === today
        const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 gap-1">
            <div className="w-full relative group">
              <div
                className={`w-full rounded-sm transition-all ${isToday ? 'bg-emerald-400' : 'bg-blue-500/60'}`}
                style={{ height: `${height}%`, minHeight: '4px' }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                {d.date}: {fmt(d.cost)}
              </div>
            </div>
            <span className={`text-[9px] ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>{dayLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CostsTab() {
  const [data, setData] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d'>('7d')

  useEffect(() => {
    fetch('/api/costs')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign className="h-8 w-8 text-emerald-400 animate-pulse mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Loading cost data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-16 text-slate-500">No cost data available yet. The collector will populate this automatically.</div>
  }

  const { summary, byModel, bySource, costBreakdown, dailySpend, topExpensive } = data
  const vsYesterday = summary.yesterday > 0 ? ((summary.today - summary.yesterday) / summary.yesterday) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Cost Tracking</h2>
          <Badge className="bg-slate-700/50 text-slate-300">Anthropic API</Badge>
        </div>
        <div className="flex gap-1 text-sm">
          {(['7d', '30d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded ${range === r ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Today</p>
          <p className="text-2xl font-bold text-emerald-300">{fmt(summary.today)}</p>
          <div className="flex items-center gap-1 mt-1">
            {vsYesterday >= 0
              ? <TrendingUp className="h-3 w-3 text-red-400" />
              : <TrendingDown className="h-3 w-3 text-emerald-400" />}
            <span className={`text-xs ${vsYesterday >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {vsYesterday >= 0 ? '+' : ''}{vsYesterday.toFixed(0)}% vs yesterday
            </span>
          </div>
        </div>
        <div className="border border-slate-700/50 bg-slate-800/30 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Yesterday</p>
          <p className="text-2xl font-bold text-white">{fmt(summary.yesterday)}</p>
        </div>
        <div className="border border-blue-500/30 bg-blue-900/10 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">This Week</p>
          <p className="text-2xl font-bold text-blue-300">{fmt(summary.week)}</p>
          <p className="text-xs text-slate-500 mt-1">avg {fmt(summary.avgPerDay)}/day</p>
        </div>
        <div className="border border-slate-700/50 bg-slate-800/30 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Sessions Tracked</p>
          <p className="text-2xl font-bold text-white">{summary.totalEvents}</p>
          <p className="text-xs text-slate-500 mt-1">30-day window</p>
        </div>
      </div>

      {/* Daily Spend Chart + Top Expensive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-700/50 bg-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Daily Spend — Last 7 Days</h3>
          </div>
          <MiniChart data={dailySpend} />
          <div className="flex justify-between text-[10px] text-slate-600 mt-2">
            <span>Peak: {fmt(Math.max(...dailySpend.map(d => d.cost)))}</span>
            <span>Total: {fmt(dailySpend.reduce((s, d) => s + d.cost, 0))}</span>
          </div>
        </div>

        <div className="border border-slate-700/50 bg-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Top Cost Drivers</h3>
          </div>
          <div className="space-y-2">
            {topExpensive.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="text-xs font-mono text-emerald-300 shrink-0 ml-2">{fmt(item.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* By Model + By Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-700/50 bg-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-white text-sm">By Model</h3>
          </div>
          <div className="space-y-3">
            {byModel.map((m) => {
              const colors = modelColor(m.model)
              return (
                <div key={m.model}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] border ${colors.badge}`}>{shortModel(m.model)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">{m.pct.toFixed(1)}%</span>
                      <span className={`font-mono font-bold ${colors.text}`}>{fmt(m.cost)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border border-slate-700/50 bg-slate-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">By Source</h3>
          </div>
          <div className="space-y-3">
            {bySource.map((s) => (
              <div key={s.source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white capitalize">{s.source}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">{s.pct.toFixed(1)}%</span>
                    <span className="font-mono font-bold text-white">{fmt(s.cost)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${sourceColor(s.source)}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anthropic Cost Breakdown */}
      <div className="border border-slate-700/50 bg-slate-800/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-blue-400" />
          <h3 className="font-semibold text-white text-sm">Anthropic Cost Breakdown</h3>
          <span className="text-xs text-slate-500 ml-auto">Cache reads are 90% cheaper than input</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cache Write', data: costBreakdown.cacheWrite, color: 'text-purple-300', desc: 'Context stored per session' },
            { label: 'Output', data: costBreakdown.output, color: 'text-blue-300', desc: "Jasper's responses" },
            { label: 'Cache Read', data: costBreakdown.cacheRead, color: 'text-emerald-300', desc: 'Cached context re-use (cheap)' },
            { label: 'Input', data: costBreakdown.input, color: 'text-slate-300', desc: 'Your messages' },
          ].sort((a, b) => b.data.cost - a.data.cost).map(({ label, data, color, desc }) => (
            <div key={label} className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className={`text-xl font-bold font-mono ${color}`}>{fmt(data.cost)}</p>
              <p className="text-xs font-semibold text-white mt-1">{label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{fmtTokens(data.tokens)} tokens</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{data.pct.toFixed(1)}% of spend</p>
              <p className="text-[9px] text-slate-600 mt-1 italic">{desc}</p>
            </div>
          ))}
        </div>
        {costBreakdown.cacheWrite.pct > 50 && (
          <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
            💡 Cache writes are {costBreakdown.cacheWrite.pct.toFixed(0)}% of spend — longer sessions save money via cache reads.
          </p>
        )}
      </div>
    </div>
  )
}
