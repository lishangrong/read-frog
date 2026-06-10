import type { TtsPlaybackState, TtsSpeakOptions } from './tts-engine'
import { getTtsEngine } from './tts-engine'
import type { TtsProvider } from '@/types/config/tts'

/**
 * High-level audio controller that manages TTS playback.
 * Splits long text into segments and plays them sequentially.
 */
export class AudioController {
  private currentProvider: TtsProvider = 'webSpeech'
  private isDestroyed = false
  private segments: string[] = []
  private currentSegmentIndex = 0
  private _state: TtsPlaybackState = 'idle'
  onStateChange: ((state: TtsPlaybackState) => void) | null = null
  onProgress: ((current: number, total: number) => void) | null = null

  get state(): TtsPlaybackState {
    return this._state
  }

  private setState(state: TtsPlaybackState) {
    this._state = state
    this.onStateChange?.(state)
  }

  /**
   * Speak text with the given options, splitting long text into segments.
   */
  async speak(
    text: string,
    provider: TtsProvider,
    options: TtsSpeakOptions,
  ): Promise<void> {
    this.stop()
    this.currentProvider = provider

    // Split long text into sentence-based segments
    this.segments = splitTextIntoSegments(text)
    this.currentSegmentIndex = 0

    if (this.segments.length === 0)
      return

    const engine = await getTtsEngine(provider)
    engine.onStateChange = (state) => {
      this.setState(state)
    }

    this.setState('playing')

    for (let i = 0; i < this.segments.length; i++) {
      if (this.isDestroyed || this._state === 'idle')
        break

      this.currentSegmentIndex = i
      this.onProgress?.(i + 1, this.segments.length)

      try {
        await engine.speak(this.segments[i], options)
      }
      catch (error) {
        console.error('TTS segment playback error:', error)
        break
      }
    }

    if (this._state !== 'idle') {
      this.setState('idle')
    }
  }

  stop() {
    const engine = getCurrentEngineSync()
    if (engine) {
      engine.stop()
    }
    this.segments = []
    this.currentSegmentIndex = 0
    this.setState('idle')
  }

  pause() {
    const engine = getCurrentEngineSync()
    if (engine) {
      engine.pause()
    }
  }

  resume() {
    const engine = getCurrentEngineSync()
    if (engine) {
      engine.resume()
    }
  }

  destroy() {
    this.isDestroyed = true
    this.stop()
    this.onStateChange = null
    this.onProgress = null
  }
}

function getCurrentEngineSync() {
  // Import synchronously to get current engine
  const { getCurrentEngine } = require('./tts-engine') as typeof import('./tts-engine')
  return getCurrentEngine()
}

/**
 * Split text into sentence-based segments for sequential playback.
 */
function splitTextIntoSegments(text: string, maxLength = 500): string[] {
  if (text.length <= maxLength)
    return [text]

  const segments: string[] = []
  // Split by sentence-ending punctuation followed by space or newline
  const sentences = text.split(/(?<=[.!?。！？\n])\s+/)

  let current = ''
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current.length > 0) {
      segments.push(current.trim())
      current = sentence
    }
    else {
      current += (current ? ' ' : '') + sentence
    }
  }
  if (current.trim()) {
    segments.push(current.trim())
  }

  return segments
}

// Singleton instance
let controllerInstance: AudioController | null = null

export function getAudioController(): AudioController {
  if (!controllerInstance) {
    controllerInstance = new AudioController()
  }
  return controllerInstance
}
