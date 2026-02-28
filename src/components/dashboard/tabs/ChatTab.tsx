'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface AttachedImage {
  base64: string
  mime: string
  preview: string
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: {
  sessions: ChatSession[]
  activeId: string | null
  onSelect: (s: ChatSession) => void
  onCreate: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col w-56 flex-shrink-0 border-r border-slate-700/50 bg-slate-900/60">
      {/* New chat button */}
      <div className="p-3 border-b border-slate-700/50">
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all"
        >
          <span className="text-lg">+</span> New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-6 px-3">No chats yet — start one above</p>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            onClick={() => onSelect(s)}
            className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all border-l-2 ${
              activeId === s.id
                ? 'border-emerald-500 bg-slate-800/60 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <span className="text-sm">💬</span>
            <span className="flex-1 text-xs truncate">{s.title}</span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(s.id) }}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 text-sm transition-all flex-shrink-0"
            >×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ChatTab ─────────────────────────────────────────────────────────────
export function ChatTab() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Load sessions on mount
  useEffect(() => {
    fetch('/api/chat/sessions')
      .then(r => r.json())
      .then(d => {
        const list: ChatSession[] = d.sessions || []
        setSessions(list)
        if (list.length > 0) selectSession(list[0])
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  const selectSession = useCallback(async (session: ChatSession) => {
    setActiveSession(session)
    setTitleDraft(session.title)
    setMessages([])
    try {
      const res = await fetch(`/api/chat/history?chat_session_id=${session.id}&limit=100`)
      const d = await res.json()
      setMessages(d.messages || [])
    } catch {}
  }, [])

  const createSession = useCallback(async () => {
    const res = await fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) })
    const d = await res.json()
    if (d.session) {
      setSessions(prev => [d.session, ...prev])
      setActiveSession(d.session)
      setTitleDraft(d.session.title)
      setMessages([])
    }
  }, [])

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' })
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      if (activeSession?.id === id) {
        if (next.length > 0) selectSession(next[0])
        else { setActiveSession(null); setMessages([]) }
      }
      return next
    })
  }, [activeSession, selectSession])

  const saveTitle = useCallback(async () => {
    if (!activeSession || !titleDraft.trim()) return
    setEditingTitle(false)
    const newTitle = titleDraft.trim()
    await fetch(`/api/chat/sessions/${activeSession.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    const updated = { ...activeSession, title: newTitle }
    setActiveSession(updated)
    setSessions(prev => prev.map(s => s.id === activeSession.id ? updated : s))
  }, [activeSession, titleDraft])

  const exportMarkdown = useCallback(() => {
    if (!activeSession) return
    window.open(`/api/chat/export?session_id=${activeSession.id}`, '_blank')
  }, [activeSession])

  // ── Image helpers ──
  async function fileToBase64(file: File | Blob): Promise<{ base64: string; mime: string }> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => { const r = reader.result as string; resolve({ base64: r.split(',')[1], mime: file.type || 'image/jpeg' }) }
      reader.readAsDataURL(file)
    })
  }

  async function attachImageFile(file: File | Blob) {
    const { base64, mime } = await fileToBase64(file)
    setAttachedImage({ base64, mime, preview: URL.createObjectURL(file) })
  }

  function clearAttachment() { if (attachedImage) URL.revokeObjectURL(attachedImage.preview); setAttachedImage(null) }

  async function handlePaste(e: React.ClipboardEvent) {
    const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (img) { e.preventDefault(); const f = img.getAsFile(); if (f) await attachImageFile(f) }
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true) }
  function handleDragLeave() { setDragOver(false) }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) await attachImageFile(f)
    else if (e.dataTransfer.getData('text')) setInput(p => p + e.dataTransfer.getData('text'))
  }

  // ── TTS ──
  function stopAudio() { audioRef.current?.pause(); audioRef.current = null; setAudioPlaying(false) }

  async function playTTS(text: string) {
    if (!ttsEnabled) return
    try {
      const res = await fetch('/api/chat/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      setAudioPlaying(true)
      audio.onended = () => { setAudioPlaying(false); URL.revokeObjectURL(url) }
      audio.play().catch(() => setAudioPlaying(false))
    } catch {}
  }

  // ── Voice recording ──
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = e => audioChunksRef.current.push(e.data)
      mr.start()
      setRecording(true)
    } catch {}
  }

  async function stopRecording() {
    const mr = mediaRecorderRef.current
    if (!mr) return
    mr.stop()
    setRecording(false)
    setTranscribing(true)
    mr.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      try {
        const res = await fetch('/api/chat/transcribe', { method: 'POST', body: form })
        const d = await res.json()
        if (d.text) { setInput(d.text); sendMessage(d.text) }
      } catch {}
      setTranscribing(false)
      mr.stream.getTracks().forEach(t => t.stop())
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  // ── Send ──
  async function sendMessage(text: string) {
    if (!text.trim() && !attachedImage) return
    if (sending) return

    // Auto-create session if none exists
    let session = activeSession
    if (!session) {
      const res = await fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: text.slice(0, 40) || 'New Chat' }) })
      const d = await res.json()
      session = d.session
      if (session) { setSessions(prev => [session!, ...prev]); setActiveSession(session); setTitleDraft(session.title) }
    }

    setSending(true)
    setInput('')
    const imageToSend = attachedImage
    clearAttachment()

    // Optimistic user message
    const tempId = `temp-${Date.now()}`
    const tempMsg: ChatMessage = { id: tempId, role: 'user', content: text.trim(), created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          chat_session_id: session?.id,
          ...(imageToSend ? { image_base64: imageToSend.base64, image_mime: imageToSend.mime } : {}),
        }),
      })
      const d = await res.json()
      const realUser = d.userMessage
      const realAssistant = d.assistantMessage

      setMessages(prev => {
        const without = prev.filter(m => m.id !== tempId)
        const next = [...without]
        if (realUser) next.push(realUser)
        if (realAssistant) next.push(realAssistant)
        return next
      })

      // Auto-title after first exchange
      if (session && session.title === 'New Chat' && text.trim()) {
        const newTitle = text.trim().slice(0, 45)
        await fetch(`/api/chat/sessions/${session.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) })
        const updated = { ...session, title: newTitle }
        setActiveSession(updated)
        setTitleDraft(newTitle)
        setSessions(prev => prev.map(s => s.id === session!.id ? updated : s))
      }

      if (realAssistant?.content && ttsEnabled) playTTS(realAssistant.content)
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  // ── Render ──
  return (
    <div className="flex" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeId={activeSession?.id || null}
        onSelect={selectSession}
        onCreate={createSession}
        onDelete={deleteSession}
      />

      {/* Main chat area */}
      <div
        className={`flex flex-col flex-1 relative transition-all ${dragOver ? 'ring-2 ring-emerald-400/50 ring-inset' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 z-20 bg-emerald-900/40 flex items-center justify-center pointer-events-none">
            <div className="text-emerald-300 text-center"><div className="text-4xl mb-2">📎</div><p className="font-medium">Drop image here</p></div>
          </div>
        )}

        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
          <span className="text-xl">🦞</span>

          {/* Editable title */}
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
              className="flex-1 bg-slate-700 border border-emerald-500/50 rounded-lg px-3 py-1 text-sm text-white focus:outline-none"
            />
          ) : (
            <button
              onClick={() => activeSession && setEditingTitle(true)}
              className="flex-1 text-left text-white font-medium text-sm hover:text-emerald-300 transition-colors truncate"
              title="Click to rename"
            >
              {activeSession?.title || 'Jasper Chat'}
              {activeSession && <span className="ml-2 text-slate-600 text-xs font-normal">✏️</span>}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {activeSession && (
              <button onClick={exportMarkdown} title="Export to Markdown (Obsidian)" className="text-slate-400 hover:text-emerald-300 text-sm transition-colors px-2 py-1 rounded hover:bg-slate-700/50">
                ⬇️ Export
              </button>
            )}
            {audioPlaying && (
              <button onClick={stopAudio} className="text-amber-400 text-sm hover:text-amber-300">🔊 Stop</button>
            )}
            <button onClick={() => setTtsEnabled(p => !p)} title={ttsEnabled ? 'Voice on' : 'Voice off'} className={`text-lg transition-opacity ${ttsEnabled ? 'opacity-100' : 'opacity-30'}`}>
              {ttsEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!activeSession && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <div className="text-5xl mb-4">🦞</div>
            <p className="text-slate-500 font-medium">Start a new chat</p>
            <p className="text-sm mt-1">Click <strong>+ New Chat</strong> in the sidebar</p>
          </div>
        )}

        {/* Messages */}
        {activeSession && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !sending && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <p className="text-sm">Ask me anything about your projects, strategy, or ideas</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <span className="text-xl mr-2 flex-shrink-0 mt-1">🦞</span>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/20 border border-emerald-700/30 text-slate-100 rounded-tr-sm'
                    : 'bg-slate-800/60 border border-slate-700/30 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <span className="text-xl mr-2">🦞</span>
                <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Image preview */}
        {attachedImage && (
          <div className="px-4 pb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="relative inline-block">
              <img src={attachedImage.preview} alt="attachment" className="max-h-16 max-w-32 rounded-lg border border-slate-600 object-cover" />
              <button onClick={clearAttachment} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">×</button>
            </div>
            <span className="text-xs text-slate-500">Image attached</span>
          </div>
        )}

        {/* Input */}
        {activeSession && (
          <div className="border-t border-slate-700/50 p-3 flex-shrink-0">
            <div className="flex items-end gap-2">
              <button
                onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                disabled={transcribing || sending}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${recording ? 'bg-red-500 text-white scale-110 animate-pulse' : transcribing ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {transcribing ? '⏳' : recording ? '🔴' : '🎙️'}
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Message Jasper… paste image with Ctrl+V, or drag and drop"
                rows={1}
                disabled={sending || transcribing}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50 min-h-[40px] max-h-28"
                onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 112) + 'px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={(!input.trim() && !attachedImage) || sending || transcribing}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 flex items-center justify-center transition-all"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 text-center">
              Hold 🎙️ to speak · Ctrl+V to paste image · {ttsEnabled ? '🔊 voice on' : '🔇 voice off'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
