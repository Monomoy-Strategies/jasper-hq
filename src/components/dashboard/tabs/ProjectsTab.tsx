'use client'

import { Badge } from '@/components/ui/badge'
import { FolderOpen, ExternalLink } from 'lucide-react'

interface ProjectsTabProps {
  projects?: any[]
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
    case 'paused': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'completed': return 'bg-blue-900/30 text-blue-300 border-blue-500/30'
    case 'archived': return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
    default: return 'bg-slate-700/30 text-slate-300 border-slate-600/30'
  }
}

export function ProjectsTab({ projects = [] }: ProjectsTabProps) {
  const activeProjects = projects.filter(p => p.status === 'active')
  const otherProjects = projects.filter(p => p.status !== 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-6 w-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <Badge className="bg-slate-700/50 text-slate-300">{projects.length} total</Badge>
        </div>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Active Projects ({activeProjects.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project: any) => (
              <div 
                key={project.id} 
                className="border border-emerald-500/30 bg-gradient-to-br from-slate-800/80 to-emerald-900/10 backdrop-blur rounded-lg p-5 hover:border-emerald-500/50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">{project.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">{project.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {project.tags?.map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-purple-900/20 text-purple-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700/50">
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                      <ExternalLink className="h-3 w-3" />
                      Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Projects */}
      {otherProjects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-400 mb-4">
            Other Projects ({otherProjects.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherProjects.map((project: any) => (
              <div 
                key={project.id} 
                className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-5 hover:border-slate-600/50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">{project.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="text-xs text-slate-500">
                  {project.updated_at && `Updated: ${new Date(project.updated_at).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-16 border border-slate-700/50 bg-slate-800/30 rounded-lg">
          <FolderOpen className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Projects Yet</h3>
          <p className="text-sm text-slate-500">Projects will appear here once created</p>
        </div>
      )}
    </div>
  )
}
