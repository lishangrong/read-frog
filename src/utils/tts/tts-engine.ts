import type { TtsVoice } from '@/types/config/tts'

/* ──────────────────────────────
  TTS Engine interface
  ────────────────────────────── */

export type TtsPlaybackState = 'idle' | 'playing' | 'paused'

export interface TtsVoiceInfo {
  id: string
  name: string
  lang?: string
}

export interface TtsSpeakOptions {
  voice: string
  speed: number
  lang: string
}

export interface TtsEngine {
  speak(text: string, options: TtsSpeakOptions): Promise<void>
  stop(): void
  pause(): void
  resume(): void
  getVoices(): Promise<TtsVoiceInfo[]>
  readonly state: TtsPlaybackState
  onStateChange: ((state: TtsPlaybackState) => void) | null
  destroy(): void
}

/* ──────────────────────────────
  Engine factory
  ────────────────────────────── */

export type TtsProviderType = 'webSpeech' | 'openai'

let currentEngine: TtsEngine | null = null

export async function getTtsEngine(provider: TtsProviderType): Promise<TtsEngine> {
  // Reuse existing engine if same provider
  if (currentEngine) {
    currentEngine.destroy()
    currentEngine = null
  }

  switch (provider) {
    case 'webSpeech': {
      const { WebSpeechEngine } = await import('./web-speech-engine')
      currentEngine = new WebSpeechEngine()
      break
    }
    case 'openai': {
      const { OpenAITtsEngine } = await import('./openai-tts-engine')
      currentEngine = new OpenAITtsEngine()
      break
    }
    default:
      throw new Error(`Unknown TTS provider: ${provider}`)
  }

  return currentEngine
}

export function getCurrentEngine(): TtsEngine | null {
  return currentEngine
}
