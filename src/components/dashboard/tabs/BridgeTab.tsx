'use client'

import { Badge } from '@/components/ui/badge'

interface Agent {
  id: string
  name: string
  model: string
  role: string
  roleType: 'primary' | 'board' | 'intern-senior' | 'intern-junior'
  status: 'active' | 'idle' | 'offline'
  currentAssignment?: string
  lastActive: string
  emoji: string
  color: string
}

const AGENTS: Agent[] = [
  {
    id: 'jasper',
    name: 'Jasper',
    model: 'Claude Opus 4.6',
    role: 'Primary Agent',
    roleType: 'primary',
    status: 'active',
    currentAssignment: 'Command & Control',
    lastActive: 'Now',
    emoji: '🦞',
    color: 'amber',
  },
  {
    id: 'cso',
    name: 'CSO Agent',
    model: 'Claude Opus 4.6',
    role: 'Board Member',
    roleType: 'board',
    status: 'idle',
    currentAssignment: 'Strategy & Risk Analysis',
    lastActive: '2h ago',
    emoji: '📡',
    color: 'purple',
  },
  {
    id: 'coo',
    name: 'COO Agent',
    model: 'GPT-5.2 Codex',
    role: 'Board Member',
    roleType: 'board',
    status: 'idle',
    currentAssignment: 'Execution & Operations',
    lastActive: '3h ago',
    emoji: '⚙️',
    color: 'blue',
  },
  {
    id: 'cro',
    name: 'CRO Agent',
    model: 'Grok 3',
    role: 'Board Member',
    roleType: 'board',
    status: 'offline',
    currentAssignment: 'Research & Data Analysis',
    lastActive: '1d ago',
    emoji: '🔬',
    color: 'orange',
  },
  {
    id: 'cpo',
    name: 'CPO Agent',
    model: 'Gemini 3 Pro',
    role: 'Board Member',
    roleType: 'board',
    status: 'idle',
    currentAssignment: 'Product & UX Design',
    lastActive: '4h ago',
    emoji: '🎨',
    color: 'emerald',
  },
  {
    id: 'llama70b',
    name: 'Llama 70B',
    model: 'Llama 3.3 70B',
    role: 'Senior Intern',
    roleType: 'intern-senior',
    status: 'idle',
    currentAssignment: 'Heavy local processing',
    lastActive: '30m ago',
    emoji: '🏠',
    color: 'slate',
  },
  {
    id: 'llama8b',
    name: 'Llama 8B',
    model: 'Llama 3.1 8B',
    role: 'Junior Intern',
    roleType: 'intern-junior',
    status: 'idle',
    currentAssignment: 'Quick local tasks',
    lastActive: '1h ago',
    emoji: '🏠',
    color: 'slate',
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-500 animate-pulse'
    case 'idle': return 'bg-amber-500'
    case 'offline': return 'bg-slate-500'
    default: return 'bg-slate-500'
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
    case 'idle': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'offline': return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
    default: return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
  }
}

function getCardBorderColor(agent: Agent) {
  if (agent.status === 'active') {
    return 'border-emerald-500/50 bg-gradient-to-br from-slate-800/80 to-emerald-900/20'
  }
  switch (agent.color) {
    case 'amber': return 'border-amber-500/30 bg-slate-800/50'
    case 'purple': return 'border-purple-500/30 bg-slate-800/50'
    case 'blue': return 'border-blue-500/30 bg-slate-800/50'
    case 'orange': return 'border-orange-500/30 bg-slate-800/50'
    case 'emerald': return 'border-emerald-500/30 bg-slate-800/50'
    default: return 'border-slate-700/50 bg-slate-800/50'
  }
}

export function BridgeTab() {
  const primaryAgent = AGENTS.find(a => a.roleType === 'primary')
  const boardAgents = AGENTS.filter(a => a.roleType === 'board')
  const internAgents = AGENTS.filter(a => a.roleType.startsWith('intern'))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌉</span>
          <div>
            <h2 className="text-2xl font-bold text-white">The Bridge</h2>
            <p className="text-sm text-slate-400">AI Agent Command & Monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-300">{AGENTS.filter(a => a.status === 'active').length} Active</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-amber-300">{AGENTS.filter(a => a.status === 'idle').length} Idle</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <span className="text-slate-400">{AGENTS.filter(a => a.status === 'offline').length} Offline</span>
          </div>
        </div>
      </div>

      {/* Primary Agent - Featured Card */}
      {primaryAgent && (
        <div className={`border-2 rounded-xl p-6 ${getCardBorderColor(primaryAgent)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{primaryAgent.emoji}</div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-white">{primaryAgent.name}</h3>
                  <span className={`w-3 h-3 rounded-full ${getStatusColor(primaryAgent.status)}`}></span>
                </div>
                <p className="text-lg text-amber-300">{primaryAgent.role}</p>
                <p className="text-sm text-slate-400">{primaryAgent.model}</p>
              </div>
            </div>
            <Badge className={`border ${getStatusBadgeClass(primaryAgent.status)}`}>
              {primaryAgent.status.toUpperCase()}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Current Assignment:</span>
              <p className="text-white font-medium mt-1">{primaryAgent.currentAssignment}</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Last Active:</span>
              <p className="text-emerald-300 font-medium mt-1">{primaryAgent.lastActive}</p>
            </div>
          </div>
        </div>
      )}

      {/* Board Members Grid */}
      <div>
        <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
          🏛️ AI Board of Directors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {boardAgents.map((agent) => (
            <div key={agent.id} className={`border rounded-lg p-4 ${getCardBorderColor(agent)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{agent.emoji}</span>
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
                </div>
                <Badge className={`text-xs border ${getStatusBadgeClass(agent.status)}`}>
                  {agent.status}
                </Badge>
              </div>
              <h4 className="text-lg font-semibold text-white">{agent.name}</h4>
              <p className="text-xs text-slate-400 mb-2">{agent.model}</p>
              <p className="text-sm text-slate-300 mb-3">{agent.currentAssignment}</p>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                Last active: {agent.lastActive}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Models / Interns */}
      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
          🏠 Local Fleet (Interns)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internAgents.map((agent) => (
            <div key={agent.id} className="border border-slate-700/50 bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{agent.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">{agent.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
                    </div>
                    <p className="text-xs text-slate-400">{agent.model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`text-xs border ${agent.roleType === 'intern-senior' ? 'bg-blue-900/20 text-blue-300 border-blue-500/30' : 'bg-slate-700/30 text-slate-400 border-slate-600/30'}`}>
                    {agent.role}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">{agent.lastActive}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">{agent.currentAssignment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Overview */}
      <div className="border border-slate-700/50 bg-slate-800/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">🖥️ System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-300">{AGENTS.length}</div>
            <div className="text-xs text-slate-400">Total Agents</div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-300">4</div>
            <div className="text-xs text-slate-400">Board Members</div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="text-2xl font-bold text-amber-300">2</div>
            <div className="text-xs text-slate-400">Local Models</div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-300">100%</div>
            <div className="text-xs text-slate-400">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  )
}
