import type { TTSPlaybackState } from '@/utils/atoms/tts'
import type { ITTSProvider, TTSProgress, TTSProviderId } from '@/utils/tts/types'
import { extractTextForTTS, splitTextIntoChunks } from '@/utils/tts/text-extractor'
import { ttsAudioCache } from '@/utils/tts/audio-cache'
import { OpenAITTSProvider } from '@/utils/tts/providers/openai-tts-provider'
import { WebSpeechTTSProvider } from '@/utils/tts/providers/web-speech-provider'
import { TTSPreloader } from '@/utils/tts/preloader'

/**
 * TTS Engine Controller (v2).
 *
 * Manages speech synthesis via two backends:
 * - **AI TTS** (OpenAI): Synthesizes audio server-side, plays via `<audio>` element.
 *   Supports progress tracking, seeking, skip forward/backward, and caching.
 * - **Web Speech**: Uses the browser's built-in SpeechSynthesis API.
 *   Free but with limited control (no seek/progress).
 *
 * The engine routes to the correct backend based on the `provider` parameter
 * in the play event detail. It checks the audio cache before synthesizing
 * to minimize latency.
 *
 * This controller is instantiated in the side content script context
 * and responds to custom events dispatched by UI components.
 */
export class TTSEngine {
  private onStateChange: (state: TTSPlaybackState) => void
  private onError: (message: string | null) => void
  private onProgress: (progress: TTSProgress) => void
  private isDestroyed = false

  // Providers
  private openAIProvider: OpenAITTSProvider
  private webSpeechProvider: WebSpeechTTSProvider
  private preloader: TTSPreloader

  // AI TTS playback state
  private audioElement: HTMLAudioElement | null = null
  private blobUrl: string | null = null
  private progressRafId: number | null = null

  // Web Speech state
  private utterance: SpeechSynthesisUtterance | null = null

  // Current playback info
  private currentProvider: TTSProviderId = 'web-speech'
  private currentText = ''
  private currentVoiceId = 'alloy'
  private currentSpeed = 1.0
  private currentVolume = 1.0
  private currentModel = 'tts-1'
  private currentFormat = 'mp3'

  constructor(
    onStateChange: (state: TTSPlaybackState) => void,
    onError: (message: string | null) => void,
    onProgress: (progress: TTSProgress) => void,
    options?: {
      hasOpenAIKey?: boolean
      model?: string
      format?: string
    },
  ) {
    this.onStateChange = onStateChange
    this.onError = onError
    this.onProgress = onProgress

    // Initialize providers
    this.openAIProvider = new OpenAITTSProvider(options?.hasOpenAIKey ?? false)
    this.webSpeechProvider = new WebSpeechTTSProvider()
    this.currentModel = options?.model ?? 'tts-1'
    this.currentFormat = options?.format ?? 'mp3'

    // Initialize preloader
    this.preloader = new TTSPreloader()

    // Bind event handlers
    this.handlePlay = this.handlePlay.bind(this)
    this.handlePause = this.handlePause.bind(this)
    this.handleResume = this.handleResume.bind(this)
    this.handleStop = this.handleStop.bind(this)
    this.handleSetSpeed = this.handleSetSpeed.bind(this)
    this.handleSkip = this.handleSkip.bind(this)
    this.handleSeek = this.handleSeek.bind(this)
    this.handlePreload = this.handlePreload.bind(this)

    // Register event listeners
    document.addEventListener('read-frog:tts-play', this.handlePlay as EventListener)
    document.addEventListener('read-frog:tts-pause', this.handlePause)
    document.addEventListener('read-frog:tts-resume', this.handleResume)
    document.addEventListener('read-frog:tts-stop', this.handleStop)
    document.addEventListener('read-frog:tts-set-speed', this.handleSetSpeed as EventListener)
    document.addEventListener('read-frog:tts-skip', this.handleSkip as EventListener)
    document.addEventListener('read-frog:tts-seek', this.handleSeek as EventListener)
    document.addEventListener('read-frog:tts-preload', this.handlePreload as EventListener)
    document.addEventListener('read-frog:speak-selection', this.handlePlay as EventListener)
  }

  /**
   * Update OpenAI API key availability.
   */
  setOpenAIAvailable(available: boolean): void {
    this.openAIProvider.setApiKeyAvailable(available)
  }

  /**
   * Destroy the engine and clean up all resources.
   */
  destroy(): void {
    if (this.isDestroyed) return
    this.isDestroyed = true

    this.stop()
    this.preloader.destroy()

    document.removeEventListener('read-frog:tts-play', this.handlePlay as EventListener)
    document.removeEventListener('read-frog:tts-pause', this.handlePause)
    document.removeEventListener('read-frog:tts-resume', this.handleResume)
    document.removeEventListener('read-frog:tts-stop', this.handleStop)
    document.removeEventListener('read-frog:tts-set-speed', this.handleSetSpeed as EventListener)
    document.removeEventListener('read-frog:tts-skip', this.handleSkip as EventListener)
    document.removeEventListener('read-frog:tts-seek', this.handleSeek as EventListener)
    document.removeEventListener('read-frog:tts-preload', this.handlePreload as EventListener)
    document.removeEventListener('read-frog:speak-selection', this.handlePlay as EventListener)
  }

