'use client'

import { Badge } from '@/components/ui/badge'
import { ListTodo, CheckCircle2, Circle, Clock } from 'lucide-react'

interface TasksTabProps {
  tasks?: any[]
}

function mapStatus(status: string): string {
  switch (status) {
    case 'done': case 'completed': return 'done'
    case 'in-progress': case 'in_progress': return 'in_progress'
    default: return 'todo'
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': case 'p1': return 'text-red-400 bg-red-900/20 border-red-500/30'
    case 'medium': case 'p2': return 'text-amber-400 bg-amber-900/20 border-amber-500/30'
    case 'low': case 'p3': return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
    default: return 'text-slate-400 bg-slate-700/30 border-slate-600/30'
  }
}

export function TasksTab({ tasks = [] }: TasksTabProps) {
  const todo = tasks.filter(t => mapStatus(t.status) === 'todo')
  const inProgress = tasks.filter(t => mapStatus(t.status) === 'in_progress')
  const done = tasks.filter(t => mapStatus(t.status) === 'done')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListTodo className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <Badge className="bg-slate-700/50 text-slate-300">{tasks.length} total</Badge>
        </div>
      </div>

      {/* Kanban-style columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-slate-400" />
              <span className="font-semibold text-white">To Do</span>
            </div>
            <Badge className="bg-slate-700/50 text-slate-300">{todo.length}</Badge>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {todo.length > 0 ? (
              todo.map((task: any) => (
                <div key={task.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/20 hover:bg-slate-700/50 transition">
                  <p className="text-sm font-medium text-white mb-2">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.project && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 border border-purple-500/30">
                        {task.project}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks to do</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="border border-blue-500/30 bg-blue-900/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-blue-300">In Progress</span>
            </div>
            <Badge className="bg-blue-900/20 text-blue-300">{inProgress.length}</Badge>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {inProgress.length > 0 ? (
              inProgress.map((task: any) => (
                <div key={task.id} className="p-3 bg-blue-900/20 rounded-lg border border-blue-500/20 hover:bg-blue-900/30 transition">
                  <p className="text-sm font-medium text-white mb-2">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.project && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 border border-purple-500/30">
                        {task.project}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-blue-400/50">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nothing in progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="border border-emerald-500/30 bg-emerald-900/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Done</span>
            </div>
            <Badge className="bg-emerald-900/20 text-emerald-300">{done.length}</Badge>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {done.length > 0 ? (
              done.map((task: any) => (
                <div key={task.id} className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/20 hover:bg-emerald-900/30 transition opacity-75">
                  <p className="text-sm font-medium text-slate-300 line-through mb-2">{task.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.completed_at && (
                      <span className="text-xs text-emerald-400">
                        ✓ {new Date(task.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-emerald-400/50">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No completed tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
