'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Kanban,
  Plus,
  Clock,
  User,
  Bot,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AgentTask } from '@/types'
import { taskStatusColors, priorityColors } from '@/types'
import { getAgentTasks } from '@/services/dashboardService'

interface TasksPanelProps {
  limit?: number
}

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress', 
  done: 'Done',
  archive: 'Archive'
}

const assignedByIcons = {
  user: User,
  agent: Bot,
  system: Settings,
}

export function TasksPanel({ limit = 20 }: TasksPanelProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const taskData = await getAgentTasks()
      setTasks(taskData.slice(0, limit))
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, AgentTask[]>)

  if (loading) {
    return (
      <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Kanban className="h-5 w-5 text-amber-400" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 bg-slate-700/30" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Kanban className="h-5 w-5 text-amber-400" />
            Tasks
            <Badge className="bg-slate-700/50 text-slate-300">{tasks.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {Object.entries(statusLabels).map(([status, label]) => {
            const statusTasks = tasksByStatus[status] || []
            
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-300">{label}</h4>
                  <Badge className={`text-xs ${taskStatusColors[status as keyof typeof taskStatusColors]}`}>
                    {statusTasks.length}
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {statusTasks.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      No {label.toLowerCase()} tasks
                    </div>
                  ) : (
                    statusTasks.map(task => <TaskCard key={task.id} task={task} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskCard({ task }: { task: AgentTask }) {
  const AssignedByIcon = assignedByIcons[task.assigned_by]
  
  return (
    <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-sm font-medium text-white line-clamp-2">{task.title}</h5>
          <Badge className={`text-xs shrink-0 ${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
        </div>
        
        {task.notes && (
          <p className="text-xs text-slate-400 line-clamp-2">{task.notes}</p>
        )}
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <AssignedByIcon className="h-3 w-3" />
            <span>{task.assigned_by}</span>
          </div>
          
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
          </div>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map(tag => (
              <Badge 
                key={tag} 
                className="text-xs bg-slate-600/30 text-slate-300 hover:bg-slate-600/50"
              >
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge className="text-xs bg-slate-600/30 text-slate-300">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}