'use client'

import { useState } from 'react'

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

// Legacy Supabase task type (for future live integration)
interface AgentTask {
  id: string
  agent: string
  status: string
  priority: string
  title: string
  project: string | null
  created_at: string
  updated_at: string
}

// ── Sub-component: Agent Card ──────────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentDef }) {
  const assignment = CURRENT_ASSIGNMENTS[agent.id]
  const status = assignment?.status ?? 'idle'
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
        {assignment && status !== 'idle' ? (
          <div className="space-y-1">
            <p className="text-xs text-white font-medium leading-snug line-clamp-2">
              {assignment.task}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500 truncate">{assignment.project}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_BADGE[assignment.priority]}`}>
                {assignment.priority}
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
  const [lastUpdated] = useState<Date>(new Date())

  // Counts from static CURRENT_ASSIGNMENTS
  const assignments = Object.values(CURRENT_ASSIGNMENTS)
  const runningCount = assignments.filter(a => a.status === 'active').length
  const queuedCount  = assignments.filter(a => a.status === 'queued').length
  const blockedCount = assignments.filter(a => a.status === 'blocked').length

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

          {/* Last updated */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {/* Agent Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600">
        <span>{runningCount} active · {queuedCount} queued · {blockedCount} blocked · {assignments.filter(a => a.status === 'idle').length} idle</span>
        <span>Update assignments in AgentCommandCenter.tsx → CURRENT_ASSIGNMENTS</span>
      </div>
    </div>
  )
}
