'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Wifi, WifiOff, Loader2, Clock, MessageSquare, Wrench, Coins } from 'lucide-react'
import type { LiveStatus } from '@/types'

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

export function LiveStatusWidget() {
  const [status, setStatus] = useState<LiveStatus>({
    status: 'working',
    currentTask: 'Building Jasper HQ Phase 1',
    lastActivity: new Date(),
    model: 'Claude Sonnet 4',
    channel: 'telegram',
    metrics: {
      messages: 42,
      toolCalls: 18,
      tokensIn: 15420,
      tokensOut: 8250,
    }
  })

  const config = statusConfig[status.status]
  const StatusIcon = config.icon

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString()
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        lastActivity: new Date(),
        metrics: prev.metrics ? {
          ...prev.metrics,
          messages: prev.metrics.messages + Math.floor(Math.random() * 2),
          toolCalls: prev.metrics.toolCalls + Math.floor(Math.random() * 1),
        } : undefined
      }))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

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
              <StatusIcon className={`h-3 w-3 mr-1 ${status.status === 'working' || status.status === 'thinking' ? 'animate-spin' : ''}`} />
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
            <span className="font-medium text-white">{status.model}</span>
          </div>

          {/* Channel */}
          {status.channel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Channel:</span>
              <span className="font-medium text-white">{channelLabels[status.channel] || status.channel}</span>
            </div>
          )}

          {/* Current Task */}
          {status.currentTask && (
            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
              <p className="text-sm font-medium text-slate-300">Currently working on:</p>
              <p className="text-sm mt-1 text-white">{status.currentTask}</p>
            </div>
          )}

          {/* Session Metrics */}
          {status.metrics && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Messages:</span>
                <span className="font-medium text-white">{status.metrics.messages}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Tools:</span>
                <span className="font-medium text-white">{status.metrics.toolCalls}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Tokens:</span>
                <span className="font-medium text-white">
                  {Math.round((status.metrics.tokensIn + status.metrics.tokensOut) / 1000)}k 
                  <span className="text-slate-400 text-xs ml-1">
                    ({Math.round(status.metrics.tokensIn / 1000)}k in / {Math.round(status.metrics.tokensOut / 1000)}k out)
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Last Active */}
          <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-700/50">
            <span>Last active:</span>
            <span className="text-white">{formatLastSeen(status.lastActivity)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}