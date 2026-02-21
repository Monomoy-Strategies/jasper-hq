'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Star, Clock } from 'lucide-react'

const STATUS_CYCLE = ['new', 'exploring', 'validated', 'backburner', 'archived']

async function updateIdeaStatus(ideaId: string, newStatus: string) {
  try {
    await fetch(`/api/ideas/${ideaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  } catch {}
}

interface IdeasTabProps {
  ideas?: any[]
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'new': return 'bg-blue-900/30 text-blue-300 border-blue-500/30'
    case 'exploring': case 'in-progress': return 'bg-purple-900/30 text-purple-300 border-purple-500/30'
    case 'validated': case 'approved': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
    case 'backburner': case 'paused': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'archived': case 'rejected': return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
    default: return 'bg-slate-700/30 text-slate-300 border-slate-600/30'
  }
}

function getRatingStars(rating: number) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star 
        key={i} 
        className={`h-4 w-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
      />
    )
  }
  return stars
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

export function IdeasTab({ ideas: initialIdeas = [] }: IdeasTabProps) {
  const [ideas, setIdeas] = useState(initialIdeas)

  const cycleStatus = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId)
    if (!idea) return
    const currentStatus = idea.metadata?.status || idea.status || 'new'
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, metadata: { ...(i.metadata || {}), status: nextStatus } } : i))
    await updateIdeaStatus(ideaId, nextStatus)
  }

  // Status is stored in metadata.status (not a direct column)
  const getStatus = (i: any) => i.metadata?.status || i.status || 'new'

  // Group ideas by status
  const newIdeas = ideas.filter(i => getStatus(i) === 'new')
  const exploringIdeas = ideas.filter(i => ['exploring', 'in-progress'].includes(getStatus(i)))
  const validatedIdeas = ideas.filter(i => ['validated', 'approved'].includes(getStatus(i)))
  const backburnerIdeas = ideas.filter(i => ['backburner', 'paused'].includes(getStatus(i)))

  const IdeaCard = ({ idea }: { idea: any }) => (
    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/20 hover:bg-slate-700/50 transition group">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-white line-clamp-2">{idea.title}</h4>
        {(idea.rating || idea.metadata?.rating) && (
          <div className="flex items-center gap-0.5 shrink-0 ml-2">
            {getRatingStars(idea.rating || idea.metadata?.rating)}
          </div>
        )}
      </div>
      {idea.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-3">{idea.description}</p>
      )}
      {idea.tags && idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {idea.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-amber-900/20 text-amber-300 border border-amber-500/20">
              {tag}
            </span>
          ))}
          {idea.tags.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/50 text-slate-400">
              +{idea.tags.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => cycleStatus(idea.id)}
          title="Click to cycle status"
          className={`border rounded-full px-2 py-0.5 font-medium text-[11px] transition hover:opacity-80 cursor-pointer ${getStatusColor(getStatus(idea))}`}
        >
          {getStatus(idea)} →
        </button>
        {idea.created_at && (
          <span className="text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(idea.created_at)}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-amber-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Ideas Pipeline</h2>
            <p className="text-sm text-slate-400">{ideas.length} ideas captured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/30">{newIdeas.length} New</Badge>
          <Badge className="bg-purple-900/30 text-purple-300 border-purple-500/30">{exploringIdeas.length} Exploring</Badge>
          <Badge className="bg-emerald-900/30 text-emerald-300 border-emerald-500/30">{validatedIdeas.length} Validated</Badge>
        </div>
      </div>

      {/* Ideas Grid Layout */}
      {ideas.length > 0 ? (
        <div className="space-y-8">
          {/* New Ideas */}
          {newIdeas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                New Ideas ({newIdeas.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {newIdeas.map((idea: any) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </div>
          )}

          {/* Exploring */}
          {exploringIdeas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Exploring ({exploringIdeas.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {exploringIdeas.map((idea: any) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </div>
          )}

          {/* Validated */}
          {validatedIdeas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Validated ({validatedIdeas.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {validatedIdeas.map((idea: any) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </div>
          )}

          {/* Backburner */}
          {backburnerIdeas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Backburner ({backburnerIdeas.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {backburnerIdeas.map((idea: any) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 border border-slate-700/50 bg-slate-800/30 rounded-lg">
          <Lightbulb className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Ideas Yet</h3>
          <p className="text-sm text-slate-500">Ideas will appear here as they're generated</p>
          <p className="text-xs text-slate-600 mt-2">Tell Jasper "I have an idea about..." to get started</p>
        </div>
      )}

      {/* Quick Stats */}
      {ideas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-amber-500/30 bg-amber-900/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-300">{ideas.length}</div>
            <div className="text-xs text-slate-400">Total Ideas</div>
          </div>
          <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-300">
              {ideas.filter((i: any) => i.rating >= 4).length}
            </div>
            <div className="text-xs text-slate-400">High Rated (4+)</div>
          </div>
          <div className="border border-purple-500/30 bg-purple-900/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-300">
              {[...new Set(ideas.flatMap((i: any) => i.tags || []))].length}
            </div>
            <div className="text-xs text-slate-400">Unique Tags</div>
          </div>
          <div className="border border-blue-500/30 bg-blue-900/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-300">
              {ideas.filter((i: any) => {
                if (!i.created_at) return false
                const created = new Date(i.created_at)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return created > weekAgo
              }).length}
            </div>
            <div className="text-xs text-slate-400">This Week</div>
          </div>
        </div>
      )}
    </div>
  )
}
