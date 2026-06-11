import type { TtsPlaybackState, TtsSpeakOptions } from './tts-engine'
import { getTtsEngine } from './tts-engine'
import { sanitizeTextForTts } from './text-sanitizer'
import type { TtsProvider } from '@/types/config/tts'

/**
 * High-level audio controller that manages TTS playback.
 * Splits long text into segments and plays them sequentially.
 * Supports skip forward/backward and segment seeking.
 */
export class AudioController {
  private currentProvider: TtsProvider = 'webSpeech'
  private isDestroyed = false
  private segments: string[] = []
  private currentSegmentIndex = 0
  private _state: TtsPlaybackState = 'idle'
  private playbackAbort: { aborted: boolean } | null = null
  private currentOptions: TtsSpeakOptions | null = null

  onStateChange: ((state: TtsPlaybackState) => void) | null = null
  onProgress: ((current: number, total: number) => void) | null = null

  get state(): TtsPlaybackState {
    return this._state
  }

  get currentSegment(): number {
    return this.currentSegmentIndex
  }

  get totalSegments(): number {
    return this.segments.length
  }

  private setState(state: TtsPlaybackState) {
    this._state = state
    this.onStateChange?.(state)
  }

  /**
   * Speak text with the given options, splitting long text into segments.
   * Text is sanitized before processing.
   */
  async speak(
    text: string,
    provider: TtsProvider,
    options: TtsSpeakOptions,
  ): Promise<void> {
    this.stop()
    this.currentProvider = provider
    this.currentOptions = options

    // Sanitize text before splitting
    const cleanText = sanitizeTextForTts(text)

    // Split long text into sentence-based segments
    this.segments = splitTextIntoSegments(cleanText)
    this.currentSegmentIndex = 0

    if (this.segments.length === 0)
      return

    this.setState('playing')
    await this.playSegmentsFrom(0, options)
  }

  /**
   * Play segments sequentially starting from a given index.
   * Uses an abort token to support interruption by skip/stop.
   */
  private async playSegmentsFrom(
    startIndex: number,
    options: TtsSpeakOptions,
  ): Promise<void> {
    const abort = { aborted: false }
    this.playbackAbort = abort

    const engine = await getTtsEngine(this.currentProvider)
    engine.onStateChange = (state) => {
      // Only forward engine state if we're not in abort/skip mode
      if (!abort.aborted) {
        this.setState(state)
      }
    }

    for (let i = startIndex; i < this.segments.length; i++) {
      if (this.isDestroyed || this._state === 'idle' || abort.aborted)
        break

      this.currentSegmentIndex = i
      this.onProgress?.(i + 1, this.segments.length)

      // Prefetch next segment's audio into cache (fire-and-forget)
      if (i + 1 < this.segments.length) {
        this.prefetchSegment(this.segments[i + 1], options)
      }

      try {
        await engine.speak(this.segments[i], options)
      }
      catch (error) {
        if (!abort.aborted) {
          console.error('TTS segment playback error:', error)
        }
        break
      }
    }

    // Only transition to idle if this playback was not aborted (by skip)
    if (!abort.aborted && this._state !== 'idle') {
      this.setState('idle')
    }
  }

  /**
   * Prefetch a segment's audio into cache (fire-and-forget).
   * Only applies to API-based providers (openai, edgeTts).
   */
  private prefetchSegment(text: string, options: TtsSpeakOptions) {
    if (this.currentProvider === 'webSpeech') return

    import('./audio-cache').then(({ getTtsAudioCache }) => {
      const cache = getTtsAudioCache()
      const key = cache.buildKey(text, options.voice, options.speed)
      if (cache.has(key)) return

      // Fire-and-forget: request audio via message and cache it
      import('@/utils/hash').then(({ Sha256Hex }) => {
        import('@/utils/message').then(({ sendMessage }) => {
          const type = this.currentProvider === 'edgeTts' ? 'edgeTts' : 'tts'
          sendMessage('enqueueRequest', {
            type,
            params: { text, voice: options.voice, speed: options.speed, lang: options.lang },
            scheduleAt: Date.now(),
            hash: Sha256Hex(text, options.voice, String(options.speed)),
            priority: 80, // Lower priority than active playback
          }).then((audioBase64: string) => {
            cache.set(key, audioBase64)
          }).catch(() => { /* prefetch failures are non-critical */ })
        })
      })
    }).catch(() => { /* cache import failure is non-critical */ })
  }

  /**
   * Skip to a specific segment index.
   */
  async skipToSegment(index: number): Promise<void> {
    if (this.segments.length === 0 || !this.currentOptions) return

    const targetIndex = Math.max(0, Math.min(index, this.segments.length - 1))

    // Abort current playback
    if (this.playbackAbort) {
      this.playbackAbort.aborted = true
    }

    // Stop current engine audio
    const engine = getCurrentEngineSync()
    if (engine) {
      engine.stop()
    }

    this.setState('playing')
    await this.playSegmentsFrom(targetIndex, this.currentOptions)
  }

  /**
   * Skip to the next segment.
   */
  skipForward(): void {
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.skipToSegment(this.currentSegmentIndex + 1)
    }
  }

  /**
   * Skip to the previous segment.
   */
  skipBackward(): void {
    if (this.currentSegmentIndex > 0) {
      this.skipToSegment(this.currentSegmentIndex - 1)
    }
  }

  stop() {
    if (this.playbackAbort) {
      this.playbackAbort.aborted = true
      this.playbackAbort = null
    }
    const engine = getCurrentEngineSync()
    if (engine) {
      engine.stop()
    }
    this.segments = []
    this.currentSegmentIndex = 0
    this.currentOptions = null
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
export function splitTextIntoSegments(text: string, maxLength = 500): string[] {
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
