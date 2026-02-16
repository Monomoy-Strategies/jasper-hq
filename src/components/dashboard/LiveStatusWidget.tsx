'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock } from 'lucide-react'

const statusConfig = {
  idle: {
    label: 'Idle',
    color: 'bg-amber-500',
    badgeClass: 'bg-amber-900/20 text-amber-300 border-amber-500/30',
    icon: Clock,
  },
  working: {
    label: 'Working',
    color: 'bg-blue-500 animate-pulse',
    badgeClass: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
    icon: Loader2,
  },
  thinking: {
    label: 'Thinking',
    color: 'bg-purple-500 animate-pulse',
    badgeClass: 'bg-purple-900/20 text-purple-300 border-purple-500/30',
    icon: Loader2,
  },
}

const channelLabels: Record<string, string> = {
  telegram: '📱 Telegram',
  discord: '💬 Discord',
  api: '🔌 API',
  web: '🌐 Web',
}

interface ContextUsage {
  used: number
  total: number
}

interface LiveStatusWidgetProps {
  model?: string
  channel?: string
  currentTask?: string
  status?: 'idle' | 'working' | 'thinking'
  contextUsage?: ContextUsage | null
}

function formatTokenCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return String(n)
}

function getContextColor(pct: number): { bar: string; text: string } {
  if (pct >= 80) return { bar: 'bg-red-500', text: 'text-red-400' }
  if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-400' }
  return { bar: 'bg-emerald-500', text: 'text-emerald-400' }
}

export function LiveStatusWidget({ 
  model = 'Claude Opus 4.5',
  channel = 'telegram',
  currentTask = 'Monitoring systems',
  status = 'working',
  contextUsage = null,
}: LiveStatusWidgetProps) {
  const config = statusConfig[status] || statusConfig.working
  const StatusIcon = config.icon

  const contextPct = contextUsage && contextUsage.total > 0
    ? Math.round((contextUsage.used / contextUsage.total) * 100)
    : null
  const contextColor = contextPct !== null ? getContextColor(contextPct) : null

  return (
    <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-white">
            <Image
              src="/jasper-avatar.jpg"
              alt="Jasper"
              width={40}
              height={40}
              className="rounded-full ring-2 ring-amber-400/50"
            />
            Jasper
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.color}`} />
            <Badge className={`border ${config.badgeClass}`}>
              <StatusIcon className={`h-3 w-3 mr-1 ${status === 'working' || status === 'thinking' ? 'animate-spin' : ''}`} />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Model */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Model:</span>
            <span className="font-medium text-white">{model}</span>
          </div>

          {/* Channel */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Channel:</span>
            <span className="font-medium text-white">{channelLabels[channel] || channel}</span>
          </div>

          {/* Context Window */}
          {contextPct !== null && contextUsage && contextColor && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Context:</span>
                <span className={`font-medium ${contextColor.text}`}>
                  {formatTokenCount(contextUsage.used)}/{formatTokenCount(contextUsage.total)} ({contextPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${contextColor.bar}`}
                  style={{ width: `${Math.min(contextPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Current Task */}
          {currentTask && (
            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
              <p className="text-sm font-medium text-slate-300">Currently working on:</p>
              <p className="text-sm mt-1 text-white">{currentTask}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
