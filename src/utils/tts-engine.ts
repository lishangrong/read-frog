import type { TTSPlaybackState } from '@/utils/atoms/tts'

/**
 * TTS Engine Controller.
 *
 * Manages speech synthesis via the Web Speech API (SpeechSynthesis).
 * Provides play, pause, resume, stop, and speed/volume control.
 *
 * This controller is instantiated in the host content script context
 * and responds to custom events dispatched by the UI components.
 */
export class TTSEngine {
  private utterance: SpeechSynthesisUtterance | null = null
  private onStateChange: (state: TTSPlaybackState) => void
  private onError: (message: string | null) => void
  private isDestroyed = false

  constructor(
    onStateChange: (state: TTSPlaybackState) => void,
    onError: (message: string | null) => void,
  ) {
    this.onStateChange = onStateChange
    this.onError = onError

    this.handlePlay = this.handlePlay.bind(this)
    this.handlePause = this.handlePause.bind(this)
    this.handleResume = this.handleResume.bind(this)
    this.handleStop = this.handleStop.bind(this)
    this.handleSetSpeed = this.handleSetSpeed.bind(this)

    // Register event listeners
    document.addEventListener('read-frog:tts-play', this.handlePlay as EventListener)
    document.addEventListener('read-frog:tts-pause', this.handlePause)
    document.addEventListener('read-frog:tts-resume', this.handleResume)
    document.addEventListener('read-frog:tts-stop', this.handleStop)
    document.addEventListener('read-frog:tts-set-speed', this.handleSetSpeed as EventListener)
    document.addEventListener('read-frog:speak-selection', this.handlePlay as EventListener)
  }

  /**
   * Destroy the engine and clean up all resources.
   */
  destroy(): void {
    if (this.isDestroyed)
      return
    this.isDestroyed = true

    this.stop()

    document.removeEventListener('read-frog:tts-play', this.handlePlay as EventListener)
    document.removeEventListener('read-frog:tts-pause', this.handlePause)
    document.removeEventListener('read-frog:tts-resume', this.handleResume)
    document.removeEventListener('read-frog:tts-stop', this.handleStop)
    document.removeEventListener('read-frog:tts-set-speed', this.handleSetSpeed as EventListener)
    document.removeEventListener('read-frog:speak-selection', this.handlePlay as EventListener)
  }

  /**
   * Start TTS playback with the given parameters.
   */
  private handlePlay(e: CustomEvent): void {
    const { text, speed = 1.0, voiceId = 'alloy', volume = 1.0 } = e.detail || {}

    if (!text) {
      this.onError('No text provided for speech synthesis')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speed
    utterance.volume = volume

    // Try to match the requested voice
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      // Map voiceId to a system voice by name pattern
      const matchedVoice = voices.find(v =>
        v.name.toLowerCase().includes(voiceId.toLowerCase()),
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
      utterance.voice = matchedVoice
    }

    utterance.onstart = () => {
      this.onStateChange('playing')
    }

    utterance.onend = () => {
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

    this.utterance = utterance
    this.onStateChange('loading')

    // Small delay to ensure voices are loaded
    setTimeout(() => {
      if (!this.isDestroyed) {
        window.speechSynthesis.speak(utterance)
      }
    }, 50)
  }

  /**
   * Pause current playback.
   */
  private handlePause(): void {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
    }
  }

  /**
   * Resume paused playback.
   */
  private handleResume(): void {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }

  /**
   * Stop playback and reset state.
   */
  private handleStop(): void {
    this.stop()
  }

  /**
   * Update playback speed on the fly.
   */
  private handleSetSpeed(e: CustomEvent): void {
    const { speed } = e.detail || {}
    if (this.utterance && speed !== undefined) {
      // SpeechSynthesis doesn't support rate changes mid-utterance,
      // so we need to restart if currently playing
      if (window.speechSynthesis.speaking) {
        const text = this.utterance.text
        const volume = this.utterance.volume
        const voice = this.utterance.voice

        window.speechSynthesis.cancel()

        const newUtterance = new SpeechSynthesisUtterance(text)
        newUtterance.rate = speed
        newUtterance.volume = volume
        if (voice)
          newUtterance.voice = voice

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
      else {
        this.utterance.rate = speed
      }
    }
  }

  /**
   * Stop speech synthesis and clean up.
   */
  private stop(): void {
    window.speechSynthesis.cancel()
    this.utterance = null
    this.onStateChange('idle')
    this.onError(null)
  }
}
