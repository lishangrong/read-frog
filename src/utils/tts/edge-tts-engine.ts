import type { TtsEngine, TtsPlaybackState, TtsSpeakOptions, TtsVoiceInfo } from './tts-engine'
import { EDGE_TTS_VOICES } from './edge-tts-voices'
import { Sha256Hex } from '@/utils/hash'
import { sendMessage } from '@/utils/message'
import { getTtsAudioCache } from './audio-cache'

/**
 * TTS engine using Microsoft Edge TTS service.
 * Free, multi-language, multi-voice. No API key required.
 * Audio is synthesized via background script WebSocket connection.
 * Integrates with audio cache for instant playback on cache hits.
 */
export class EdgeTtsEngine implements TtsEngine {
  private audio: HTMLAudioElement | null = null
  private _state: TtsPlaybackState = 'idle'
  onStateChange: ((state: TtsPlaybackState) => void) | null = null

  get state(): TtsPlaybackState {
    return this._state
  }

  private setState(state: TtsPlaybackState) {
    this._state = state
    this.onStateChange?.(state)
  }

  async speak(text: string, options: TtsSpeakOptions): Promise<void> {
    this.stop()

    const voice = options.voice || 'en-US-AriaNeural'
    const speed = options.speed
    const cache = getTtsAudioCache()
    const cacheKey = cache.buildKey(text, voice, speed)

    // Check cache first
    let audioBase64 = cache.get(cacheKey)

    if (!audioBase64) {
      // Cache miss: request from background script
      audioBase64 = await sendMessage('enqueueRequest', {
        type: 'edgeTts',
        params: {
          text,
          voice,
          speed,
          lang: options.lang,
        },
        scheduleAt: Date.now(),
        hash: Sha256Hex(text, voice, String(speed)),
        priority: 50,
      })

      // Store in cache for future use
      cache.set(cacheKey, audioBase64)
    }

    // Decode base64 audio and play
    const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg')
    const audioUrl = URL.createObjectURL(audioBlob)

    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl)
      this.audio = audio

      audio.onplay = () => {
        this.setState('playing')
      }
      audio.onpause = () => {
        if (this._state !== 'idle') {
          this.setState('paused')
        }
      }
      audio.onended = () => {
        this.setState('idle')
        URL.revokeObjectURL(audioUrl)
        this.audio = null
        resolve()
      }
      audio.onerror = () => {
        this.setState('idle')
        URL.revokeObjectURL(audioUrl)
        this.audio = null
        reject(new Error('Failed to play Edge TTS audio'))
      }

      audio.play().catch(reject)
    })
  }

  stop() {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.audio.src = ''
      this.audio = null
    }
    this.setState('idle')
  }

  pause() {
    if (this.audio && this._state === 'playing') {
      this.audio.pause()
    }
  }

  resume() {
    if (this.audio && this._state === 'paused') {
      this.audio.play()
    }
  }

  async getVoices(): Promise<TtsVoiceInfo[]> {
    return EDGE_TTS_VOICES.map(v => ({
      id: v.id,
      name: `${v.label} (${v.gender})`,
      lang: v.lang,
    }))
  }

  destroy() {
    this.stop()
    this.onStateChange = null
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64)
  const byteArrays: Uint8Array[] = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays, { type: mimeType })
}
