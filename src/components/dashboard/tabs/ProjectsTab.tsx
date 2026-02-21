'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

interface ProjectsTabProps {
  projects?: any[]
}

// Hardcoded project state (will be replaced by live task counting as tasks get tagged)
const PROJECT_STATS: Record<string, { done: number; inProgress: number; todo: number; blocked: number; priority: string; url?: string }> = {
  'The Vibe Entrepreneur':   { done: 5, inProgress: 3, todo: 6, blocked: 0, priority: 'P0', url: 'https://thevibeentrepreneur.com' },
  'Jasper HQ':               { done: 12, inProgress: 4, todo: 5, blocked: 0, priority: 'P0', url: 'https://jasper-hq.vercel.app' },
  'OpenClaw HQ':             { done: 8, inProgress: 2, todo: 3, blocked: 0, priority: 'P1', url: 'https://openclawhq.ai' },
  'AIDEN':                   { done: 1, inProgress: 1, todo: 8, blocked: 0, priority: 'P1' },
  'Vortxx':                  { done: 10, inProgress: 2, todo: 4, blocked: 0, priority: 'P1', url: 'https://vortxx.vercel.app' },
  'HeartbeatGuard':          { done: 6, inProgress: 1, todo: 3, blocked: 0, priority: 'P1', url: 'https://heartbeatguard.com' },
  'YTidy':                   { done: 8, inProgress: 1, todo: 2, blocked: 0, priority: 'P1', url: 'https://ytidy.com' },
  'GiftHQ':                  { done: 5, inProgress: 1, todo: 3, blocked: 0, priority: 'P2', url: 'https://gifthq.ai' },
  'My Cape Compass':         { done: 1, inProgress: 0, todo: 6, blocked: 0, priority: 'P2' },
  'Monomoy Site':            { done: 7, inProgress: 1, todo: 2, blocked: 0, priority: 'P2', url: 'https://monomoystrategies.com' },
  'The Fort':                { done: 4, inProgress: 2, todo: 5, blocked: 0, priority: 'P1', url: 'https://thefortnh.com' },
  'Trigger.dev Integration': { done: 1, inProgress: 2, todo: 5, blocked: 1, priority: 'P1' },
}

function getPct(done: number, inProgress: number, todo: number, blocked: number) {
  const total = done + inProgress + todo + blocked
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

function ProgressBar({ done, inProgress, todo, blocked }: { done: number; inProgress: number; todo: number; blocked: number }) {
  const total = done + inProgress + todo + blocked
  if (total === 0) return <div className="h-2 bg-slate-700/50 rounded-full" />

  const donePct = (done / total) * 100
  const inProgPct = (inProgress / total) * 100
  const blockedPct = (blocked / total) * 100
  // todo fills the rest

  return (
    <div className="h-2 bg-slate-700/40 rounded-full overflow-hidden flex">
      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${donePct}%` }} />
      <div className="h-full bg-blue-500 transition-all" style={{ width: `${inProgPct}%` }} />
      <div className="h-full bg-red-500 transition-all" style={{ width: `${blockedPct}%` }} />
      {/* todo is the remaining grey — rendered by the base bg */}
    </div>
  )
}

function priorityStyle(p: string) {
  if (p === 'P0') return 'bg-red-900/40 text-red-300 border-red-500/40'
  if (p === 'P1') return 'bg-amber-900/40 text-amber-300 border-amber-500/40'
  return 'bg-slate-700/40 text-slate-400 border-slate-600/40'
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
    case 'paused': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'completed': return 'bg-blue-900/30 text-blue-300 border-blue-500/30'
    default: return 'bg-slate-700/30 text-slate-300 border-slate-600/30'
  }
}

function ProjectRow({ project }: { project: any }) {
  const [expanded, setExpanded] = useState(false)
  const stats = PROJECT_STATS[project.name] || { done: 0, inProgress: 0, todo: 1, blocked: 0, priority: 'P2' }
  const pct = getPct(stats.done, stats.inProgress, stats.todo, stats.blocked)
  const total = stats.done + stats.inProgress + stats.todo + stats.blocked
  const activeTasks = stats.inProgress + stats.todo

  return (
    <div className={`border rounded-xl overflow-hidden transition ${
      project.status === 'active'
        ? 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60'
        : 'border-slate-700/30 bg-slate-800/20 opacity-70'
    }`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 mb-3">
          <button className="text-slate-500 hover:text-white transition shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <h4 className="font-semibold text-white flex-1">{project.name}</h4>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${priorityStyle(stats.priority)}`}>
              {stats.priority}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadge(project.status)}`}>
              {project.status}
            </span>
            {stats.url && (
              <a href={stats.url} target="_blank" rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition"
                onClick={e => e.stopPropagation()}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="pl-7">
          <ProgressBar done={stats.done} inProgress={stats.inProgress} todo={stats.todo} blocked={stats.blocked} />
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400 font-bold">{pct}% complete</span>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> {stats.done} done</span>
                {stats.inProgress > 0 && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span> {stats.inProgress} in progress</span>}
                {stats.blocked > 0 && <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> {stats.blocked} blocked</span>}
              </div>
            </div>
            <span className="text-[11px] text-slate-500">{activeTasks} active task{activeTasks !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {expanded && project.description && (
        <div className="px-4 pb-4 pl-11 border-t border-slate-700/30 pt-3">
          <p className="text-sm text-slate-400 leading-relaxed">{project.description}</p>
          {project.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProjectsTab({ projects = [] }: ProjectsTabProps) {
  const activeProjects = projects.filter(p => p.status === 'active')
  const otherProjects = projects.filter(p => p.status !== 'active')

  // Legend
  const legend = [
    { color: 'bg-emerald-500', label: 'Done' },
    { color: 'bg-blue-500', label: 'In Progress' },
    { color: 'bg-slate-600', label: 'Backlog' },
    { color: 'bg-red-500', label: 'Blocked' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <Badge className="bg-emerald-900/20 text-emerald-300">{activeProjects.length} active</Badge>
          <Badge className="bg-slate-700/50 text-slate-400">{projects.length} total</Badge>
        </div>
        <div className="flex items-center gap-3">
          {legend.map(l => (
            <div key={l.label} className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${l.color}`}></span>{l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Active — {activeProjects.length} projects
          </h3>
          {activeProjects.map((project: any) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{otherProjects.length} other</h3>
          {otherProjects.map((project: any) => (
            <ProjectRow key={project.id} project={project} />
          ))}
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-16 text-slate-500">No projects found. Add projects in Supabase.</div>
      )}
    </div>
  )
}
