'use client'

import { Badge } from '@/components/ui/badge'
import { TrendingUp, Calendar, BarChart3, Lightbulb, ExternalLink } from 'lucide-react'

// Mock data - replace with real Supabase data when tables exist
const MOCK_CAMPAIGNS = [
  { id: 1, name: 'OpenClaw Launch', status: 'active', platform: 'Product Hunt', startDate: '2026-02-20', budget: '$500', reach: '10K+' },
  { id: 2, name: 'Jasper Demo Videos', status: 'planning', platform: 'YouTube', startDate: '2026-03-01', budget: '$200', reach: '5K' },
  { id: 3, name: 'AI Board Feature', status: 'active', platform: 'Twitter/X', startDate: '2026-02-15', budget: '$0', reach: '2K' },
]

const MOCK_CONTENT_CALENDAR = [
  { id: 1, title: 'Launch Post - Product Hunt', date: '2026-02-20', platform: 'Product Hunt', type: 'launch' },
  { id: 2, title: 'Thread: How AI Board Works', date: '2026-02-22', platform: 'Twitter/X', type: 'thread' },
  { id: 3, title: 'Demo Video: Dashboard Tour', date: '2026-02-25', platform: 'YouTube', type: 'video' },
  { id: 4, title: 'Reddit AMA - r/SideProject', date: '2026-03-01', platform: 'Reddit', type: 'engagement' },
  { id: 5, title: 'Blog: Building with OpenClaw', date: '2026-03-05', platform: 'Blog', type: 'article' },
]

const MOCK_CHANNELS = [
  { name: 'Reddit', icon: '🔴', followers: '—', growth: '+—', status: 'pending' },
  { name: 'Twitter/X', icon: '𝕏', followers: '156', growth: '+23', status: 'active' },
  { name: 'Product Hunt', icon: '🚀', followers: '—', growth: '+—', status: 'launching' },
  { name: 'YouTube', icon: '📺', followers: '12', growth: '+5', status: 'growing' },
  { name: 'SEO', icon: '🔍', followers: '—', growth: '—', status: 'tracking' },
]

const MOCK_IDEAS = [
  { id: 1, title: 'Weekly AI Agent Updates newsletter', priority: 'high', status: 'backlog' },
  { id: 2, title: 'Developer documentation site', priority: 'medium', status: 'in-progress' },
  { id: 3, title: 'Affiliate program for OpenClaw', priority: 'low', status: 'backlog' },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'active': case 'growing': return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
    case 'planning': case 'pending': return 'bg-amber-900/30 text-amber-300 border-amber-500/30'
    case 'launching': return 'bg-purple-900/30 text-purple-300 border-purple-500/30'
    case 'tracking': return 'bg-blue-900/30 text-blue-300 border-blue-500/30'
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

export function MarketingTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Marketing</h2>
            <p className="text-sm text-slate-400">Monomoy Strategies</p>
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="border border-emerald-500/30 bg-gradient-to-br from-slate-800/80 to-emerald-900/10 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-emerald-300 mb-4 flex items-center gap-2">
          <span>🎯</span> Active Campaigns
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Campaign</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Platform</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Start Date</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Budget</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Reach</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-3 px-3 text-white font-medium">{campaign.name}</td>
                  <td className="py-3 px-3 text-slate-300">{campaign.platform}</td>
                  <td className="py-3 px-3">
                    <Badge className={`border ${getStatusColor(campaign.status)}`}>{campaign.status}</Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{campaign.startDate}</td>
                  <td className="py-3 px-3 text-emerald-300">{campaign.budget}</td>
                  <td className="py-3 px-3 text-blue-300">{campaign.reach}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Calendar */}
        <div className="border border-blue-500/30 bg-slate-800/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Content Calendar
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {MOCK_CONTENT_CALENDAR.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{item.date}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{item.platform}</span>
                  </div>
                </div>
                <Badge className="text-xs bg-slate-700/50 text-slate-300">{item.type}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Performance */}
        <div className="border border-purple-500/30 bg-slate-800/50 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Channel Performance
          </h3>
          <div className="space-y-3">
            {MOCK_CHANNELS.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{channel.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{channel.name}</p>
                    <p className="text-xs text-slate-400">Followers: {channel.followers}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`border ${getStatusColor(channel.status)}`}>{channel.status}</Badge>
                  {channel.growth !== '—' && (
                    <p className="text-xs text-emerald-400 mt-1">{channel.growth} this week</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketing Ideas Pipeline */}
      <div className="border border-amber-500/30 bg-slate-800/50 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" /> Marketing Ideas Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_IDEAS.map((idea) => (
            <div key={idea.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/20">
              <p className="text-sm font-medium text-white mb-2">{idea.title}</p>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs border ${getPriorityColor(idea.priority)}`}>{idea.priority}</Badge>
                <Badge className={`text-xs border ${getStatusColor(idea.status === 'in-progress' ? 'active' : 'pending')}`}>{idea.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
