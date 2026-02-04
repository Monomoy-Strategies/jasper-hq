'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Activity,
  Filter,
  Pin,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AgentActivity, ActivityFilterType } from '@/types'
import { activityIcons, categoryColors } from '@/types'
import { getAgentActivity } from '@/services/dashboardService'

interface ActivityFeedProps {
  limit?: number
  showFilter?: boolean
}

const filterOptions: { value: ActivityFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Email' },
  { value: 'code', label: 'Code' },
  { value: 'research', label: 'Research' },
  { value: 'file', label: 'Files' },
  { value: 'system', label: 'System' },
  { value: 'communication', label: 'Communication' },
]

export function ActivityFeed({ limit = 20, showFilter = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ActivityFilterType>('all')

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const activityData = await getAgentActivity(limit)
      setActivities(activityData)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true
    
    // Map filter types to activity characteristics
    switch (filter) {
      case 'email':
        return ['email_sent', 'email_drafted', 'email_processed'].includes(activity.activity_type)
      case 'code':
        return activity.activity_type === 'code_generated'
      case 'research':
        return ['research_completed', 'search_performed'].includes(activity.activity_type)
      case 'file':
        return ['file_created', 'file_updated'].includes(activity.activity_type)
      case 'system':
        return activity.category === 'system' || ['error_occurred', 'session_started', 'session_ended'].includes(activity.activity_type)
      case 'communication':
        return activity.category === 'communication' || activity.activity_type === 'message_sent'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <Card className="border border-slate-700/50 bg-slate-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="h-5 w-5 text-amber-400" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full bg-slate-700/30" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4 bg-slate-700/30" />
                  <Skeleton className="h-3 w-1/2 bg-slate-700/30" />
                </div>
              </div>
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
            <Activity className="h-5 w-5 text-amber-400" />
            Activity Feed
            <Badge className="bg-slate-700/50 text-slate-300">
              {filteredActivities.length}
            </Badge>
          </CardTitle>
          {showFilter && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as ActivityFilterType)}
                className="bg-slate-700/50 text-white text-sm rounded px-2 py-1 border border-slate-600/30"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No activities found</p>
              {filter !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilter('all')}
                  className="mt-2 text-slate-400 hover:text-white"
                >
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            filteredActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: AgentActivity }) {
  const icon = activityIcons[activity.activity_type] || '📌'
  
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-slate-700/20 transition-colors">
      <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center shrink-0 text-sm">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white line-clamp-2">{activity.title}</p>
            {activity.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activity.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {activity.is_pinned && (
              <Pin className="h-3 w-3 text-amber-400" />
            )}
            {activity.importance === 'high' || activity.importance === 'critical' && (
              <Badge className={`text-xs ${activity.importance === 'critical' ? 'bg-red-900/20 text-red-300' : 'bg-amber-900/20 text-amber-300'}`}>
                {activity.importance}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${categoryColors[activity.category]}`}>
              {activity.category}
            </Badge>
            {activity.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs border-slate-600/30 text-slate-300">
                {tag}
              </Badge>
            ))}
          </div>
          
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  )
}