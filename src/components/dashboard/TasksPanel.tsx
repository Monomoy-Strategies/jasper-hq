'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListTodo, Plus, CheckCircle2, Circle, Clock } from 'lucide-react'

interface TasksPanelProps {
  tasks?: any[]
}

function mapStatus(status: string): string {
  switch (status) {
    case 'done': case 'completed': return 'done'
    case 'in-progress': case 'in_progress': return 'in_progress'
    default: return 'todo'
  }
}

export function TasksPanel({ tasks = [] }: TasksPanelProps) {
  const todo = tasks.filter(t => mapStatus(t.status) === 'todo')
  const inProgress = tasks.filter(t => mapStatus(t.status) === 'in_progress')
  const done = tasks.filter(t => mapStatus(t.status) === 'done')

  return (
    <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur h-96 overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <ListTodo className="h-5 w-5 text-amber-400" />
            Tasks
            <Badge className="bg-slate-700/50 text-slate-300">{tasks.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* To Do */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">To Do</span>
              <Badge className="bg-slate-700/50 text-slate-300 text-xs">{todo.length}</Badge>
            </div>
            {todo.length > 0 ? (
              <div className="space-y-1">
                {todo.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-slate-700/20">
                    <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-white line-clamp-1">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 pl-2">No to do tasks</p>
            )}
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-300">In Progress</span>
              <Badge className="bg-blue-900/20 text-blue-300 text-xs">{inProgress.length}</Badge>
            </div>
            {inProgress.length > 0 ? (
              <div className="space-y-1">
                {inProgress.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-blue-900/10 border border-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="text-sm text-white line-clamp-1">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 pl-2">No in progress tasks</p>
            )}
          </div>

          {/* Done */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-300">Done</span>
              <Badge className="bg-emerald-900/20 text-emerald-300 text-xs">{done.length}</Badge>
            </div>
            {done.length > 0 ? (
              <div className="space-y-1">
                {done.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-emerald-900/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-slate-300 line-clamp-1 line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 pl-2">No done tasks</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
