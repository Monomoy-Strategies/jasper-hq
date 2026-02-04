'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LiveStatusWidget } from '@/components/dashboard/LiveStatusWidget'
import { QuickNoteInput } from '@/components/dashboard/QuickNoteInput'
import { TasksPanel } from '@/components/dashboard/TasksPanel'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Row - Live Status + Quick Note + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <LiveStatusWidget />
          </div>
          <div className="lg:col-span-3">
            <QuickNoteInput />
          </div>
          <div className="lg:col-span-6">
            <ActivityFeed limit={10} />
          </div>
        </div>

        {/* Second Row - Tasks + Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <TasksPanel />
          </div>
          <div>
            {/* Projects Board - placeholder for now */}
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-6 h-96">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📁</span>
                <h3 className="text-xl font-bold text-white">Projects Board</h3>
              </div>
              <div className="text-slate-400 text-center mt-16">
                Projects component coming soon...
              </div>
            </div>
          </div>
        </div>

        {/* Third Row - Ideas + Docs + Calendar + System Health + Scheduled Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div>
            {/* Ideas Pipeline */}
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💡</span>
                <h4 className="font-semibold text-white">Ideas</h4>
              </div>
              <div className="text-slate-400 text-center mt-8 text-sm">
                Ideas Pipeline
                <br />
                coming soon...
              </div>
            </div>
          </div>
          
          <div>
            {/* Documents Hub */}
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📄</span>
                <h4 className="font-semibold text-white">Docs</h4>
              </div>
              <div className="text-slate-400 text-center mt-8 text-sm">
                Documents Hub
                <br />
                coming soon...
              </div>
            </div>
          </div>
          
          <div>
            {/* Calendar */}
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📅</span>
                <h4 className="font-semibold text-white">Calendar</h4>
              </div>
              <div className="text-slate-400 text-center mt-8 text-sm">
                Today's Calendar
                <br />
                coming soon...
              </div>
            </div>
          </div>
          
          <div>
            {/* System Health */}
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚡</span>
                <h4 className="font-semibold text-white">System</h4>
              </div>
              <div className="text-slate-400 text-center mt-8 text-sm">
                System Health
                <br />
                coming soon...
              </div>
            </div>
          </div>
          
          <div>
            {/* Scheduled Workflows */}
            <div className="border border-slate-700/50 bg-slate-800/50 backdrop-blur rounded-lg p-4 h-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚙️</span>
                <h4 className="font-semibold text-white">Workflows</h4>
              </div>
              <div className="text-slate-400 text-center mt-8 text-sm">
                Scheduled
                <br />
                Workflows
                <br />
                coming soon...
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}