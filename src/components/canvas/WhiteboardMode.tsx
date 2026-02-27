'use client'

import dynamic from 'next/dynamic'

// Excalidraw must be loaded client-side only — SSR will break it
const ExcalidrawComponent = dynamic(
  async () => {
    const { Excalidraw } = await import('@excalidraw/excalidraw')
    return { default: Excalidraw }
  },
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
  return (
    <div className="flex flex-col h-full">
      {/* Info bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/50 text-xs text-slate-500">
        <span>🎨</span>
        <span>Freeform whiteboard · Sketch, diagram, wireframe anything · Scroll to zoom · Space+drag to pan</span>
        <span className="ml-auto text-slate-600">Powered by Excalidraw</span>
      </div>

      <div className="flex-1" style={{ minHeight: '500px' }}>
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
