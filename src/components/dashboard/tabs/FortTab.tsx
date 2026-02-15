'use client'

import { Badge } from '@/components/ui/badge'
import { Building2, DollarSign, Calendar, Megaphone, Users } from 'lucide-react'

// Mock data - replace with real data when available
const TENANTS = [
  { id: 1, name: 'Smoothie Bar', status: 'active', rent: '$1,200/mo', contact: 'Sarah M.', icon: '🥤' },
  { id: 2, name: 'FortNH.com', status: 'active', rent: 'Internal', contact: 'Bill S.', icon: '🌐' },
  { id: 3, name: 'Performance Therapy', status: 'active', rent: '$2,500/mo', contact: 'Dr. Mike', icon: '💆' },
]

const FORT_PROJECTS = [
  { id: 1, name: 'Website Redesign', status: 'in-progress', priority: 'high', dueDate: '2026-03-15' },
  { id: 2, name: 'Spring Marketing Campaign', status: 'planning', priority: 'medium', dueDate: '2026-03-01' },
  { id: 3, name: 'Equipment Upgrade', status: 'pending', priority: 'low', dueDate: '2026-04-01' },
  { id: 4, name: 'Member App Development', status: 'backlog', priority: 'medium', dueDate: '2026-06-01' },
]

const BUDGET_ITEMS = [
  { category: 'Marketing', allocated: 5000, spent: 1200, remaining: 3800 },
  { category: 'Equipment', allocated: 15000, spent: 8500, remaining: 6500 },
  { category: 'Maintenance', allocated: 3000, spent: 1800, remaining: 1200 },
  { category: 'Events', allocated: 2000, spent: 500, remaining: 1500 },
]

const MARKETING_ACTIVITIES = [
  { id: 1, title: 'Instagram Posts', frequency: 'Daily', status: 'active', platform: '📸' },
  { id: 2, title: 'Email Newsletter', frequency: 'Weekly', status: 'active', platform: '📧' },
  { id: 3, title: 'Local Radio Spot', frequency: 'Monthly', status: 'paused', platform: '📻' },
  { id: 4, title: 'Google Ads', frequency: 'Ongoing', status: 'active', platform: '🔍' },
]

const KEY_DATES = [
  { date: '2026-03-01', event: 'Price Increase', type: 'important', description: 'Membership rates go up 10%' },
  { date: '2026-03-15', event: 'Spring Promo Launch', type: 'campaign', description: '30-day trial campaign' },
  { date: '2026-04-01', event: 'Q2 Budget Review', type: 'internal', description: 'Review quarterly performance' },
  { date: '2026-05-01', event: 'Summer Hours Begin', type: 'operational', description: 'Extended hours for summer' },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active': case 'in-progress': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
    case 'planning': case 'pending': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'paused': case 'backlog': return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
    default: return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high': return 'bg-red-900/30 text-red-300 border-red-500/30'
    case 'medium': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'low': return 'bg-blue-900/30 text-blue-300 border-blue-500/30'
    default: return 'bg-slate-700/30 text-slate-400 border-slate-600/30'
  }
}

function getDateTypeColor(type: string) {
  switch (type) {
    case 'important': return 'border-red-500/30 bg-red-900/10'
    case 'campaign': return 'border-emerald-500/30 bg-emerald-900/10'
    case 'internal': return 'border-blue-500/30 bg-blue-900/10'
    case 'operational': return 'border-amber-500/30 bg-amber-900/10'
    default: return 'border-slate-700/50 bg-slate-800/50'
  }
}

export function FortTab() {
  const totalAllocated = BUDGET_ITEMS.reduce((acc, b) => acc + b.allocated, 0)
  const totalSpent = BUDGET_ITEMS.reduce((acc, b) => acc + b.spent, 0)
  const totalRemaining = BUDGET_ITEMS.reduce((acc, b) => acc + b.remaining, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💪</span>
          <div>
            <h2 className="text-2xl font-bold text-white">The Fort</h2>
            <p className="text-sm text-slate-400">Fortitude Health & Training</p>
          </div>
        </div>
      </div>

      {/* Tenants Overview */}
      <div className="border border-blue-500/30 bg-gradient-to-br from-slate-800/80 to-blue-900/10 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" /> Tenants
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TENANTS.map((tenant) => (
            <div key={tenant.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{tenant.icon}</span>
                <div>
                  <h4 className="font-semibold text-white">{tenant.name}</h4>
                  <Badge className={`border ${getStatusColor(tenant.status)}`}>{tenant.status}</Badge>
                </div>
              </div>
              <div className="text-sm space-y-1 mt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Rent:</span>
                  <span className="text-emerald-300">{tenant.rent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact:</span>
                  <span className="text-white">{tenant.contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Fort Projects */}
        <div className="border border-purple-500/30 bg-slate-800/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Active Projects
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {FORT_PROJECTS.map((project) => (
              <div key={project.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-white">{project.name}</p>
                  <Badge className={`text-xs border ${getStatusColor(project.status)}`}>{project.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <Badge className={`border ${getPriorityColor(project.priority)}`}>{project.priority}</Badge>
                  <span className="text-slate-400">Due: {project.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Tracker */}
        <div className="border border-emerald-500/30 bg-slate-800/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Budget Tracker
          </h3>
          <div className="space-y-3 mb-4">
            {BUDGET_ITEMS.map((item) => {
              const percentSpent = Math.round((item.spent / item.allocated) * 100)
              return (
                <div key={item.category} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{item.category}</span>
                    <span className="text-xs text-slate-400">{percentSpent}% used</span>
                  </div>
                  <div className="h-2 bg-slate-600/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${percentSpent > 75 ? 'bg-red-500' : percentSpent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${percentSpent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-slate-400">Spent: ${item.spent.toLocaleString()}</span>
                    <span className="text-emerald-400">Remaining: ${item.remaining.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-3 border-t border-slate-700/50 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Total Budget:</span>
              <span className="font-semibold">${totalAllocated.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-400 mt-1">
              <span>Remaining:</span>
              <span className="font-semibold">${totalRemaining.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketing Activities */}
        <div className="border border-amber-500/30 bg-slate-800/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Marketing Activities
          </h3>
          <div className="space-y-3">
            {MARKETING_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{activity.platform}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-slate-400">{activity.frequency}</p>
                  </div>
                </div>
                <Badge className={`border ${getStatusColor(activity.status)}`}>{activity.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Key Dates */}
        <div className="border border-red-500/30 bg-slate-800/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Key Dates
          </h3>
          <div className="space-y-3">
            {KEY_DATES.map((item) => (
              <div key={item.date} className={`p-3 rounded-lg border ${getDateTypeColor(item.type)}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">{item.event}</p>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