  // ─── Play ──────────────────────────────────────────────────────────

  private handlePlay(e: CustomEvent): void {
    const {
      text,
      speed = 1.0,
      voiceId = 'alloy',
      volume = 1.0,
      provider = 'web-speech',
      model = 'tts-1',
      format = 'mp3',
    } = e.detail || {}

    if (!text) {
      this.onError('No text provided for speech synthesis')
      return
    }

    // Stop any current playback
    this.stop()

    // Purify text for TTS
    const cleanText = extractTextForTTS(text)
    if (!cleanText) {
      this.onError('Text is empty after purification')
      return
    }

    // Store current playback params
    this.currentProvider = provider as TTSProviderId
    this.currentText = cleanText
    this.currentVoiceId = voiceId
    this.currentSpeed = speed
    this.currentVolume = volume
    this.currentModel = model
    this.currentFormat = format

    if (provider === 'openai') {
      this.playAITTS(cleanText, voiceId, speed, volume, model, format)
    }
    else {
      this.playWebSpeech(cleanText, voiceId, speed, volume)
    }
  }

  // ─── AI TTS Playback (OpenAI) ─────────────────────────────────────

  private async playAITTS(
    text: string,
    voiceId: string,
    speed: number,
    volume: number,
    model: string,
    format: string,
  ): Promise<void> {
    this.onStateChange('loading')

    try {
      // Check cache first
      let audioBuffer = ttsAudioCache.get(text, voiceId, speed, 'openai')

      if (!audioBuffer) {
        // Synthesize audio
        const chunks = splitTextIntoChunks(text)
        const buffers: ArrayBuffer[] = []

        for (const chunk of chunks) {
          const buffer = await this.openAIProvider.synthesize({
            text: chunk,
            voiceId,
            speed,
            model,
            format,
          })
          buffers.push(buffer)

          // Cache each chunk
          ttsAudioCache.set(chunk, voiceId, speed, 'openai', buffer)
        }

        // Concatenate chunks if multiple
        audioBuffer = buffers.length === 1
          ? buffers[0]
          : concatenateArrayBuffers(buffers)
      }

      if (this.isDestroyed) return

      // Create audio element and play
      this.playAudioBuffer(audioBuffer, volume, format)
    }
    catch (error) {
      if (this.isDestroyed) return
      this.onStateChange('error')
      this.onError(error instanceof Error ? error.message : 'TTS synthesis failed')
    }
  }

  private playAudioBuffer(buffer: ArrayBuffer, volume: number, format: string): void {
    // Clean up previous audio element
    this.cleanupAudioElement()

    // Determine MIME type
    const mimeType = format === 'opus' ? 'audio/ogg' : `audio/${format}`
    const blob = new Blob([buffer], { type: mimeType })
    this.blobUrl = URL.createObjectURL(blob)

    const audio = new Audio(this.blobUrl)
    audio.volume = volume
    this.audioElement = audio

    audio.onloadedmetadata = () => {
      // Report initial progress with duration
      this.onProgress({
        currentTime: 0,
        duration: audio.duration || 0,
        percentage: 0,
      })
    }

    audio.onplay = () => {
      this.onStateChange('playing')
      this.startProgressTracking()
    }

    audio.onpause = () => {
      this.onStateChange('paused')
      this.stopProgressTracking()
    }

    audio.onended = () => {
      this.stopProgressTracking()
      this.onProgress({ currentTime: 0, duration: 0, percentage: 0 })
      this.onStateChange('idle')
      this.onError(null)
      this.cleanupAudioElement()
    }

    audio.onerror = () => {
      this.stopProgressTracking()
      this.onStateChange('error')
      this.onError('Audio playback error')
      this.cleanupAudioElement()
    }

    // Start playback
    audio.play().catch((err) => {
      this.onStateChange('error')
      this.onError(`Audio play failed: ${err.message}`)
    })
  }

  // ─── Web Speech Playback ──────────────────────────────────────────

