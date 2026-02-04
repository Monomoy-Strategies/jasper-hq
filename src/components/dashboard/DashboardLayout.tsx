'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
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
                className="bg-emerald-900/20 text-emerald-300 border-emerald-500/30"
              >
                Status: Working
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
  )
}