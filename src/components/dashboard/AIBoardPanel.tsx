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

interface SessionMember {
  seat: string
  name: string
  focus?: string
  status: string
  theories: string[]
  recommendations: string[]
}

interface BoardSession {
  id: string
  title: string
  content: string
  created_at: string
  metadata?: {
    session_date?: string
    status?: string
    member_count?: number
    action_items_count?: number
  }
  tags?: string[]
}

interface ParsedSession {
  topic: string
  status: string
  called_by: string
  attendees: { seat: string; name: string }[]
  members: SessionMember[]
  key_insights: string[]
  action_items: { text: string; completed: boolean }[]
  synthesis: string
  date: string
  file_path: string
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

function parseSessionContent(content: string): ParsedSession | null {
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-500/30', label: '🔴 LIVE' }
    case 'in_progress':
      return { bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-500/30', label: 'In Progress' }
    case 'completed':
      return { bg: 'bg-emerald-900/30', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Completed' }
    default:
      return { bg: 'bg-slate-700/30', text: 'text-slate-300', border: 'border-slate-500/30', label: status }
  }
}

function getMemberStatusIcon(status: string) {
  switch (status) {
    case 'thinking':
      return '🤔'
    case 'researching':
      return '🔍'
    case 'completed':
      return '✅'
    case 'ruled_out':
      return '❌'
    case 'possible':
      return '⚠️'
    default:
      return '⏳'
  }
}

export function AIBoardPanel({ documents = [] }: AIBoardPanelProps) {
  const [showProcess, setShowProcess] = useState(false)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  
  // Filter board-related documents (board sessions have category 'ai-board' and tag 'board-session')
  const boardSessions = documents
    .filter((d: any) => d.category === 'ai-board' && d.tags?.includes('board-session'))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const colorMap: Record<string, string> = {
    purple: 'border-purple-500/40 bg-purple-900/20 text-purple-300',
    blue: 'border-blue-500/40 bg-blue-900/20 text-blue-300',
    orange: 'border-orange-500/40 bg-orange-900/20 text-orange-300',
    emerald: 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300',
  }

  const seatColorMap: Record<string, string> = {
    CSO: 'purple',
    COO: 'blue',
    CRO: 'orange',
    CPO: 'emerald',
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

      {/* Board Sessions */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>📋</span> Board Sessions
          <span className="text-xs text-slate-500 ml-auto">{boardSessions.length} total</span>
        </h4>
        
        {boardSessions.length > 0 ? (
          <div className="space-y-3">
            {boardSessions.map((session: BoardSession) => {
              const parsed = parseSessionContent(session.content)
              const isExpanded = expandedSession === session.id
              const status = parsed?.status || session.metadata?.status || 'completed'
              const statusBadge = getStatusBadge(status)
              
              return (
                <div 
                  key={session.id} 
                  className="bg-slate-700/30 rounded-lg border border-slate-600/20 overflow-hidden"
                >
                  {/* Session Header */}
                  <button
                    onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    className="w-full p-3 text-left hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{session.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    {parsed?.topic && (
                      <p className="text-[11px] text-slate-400 mb-2">{parsed.topic}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span>📅 {parsed?.date || session.metadata?.session_date || session.created_at?.split('T')[0]}</span>
                      {parsed?.called_by && <span>👤 {parsed.called_by}</span>}
                      {session.metadata?.member_count && (
                        <span>👥 {session.metadata.member_count} members</span>
                      )}
                      <span className="ml-auto">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && parsed && (
                    <div className="border-t border-slate-600/20 p-4 space-y-4">
                      {/* Member Memos */}
                      {parsed.members && parsed.members.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-purple-300 mb-2">Board Member Memos</h5>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            {parsed.members.map((member, idx) => {
                              const color = seatColorMap[member.seat] || 'slate'
                              return (
                                <div 
                                  key={idx}
                                  className={`p-3 rounded-lg border ${colorMap[color] || 'border-slate-500/30 bg-slate-800/30'}`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold">{member.seat}</span>
                                    <span className="text-[10px] text-slate-400">{member.name}</span>
                                    <span className="ml-auto">{getMemberStatusIcon(member.status)}</span>
                                  </div>
                                  
                                  {member.theories && member.theories.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-[10px] text-slate-500 mb-1">Theories:</p>
                                      {member.theories.slice(0, 2).map((t, i) => (
                                        <p key={i} className="text-[11px] text-slate-300 pl-2 border-l-2 border-slate-600 mb-1">
                                          {t.substring(0, 100)}{t.length > 100 ? '...' : ''}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {member.recommendations && member.recommendations.length > 0 && (
                                    <div>
                                      <p className="text-[10px] text-slate-500 mb-1">Recommendation:</p>
                                      <p className="text-[11px] text-emerald-300">
                                        {member.recommendations[0]?.substring(0, 100)}
                                        {(member.recommendations[0]?.length || 0) > 100 ? '...' : ''}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Key Insights */}
                      {parsed.key_insights && parsed.key_insights.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-amber-300 mb-2">🔑 Key Insights</h5>
                          <div className="space-y-1">
                            {parsed.key_insights.map((insight, i) => (
                              <p key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                <span className="text-amber-400 mt-0.5">•</span>
                                <span>{insight}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {parsed.action_items && parsed.action_items.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-blue-300 mb-2">📋 Action Items</h5>
                          <div className="space-y-1">
                            {parsed.action_items.map((item, i) => (
                              <p key={i} className={`text-[11px] flex items-start gap-1.5 ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                <span className={item.completed ? 'text-emerald-400' : 'text-slate-500'}>
                                  {item.completed ? '✓' : '○'}
                                </span>
                                <span>{item.text}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Synthesis Preview */}
                      {parsed.synthesis && (
                        <div>
                          <h5 className="text-xs font-semibold text-purple-300 mb-2">📊 CSO Synthesis</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {parsed.synthesis.substring(0, 300)}
                            {parsed.synthesis.length > 300 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
