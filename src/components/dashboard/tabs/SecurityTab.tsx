'use client'

import { useState, useEffect } from 'react'

interface SessionContext {
  used: number
  total: number
  pct: number
  model: string
}

interface SessionEntry {
  key: string
  label: string
  kind: string
  age: string
  model: string
  used: number
  total: number
  pct: number
}

interface SecurityData {
  system: {
    openclawVersion: string
    latestVersion: string
    updateAvailable: boolean
    criticalUpdate?: boolean
    model?: string
    channel?: string
    nodeVersion: string
    os: string
    uptime: string
    lastUpdate: string
  }
  context: {
    used: number
    total: number
    discord?: SessionContext | null
    main?: SessionContext | null
    sessions?: SessionEntry[]
  }
  audit: {
    overall: 'green' | 'yellow' | 'red'
    critical: number
    warnings: number
    info: number
    lastAudit: string
    findings: Array<{
      level: 'critical' | 'warning' | 'info'
      id: string
      message: string
    }>
  }
  network: {
    gateway: 'running' | 'stopped'
    bind: string
    port: number
    firewall: 'active' | 'inactive'
    ssh: 'enabled' | 'disabled'
    exposedServices: string[]
  }
  services: Array<{
    name: string
    status: string
    detail: string
  }>
  events: Array<{
    time: string
    type: string
    message: string
  }>
  heartbeatGuard: {
    defenderStatus: 'active' | 'inactive' | 'unknown'
    lastScan: string
    definitionsAge: string
    pendingUpdates: number
    diskEncryption: string
    credentialReview: string
  }
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function StatusBadge({ status, type }: { status: string; type: 'success' | 'warning' | 'error' | 'info' }) {
  const colors = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[type]}`}>
      {status}
    </span>
  )
}

function PulsingDot({ color }: { color: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'bg-emerald-400',
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
  }

  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`}></span>
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[color]}`}></span>
    </span>
  )
}

function getServiceStatusType(status: string): 'success' | 'warning' | 'error' {
  const successStatuses = ['connected', 'running', 'reachable', 'active']
  const errorStatuses = ['disconnected', 'stopped', 'unreachable', 'inactive']
  
  if (successStatuses.includes(status.toLowerCase())) return 'success'
  if (errorStatuses.includes(status.toLowerCase())) return 'error'
  return 'warning'
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'update': return '🔄'
    case 'audit': return '🛡️'
    case 'fix': return '🔧'
    case 'milestone': return '🎯'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    default: return '📋'
  }
}

export function SecurityTab() {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSecurityData() {
      try {
        const res = await fetch('/api/security')
        if (!res.ok) throw new Error('Failed to fetch security data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchSecurityData()
    const interval = setInterval(fetchSecurityData, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading security data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-2">⚠️ Failed to load security data</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const getUpdateStatusBadge = () => {
    if (data.system.criticalUpdate) {
      return <StatusBadge status="🔴 Critical update" type="error" />
    }
    if (data.system.updateAvailable) {
      return <StatusBadge status="⚠️ Update available" type="warning" />
    }
    return <StatusBadge status="✅ Up to date" type="success" />
  }

  const getAuditColor = () => {
    switch (data.audit.overall) {
      case 'green': return 'emerald'
      case 'yellow': return 'yellow'
      case 'red': return 'red'
      default: return 'slate'
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Row — 3 Equal Sections: System Status | Security Audit | Network & Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💻</span>
            <h4 className="font-semibold text-white text-base">System Status</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">OpenClaw</span>
              <span className="text-white font-mono">{data.system.openclawVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Update Status</span>
              {getUpdateStatusBadge()}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Last Update</span>
              <span className="text-slate-300 text-xs">{formatDate(data.system.lastUpdate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Node.js</span>
              <span className="text-white font-mono text-xs">{data.system.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">OS</span>
              <span className="text-slate-300 text-xs">{data.system.os}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Uptime</span>
              <span className="text-emerald-400 font-medium">{data.system.uptime}</span>
            </div>
          </div>
        </div>

        {/* Security Audit Summary */}
        <div className={`border bg-slate-800/50 backdrop-blur rounded-xl p-6 ${
          data.audit.overall === 'green' ? 'border-emerald-500/30' :
          data.audit.overall === 'yellow' ? 'border-yellow-500/30' :
          'border-red-500/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <h4 className="font-semibold text-white text-base">Security Audit</h4>
            </div>
            <div className="flex items-center gap-2">
              <PulsingDot color={data.audit.overall} />
              <span className={`text-sm font-bold ${
                data.audit.overall === 'green' ? 'text-emerald-400' :
                data.audit.overall === 'yellow' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {data.audit.overall.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Critical</span>
              <span className={`font-bold ${data.audit.critical > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {data.audit.critical}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Warnings</span>
              <span className={`font-bold ${data.audit.warnings > 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                {data.audit.warnings}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Info</span>
              <span className={`font-bold ${data.audit.info > 0 ? 'text-blue-400' : 'text-slate-500'}`}>
                {data.audit.info}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400">Last Audit</span>
                <span className="text-slate-300 text-xs">{formatTime(data.audit.lastAudit)}</span>
              </div>
              <button
                className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                onClick={() => alert('Run Audit functionality coming soon')}
              >
                🔍 Run Audit
              </button>
            </div>
          </div>
        </div>

        {/* Network & Access */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🌐</span>
            <h4 className="font-semibold text-white text-base">Network & Access</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Gateway</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data.network.gateway === 'running' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={data.network.gateway === 'running' ? 'text-emerald-400' : 'text-red-400'}>
                  {data.network.gateway}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Bind Address</span>
              <span className="text-white text-xs font-mono">{data.network.bind}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Port</span>
              <span className="text-white font-mono">{data.network.port}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Firewall</span>
              <StatusBadge 
                status={data.network.firewall} 
                type={data.network.firewall === 'active' ? 'success' : 'error'} 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">SSH</span>
              <StatusBadge 
                status={data.network.ssh} 
                type={data.network.ssh === 'disabled' ? 'success' : 'warning'} 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Exposed Services</span>
              <span className={`text-xs ${data.network.exposedServices.length === 0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {data.network.exposedServices.length === 0 ? 'None' : data.network.exposedServices.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Context Window Usage */}
      {data.context && (
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🧠</span>
            <h4 className="font-semibold text-white text-base">Context Window Usage</h4>
            <span className="text-xs text-slate-500 ml-auto">Updates every 15 min</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Discord Session */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="text-white font-medium text-sm">Discord #jasper</span>
                {data.context.discord && (
                  <span className="text-xs text-slate-500 ml-auto font-mono">
                    {data.context.discord.model}
                  </span>
                )}
              </div>
              {data.context.discord ? (
                <>
                  <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.context.discord.pct >= 85 ? 'bg-red-500' :
                        data.context.discord.pct >= 60 ? 'bg-yellow-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${data.context.discord.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={`font-bold ${
                      data.context.discord.pct >= 85 ? 'text-red-400' :
                      data.context.discord.pct >= 60 ? 'text-yellow-400' :
                      'text-emerald-400'
                    }`}>
                      {(data.context.discord.used / 1000).toFixed(0)}k / {(data.context.discord.total / 1000).toFixed(0)}k ({data.context.discord.pct}%)
                    </span>
                    <span className="text-slate-500">
                      {((data.context.discord.total - data.context.discord.used) / 1000).toFixed(0)}k remaining
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-xs italic">No active Discord session</p>
              )}
            </div>

            {/* Main/Telegram Session */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📱</span>
                <span className="text-white font-medium text-sm">Main (Telegram)</span>
                {data.context.main && (
                  <span className="text-xs text-slate-500 ml-auto font-mono">
                    {data.context.main.model}
                  </span>
                )}
              </div>
              {data.context.main ? (
                <>
                  <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.context.main.pct >= 85 ? 'bg-red-500' :
                        data.context.main.pct >= 60 ? 'bg-yellow-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${data.context.main.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={`font-bold ${
                      data.context.main.pct >= 85 ? 'text-red-400' :
                      data.context.main.pct >= 60 ? 'text-yellow-400' :
                      'text-emerald-400'
                    }`}>
                      {(data.context.main.used / 1000).toFixed(0)}k / {(data.context.main.total / 1000).toFixed(0)}k ({data.context.main.pct}%)
                    </span>
                    <span className="text-slate-500">
                      {((data.context.main.total - data.context.main.used) / 1000).toFixed(0)}k remaining
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-xs italic">No active main session</p>
              )}
            </div>
          </div>

          {/* All Sessions Table */}
          {data.context.sessions && data.context.sessions.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                Show all {data.context.sessions.length} active sessions
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <th className="text-left py-2 pr-4">Session</th>
                      <th className="text-left py-2 pr-4">Kind</th>
                      <th className="text-left py-2 pr-4">Age</th>
                      <th className="text-left py-2 pr-4">Model</th>
                      <th className="text-right py-2">Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.context.sessions.map((session, idx) => (
                      <tr key={idx} className="border-b border-slate-700/20">
                        <td className="py-2 pr-4 text-white font-mono truncate max-w-[200px]" title={session.key}>
                          {session.label}
                        </td>
                        <td className="py-2 pr-4 text-slate-400">{session.kind}</td>
                        <td className="py-2 pr-4 text-slate-400">{session.age}</td>
                        <td className="py-2 pr-4 text-slate-400 font-mono">{session.model}</td>
                        <td className="py-2 text-right">
                          <span className={`font-bold ${
                            session.pct >= 85 ? 'text-red-400' :
                            session.pct >= 60 ? 'text-yellow-400' :
                            'text-emerald-400'
                          }`}>
                            {(session.used / 1000).toFixed(0)}k/{(session.total / 1000).toFixed(0)}k ({session.pct}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Middle Row — Full Width: Service Health */}
      <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h4 className="font-semibold text-white text-base">Service Health</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.services.map((service) => (
            <div
              key={service.name}
              className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{service.name}</span>
                <span className={`w-2 h-2 rounded-full ${
                  getServiceStatusType(service.status) === 'success' ? 'bg-emerald-400' :
                  getServiceStatusType(service.status) === 'error' ? 'bg-red-400' :
                  'bg-yellow-400'
                }`}></span>
              </div>
              <div className="space-y-1">
                <StatusBadge 
                  status={service.status} 
                  type={getServiceStatusType(service.status)} 
                />
                <p className="text-[11px] text-slate-400 mt-2 truncate" title={service.detail}>
                  {service.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row — 2 Sections: Security Events Log | HeartbeatGuard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events Log */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📜</span>
            <h4 className="font-semibold text-white text-base">Security Events</h4>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.events.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-slate-700/20 rounded-lg border border-slate-600/10"
              >
                <span className="text-lg">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{event.message}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{getRelativeTime(event.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HeartbeatGuard Checks */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏥</span>
            <h4 className="font-semibold text-white text-base">HeartbeatGuard</h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Windows Defender</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${data.heartbeatGuard.defenderStatus === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={data.heartbeatGuard.defenderStatus === 'active' ? 'text-emerald-400' : 'text-red-400'}>
                  {data.heartbeatGuard.defenderStatus}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Last Scan</span>
              <span className="text-slate-300 text-xs">{formatTime(data.heartbeatGuard.lastScan)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Definitions Age</span>
              <StatusBadge 
                status={data.heartbeatGuard.definitionsAge} 
                type={data.heartbeatGuard.definitionsAge.includes('<') ? 'success' : 'warning'} 
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Pending Updates</span>
              <span className={`font-bold ${data.heartbeatGuard.pendingUpdates > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {data.heartbeatGuard.pendingUpdates}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Disk Encryption</span>
              <StatusBadge 
                status={data.heartbeatGuard.diskEncryption} 
                type={data.heartbeatGuard.diskEncryption.toLowerCase().includes('enabled') ? 'success' : 'warning'} 
              />
            </div>
            <div className="pt-2 border-t border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Credential Review</span>
                <span className="text-slate-300 text-xs">
                  Last: {formatDate(data.heartbeatGuard.credentialReview)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
