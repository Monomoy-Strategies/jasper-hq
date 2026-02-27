/*
  ── Jasper Canvas ─────────────────────────────────────────────────────────────
  Run this SQL once in Supabase Dashboard to enable map saving:

  CREATE TABLE IF NOT EXISTS canvas_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'mindmap',
    data JSONB NOT NULL DEFAULT '{}',
    project TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE canvas_maps ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users manage own maps" ON canvas_maps
    FOR ALL USING (user_id::text = auth.uid()::text);
  ─────────────────────────────────────────────────────────────────────────────
*/

'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const MindMapMode = dynamic(() => import('@/components/canvas/MindMapMode'), { ssr: false })
const WhiteboardMode = dynamic(() => import('@/components/canvas/WhiteboardMode'), { ssr: false })

type CanvasMode = 'mindmap' | 'whiteboard'

const MODES: { id: CanvasMode; icon: string; label: string; desc: string }[] = [
  { id: 'mindmap', icon: '🗺️', label: 'Mind Map', desc: 'AI-generated project maps' },
  { id: 'whiteboard', icon: '🎨', label: 'Whiteboard', desc: 'Freeform brainstorming canvas' },
]

export function CanvasTab() {
  const [mode, setMode] = useState<CanvasMode>('mindmap')

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div>
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <span>🧠</span> Jasper Canvas
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">AI-powered mind mapping · visual brainstorming · project layouts</p>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m.id
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'mindmap' ? <MindMapMode /> : <WhiteboardMode />}
      </div>
    </div>
  )
}
