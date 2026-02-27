'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// Excalidraw must be loaded client-side only
const ExcalidrawComponent = dynamic(
  () => import('@excalidraw/excalidraw').then(mod => ({ default: mod.Excalidraw })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading whiteboard…</p>
        </div>
      </div>
    ),
  }
)

export default function WhiteboardMode() {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Info bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/50 text-xs text-slate-500">
        <span>🎨</span>
        <span>Freeform whiteboard · Sketch, diagram, wireframe anything · Shift+drag to pan · Scroll to zoom</span>
        <span className="ml-auto text-slate-600">Powered by Excalidraw</span>
      </div>

      <div
        className="flex-1"
        style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}
        onLoad={() => setIsLoaded(true)}
      >
        <ExcalidrawComponent
          theme="dark"
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: true,
              export: { saveFileToDisk: true },
              toggleTheme: false,
            },
          }}
        />
      </div>
    </div>
  )
}
