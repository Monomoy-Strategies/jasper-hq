'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Loader2, Clock } from 'lucide-react'

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

interface LiveStatusWidgetProps {
  model?: string
  channel?: string
  currentTask?: string
  status?: 'idle' | 'working' | 'thinking'
}

export function LiveStatusWidget({ 
  model = 'Claude Opus 4.5',
  channel = 'telegram',
  currentTask = 'Monitoring systems',
  status = 'working'
}: LiveStatusWidgetProps) {
  const config = statusConfig[status] || statusConfig.working
  const StatusIcon = config.icon

  return (
    <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Bot className="h-5 w-5 text-amber-400" />
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
