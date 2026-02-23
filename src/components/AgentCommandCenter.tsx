'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ── Agent Definitions ──────────────────────────────────────────────────────────

interface AgentDef {
  id: string
  name: string
  emoji: string
  role: string
  color: string
  borderColor: string
  textColor: string
  bgColor: string
}

const AGENTS: AgentDef[] = [
  {
    id: 'beacon',
    name: 'BEACON',
    emoji: '📡',
    role: 'Content Creation',
    color: 'amber',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-300',
    bgColor: 'bg-amber-900/20',
  },
  {
    id: 'navigator',
    name: 'NAVIGATOR',
    emoji: '🔭',
    role: 'Research & Intel',
    color: 'blue',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-300',
    bgColor: 'bg-blue-900/20',
  },
  {
    id: 'rigger',
    name: 'RIGGER',
    emoji: '⚙️',
    role: 'Automation & n8n',
    color: 'orange',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-300',
    bgColor: 'bg-orange-900/20',
  },
  {
    id: 'dev',
    name: 'FORGE',
    emoji: '💻',
    role: 'Development',
    color: 'emerald',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-300',
    bgColor: 'bg-emerald-900/20',
  },
  {
    id: 'fort',
    name: 'ANCHOR',
    emoji: '🏰',
    role: 'The Fort Marketing',
    color: 'purple',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-300',
    bgColor: 'bg-purple-900/20',
  },
]

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentTask {
  id: string
  agent: string
  project: string | null
  title: string
  description: string | null
  branch: string | null
  pr: number | null
  status: 'queued' | 'running' | 'blocked' | 'review-ready' | 'done'
  priority: 'P1' | 'P2' | 'P3'
  created_at: string
  updated_at: string
  completed_at: string | null
  notes: string | null
}

type AgentStatus = 'idle' | 'active' | 'queued' | 'blocked' | 'review'

// ── Status helpers ─────────────────────────────────────────────────────────────

function getAgentStatus(tasks: AgentTask[]): AgentStatus {
  if (tasks.some(t => t.status === 'blocked')) return 'blocked'
  if (tasks.some(t => t.status === 'running')) return 'active'
  if (tasks.some(t => t.status === 'review-ready')) return 'review'
  if (tasks.some(t => t.status === 'queued')) return 'queued'
  return 'idle'
}

const STATUS_CONFIG: Record<AgentStatus, { dot: string; label: string; dotColor: string }> = {
  idle:    { dot: '🟢', label: 'IDLE',    dotColor: 'bg-emerald-400' },
  active:  { dot: '🟡', label: 'ACTIVE',  dotColor: 'bg-yellow-400' },
  queued:  { dot: '🔵', label: 'QUEUED',  dotColor: 'bg-blue-400' },
  blocked: { dot: '🔴', label: 'BLOCKED', dotColor: 'bg-red-400' },
  review:  { dot: '🟣', label: 'REVIEW',  dotColor: 'bg-purple-400' },
}

const PRIORITY_BADGE: Record<string, string> = {
  P1: 'bg-red-900/40 text-red-300 border-red-500/30',
  P2: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  P3: 'bg-slate-700/40 text-slate-300 border-slate-500/30',
}

// ── Sub-component: Agent Card ──────────────────────────────────────────────────

function AgentCard({
  agent,
  tasks,
}: {
  agent: AgentDef
  tasks: AgentTask[]
}) {
  const status = getAgentStatus(tasks)
  const statusInfo = STATUS_CONFIG[status]
  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'queued')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const currentTask = tasks.find(t => t.status === 'running') || tasks.find(t => t.status === 'queued')

  return (
    <div
      className={`rounded-lg border ${agent.borderColor} ${agent.bgColor} p-4 flex flex-col gap-3 min-h-[200px]`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${agent.textColor} truncate`}>{agent.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{agent.role}</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
        <span className={`text-xs font-semibold ${agent.textColor}`}>{statusInfo.label}</span>
      </div>

      {/* Current task */}
      <div className="flex-1">
        {currentTask ? (
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-medium">
              {currentTask.status === 'running' ? '▶ Running' : '⏳ Next up'}
            </p>
            <p className="text-xs text-white font-medium leading-tight line-clamp-2">
              {currentTask.title}
            </p>
            {currentTask.project && (
              <p className="text-[10px] text-slate-500 truncate">{currentTask.project}</p>
            )}
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded border ${PRIORITY_BADGE[currentTask.priority]}`}>
              {currentTask.priority}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">No active tasks</p>
        )}
      </div>

      {/* Footer counts */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-700/40">
        <span>{activeTasks.length} active</span>
        <span>{doneTasks.length} done</span>
        <span>{tasks.length} total</span>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AgentCommandCenter() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [liveIndicator, setLiveIndicator] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch all agent_tasks from Supabase
  async function fetchTasks() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setTasks(data as AgentTask[])
      setLastUpdated(new Date())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()

    if (!supabase) return

    // Realtime subscription
    const channel = supabase
      .channel('agent_tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_tasks' },
        () => {
          fetchTasks()
          // Pulse live indicator
          setLiveIndicator(false)
          setTimeout(() => setLiveIndicator(true), 300)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Group tasks by agent
  const tasksByAgent = AGENTS.reduce<Record<string, AgentTask[]>>((acc, agent) => {
    acc[agent.id] = tasks.filter(t => t.agent === agent.id)
    return acc
  }, {})

  // Overall counts
  const runningCount = tasks.filter(t => t.status === 'running').length
  const queuedCount = tasks.filter(t => t.status === 'queued').length
  const blockedCount = tasks.filter(t => t.status === 'blocked').length

  return (
    <div className="border border-slate-700/50 bg-slate-800/40 backdrop-blur rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="text-lg font-bold text-white">AGENT COMMAND CENTER</h3>
            <p className="text-xs text-slate-500">Monomoy Strategies — Mission Control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Summary pills */}
          {runningCount > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-300 border border-yellow-500/30">
              {runningCount} running
            </span>
          )}
          {blockedCount > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-red-900/30 text-red-300 border border-red-500/30">
              {blockedCount} blocked
            </span>
          )}

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                liveIndicator ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            Live
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map(agent => (
            <div
              key={agent.id}
              className={`rounded-lg border ${agent.borderColor} ${agent.bgColor} p-4 min-h-[200px] animate-pulse`}
            />
          ))}
        </div>
      ) : (
        /* Agent Cards Grid */
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map(agent => (
            <AgentCard key={agent.id} agent={agent} tasks={tasksByAgent[agent.id] || []} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600">
        <span>
          {tasks.length} total tasks • {queuedCount} queued • {runningCount} running
        </span>
        {lastUpdated && (
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  )
}
