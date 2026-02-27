import { NextRequest, NextResponse } from 'next/server'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
// Tom (Conversations & Books) — Australian, easy going and natural
const VOICE_ID = 'DYkrAHD8iwork3YSUBbs'
// Flash v2.5 — lowest latency model (~75ms first chunk)
const MODEL_ID = 'eleven_flash_v2_5'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    // Truncate very long responses for TTS (first ~500 chars for speed)
    const ttsText = text.length > 800 ? text.substring(0, 800) + '...' : text

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: ttsText,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 1.0,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`ElevenLabs error: ${err}`)
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
