'use client'

import { useState } from 'react'

interface BoardMember {
  seat: string
  name: string
  model: string
  focus: string
  emoji: string
  color: string
}

interface BoardSession {
  id: string
  title: string
  date: string
  verdict: string
  topic: string
}

const BOARD_MEMBERS: BoardMember[] = [
  { seat: 'CSO', name: 'Claude Opus 4.6', model: 'opus', focus: 'Strategy & Risk', emoji: '📡', color: 'purple' },
  { seat: 'COO', name: 'GPT-5.2 Codex', model: 'codex', focus: 'Execution & Ops', emoji: '⚙️', color: 'blue' },
  { seat: 'CRO', name: 'Grok 3', model: 'grok', focus: 'Research & Data', emoji: '🔬', color: 'orange' },
  { seat: 'CPO', name: 'Gemini 3 Pro', model: 'gemini', focus: 'Product & UX', emoji: '🎨', color: 'emerald' },
]

const BOARD_PROCESS = [
  { round: 1, name: 'Deep Thinking', desc: 'Independent Response Memos' },
  { round: 2, name: 'Cross-Examination', desc: 'Challenge & debate each other' },
  { round: 3, name: 'Consensus', desc: 'Final positions & synthesis' },
]

interface AIBoardPanelProps {
  documents?: any[]
}

export function AIBoardPanel({ documents = [] }: AIBoardPanelProps) {
  const [showProcess, setShowProcess] = useState(false)
  
  // Filter board-related documents
  const boardDocs = documents.filter((d: any) => d.category === 'ai-board')
  const sessions = boardDocs.filter((d: any) => d.tags?.includes('session'))
  const config = boardDocs.find((d: any) => d.tags?.includes('config'))

  const colorMap: Record<string, string> = {
    purple: 'border-purple-500/40 bg-purple-900/20 text-purple-300',
    blue: 'border-blue-500/40 bg-blue-900/20 text-blue-300',
    orange: 'border-orange-500/40 bg-orange-900/20 text-orange-300',
    emerald: 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300',
  }

  return (
    <div className="border border-purple-500/30 bg-gradient-to-br from-slate-800/80 via-purple-900/10 to-slate-800/80 backdrop-blur rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h3 className="text-xl font-bold text-white">AI Board of Directors</h3>
            <p className="text-xs text-slate-400">Chaired by Jasper 🦞 • 3-Round Debate Cycle</p>
          </div>
        </div>
        <button 
          onClick={() => setShowProcess(!showProcess)}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/30 text-purple-300 border border-purple-500/30 hover:bg-purple-900/50 transition"
        >
          {showProcess ? 'Hide Process' : 'View Process'}
        </button>
      </div>

      {/* Process Accordion */}
      {showProcess && (
        <div className="mb-5 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
          <h4 className="text-sm font-semibold text-purple-300 mb-3">3-Round Debate Cycle</h4>
          <div className="flex gap-3">
            {BOARD_PROCESS.map((p) => (
              <div key={p.round} className="flex-1 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-purple-400">R{p.round}</span>
                  <span className="text-sm font-medium text-white">{p.name}</span>
                </div>
                <p className="text-[11px] text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Board Members Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {BOARD_MEMBERS.map((m) => (
          <div key={m.seat} className={`p-3 rounded-lg border ${colorMap[m.color]}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{m.emoji}</span>
              <span className="text-xs font-bold">{m.seat}</span>
            </div>
            <p className="text-sm font-medium text-white">{m.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.focus}</p>
          </div>
        ))}
      </div>

      {/* Local Models / Interns */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 p-2 rounded border border-slate-700/30 bg-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-xs">🏠</span>
            <span className="text-[11px] text-slate-300">Llama 3.3 70B</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">Local • Senior Intern</span>
          </div>
        </div>
        <div className="flex-1 p-2 rounded border border-slate-700/30 bg-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-xs">🏠</span>
            <span className="text-[11px] text-slate-300">Llama 3.1 8B</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">Local • Junior Intern</span>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>📋</span> Board Sessions
          <span className="text-xs text-slate-500 ml-auto">{sessions.length} total</span>
        </h4>
        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((s: any) => {
              let sessionData: any = {}
              try { sessionData = JSON.parse(s.content) } catch {}
              return (
                <div key={s.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{s.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-500/20">
                      {sessionData.verdict || 'Completed'}
                    </span>
                  </div>
                  {sessionData.key_insights && (
                    <div className="mt-2 space-y-1">
                      {sessionData.key_insights.slice(0, 3).map((insight: string, i: number) => (
                        <p key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{insight}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2">{sessionData.date || s.created_at?.split('T')[0]}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-4 bg-slate-700/20 rounded-lg text-center">
            <p className="text-sm text-slate-400">No board sessions yet</p>
            <p className="text-[11px] text-slate-500 mt-1">Tell Jasper "Call a board meeting on [topic]"</p>
          </div>
        )}
      </div>
    </div>
  )
}
