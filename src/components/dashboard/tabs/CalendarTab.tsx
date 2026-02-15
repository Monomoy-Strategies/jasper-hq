'use client'

import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin } from 'lucide-react'

interface CalendarTabProps {
  calendar?: {
    today?: any[]
    week?: any[]
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      timeZone: 'America/New_York' 
    })
  } catch {
    return ''
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      timeZone: 'America/New_York' 
    })
  } catch {
    return ''
  }
}

function getEventColor(title: string) {
  const lowerTitle = title.toLowerCase()
  if (lowerTitle.includes('meeting') || lowerTitle.includes('call')) {
    return 'border-blue-500/40 bg-blue-900/20'
  }
  if (lowerTitle.includes('deadline') || lowerTitle.includes('due')) {
    return 'border-red-500/40 bg-red-900/20'
  }
  if (lowerTitle.includes('review') || lowerTitle.includes('sync')) {
    return 'border-purple-500/40 bg-purple-900/20'
  }
  if (lowerTitle.includes('lunch') || lowerTitle.includes('break')) {
    return 'border-amber-500/40 bg-amber-900/20'
  }
  return 'border-slate-700/50 bg-slate-800/50'
}

export function CalendarTab({ calendar }: CalendarTabProps) {
  const todayEvents = calendar?.today || []
  const weekEvents = calendar?.week || []

  // Group week events by date
  const groupedWeek: Record<string, any[]> = {}
  weekEvents.forEach((event: any) => {
    const dateKey = formatDate(event.start_time)
    if (!groupedWeek[dateKey]) {
      groupedWeek[dateKey] = []
    }
    groupedWeek[dateKey].push(event)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Calendar</h2>
            <p className="text-sm text-slate-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                timeZone: 'America/New_York'
              })}
            </p>
          </div>
        </div>
        <Badge className="bg-blue-900/30 text-blue-300 border-blue-500/30">
          {todayEvents.length} events today
        </Badge>
      </div>

      {/* Today's Events - Featured */}
      <div className="border-2 border-blue-500/40 bg-gradient-to-br from-slate-800/80 to-blue-900/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
          <span className="text-2xl">📅</span> Today
        </h3>
        {todayEvents.length > 0 ? (
          <div className="space-y-3">
            {todayEvents.map((event: any) => (
              <div 
                key={event.id} 
                className={`p-4 rounded-lg border ${getEventColor(event.title)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-white">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-blue-300">
                        <Clock className="h-4 w-4" />
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {event.is_all_day && (
                    <Badge className="bg-amber-900/30 text-amber-300 border-amber-500/30">
                      All Day
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No events scheduled for today</p>
            <p className="text-sm text-slate-500 mt-1">Enjoy your free day! 🎉</p>
          </div>
        )}
      </div>

      {/* Upcoming Week */}
      <div className="border border-slate-700/50 bg-slate-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="text-xl">📆</span> Upcoming Week
        </h3>
        {Object.keys(groupedWeek).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedWeek).map(([dateKey, events]) => (
              <div key={dateKey}>
                <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  {dateKey}
                  <Badge className="bg-slate-700/50 text-slate-400 text-xs">{events.length}</Badge>
                </h4>
                <div className="space-y-2 pl-4 border-l-2 border-slate-700/50">
                  {events.map((event: any) => (
                    <div 
                      key={event.id} 
                      className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/20 hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <span className="text-xs text-blue-300">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>
                        {event.location && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">No upcoming events this week</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-blue-500/30 bg-blue-900/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-300">{todayEvents.length}</div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
        <div className="border border-purple-500/30 bg-purple-900/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">{weekEvents.length}</div>
          <div className="text-xs text-slate-400">This Week</div>
        </div>
        <div className="border border-emerald-500/30 bg-emerald-900/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-300">
            {weekEvents.filter((e: any) => e.title?.toLowerCase().includes('meeting')).length}
          </div>
          <div className="text-xs text-slate-400">Meetings</div>
        </div>
        <div className="border border-amber-500/30 bg-amber-900/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">
            {weekEvents.filter((e: any) => e.is_all_day).length}
          </div>
          <div className="text-xs text-slate-400">All Day Events</div>
        </div>
      </div>
    </div>
  )
}
