'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LiveStatusWidget } from '@/components/dashboard/LiveStatusWidget'
import { QuickNoteInput } from '@/components/dashboard/QuickNoteInput'
import { TasksPanel } from '@/components/dashboard/TasksPanel'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { AIBoardPanel } from '@/components/dashboard/AIBoardPanel'

interface DashboardData {
  status: any
  tasks: any[]
  activities: any[]
  documents: any[]
  projects: any[]
  calendar: { today: any[], week: any[] }
  ideas: any[]
  _meta?: any
  error?: string
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Row - Live Status + Quick Note + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <LiveStatusWidget 
              model={data?.status?.model || 'Claude Opus 4.5'}
              channel={data?.status?.channel || 'telegram'}
              currentTask={data?.status?.currentTask}
              status={data?.status?.status || 'working'}
            />
          </div>
          <div className="lg:col-span-3">
            <QuickNoteInput />
          </div>
          <div className="lg:col-span-6">
            <ActivityFeed activities={data?.activities || []} limit={10} />
          </div>
        </div>

        {/* Second Row - Tasks + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <TasksPanel tasks={data?.tasks || []} />
          </div>
          <div>
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-6 h-96 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📁</span>
                <h3 className="text-xl font-bold text-white">Projects Board</h3>
                <span className="text-sm text-slate-400 ml-auto">{data?.projects?.length || 0}</span>
              </div>
              {loading ? (
                <div className="text-slate-400 text-center mt-16">Loading...</div>
              ) : data?.projects?.length ? (
                <div className="space-y-3">
                  {data.projects.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{p.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-600/30 text-slate-300'}`}>
                          {p.status}
                        </span>
                      </div>
                      {p.description && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center mt-16">No projects found</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Board of Directors */}
        <AIBoardPanel documents={data?.documents || []} />

        {/* Third Row - Ideas + Docs + Calendar + System + Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Ideas */}
          <div>
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💡</span>
                <h4 className="font-semibold text-white">Ideas</h4>
                <span className="text-xs text-slate-400 ml-auto">{data?.ideas?.length || 0}</span>
              </div>
              {data?.ideas?.length ? (
                <div className="space-y-2">
                  {data.ideas.map((idea: any) => (
                    <div key={idea.id} className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                      <p className="text-sm text-white line-clamp-2">{idea.title}</p>
                      {idea.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {idea.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-amber-900/20 text-amber-300 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center mt-8 text-sm">No ideas yet</div>
              )}
            </div>
          </div>
          
          {/* Docs */}
          <div>
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📄</span>
                <h4 className="font-semibold text-white">Docs</h4>
                <span className="text-xs text-slate-400 ml-auto">{data?.documents?.length || 0}</span>
              </div>
              {data?.documents?.length ? (
                <div className="space-y-2">
                  {data.documents.map((doc: any) => (
                    <div key={doc.id} className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                      <p className="text-sm text-white line-clamp-1">{doc.title}</p>
                      <p className="text-[10px] text-slate-400">{doc.category}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center mt-8 text-sm">No documents</div>
              )}
            </div>
          </div>
          
          {/* Calendar */}
          <div>
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📅</span>
                <h4 className="font-semibold text-white">Today</h4>
                <span className="text-xs text-slate-400 ml-auto">{data?.calendar?.today?.length || 0}</span>
              </div>
              {data?.calendar?.today?.length ? (
                <div className="space-y-2">
                  {data.calendar.today.map((evt: any) => (
                    <div key={evt.id} className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                      <p className="text-sm text-white">{evt.title}</p>
                      <p className="text-[10px] text-blue-300">{formatTime(evt.start_time)} - {formatTime(evt.end_time)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center mt-8 text-sm">No events today</div>
              )}
            </div>
          </div>
          
          {/* System */}
          <div>
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h4 className="font-semibold text-white">System</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">API</span><span className="text-emerald-300">● Connected</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tasks</span><span className="text-white">{data?._meta?.counts?.tasks ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Projects</span><span className="text-white">{data?._meta?.counts?.projects ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Docs</span><span className="text-white">{data?._meta?.counts?.documents ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Activities</span><span className="text-white">{data?._meta?.counts?.activities ?? '—'}</span></div>
                {data?._meta?.fetchedAt && (
                  <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-500">
                    Last sync: {new Date(data._meta.fetchedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Workflows */}
          <div>
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚙️</span>
                <h4 className="font-semibold text-white">Workflows</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                  <p className="text-white text-xs">📰 Morning Briefing</p><p className="text-[10px] text-slate-400">5:00 AM EST daily</p>
                </div>
                <div className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                  <p className="text-white text-xs">📧 Email Triage (3x)</p><p className="text-[10px] text-slate-400">5AM / 12PM / 6PM</p>
                </div>
                <div className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                  <p className="text-white text-xs">💡 Ideas Generation</p><p className="text-[10px] text-slate-400">4:50 AM EST daily</p>
                </div>
                <div className="p-2 bg-slate-700/30 rounded border border-slate-600/20">
                  <p className="text-white text-xs">🔒 Security Review</p><p className="text-[10px] text-slate-400">M/W/F 8 AM EST</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
