'use client'

import { LiveStatusWidget } from '@/components/dashboard/LiveStatusWidget'
import { QuickNoteInput } from '@/components/dashboard/QuickNoteInput'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

interface DashboardTabProps {
  data: {
    status?: any
    activities?: any[]
    _meta?: any
  }
}

export function DashboardTab({ data }: DashboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Row - Live Status + Quick Note + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <LiveStatusWidget 
            model={data?.status?.model || 'Claude Opus 4.6'}
            channel={data?.status?.channel || 'discord'}
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

      {/* Stats Row - System + Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Stats */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4">
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

        {/* Workflows */}
        <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4">
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
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="border border-emerald-500/30 bg-emerald-900/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <h4 className="font-semibold text-emerald-300">Today</h4>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">{data?._meta?.counts?.activities || 0}</div>
            <div className="text-sm text-slate-400">Activities logged</div>
          </div>
        </div>

        <div className="border border-amber-500/30 bg-amber-900/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <h4 className="font-semibold text-amber-300">Active</h4>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">{data?._meta?.counts?.tasks || 0}</div>
            <div className="text-sm text-slate-400">Tasks in pipeline</div>
          </div>
        </div>
      </div>
    </div>
  )
}
