'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// ── Agent Definitions ──────────────────────────────────────────────────────────

interface AgentDef {
  id: string
  name: string
  emoji: string
  role: string
  title: string
  owns: string[]
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
    title: 'Content & Brand Strategist',
    owns: ['Blog & social content', 'Newsletter drafts', 'TVE & Monomoy copy'],
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
    title: 'Research & Intelligence Lead',
    owns: ['Market research', 'Competitor analysis', 'Daily intel briefings'],
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
    title: 'Automation & Infrastructure Engineer',
    owns: ['n8n workflow pipelines', 'GiftHQ social pipeline', 'Integration & sync jobs'],
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
    title: 'Lead Developer',
    owns: ['Jasper HQ', 'Vortxx', 'YTidy', 'GiftHQ', 'All code & deploys'],
    color: 'emerald',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-300',
    bgColor: 'bg-emerald-900/20',
  },
  {
    id: 'fort',
    name: 'ANCHOR',
    emoji: '🏰',
    role: 'The Fort Strategy',
    title: 'Fort Marketing & Strategy Lead',
    owns: ['Fort marketing plans', 'Performance Therapy growth', 'Membership & pricing'],
    color: 'purple',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-300',
    bgColor: 'bg-purple-900/20',
  },
]

// ── Current Assignments (update as agents take on new work) ───────────────────

interface Assignment {
  status: 'active' | 'queued' | 'idle' | 'blocked'
  project: string
  task: string
  priority: 'P1' | 'P2' | 'P3'
}

const CURRENT_ASSIGNMENTS: Record<string, Assignment> = {
  beacon: {
    status: 'queued',
    project: 'TVE Newsletter',
    task: 'Draft TVE Issue #1 — Apply This Now section',
    priority: 'P1',
  },
  navigator: {
    status: 'queued',
    project: 'GiftHQ',
    task: 'Research Amazon PA API categories for Mother\'s Day',
    priority: 'P1',
  },
  rigger: {
    status: 'active',
    project: 'GiftHQ Pipeline',
    task: 'Build Amazon → OpenAI → video → social auto-posting pipeline',
    priority: 'P1',
  },
  dev: {
    status: 'queued',
    project: 'Jasper Chat',
    task: 'Fix chat lag — bypass cron, call Claude API directly in /api/chat/send',
    priority: 'P1',
  },
  fort: {
    status: 'active',
    project: 'The Fort',
    task: 'March 1 price increase — member communication & Drew talking points',
    priority: 'P1',
  },
}

type AgentStatus = 'idle' | 'active' | 'queued' | 'blocked'

const STATUS_CONFIG: Record<AgentStatus, { label: string; dotColor: string }> = {
  idle:    { label: 'IDLE',    dotColor: 'bg-slate-400' },
  active:  { label: 'ACTIVE',  dotColor: 'bg-yellow-400' },
  queued:  { label: 'QUEUED',  dotColor: 'bg-blue-400' },
  blocked: { label: 'BLOCKED', dotColor: 'bg-red-400' },
}

const PRIORITY_BADGE: Record<string, string> = {
  P1: 'bg-red-900/40 text-red-300 border-red-500/30',
  P2: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  P3: 'bg-slate-700/40 text-slate-300 border-slate-500/30',
}

