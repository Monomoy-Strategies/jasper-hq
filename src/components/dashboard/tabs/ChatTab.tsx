'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ChatMessage {
  id: string
  created_at: string
  role: 'user' | 'assistant'
  content: string
  status: 'pending' | 'processing' | 'complete'
}

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadHistory() {
    try {
      const res = await fetch('/api/chat/history')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {}
  }

  // Poll for response after sending
  const startPolling = useCallback((messageId: string) => {
    setWaitingForResponse(true)
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/history?since=${messageId}`)
        if (!res.ok) return
        const data = await res.json()
        const assistantMessages = (data.messages || []).filter(
          (m: ChatMessage) => m.role === 'assistant' && m.status === 'complete'
        )
        if (assistantMessages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = assistantMessages.filter((m: ChatMessage) => !existingIds.has(m.id))
            if (newMsgs.length > 0) {
              // Play TTS for the latest response
              playTTS(newMsgs[newMsgs.length - 1].content)
              return [...prev, ...newMsgs]
            }
            return prev
          })
          clearInterval(pollIntervalRef.current!)
          setWaitingForResponse(false)
        }
      } catch {}
    }, 2500)

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        setWaitingForResponse(false)
      }
    }, 300000)
  }, [])

  async function playTTS(text: string) {
    try {
      setAudioPlaying(true)
      const res = await fetch('/api/chat/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) {
        setAudioPlaying(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setAudioPlaying(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => setAudioPlaying(false)
      await audio.play()
    } catch {
      setAudioPlaying(false)
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    setSending(true)
    setInput('')

    // Optimistic user message
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      role: 'user',
      content: text.trim(),
      status: 'complete',
    }
    setMessages(prev => [...prev, optimisticMsg])
    setWaitingForResponse(true)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        const realUser = data.userMessage || data.message
        const realAssistant = data.assistantMessage

        setMessages(prev => {
          const withoutOptimistic = prev.filter(m => m.id !== optimisticMsg.id)
          return realAssistant
            ? [...withoutOptimistic, realUser, realAssistant]
            : [...withoutOptimistic, realUser]
        })

        if (realAssistant?.content) {
          // Response came back synchronously — play TTS and stop waiting
          playTTS(realAssistant.content)
          setWaitingForResponse(false)
        } else {
          // Async path — poll for response
          startPolling(realUser.id)
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setWaitingForResponse(false)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setWaitingForResponse(false)
    } finally {
      setSending(false)
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          const res = await fetch('/api/chat/transcribe', { method: 'POST', body: formData })
          if (res.ok) {
            const { transcript } = await res.json()
            if (transcript?.trim()) await sendMessage(transcript)
          }
        } finally {
          setTranscribing(false)
        }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setAudioPlaying(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50">
        <span className="text-2xl">🦞</span>
        <div>
          <h2 className="text-white font-semibold">Chat with Jasper</h2>
          <p className="text-slate-400 text-xs">Voice + text • Powered by Claude + ElevenLabs</p>
        </div>
        {waitingForResponse && (
          <div className="ml-auto flex items-center gap-2 text-emerald-400 text-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Jasper is thinking...
          </div>
        )}
        {audioPlaying && (
          <button
            onClick={stopAudio}
            className="ml-auto flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300"
          >
            <span>🔊</span> Playing (tap to stop)
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !waitingForResponse && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="text-5xl mb-4">🦞</span>
            <p className="text-lg font-medium text-slate-400">Hey Bill, what's on your mind?</p>
            <p className="text-sm mt-1">Type or use the mic to talk to Jasper</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-base flex-shrink-0">
                🦞
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-white rounded-tr-sm'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-200 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {waitingForResponse && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center text-base flex-shrink-0">
              🦞
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="flex items-end gap-3">
          {/* Voice button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={transcribing || sending}
            className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              recording
                ? 'bg-red-500 text-white scale-110 animate-pulse'
                : transcribing
                ? 'bg-amber-500/20 text-amber-400 cursor-wait'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
            title={recording ? 'Release to send' : 'Hold to record'}
          >
            {transcribing ? '⏳' : recording ? '🔴' : '🎙️'}
          </button>

          {/* Text input */}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Jasper... (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={sending || transcribing}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-500/50 min-h-[44px] max-h-32"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 128) + 'px'
            }}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending || transcribing}
            className="flex-shrink-0 w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          Hold 🎙️ to record voice • Jasper responds in ~30-60 seconds
        </p>
      </div>
    </div>
  )
}
