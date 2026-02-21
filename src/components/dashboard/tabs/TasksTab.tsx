'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ListTodo, CheckCircle2, Circle, Clock, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react'

interface TasksTabProps {
  tasks?: any[]
}

function mapStatus(status: string): 'todo' | 'in_progress' | 'done' {
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

async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    return res.ok
  } catch {
    return false
  }
}

function TaskCard({
  task,
  onMove,
  onDelete,
  status,
}: {
  task: any
  onMove: (id: string, direction: 'forward' | 'back') => void
  onDelete: (id: string) => void
  status: 'todo' | 'in_progress' | 'done'
}) {
  const [moving, setMoving] = useState(false)

  const handleMove = async (direction: 'forward' | 'back') => {
    setMoving(true)
    onMove(task.id, direction)
    setMoving(false)
  }

  return (
    <div className={`p-3 rounded-lg border transition group ${
      status === 'in_progress' ? 'bg-blue-900/20 border-blue-500/20 hover:bg-blue-900/30' :
      status === 'done' ? 'bg-emerald-900/20 border-emerald-500/20 opacity-75' :
      'bg-slate-700/30 border-slate-600/20 hover:bg-slate-700/50'
    }`}>
      <p className={`text-sm font-medium mb-2 ${status === 'done' ? 'line-through text-slate-400' : 'text-white'}`}>
        {task.title}
      </p>
      {task.description && status !== 'done' && (
        <p className="text-xs text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {task.priority && (
          <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
        {task.tags?.[0] && (
          <span className="text-xs px-2 py-0.5 rounded bg-purple-900/20 text-purple-300 border border-purple-500/30">
            {task.tags[0]}
          </span>
        )}
        {task.created_at && (
          <span className="text-[10px] text-slate-500 ml-auto">
            {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {status !== 'todo' && (
          <button
            onClick={() => handleMove('back')}
            disabled={moving}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
        )}
        {status !== 'done' && (
          <button
            onClick={() => handleMove('forward')}
            disabled={moving}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 transition"
          >
            {status === 'todo' ? 'Start' : 'Complete'} <ChevronRight className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/40 text-red-400 transition"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function TasksTab({ tasks: initialTasks = [] }: TasksTabProps) {
  const [tasks, setTasks] = useState(initialTasks)

  const todo = tasks.filter(t => mapStatus(t.status) === 'todo')
  const inProgress = tasks.filter(t => mapStatus(t.status) === 'in_progress')
  const done = tasks.filter(t => mapStatus(t.status) === 'done')

  const handleMove = async (taskId: string, direction: 'forward' | 'back') => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentStatus = mapStatus(task.status)
    let newStatus: string

    if (direction === 'forward') {
      newStatus = currentStatus === 'todo' ? 'in_progress' : 'done'
    } else {
      newStatus = currentStatus === 'done' ? 'in_progress' : 'todo'
    }

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null } : t))

    // Persist to API
    await updateTaskStatus(taskId, newStatus)
  }

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    } catch {}
  }

  const Column = ({
    title,
    icon,
    items,
    status,
    borderClass,
    headerClass,
    bgClass,
  }: {
    title: string
    icon: React.ReactNode
    items: any[]
    status: 'todo' | 'in_progress' | 'done'
    borderClass: string
    headerClass: string
    bgClass: string
  }) => (
    <div className={`border ${borderClass} ${bgClass} backdrop-blur rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className={`font-semibold ${headerClass}`}>{title}</span>
        </div>
        <Badge className={`${
          status === 'todo' ? 'bg-slate-700/50 text-slate-300' :
          status === 'in_progress' ? 'bg-blue-900/20 text-blue-300' :
          'bg-emerald-900/20 text-emerald-300'
        }`}>{items.length}</Badge>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
        {items.length > 0 ? (
          items.map((task: any) => (
            <TaskCard
              key={task.id}
              task={task}
              status={status}
              onMove={handleMove}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">Empty</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListTodo className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          <Badge className="bg-slate-700/50 text-slate-300">{tasks.length} total</Badge>
        </div>
        <p className="text-xs text-slate-500">Hover a task to see move buttons</p>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Column
          title="To Do"
          icon={<Circle className="h-5 w-5 text-slate-400" />}
          items={todo}
          status="todo"
          borderClass="border-slate-700/50"
          headerClass="text-white"
          bgClass="bg-slate-800/50"
        />
        <Column
          title="In Progress"
          icon={<Clock className="h-5 w-5 text-blue-400" />}
          items={inProgress}
          status="in_progress"
          borderClass="border-blue-500/30"
          headerClass="text-blue-300"
          bgClass="bg-blue-900/10"
        />
        <Column
          title="Done"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
          items={done}
          status="done"
          borderClass="border-emerald-500/30"
          headerClass="text-emerald-300"
          bgClass="bg-emerald-900/10"
        />
      </div>
    </div>
  )
}