// Supabase task type — matches actual agent_tasks table schema
interface AgentTask {
  id: string
  user_id: string
  agent: string | null
  title: string
  notes: string | null
  status: string          // 'todo' | 'in_progress' | 'completed' | 'blocked'
  priority: string        // 'low' | 'medium' | 'high' | 'critical'
  assigned_by: string | null
  tags: string[] | null   // e.g. ['GiftHQ', 'P1']
  metadata: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

// Map DB status → display status
function mapStatus(s: string): 'active' | 'queued' | 'idle' | 'blocked' {
  if (s === 'in_progress') return 'active'
  if (s === 'todo')        return 'queued'
  if (s === 'blocked')     return 'blocked'
  return 'idle'
}

// Map DB priority → P-label
function mapPriority(p: string): 'P1' | 'P2' | 'P3' {
  if (p === 'high')   return 'P1'
  if (p === 'medium') return 'P2'
  return 'P3'
}

// Get project from tags (first tag that isn't a P-level)
function projectFromTags(tags: string[] | null): string {
  return tags?.find(t => !t.match(/^P[123]$/)) ?? ''
}

// ── Sub-component: Agent Card ──────────────────────────────────────────────────

function AgentCard({
  agent,
  status,
  currentTask,
}: {
  agent: AgentDef
  status: AgentStatus
  currentTask: { task: string; project: string; priority: 'P1'|'P2'|'P3' } | null
}) {
  const statusInfo = STATUS_CONFIG[status]

  return (
    <div className={`rounded-lg border ${agent.borderColor} ${agent.bgColor} p-4 flex flex-col gap-3`}>
      {/* Header — name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <p className={`text-sm font-bold ${agent.textColor}`}>{agent.name}</p>
            <p className="text-[11px] text-slate-400">{agent.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} ${status === 'active' ? 'animate-pulse' : ''}`} />
          <span className={`text-[10px] font-semibold ${agent.textColor}`}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Responsibilities */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5 font-medium">Owns</p>
        <ul className="space-y-0.5">
          {agent.owns.map((item) => (
            <li key={item} className="text-[11px] text-slate-300 flex items-start gap-1.5">
              <span className={`mt-0.5 w-1 h-1 rounded-full bg-current ${agent.textColor} shrink-0`} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Current assignment */}
      <div className="border-t border-slate-700/40 pt-2.5 flex-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-medium">
          {status === 'active' ? '▶ Running' : status === 'queued' ? '⏳ Up Next' : 'Assignment'}
        </p>
        {currentTask ? (
          <div className="space-y-1">
            <p className="text-xs text-white font-medium leading-snug line-clamp-2">{currentTask.task}</p>
            <div className="flex items-center gap-2 mt-1">
              {currentTask.project && (
                <span className="text-[10px] text-slate-500 truncate">{currentTask.project}</span>
              )}
              <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_BADGE[currentTask.priority]}`}>
                {currentTask.priority}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">Available — awaiting task</p>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AgentCommandCenter() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [live, setLive] = useState(true)

  useEffect(() => {
    if (!supabase) return
    // Initial fetch
    supabase
      .from('agent_tasks')
      .select('*')
      .not('agent', 'is', null)
      .neq('status', 'completed')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) { setTasks(data as AgentTask[]); setLastUpdated(new Date()) }
      })

    // Realtime subscription
    const ch = supabase
      .channel('agent_tasks_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, () => {
        supabase
          .from('agent_tasks')
          .select('*')
          .not('agent', 'is', null)
          .neq('status', 'completed')
          .order('updated_at', { ascending: false })
          .then(({ data }) => {
            if (data) { setTasks(data as AgentTask[]); setLastUpdated(new Date()) }
          })
        setLive(false); setTimeout(() => setLive(true), 400)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  // Per-agent: use DB tasks if available, else fall back to static CURRENT_ASSIGNMENTS
  function getAgentStatus(agentId: string): AgentStatus {
    const agentTasks = tasks.filter(t => t.agent === agentId)
    if (agentTasks.length > 0) return mapStatus(agentTasks[0].status)
    return CURRENT_ASSIGNMENTS[agentId]?.status ?? 'idle'
  }

  function getAgentTask(agentId: string): { task: string; project: string; priority: 'P1'|'P2'|'P3' } | null {
    const t = tasks.find(t => t.agent === agentId)
    if (t) return { task: t.title, project: projectFromTags(t.tags), priority: mapPriority(t.priority) }
    const a = CURRENT_ASSIGNMENTS[agentId]
    if (a && a.status !== 'idle') return { task: a.task, project: a.project, priority: a.priority }
    return null
  }

  const allStatuses = AGENTS.map(a => getAgentStatus(a.id))
  const runningCount = allStatuses.filter(s => s === 'active').length
  const queuedCount  = allStatuses.filter(s => s === 'queued').length
  const blockedCount = allStatuses.filter(s => s === 'blocked').length

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
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${live ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {tasks.length > 0 ? 'Live' : 'Static'} · {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {/* Agent Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={getAgentStatus(agent.id)}
            currentTask={getAgentTask(agent.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600">
        <span>{runningCount} active · {queuedCount} queued · {blockedCount} blocked</span>
        <span>{tasks.length > 0 ? `${tasks.length} tasks from Supabase` : 'Using static fallback'}</span>
      </div>
    </div>
  )
}
