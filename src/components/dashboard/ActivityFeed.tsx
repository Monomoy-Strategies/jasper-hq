'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Filter, Pin } from 'lucide-react'

interface ActivityFeedProps {
  activities?: any[]
  limit?: number
  showFilter?: boolean
}

export function ActivityFeed({ activities = [], limit = 20, showFilter = true }: ActivityFeedProps) {
  const [filter, setFilter] = useState('all')

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true
    return a.activity_type === filter || a.category === filter
  }).slice(0, limit)

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch { return '' }
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
                onChange={(e) => setFilter(e.target.value)}
                className="bg-slate-700/50 text-white text-sm rounded px-2 py-1 border border-slate-600/30"
              >
                <option value="all">All</option>
                <option value="deliverable">Deliverables</option>
                <option value="system">System</option>
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
            </div>
          ) : (
            filteredActivities.map((activity: any) => (
              <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-700/20 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center shrink-0 text-sm">
                  {activity.activity_type === 'deliverable' ? '📦' : activity.activity_type === 'system' ? '⚡' : '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white line-clamp-2">{activity.title}</p>
                    {activity.is_pinned && <Pin className="h-3 w-3 text-amber-400 shrink-0" />}
                  </div>
                  {activity.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{activity.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <Badge className="text-xs bg-slate-700/50 text-slate-300">{activity.activity_type || 'activity'}</Badge>
                    <span className="text-xs text-slate-400">{formatTime(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
