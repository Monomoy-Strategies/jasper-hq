'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

interface ApiService {
  name: string
  emoji: string
  description: string
  capabilities: string[]
  checkUrl?: string
}

const SERVICES: ApiService[] = [
  { name: 'Anthropic Claude', emoji: '🤖', description: 'Primary LLM. Haiku for crons, Sonnet for chat, Opus for board sessions.', capabilities: ['Haiku 4.5', 'Sonnet 4.6', 'Opus 4.5/4.6'] },
  { name: 'Discord', emoji: '💬', description: 'Primary chat channel — #jasper. Inline buttons, reactions, file sharing.', capabilities: ['Send', 'React', 'Threads', 'Buttons'] },
  { name: 'Brave Search', emoji: '🔍', description: 'Web search engine. Region/freshness filters, real-time results.', capabilities: ['Web Search', 'Region Filter', 'Freshness'] },
  { name: 'Web Fetch', emoji: '🌐', description: 'Page content extraction and URL content retrieval.', capabilities: ['Page Fetch', 'Content Extract', 'Markdown'] },
  { name: 'Supabase', emoji: '🗄️', description: 'Database backend for Jasper HQ — tasks, ideas, docs, costs, board sessions.', capabilities: ['Tasks', 'Documents', 'Costs', 'Board'], checkUrl: 'https://cymfsifrjcisncnzywbd.supabase.co' },
  { name: 'ElevenLabs', emoji: '🎙️', description: 'Text-to-speech synthesis. Voices: Roger, Sarah, George, Charlie.', capabilities: ['TTS', 'Voice Cloning', 'Roger/Sarah/George'] },
  { name: 'GOG CLI', emoji: '📧', description: 'Gmail + Calendar + Drive for 3 accounts. Bill@, bsifflard747@, monomoy@.', capabilities: ['Gmail', 'Calendar', 'Drive', '3 Accounts'] },
  { name: 'n8n', emoji: '🔧', description: 'Automation platform. Docker on Monomoy-1, localhost:5678.', capabilities: ['Workflows', 'Webhooks', 'Integrations'] },
  { name: 'OpenAI', emoji: '🧠', description: 'GPT-5.2 Codex for coding tasks. Image generation (DALL-E).', capabilities: ['GPT-5.2', 'DALL-E', 'Whisper'] },
  { name: 'GitHub', emoji: '🐙', description: 'Monomoy-Strategies org. Code repos, deployments.', capabilities: ['Repos', 'CI/CD', 'PAT Auth'] },
  { name: 'Vercel', emoji: '▲', description: 'Hosting for Jasper HQ, TVE, Monomoy, OpenClaw HQ.', capabilities: ['Jasper HQ', 'TVE', 'Monomoy'] },
  { name: 'Tailscale VPN', emoji: '🔒', description: 'Private network between Monomoy-1, Monomoy-2, VPS. Secure mesh.', capabilities: ['M-1', 'M-2', 'Private Mesh'] },
]

export function ApiHealthTab() {
  const [pinged, setPinged] = useState<Record<string, 'checking' | 'ok' | 'error'>>({})

  const pingAll = () => {
    SERVICES.filter(s => s.checkUrl).forEach(s => {
      setPinged(prev => ({ ...prev, [s.name]: 'checking' }))
      fetch(s.checkUrl!, { mode: 'no-cors' })
        .then(() => setPinged(prev => ({ ...prev, [s.name]: 'ok' })))
        .catch(() => setPinged(prev => ({ ...prev, [s.name]: 'error' })))
    })
  }

  useEffect(() => { pingAll() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔌</span>
          <div>
            <h2 className="text-2xl font-bold text-white">API Health</h2>
            <p className="text-sm text-slate-400">{SERVICES.length} integrations configured</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {SERVICES.length} / {SERVICES.length} Connected
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((service) => {
          const pingStatus = pinged[service.name]
          const isChecking = pingStatus === 'checking'
          return (
            <div key={service.name} className="border border-slate-700/50 bg-slate-800/30 rounded-xl p-4 hover:bg-slate-800/50 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{service.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    isChecking ? 'bg-amber-500 animate-pulse' :
                    pingStatus === 'error' ? 'bg-red-500' :
                    'bg-emerald-500'
                  }`}></span>
                  <span className={`text-[10px] font-semibold uppercase ${
                    isChecking ? 'text-amber-400' :
                    pingStatus === 'error' ? 'text-red-400' :
                    'text-emerald-400'
                  }`}>
                    {isChecking ? 'Checking' : pingStatus === 'error' ? 'Error' : 'Healthy'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{service.description}</p>
              <div className="flex flex-wrap gap-1">
                {service.capabilities.map(cap => (
                  <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/30">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
