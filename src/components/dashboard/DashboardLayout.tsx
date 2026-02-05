'use client'

import { ReactNode, createContext, useContext } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DashboardData {
  status: any
  tasks: any[]
  activities: any[]
  documents: any[]
  projects: any[]
  calendar: any[]
  ideas: any[]
  _meta?: any
}

interface DashboardLayoutProps {
  children: ReactNode
  data?: DashboardData
  status?: 'idle' | 'working' | 'thinking'
}

const DashboardContext = createContext<DashboardData | null>(null)

export function useDashboardData() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardData must be used within DashboardLayout')
  }
  return context
}

export function DashboardLayout({ children, data, status = 'working' }: DashboardLayoutProps) {
  const statusConfig = {
    idle: { label: 'Idle', class: 'bg-amber-900/20 text-amber-300 border-amber-500/30' },
    working: { label: 'Working', class: 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30' },
    thinking: { label: 'Thinking', class: 'bg-purple-900/20 text-purple-300 border-purple-500/30' }
  }
  
  const currentStatus = statusConfig[data?.status?.status || status] || statusConfig.working

  return (
    <DashboardContext.Provider value={data || { status: {}, tasks: [], activities: [], documents: [], projects: [], calendar: [], ideas: [] }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🦞</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">Jasper HQ</h1>
                  <p className="text-sm text-slate-400">Command Center</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline" 
                  className={currentStatus.class}
                >
                  Status: {currentStatus.label}
                </Badge>
                <Avatar>
                  <AvatarFallback className="bg-slate-700 text-white">
                    B
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  )
}