  private playWebSpeech(text: string, voiceId: string, speed: number, volume: number): void {
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speed
    utterance.volume = volume

    // Match voice
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const matched = voices.find(v =>
        (v.voiceURI === voiceId)
        || v.name.toLowerCase().includes(voiceId.toLowerCase()),
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
      utterance.voice = matched
    }

    utterance.onstart = () => {
      this.onStateChange('playing')
    }

    utterance.onend = () => {
      this.onProgress({ currentTime: 0, duration: 0, percentage: 0 })
      this.onStateChange('idle')
      this.onError(null)
    }

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        this.onStateChange('idle')
        return
      }
      this.onStateChange('error')
      this.onError(`Speech synthesis error: ${event.error}`)
    }

    utterance.onpause = () => {
      this.onStateChange('paused')
    }

    utterance.onresume = () => {
      this.onStateChange('playing')
    }

    // Web Speech doesn't provide progress, but we report playing state
    this.utterance = utterance
    this.onStateChange('loading')

    setTimeout(() => {
      if (!this.isDestroyed) {
        window.speechSynthesis.speak(utterance)
      }
    }, 50)
  }

  // ─── Pause / Resume / Stop ────────────────────────────────────────

  private handlePause(): void {
    if (this.currentProvider === 'openai' && this.audioElement) {
      this.audioElement.pause()
    }
    else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
    }
  }

  private handleResume(): void {
    if (this.currentProvider === 'openai' && this.audioElement) {
      this.audioElement.play().catch(() => { /* ignore */ })
    }
    else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }

  private handleStop(): void {
    this.stop()
  }

  private stop(): void {
    // Stop AI TTS
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }
    this.cleanupAudioElement()
    this.stopProgressTracking()

    // Stop Web Speech
    window.speechSynthesis.cancel()
    this.utterance = null

    this.onProgress({ currentTime: 0, duration: 0, percentage: 0 })
    this.onStateChange('idle')
    this.onError(null)
  }

  // ─── Speed ────────────────────────────────────────────────────────

  private handleSetSpeed(e: CustomEvent): void {
    const { speed } = e.detail || {}
    if (speed === undefined) return

    this.currentSpeed = speed

    if (this.currentProvider === 'openai' && this.audioElement) {
      this.audioElement.playbackRate = speed
    }
    else if (this.utterance && window.speechSynthesis.speaking) {
      // Web Speech doesn't support rate changes mid-utterance — restart
      const text = this.utterance.text
      const volume = this.utterance.volume
      const voice = this.utterance.voice

      window.speechSynthesis.cancel()

      const newUtterance = new SpeechSynthesisUtterance(text)
      newUtterance.rate = speed
      newUtterance.volume = volume
      if (voice) newUtterance.voice = voice

      newUtterance.onstart = () => this.onStateChange('playing')
      newUtterance.onend = () => {
        this.onStateChange('idle')
        this.onError(null)
      }
      newUtterance.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          this.onStateChange('error')
          this.onError(`Speech synthesis error: ${event.error}`)
        }
      }

      this.utterance = newUtterance
      window.speechSynthesis.speak(newUtterance)
    }
    else if (this.utterance) {
      this.utterance.rate = speed
    }
  }

  // ─── Skip / Seek ──────────────────────────────────────────────────

  private handleSkip(e: CustomEvent): void {
    const { seconds = 10 } = e.detail || {}

    if (this.currentProvider === 'openai' && this.audioElement) {
      const newTime = Math.max(0, Math.min(
        this.audioElement.currentTime + seconds,
        this.audioElement.duration || Infinity,
      ))
      this.audioElement.currentTime = newTime
    }
    // Web Speech doesn't support seeking
  }

  private handleSeek(e: CustomEvent): void {
    const { percentage } = e.detail || {}
    if (percentage === undefined) return

    if (this.currentProvider === 'openai' && this.audioElement && this.audioElement.duration) {
      this.audioElement.currentTime = (percentage / 100) * this.audioElement.duration
    }
    // Web Speech doesn't support seeking
  }

  // ─── Preload ──────────────────────────────────────────────────────

  private handlePreload(e: CustomEvent): void {
    const {
      text,
      voiceId = 'alloy',
      speed = 1.0,
      provider = 'web-speech',
    } = e.detail || {}

    if (!text || provider !== 'openai') return

    // Only preload with AI TTS (Web Speech can't be cached)
    this.preloader.setProvider(this.openAIProvider)
    this.preloader.preload(text, voiceId, speed, 'openai').catch(() => { /* silent */ })
  }

  // ─── Progress Tracking ────────────────────────────────────────────

  private startProgressTracking(): void {
    this.stopProgressTracking()

    const track = () => {
      if (!this.audioElement || this.isDestroyed) return

      const currentTime = this.audioElement.currentTime
      const duration = this.audioElement.duration || 0
      const percentage = duration > 0 ? (currentTime / duration) * 100 : 0

      this.onProgress({ currentTime, duration, percentage })
      this.progressRafId = requestAnimationFrame(track)
    }

    this.progressRafId = requestAnimationFrame(track)
  }

  private stopProgressTracking(): void {
    if (this.progressRafId !== null) {
      cancelAnimationFrame(this.progressRafId)
      this.progressRafId = null
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────────────

  private cleanupAudioElement(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.removeAttribute('src')
      this.audioElement.load()
      this.audioElement = null
    }
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl)
      this.blobUrl = null
    }
  }
}

/**
 * Concatenate multiple ArrayBuffers into one.
 */
function concatenateArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  }
  return result.buffer
}
